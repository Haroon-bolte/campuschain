// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CampusCoin.sol";

/**
 * @title EventTicket
 * @dev NFT-based event tickets. Each token = 1 seat for 1 event.
 *      Resale lock enforced on-chain per policy.
 */
contract EventTicket is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    CampusCoin public campusCoin;
    address     public treasury;

    bool public resaleLocked = true; // policy: no P2P resale

    struct Event {
        uint256 id;
        string  name;
        string  date;
        string  venue;
        uint256 price;      // in CampusCoin (1e18 units)
        uint256 capacity;
        uint256 sold;
        bool    active;
        string  metadataUri; // IPFS URI
    }

    struct Ticket {
        uint256 tokenId;
        uint256 eventId;
        address owner;
        string  seatNumber;
        uint256 mintedAt;
        bool    burned;
    }

    uint256                        public eventCounter;
    uint256                        public tokenCounter;
    mapping(uint256 => Event)      public events;
    mapping(uint256 => Ticket)     public tickets;
    mapping(address => uint256[])  public ownedTickets;

    // ── Events ────────────────────────────────────────────────────────
    event EventCreated(uint256 indexed eventId, string name, uint256 price, uint256 capacity);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed buyer, string seat);
    event TicketBurned(uint256 indexed tokenId, address indexed holder);
    event EventDeleted(uint256 indexed eventId);

    constructor(address campusCoinAddress, address treasuryAddress, address adminAddress)
        ERC721("CampusChain Event Ticket", "CCET")
    {
        campusCoin = CampusCoin(campusCoinAddress);
        treasury   = treasuryAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        _grantRole(ADMIN_ROLE,         adminAddress);
        _grantRole(MINTER_ROLE,        adminAddress);
    }

    // ── Admin: Create Event ───────────────────────────────────────────
    function createEvent(
        string calldata name,
        string calldata date,
        string calldata venue,
        uint256 priceInRupees,
        uint256 capacity,
        string calldata metadataUri
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        eventCounter++;
        events[eventCounter] = Event({
            id:          eventCounter,
            name:        name,
            date:        date,
            venue:       venue,
            price:       priceInRupees * 1e18,
            capacity:    capacity,
            sold:        0,
            active:      true,
            metadataUri: metadataUri
        });
        emit EventCreated(eventCounter, name, priceInRupees * 1e18, capacity);
        return eventCounter;
    }

    // ── Admin: Delete Event ───────────────────────────────────────────
    function deleteEvent(uint256 eventId) external onlyRole(ADMIN_ROLE) {
        events[eventId].active = false;
        emit EventDeleted(eventId);
    }

    // ── Admin / Minter: Mint Ticket ───────────────────────────────────
    function mintTicket(
        address buyer,
        uint256 eventId,
        string calldata seatNumber
    ) external onlyRole(MINTER_ROLE) nonReentrant returns (uint256) {
        Event storage ev = events[eventId];
        require(ev.active,           "EventTicket: event not active");
        require(ev.sold < ev.capacity, "EventTicket: sold out");

        // Charge CampusCoin
        require(campusCoin.balanceOf(buyer)                  >= ev.price, "EventTicket: insufficient balance");
        require(campusCoin.allowance(buyer, address(this))   >= ev.price, "EventTicket: approve needed");
        campusCoin.transferFrom(buyer, treasury, ev.price);

        tokenCounter++;
        _safeMint(buyer, tokenCounter);
        _setTokenURI(tokenCounter, ev.metadataUri);

        tickets[tokenCounter] = Ticket({
            tokenId:    tokenCounter,
            eventId:    eventId,
            owner:      buyer,
            seatNumber: seatNumber,
            mintedAt:   block.timestamp,
            burned:     false
        });

        ownedTickets[buyer].push(tokenCounter);
        ev.sold++;

        emit TicketMinted(tokenCounter, eventId, buyer, seatNumber);
        return tokenCounter;
    }

    // ── Burn Ticket ───────────────────────────────────────────────────
    function burnTicket(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
                "EventTicket: not authorized");
        tickets[tokenId].burned = true;
        _burn(tokenId);
        emit TicketBurned(tokenId, msg.sender);
    }

    // ── Resale Lock ───────────────────────────────────────────────────
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal override
    {
        if (from != address(0) && to != address(0) && resaleLocked) {
            require(hasRole(ADMIN_ROLE, msg.sender), "EventTicket: resale is locked");
        }
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function setResaleLock(bool locked) external onlyRole(ADMIN_ROLE) {
        resaleLocked = locked;
    }

    // ── View ──────────────────────────────────────────────────────────
    function getOwnedTickets(address owner_) external view returns (uint256[] memory) {
        return ownedTickets[owner_];
    }

    function getEvent(uint256 eventId) external view returns (Event memory) {
        return events[eventId];
    }

    // ── Override Required ─────────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
