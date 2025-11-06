// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ✅ Using Enumerable + URIStorage so wallets & UI can detect NFTs properly
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MembershipNFT is ERC721, ERC721Enumerable, ERC721URIStorage {
    address public admin;
    uint private _tokenCounter;

    event MembershipMinted(address indexed to, uint indexed tokenId);
    event MembershipRevoked(uint indexed tokenId, address indexed from);

    constructor() ERC721("Library Membership", "LIBRARY") {
        admin = msg.sender;
        _tokenCounter = 0;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    // ✅ Mint NFT + set metadata URI so MetaMask and UI show it
    function mintMembership(address user) public onlyAdmin returns (uint) {
        _tokenCounter++;
        uint256 tokenId = _tokenCounter;

        _safeMint(user, tokenId);

        // ❗ Replace with your metadata JSON link (IPFS ideal)
        _setTokenURI(tokenId, "ipfs://bafkreigagnmfbl54d76pegymh2zjfqtsgygm2m3fmtlxftctlad2ps2kgm");

        emit MembershipMinted(user, tokenId);
        return tokenId;
    }

    // ✅ Burn membership NFT
    function revokeMembership(uint tokenId) public onlyAdmin {
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit MembershipRevoked(tokenId, owner);
    }

    // ✅ Check membership
    function hasMembership(address member) public view returns (bool) {
        return balanceOf(member) > 0;
    }

    // ✅ Total tokens minted (not burned count)
    function totalSupply() override public view returns (uint) {
        return _tokenCounter;
    }

    // ---- OVERRIDES REQUIRED BY OZ ----

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }
}
