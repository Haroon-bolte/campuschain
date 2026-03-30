const { ethers } = require("ethers");

let provider;
let signer;

const init = () => {
  try {
    // Connect to local Hardhat node
    const providerUrl = process.env.RPC_URL || "http://localhost:8545";
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    // Use the first Hardhat account as the default signer for the admin
    const adminKey = process.env.ADMIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    signer = new ethers.Wallet(adminKey, provider);
    
    console.log("✅ Web3 Service Initialized (Local Hardhat)");
  } catch (error) {
    console.error("❌ Web3 Init Error:", error.message);
  }
};

const getLatestBlock = async () => {
  try {
    if (!provider) return null;
    return await provider.getBlockNumber();
  } catch (error) {
    return null;
  }
};

module.exports = {
  init,
  getLatestBlock,
  getProvider: () => provider,
  getSigner: () => signer,
};
