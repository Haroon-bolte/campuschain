/**
 * Mock IPFS Service for CampusChain Prototype
 * ──────────────────────────────────────────
 * Instead of uploading to real IPFS (Infura/Pinata),
 * this simulates uploads and returns a deterministic CID-like hash.
 */

const init = () => {
    console.log("✅ IPFS Service Initialized (MOCK)");
};

const uploadReceipt = async (data) => {
    // Generate a mock CID-like string
    const mockHash = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.log(`📡 [MOCK IPFS] Uploaded receipt, CID: ${mockHash}`);
    return mockHash;
};

const getReceipt = async (cid) => {
    console.log(`📡 [MOCK IPFS] Fetching receipt for CID: ${cid}`);
    return {
        success: true,
        data: "This is a mock IPFS receipt content for CID: " + cid
    };
};

module.exports = {
    init,
    uploadReceipt,
    getReceipt
};
