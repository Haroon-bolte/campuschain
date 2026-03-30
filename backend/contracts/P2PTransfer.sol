// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CampusCoin.sol";

/**
 * @title P2PTransfer
 * @dev Peer-to-peer CampusCoin transfers with policy enforcement.
 *      Records every transfer on-chain for auditability.
 */
contract P2PTransfer is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    CampusCoin public campusCoin;

    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        string  note;
        uint256 timestamp;
        uint256 blockNumber;
    }

    uint256                         public transferCounter;
    mapping(uint256 => Transfer)    public transfers;
    mapping(address => uint256[])   public sentTransfers;
    mapping(address => uint256[])   public receivedTransfers;

    // ── Events ────────────────────────────────────────────────────────
    event Transferred(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string  note,
        uint256 blockNumber
    );

    constructor(address campusCoinAddress, address adminAddress) {
        campusCoin = CampusCoin(campusCoinAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(ADMIN_ROLE,         adminAddress);
    }

    /**
     * @dev Send CampusCoin to another campus wallet.
     *      Enforces P2P limit set in CampusCoin contract.
     */
    function send(address to, uint256 amountInRupees, string calldata note)
        external
        nonReentrant
    {
        require(to != msg.sender,               "P2PTransfer: cannot send to self");
        require(amountInRupees > 0,             "P2PTransfer: amount must be > 0");
        require(campusCoin.p2pEnabled(),        "P2PTransfer: P2P disabled by admin");

        uint256 amount = amountInRupees * 1e18;

        // Check P2P limit
        require(amount <= campusCoin.p2pTransferLimit(), "P2PTransfer: exceeds P2P limit");

        // Transfer (CampusCoin._beforeTokenTransfer handles freeze + daily limit)
        require(
            campusCoin.allowance(msg.sender, address(this)) >= amount,
            "P2PTransfer: approve required"
        );
        campusCoin.transferFrom(msg.sender, to, amount);

        transferCounter++;
        transfers[transferCounter] = Transfer({
            id:          transferCounter,
            from:        msg.sender,
            to:          to,
            amount:      amount,
            note:        note,
            timestamp:   block.timestamp,
            blockNumber: block.number
        });

        sentTransfers[msg.sender].push(transferCounter);
        receivedTransfers[to].push(transferCounter);

        emit Transferred(transferCounter, msg.sender, to, amount, note, block.number);
    }

    // ── View helpers ──────────────────────────────────────────────────
    function getSentTransfers(address wallet)
        external view returns (uint256[] memory)
    {
        return sentTransfers[wallet];
    }

    function getReceivedTransfers(address wallet)
        external view returns (uint256[] memory)
    {
        return receivedTransfers[wallet];
    }

    function getTransfer(uint256 transferId)
        external view returns (Transfer memory)
    {
        return transfers[transferId];
    }
}
