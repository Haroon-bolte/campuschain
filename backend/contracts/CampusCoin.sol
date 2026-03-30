// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CampusCoin
 * @dev ERC-20 campus token for MIT-ADT University Financial Ecosystem
 *      1 CampusCoin = 1 INR (pegged, admin-controlled)
 */
contract CampusCoin is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE    = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE    = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN_ROLE");

    // ── Spending Policy ──────────────────────────────────────────────
    uint256 public maxDailySpend       = 5000 * 1e18;   // ₹5,000
    uint256 public p2pTransferLimit    = 2000 * 1e18;   // ₹2,000
    bool    public kycRequired         = true;
    bool    public p2pEnabled          = true;

    mapping(address => uint256) public dailySpent;
    mapping(address => uint256) public lastSpendDay;
    mapping(address => bool)    public kycVerified;
    mapping(address => bool)    public walletFrozen;
    mapping(address => bool)    public isStudent;

    // ── Events ───────────────────────────────────────────────────────
    event WalletFrozen(address indexed wallet, bool frozen, uint256 timestamp);
    event KYCVerified(address indexed wallet, uint256 timestamp);
    event PolicyUpdated(string policyName, uint256 newValue, uint256 timestamp);
    event FeePaymentRecorded(address indexed student, uint256 amount, string category, bytes32 receiptHash);

    constructor(address adminAddress) ERC20("CampusCoin", "CCOIN") {
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(ADMIN_ROLE,         adminAddress);
        _grantRole(MINTER_ROLE,        adminAddress);
        _grantRole(PAUSER_ROLE,        adminAddress);

        // Mint initial supply to admin (treasury)
        _mint(adminAddress, 1_000_000 * 1e18); // ₹10 Lakh initial treasury
    }

    // ── Modifiers ────────────────────────────────────────────────────
    modifier notFrozen(address account) {
        require(!walletFrozen[account], "CampusCoin: wallet is frozen");
        _;
    }

    modifier kycPassed(address account) {
        if (kycRequired && isStudent[account]) {
            require(kycVerified[account], "CampusCoin: KYC not verified");
        }
        _;
    }

    // ── Admin Functions ───────────────────────────────────────────────
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function freezeWallet(address wallet, bool freeze) external onlyRole(ADMIN_ROLE) {
        walletFrozen[wallet] = freeze;
        emit WalletFrozen(wallet, freeze, block.timestamp);
    }

    function verifyKYC(address wallet) external onlyRole(ADMIN_ROLE) {
        kycVerified[wallet] = true;
        emit KYCVerified(wallet, block.timestamp);
    }

    function registerStudent(address wallet) external onlyRole(ADMIN_ROLE) {
        isStudent[wallet] = true;
    }

    function setMaxDailySpend(uint256 limit) external onlyRole(ADMIN_ROLE) {
        maxDailySpend = limit;
        emit PolicyUpdated("maxDailySpend", limit, block.timestamp);
    }

    function setP2PLimit(uint256 limit) external onlyRole(ADMIN_ROLE) {
        p2pTransferLimit = limit;
        emit PolicyUpdated("p2pTransferLimit", limit, block.timestamp);
    }

    function setKYCRequired(bool required) external onlyRole(ADMIN_ROLE) {
        kycRequired = required;
        emit PolicyUpdated("kycRequired", required ? 1 : 0, block.timestamp);
    }

    function setP2PEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        p2pEnabled = enabled;
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ── Internal Transfer Hooks ───────────────────────────────────────
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(!walletFrozen[from], "CampusCoin: sender wallet frozen");
            require(!walletFrozen[to],   "CampusCoin: receiver wallet frozen");

            // Daily spend tracking for students
            if (isStudent[from]) {
                uint256 today = block.timestamp / 1 days;
                if (lastSpendDay[from] < today) {
                    dailySpent[from]  = 0;
                    lastSpendDay[from] = today;
                }
                require(dailySpent[from] + amount <= maxDailySpend, "CampusCoin: daily spend limit exceeded");
                dailySpent[from] += amount;
            }
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    // ── View Helpers ──────────────────────────────────────────────────
    function getRemainingDailyLimit(address wallet) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastSpendDay[wallet] < today) return maxDailySpend;
        return maxDailySpend > dailySpent[wallet] ? maxDailySpend - dailySpent[wallet] : 0;
    }
}
