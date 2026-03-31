// CampusChain Unified API Client
// Handles both Backend (REST) and Blockchain (Ethers.js) communication

const BASE_URL = "http://localhost:5000/api";

// Contract ABIs
const ABIS = {
  CampusCoin: [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address recipient, uint256 amount) returns (bool)"
  ],
  FeePayment: [
    "function payFee(uint256 feeId, bytes32 receiptIpfsHash) external"
  ],
  EventTicket: [
    "function mintTicket(address buyer, uint256 eventId, string seatNumber) external returns (uint256)",
    "function burnTicket(uint256 tokenId) external"
  ],
  P2PTransfer: [
    "function send(address to, uint256 amountInRupees, string note) external"
  ]
};

// Internal state for contract config
let CONTRACT_CONFIG = null;

const API = {
  // Initialize and load contract addresses
  init: async () => {
    if (!CONTRACT_CONFIG) {
        const res = await fetch('contracts.json');
        const data = await res.json();
        CONTRACT_CONFIG = data;
        window.CONTRACTS = data.contracts; 
    }
    return CONTRACT_CONFIG;
  },

  // --- Auth ---
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  register: async (userData) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  // --- Users ---
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/users`);
    return res.json();
  },

  updateUser: async (id, data) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Fees ---
  getFees: async (sid) => {
    const url = sid ? `${BASE_URL}/fees/student/${sid}` : `${BASE_URL}/fees`;
    const res = await fetch(url);
    return res.json();
  },

  updateFee: async (id, data) => {
    const res = await fetch(`${BASE_URL}/fees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Events ---
  getEvents: async () => {
    const res = await fetch(`${BASE_URL}/events`);
    return res.json();
  },

  createEvent: async (data) => {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Transactions & Audit ---
  getTransactions: async () => {
    const res = await fetch(`${BASE_URL}/transactions`);
    return res.json();
  },

  addTransaction: async (data) => {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Web3 Helpers ---
  getProvider: () => {
    if (typeof window.ethereum !== 'undefined' && window.ethers) {
      return new window.ethers.providers.Web3Provider(window.ethereum);
    }
    return null;
  },

  connectWallet: async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error("MetaMask is not installed. Please install MetaMask to use blockchain features.");
    }
    if (!window.ethers) {
      throw new Error("Ethers library not loaded. Please refresh the page.");
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  },

  // Returns a signer (connected wallet) - use this for transactions
  getSigner: () => {
    if (!window.ethereum) throw new Error("MetaMask is not installed");
    if (!window.ethers) throw new Error("Ethers library not loaded. Please refresh.");
    const provider = new window.ethers.providers.Web3Provider(window.ethereum);
    return provider.getSigner();
  },

  getContract: (name, signerOrProvider) => {
    if (!CONTRACT_CONFIG) throw new Error("API not initialized. Call API.init() first.");
    const address = CONTRACT_CONFIG.contracts[name];
    const abi = ABIS[name];
    if (!address) throw new Error(`Contract ${name} not found`);
    if (!window.ethers) throw new Error("Ethers library not loaded");
    return new window.ethers.Contract(address, abi, signerOrProvider);
  },

  getBlockNumber: async () => {
    const provider = API.getProvider();
    if (!provider) return 0;
    return provider.getBlockNumber();
  }
};

window.CampusAPI = API;
