// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract PetNFT is ERC2771Context, ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId = 1;
    mapping(address => uint256) public userMintCount;
    uint256 public maxMintsPerUser = 2;

    event PetNFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, address indexed minter);
    event PetNFTBurned(uint256 indexed tokenId);
    event MaxMintsPerUserUpdated(uint256 newLimit);

    constructor(
        string memory _name,
        string memory _symbol,
        address initialOwner,
        address trustedForwarder
    ) ERC721(_name, _symbol) ERC2771Context(trustedForwarder) {
        _transferOwnership(initialOwner);
    }

    function mint(address to, string memory uri) public nonReentrant returns (uint256) {
        require(to != address(0), "PetNFT: cannot mint to zero address");
        require(bytes(uri).length > 0, "PetNFT: URI cannot be empty");
        require(to == _msgSender(), "PetNFT: can only mint to yourself");
        require(userMintCount[_msgSender()] < maxMintsPerUser, "PetNFT: max mints per user exceeded");

        uint256 tokenId = _nextTokenId++;
        userMintCount[_msgSender()]++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit PetNFTMinted(to, tokenId, uri, _msgSender());
        return tokenId;
    }

    function mintToSelf(string memory uri) public returns (uint256) {
        return mint(_msgSender(), uri);
    }

    function adminMint(address to, string memory uri) public onlyOwner nonReentrant returns (uint256) {
        require(to != address(0), "PetNFT: cannot mint to zero address");
        require(bytes(uri).length > 0, "PetNFT: URI cannot be empty");

        uint256 tokenId = _nextTokenId++;
        userMintCount[to]++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit PetNFTMinted(to, tokenId, uri, _msgSender());
        return tokenId;
    }

    function setMaxMintsPerUser(uint256 _maxMints) public onlyOwner {
        maxMintsPerUser = _maxMints;
        emit MaxMintsPerUserUpdated(_maxMints);
    }
    

    function burn(uint256 tokenId) public {
        require(ownerOf(tokenId) == _msgSender(), "PetNFT: caller is not token owner");
        address tokenOwner = ownerOf(tokenId);
        userMintCount[tokenOwner]--;
        _burn(tokenId);
        emit PetNFTBurned(tokenId);
    }

    function updateTokenURI(uint256 tokenId, string memory newURI) public {
        require(ownerOf(tokenId) == _msgSender() || owner() == _msgSender(), "PetNFT: caller is not token owner or contract owner");
        require(bytes(newURI).length > 0, "PetNFT: URI cannot be empty");
        _setTokenURI(tokenId, newURI);
    }

    function getMintCount(address user) public view returns (uint256) { return userMintCount[user]; }
    function getRemainingMints(address user) public view returns (uint256) { uint256 used = userMintCount[user]; if (used >= maxMintsPerUser) { return 0; } return maxMintsPerUser - used; }
    function getNextTokenId() public view returns (uint256) { return _nextTokenId; }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) { return super.tokenURI(tokenId); }
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) { return super.supportsInterface(interfaceId); }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) { return ERC2771Context._msgSender(); }
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) { return ERC2771Context._msgData(); }
    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) { return ERC2771Context._contextSuffixLength(); }

    // The ERC721URIStorage extension requires this override for _burn
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
