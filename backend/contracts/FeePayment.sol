// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CampusCoin.sol";

/**
 * @title FeePayment
 * @dev Handles tuition, hostel, library, canteen, event fee payments.
 *      All payments on-chain; receipts stored as IPFS hashes.
 */
contract FeePayment is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    CampusCoin public campusCoin;
    address     public treasury;

    uint256 public autoFineRate      = 200;  // ₹200 late fee
    bool    public autoFineEnabled   = true;

    enum FeeStatus { PENDING, PAID, OVERDUE, WAIVED }

    struct FeeRecord {
        uint256  id;
        address  student;
        uint256  amount;
        uint256  dueDate;
        string   category;       // "TUITION" | "HOSTEL" | "LIBRARY" | "CANTEEN" | "EVENTS"
        FeeStatus status;
        bytes32  receiptIpfsHash; // off-chain receipt pointer
        uint256  paidAt;
        uint256  blockNumber;
    }

    uint256                       public feeCounter;
    mapping(uint256 => FeeRecord) public fees;
    mapping(address => uint256[]) public studentFees;

    // ── Events ───────────────────────────────────────────────────────
    event FeeCreated(uint256 indexed feeId, address indexed student, uint256 amount, string category);
    event FeePaid(uint256 indexed feeId, address indexed student, uint256 amount, bytes32 receiptHash, uint256 blockNumber);
    event FeeOverdue(uint256 indexed feeId, address indexed student, uint256 fine);
    event FeeWaived(uint256 indexed feeId, address indexed student, address admin);

    constructor(address campusCoinAddress, address treasuryAddress, address adminAddress) {
        campusCoin = CampusCoin(campusCoinAddress);
        treasury   = treasuryAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(ADMIN_ROLE,         adminAddress);
    }

    // ── Admin: Create Fee ─────────────────────────────────────────────
    function createFee(
        address student,
        uint256 amount,
        uint256 dueDate,
        string  calldata category
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        feeCounter++;
        fees[feeCounter] = FeeRecord({
            id:             feeCounter,
            student:        student,
            amount:         amount * 1e18,
            dueDate:        dueDate,
            category:       category,
            status:         FeeStatus.PENDING,
            receiptIpfsHash: bytes32(0),
            paidAt:         0,
            blockNumber:    block.number
        });
        studentFees[student].push(feeCounter);
        emit FeeCreated(feeCounter, student, amount * 1e18, category);
        return feeCounter;
    }

    // ── Student: Pay Fee ──────────────────────────────────────────────
    function payFee(uint256 feeId, bytes32 receiptIpfsHash)
        external
        nonReentrant
    {
        FeeRecord storage fee = fees[feeId];
        require(fee.id != 0,                    "FeePayment: fee not found");
        require(fee.student == msg.sender,       "FeePayment: not your fee");
        require(fee.status == FeeStatus.PENDING || fee.status == FeeStatus.OVERDUE,
                                                "FeePayment: fee not payable");

        uint256 totalDue = fee.amount;

        // Apply auto-fine if overdue
        if (autoFineEnabled && block.timestamp > fee.dueDate) {
            totalDue += autoFineRate * 1e18;
            fee.status = FeeStatus.OVERDUE;
            emit FeeOverdue(feeId, msg.sender, autoFineRate * 1e18);
        }

        require(campusCoin.balanceOf(msg.sender) >= totalDue, "FeePayment: insufficient CampusCoin");
        require(campusCoin.allowance(msg.sender, address(this)) >= totalDue, "FeePayment: approve required");

        campusCoin.transferFrom(msg.sender, treasury, totalDue);

        fee.status         = FeeStatus.PAID;
        fee.receiptIpfsHash = receiptIpfsHash;
        fee.paidAt         = block.timestamp;
        fee.blockNumber    = block.number;

        emit FeePaid(feeId, msg.sender, totalDue, receiptIpfsHash, block.number);
    }

    // ── Admin: Waive Fee ──────────────────────────────────────────────
    function waiveFee(uint256 feeId) external onlyRole(ADMIN_ROLE) {
        fees[feeId].status = FeeStatus.WAIVED;
        emit FeeWaived(feeId, fees[feeId].student, msg.sender);
    }

    // ── View Helpers ──────────────────────────────────────────────────
    function getStudentFees(address student) external view returns (uint256[] memory) {
        return studentFees[student];
    }

    function getFee(uint256 feeId) external view returns (FeeRecord memory) {
        return fees[feeId];
    }

    function setAutoFine(bool enabled, uint256 rate) external onlyRole(ADMIN_ROLE) {
        autoFineEnabled = enabled;
        autoFineRate    = rate;
    }
}
