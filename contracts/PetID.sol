// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract PetID is Ownable, ReentrancyGuard {
    uint256 public petCount;
    address public petNFTContract;

    mapping(uint256 => PetBasic) public petsBasic;
    mapping(uint256 => PetExtended) public petsExtended;
    mapping(address => uint256[]) public ownersToPets;

    event PetRegistered(uint256 indexed petId, address indexed owner);
    event NFTLinked(uint256 indexed petId, address nftContract, uint256 tokenId);

    constructor (
        address initialOwner,
        address _petNFTContract
    ) {
        _transferOwnership(initialOwner);
        petCount = 1;
        petNFTContract = _petNFTContract;
    }

    struct PetBasic {
        string name;
        string species;
        string breed;
        string color;
        address petOwner;
        bool exists;
        uint256 birthDate;
    }

    struct PetExtended {
        string imageURI;
        address nftContract;
        uint256 nftTokenId;
        uint256 registeredAt;
    }

    struct PetDetails {
       string name;
        string species;
        string breed;
        string color;
        address petOwner;
        bool exists;
        uint256 birthDate;
        string imageURI;
        address nftContract;
        uint256 nftTokenId;
        uint256 registeredAt;
    }

    struct PetRegistrationData {
        string name;
        string species;
        string breed;
        string color;
        uint256 birthDate;
        string imageURI;
    }

    modifier onlyPetOwner (uint256 _petId) {
        require(petExists(_petId), "Pet does not exists");
        require(petsBasic[_petId].petOwner == _msgSender(), "Not the pet owner");
        _;
    }

    function getPetsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownersToPets[_owner];
    }

    function petExists(uint256 _petId) public view returns (bool) {
        return _petId > 0 && _petId < petCount && petsBasic[_petId].exists;
    }

    function registerPet(PetRegistrationData calldata _petData) external nonReentrant returns (uint256) {
        uint256 petId = petCount;
        petCount++;

        petsBasic[petId] = PetBasic({
            name: _petData.name,
            species: _petData.species,
            breed: _petData.breed,
            color: _petData.color,
            petOwner: _msgSender(),
            exists: true,
            birthDate: _petData.birthDate
        });

        petsExtended[petId] = PetExtended({
            imageURI: _petData.imageURI,
            nftContract: address(0),
            nftTokenId: 0,
            registeredAt: block.timestamp
        });

        ownersToPets[_msgSender()].push(petId);

        emit PetRegistered(petId, _msgSender());

        return petId;
    }

    function linkNFTToPet(uint256 _petId, address _nftContract, uint256 _tokenId) external onlyPetOwner(_petId) nonReentrant {
        require(_nftContract == petNFTContract, "Invalid NFT contract");

        IERC721 nft = IERC721(_nftContract);

        require(nft.ownerOf(_tokenId) == msg.sender, "You are not the NFT owner");

        petsExtended[_petId].nftContract = _nftContract;
        petsExtended[_petId].nftTokenId = _tokenId;

        emit NFTLinked(_petId, _nftContract, _tokenId);
    }

    function getPetDetails(uint256 _petId) external view returns (PetDetails memory) {
        require(petExists(_petId), "Pet does not exist");

        PetBasic memory basic = petsBasic[_petId];
        PetExtended memory extended = petsExtended[_petId];

        return PetDetails({
            name: basic.name,
            species: basic.species,
            breed: basic.breed,
            color: basic.color,
            birthDate: basic.birthDate,
            imageURI: extended.imageURI,
            petOwner: basic.petOwner,
            nftContract: extended.nftContract,
            nftTokenId: extended.nftTokenId,
            registeredAt: extended.registeredAt,
            exists: basic.exists
        });
    }

    function getPetBasicInfo(uint256 _petId) external view returns (string memory name, string memory species, address petOwner, uint256 birthDate) {
        require(petExists(_petId), "Pet does not exist");
        PetBasic memory basic = petsBasic[_petId];

        return (basic.name, basic.species, basic.petOwner, basic.birthDate);
    }

    function setPetNFTContract(address _newContract) external onlyOwner {
        require(_newContract != address(0), "Invalid address");
        petNFTContract = _newContract;
    }
}
