const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin, treasury] = await hre.ethers.getSigners();

  console.log("🚀 Starting CampusChain Deployment...");
  console.log("Admin Account   :", admin.address);
  console.log("Treasury Account:", treasury.address);

  // 1. Deploy CampusCoin
  const CampusCoin = await hre.ethers.getContractFactory("CampusCoin");
  const campusCoin = await CampusCoin.deploy(admin.address);
  await campusCoin.deployed();
  console.log("✅ CampusCoin deployed to:", campusCoin.address);

  // 2. Deploy FeePayment
  const FeePayment = await hre.ethers.getContractFactory("FeePayment");
  const feePayment = await FeePayment.deploy(campusCoin.address, treasury.address, admin.address);
  await feePayment.deployed();
  console.log("✅ FeePayment deployed to:", feePayment.address);

  // 3. Deploy EventTicket
  const EventTicket = await hre.ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.deploy(campusCoin.address, treasury.address, admin.address);
  await eventTicket.deployed();
  console.log("✅ EventTicket deployed to:", eventTicket.address);

  // 4. Deploy P2PTransfer
  const P2PTransfer = await hre.ethers.getContractFactory("P2PTransfer");
  const p2pTransfer = await P2PTransfer.deploy(campusCoin.address, admin.address);
  await p2pTransfer.deployed();
  console.log("✅ P2PTransfer deployed to:", p2pTransfer.address);

  // Save deployment info for Frontend & Backend
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      CampusCoin: campusCoin.address,
      FeePayment: feePayment.address,
      EventTicket: eventTicket.address,
      P2PTransfer: p2pTransfer.address
    },
    admin: admin.address,
    treasury: treasury.address,
    timestamp: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir);
  
  fs.writeFileSync(
    path.join(deploymentsDir, "local.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also copy to frontend for easy access
  const frontendDir = path.join(__dirname, "../../campusfrontend");
  fs.writeFileSync(
    path.join(frontendDir, "contracts.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✨ Deployment Complete! Info saved to /backend/deployments/local.json and /campusfrontend/contracts.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
