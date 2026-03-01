// Vanilla JS Contract Helper for PetID dApp
// Load this after ethers.js CDN in your HTML

const CONTRACT_CONFIG = {
  network: {
    chainId: 11155111, // Sepolia testnet
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com'
  },
  contracts: {
    PetNFT: {
      address: '0x994B2a414b89CFcAe57aFB756d84D95a70d01E15',
      // ABI will be loaded from artifacts or defined inline
    },
    PetID: {
      address: '0x05C183EB3ec912dfCc6EcAAFd691B043842E7846',
      // ABI will be loaded from artifacts or defined inline
    }
  }
};

// Contract ABIs - essential functions only for smaller file size
const PetNFT_ABI = [
  "constructor(string _name, string _symbol, address initialOwner, address trustedForwarder)",
  "function mint(address to, string uri) returns (uint256)",
  "function mintToSelf(string uri) returns (uint256)",
  "function adminMint(address to, string uri) returns (uint256)",
  "function burn(uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getMintCount(address user) view returns (uint256)",
  "function getRemainingMints(address user) view returns (uint256)",
  "function maxMintsPerUser() view returns (uint256)",
  "function userMintCount(address user) view returns (uint256)",
  "function setMaxMintsPerUser(uint256 _maxMints)",
  "function owner() view returns (address)",
  "function updateTokenURI(uint256 tokenId, string newURI)",
  "event PetNFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI, address indexed minter)",
  "event PetNFTBurned(uint256 indexed tokenId)"
];

const PetID_ABI = [
  "constructor(address initialOwner, address _petNFTContract)",
  "function registerPet(tuple(string name, string species, string breed, string color, uint256 birthDate, string imageURI) _petData) returns (uint256)",
  "function linkNFTToPet(uint256 petId, address nftContract, uint256 tokenId)",
  "function getPetDetails(uint256 petId) view returns (tuple(string name, string species, string breed, string color, address petOwner, bool exists, uint256 birthDate, string imageURI, address nftContract, uint256 nftTokenId, uint256 registeredAt))",
  "function getPetBasicInfo(uint256 petId) view returns (string name, string species, address petOwner, uint256 birthDate)",
  "function getPetsByOwner(address owner) view returns (uint256[])",
  "function petExists(uint256 petId) view returns (bool)",
  "function petCount() view returns (uint256)",
  "function petNFTContract() view returns (address)",
  "event PetRegistered(uint256 indexed petId, address indexed owner)",
  "event NFTLinked(uint256 indexed petId, address nftContract, uint256 tokenId)"
];

/**
 * Switch to Sepolia network or add it if not present
 */
async function switchToSepolia() {
  const chainId = '0x' + CONTRACT_CONFIG.network.chainId.toString(16); // 0xaa36a7 for Sepolia
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainId,
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } catch (addError) {
        throw new Error('Erro ao adicionar rede Sepolia: ' + addError.message);
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Connect to MetaMask and get signer
 */
async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask não está instalado. Por favor, instale MetaMask para continuar.');
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    
    // Check network and switch if needed
    const network = await provider.getNetwork();
    if (network.chainId !== CONTRACT_CONFIG.network.chainId) {
      console.log(`Rede incorreta detectada (${network.chainId}). Trocando para Sepolia...`);
      await switchToSepolia();
      // Refresh provider after network switch
      window.location.reload();
      return;
    }
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    console.log('Conectado:', address);
    console.log('Rede:', CONTRACT_CONFIG.network.name);
    return { provider, signer, address };
  } catch (error) {
    console.error('Erro ao conectar carteira:', error);
    throw error;
  }
}

/**
 * Get contract instance
 */
function getContract(contractName, signer) {
  const abis = {
    PetNFT: PetNFT_ABI,
    PetID: PetID_ABI
  };

  const address = CONTRACT_CONFIG.contracts[contractName].address;
  const abi = abis[contractName];

  if (!abi || !address) {
    throw new Error(`Contrato ${contractName} não encontrado`);
  }

  return new ethers.Contract(address, abi, signer);
}

/**
 * Check if on correct network
 */
async function checkNetwork(provider) {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  
  if (chainId !== CONTRACT_CONFIG.network.chainId) {
    console.warn(`Rede incorreta. Esperado: ${CONTRACT_CONFIG.network.chainId}, Atual: ${chainId}`);
    return false;
  }
  
  return true;
}

// Example usage functions
async function mintPetNFT(imageUri) {
  const { signer } = await connectWallet();
  const petNFT = getContract('PetNFT', signer);
  
  console.log('Mintando NFT...');
  const tx = await petNFT.mintToSelf(imageUri);
  const receipt = await tx.wait();
  
  // Get tokenId from event
  const event = receipt.logs.find(log => {
    try {
      return petNFT.interface.parseLog(log).name === 'PetNFTMinted';
    } catch { return false; }
  });
  
  if (event) {
    const parsed = petNFT.interface.parseLog(event);
    const tokenId = parsed.args.tokenId;
    console.log('NFT mintado com sucesso! Token ID:', tokenId.toString());
    return tokenId;
  }
}

async function registerPet(name, species, breed, color, birthDate, imageUri) {
  const { signer } = await connectWallet();
  const petID = getContract('PetID', signer);
  
  console.log('Registrando pet...');
  const tx = await petID.registerPet(name, species, breed, color, birthDate, imageUri);
  const receipt = await tx.wait();
  
  // Get petId from event
  const event = receipt.logs.find(log => {
    try {
      return petID.interface.parseLog(log).name === 'PetRegistered';
    } catch { return false; }
  });
  
  if (event) {
    const parsed = petID.interface.parseLog(event);
    const petId = parsed.args.petId;
    console.log('Pet registrado com sucesso! Pet ID:', petId.toString());
    return petId;
  }
}

async function getMyPets() {
  const { signer, address } = await connectWallet();
  const petID = getContract('PetID', signer);
  
  const petIds = await petID.getPetsByOwner(address);
  console.log('Seus pets:', petIds.map(id => id.toString()));
  return petIds;
}

/**
 * Buscar detalhes completos de um pet da blockchain
 * @param {number} petId - ID do pet
 * @returns {Promise<Object>} - Dados completos do pet
 */
async function getPetDetails(petId) {
  const { signer } = await connectWallet();
  const petID = getContract('PetID', signer);
  
  // Buscar dados completos do pet
  const petData = await petID.getPetDetails(petId);
  
  return {
    name: petData.name,
    species: petData.species,
    breed: petData.breed,
    color: petData.color,
    petOwner: petData.petOwner,
    birthDate: petData.birthDate.toNumber(),
    imageURI: petData.imageURI,
    nftContract: petData.nftContract,
    nftTokenId: petData.nftTokenId.toNumber(),
    registeredAt: petData.registeredAt.toNumber(),
    exists: petData.exists
  };
}

// ============================================
// FUNÇÕES COM UPLOAD AUTOMÁTICO PARA PINATA
// ============================================

/**
 * Mintar NFT com upload automático de imagem para Pinata
 * @param {File} imageFile - Arquivo de imagem do pet
 * @param {string} petName - Nome do pet (opcional)
 * @returns {Promise<{tokenId: number, ipfsUrl: string}>}
 */
async function mintPetNFTWithUpload(imageFile, petName = null) {
  // 1. Upload da imagem para Pinata via backend
  console.log('Fazendo upload da imagem para IPFS...');
  const uploadResult = await uploadImageToPinata(imageFile, petName);
  console.log('✓ Imagem enviada para IPFS:', uploadResult.gatewayUrl);

  // 2. Mintar NFT com a URI do IPFS
  const { signer } = await connectWallet();
  const petNFT = getContract('PetNFT', signer);
  
  console.log('Mintando NFT no blockchain...');
  const tx = await petNFT.mintToSelf(uploadResult.gatewayUrl);
  const receipt = await tx.wait();
  
  // Get tokenId from event
  const event = receipt.logs.find(log => {
    try {
      return petNFT.interface.parseLog(log).name === 'PetNFTMinted';
    } catch { return false; }
  });
  
  if (event) {
    const parsed = petNFT.interface.parseLog(event);
    const tokenId = parsed.args.tokenId;
    console.log('✓ NFT mintado com sucesso! Token ID:', tokenId.toString());
    return {
      tokenId: tokenId,
      ipfsUrl: uploadResult.gatewayUrl,
      ipfsHash: uploadResult.ipfsHash,
      pinataUrl: uploadResult.pinataUrl
    };
  }
}

/**
 * Registrar pet com upload automático de imagem
 * @param {object} petData - Dados do pet
 * @param {File} imageFile - Arquivo de imagem
 * @returns {Promise<{petId: number, ipfsUrl: string}>}
 */
async function registerPetWithUpload(petData, imageFile) {
  // 1. Upload da imagem para Pinata via backend
  console.log('Fazendo upload da imagem para IPFS...');
  const uploadResult = await uploadImageToPinata(imageFile, petData.name);
  console.log('✓ Imagem enviada para IPFS:', uploadResult.gatewayUrl);

  // 2. Registrar pet no blockchain
  const { signer } = await connectWallet();
  const petID = getContract('PetID', signer);
  
  console.log('Registrando pet no blockchain...');
  
  // Criar struct de registro
  const petRegistrationData = {
    name: petData.name,
    species: petData.species,
    breed: petData.breed,
    color: petData.color,
    birthDate: petData.birthDate,
    imageURI: uploadResult.gatewayUrl
  };
  
  const tx = await petID.registerPet(petRegistrationData);
  const receipt = await tx.wait();
  
  // Get petId from event
  const event = receipt.logs.find(log => {
    try {
      return petID.interface.parseLog(log).name === 'PetRegistered';
    } catch { return false; }
  });
  
  if (event) {
    const parsed = petID.interface.parseLog(event);
    const petId = parsed.args.petId;
    console.log('✓ Pet registrado com sucesso! Pet ID:', petId.toString());
    return {
      petId: petId,
      ipfsUrl: uploadResult.gatewayUrl,
      ipfsHash: uploadResult.ipfsHash,
      pinataUrl: uploadResult.pinataUrl
    };
  }
}

/**
 * Fluxo completo: Upload de imagem + metadata JSON + Mint NFT + Registro Pet
 * Cria metadata no padrão OpenSea/ERC721
 * @param {object} petData - Dados do pet (name, species, breed, color, birthDate)
 * @param {File} imageFile - Arquivo de imagem
 * @returns {Promise<{petId: number, tokenId: number, metadataUrl: string, imageUrl: string}>}
 */
async function createCompletePetNFT(petData, imageFile) {
  // 1. Upload completo (imagem + metadata JSON) via backend
  console.log('Fazendo upload completo para IPFS...');
  const uploadResult = await uploadPetWithImage(imageFile, petData);
  console.log('✓ Upload completo:', uploadResult);

  // 2. Mintar NFT com a metadata URI
  const { signer } = await connectWallet();
  const petNFT = getContract('PetNFT', signer);
  
  console.log('Mintando NFT...');
  const mintTx = await petNFT.mintToSelf(uploadResult.metadataUrl);
  const mintReceipt = await mintTx.wait();
  
  let tokenId;
  const mintEvent = mintReceipt.logs.find(log => {
    try {
      return petNFT.interface.parseLog(log).name === 'PetNFTMinted';
    } catch { return false; }
  });
  
  if (mintEvent) {
    tokenId = petNFT.interface.parseLog(mintEvent).args.tokenId;
    console.log('✓ NFT mintado! Token ID:', tokenId.toString());
  }

  // 3. Registrar pet no PetID
  const petID = getContract('PetID', signer);
  
  console.log('Registrando pet...');
  
  // Criar struct de registro
  const petRegistrationData = {
    name: petData.name,
    species: petData.species,
    breed: petData.breed,
    color: petData.color,
    birthDate: petData.birthDate,
    imageURI: uploadResult.imageUrl
  };
  
  const registerTx = await petID.registerPet(petRegistrationData);
  const registerReceipt = await registerTx.wait();
  
  let petId;
  const registerEvent = registerReceipt.logs.find(log => {
    try {
      return petID.interface.parseLog(log).name === 'PetRegistered';
    } catch { return false; }
  });
  
  if (registerEvent) {
    petId = petID.interface.parseLog(registerEvent).args.petId;
    console.log('✓ Pet registrado! Pet ID:', petId.toString());
  }

  // 4. Vincular NFT ao pet
  console.log('Vinculando NFT ao registro do pet...');
  const linkTx = await petID.linkNFTToPet(
    petId,
    CONTRACT_CONFIG.contracts.PetNFT.address,
    tokenId
  );
  await linkTx.wait();
  console.log('✓ NFT vinculado ao pet!');

  return {
    petId: petId,
    tokenId: tokenId,
    metadataUrl: uploadResult.metadataUrl,
    imageUrl: uploadResult.imageUrl,
    metadataHash: uploadResult.metadataHash,
    imageHash: uploadResult.imageHash,
    // Transaction hashes para verificação
    mintTxHash: mintReceipt.transactionHash,
    registerTxHash: registerReceipt.transactionHash,
    linkTxHash: linkReceipt.transactionHash,
    // Block numbers
    mintBlockNumber: mintReceipt.blockNumber,
    registerBlockNumber: registerReceipt.blockNumber,
    linkBlockNumber: linkReceipt.blockNumber
  };
}

/**
 * Check user's mint count and remaining mints
 */
async function checkUserMintStatus() {
  const { signer } = await connectWallet();
  const petNFTContract = getContract('PetNFT', signer);
  const userAddress = await signer.getAddress();
  
  const mintCount = await petNFTContract.userMintCount(userAddress);
  const maxMints = await petNFTContract.maxMintsPerUser();
  
  return {
    used: mintCount.toNumber(),
    max: maxMints.toNumber(),
    remaining: maxMints.toNumber() - mintCount.toNumber()
  };
}

/**
 * Burn (delete) a pet NFT to free up a mint slot
 */
async function burnPetNFT(tokenId) {
  const { signer } = await connectWallet();
  const petNFTContract = getContract('PetNFT', signer);
  console.log(`🔥 Deletando NFT #${tokenId}...`);
  
  const tx = await petNFTContract.burn(tokenId);
  const receipt = await tx.wait();
  
  console.log(`✓ NFT #${tokenId} deletado! Hash:`, receipt.transactionHash);
  return receipt;
}

/**
 * Increase max mints per user (only contract owner can do this)
 */
async function increaseMaxMints(newLimit) {
  const { signer } = await connectWallet();
  const petNFTContract = getContract('PetNFT', signer);
  const userAddress = await signer.getAddress();
  const ownerAddress = await petNFTContract.owner();
  
  if (userAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
    throw new Error('❌ Apenas o dono do contrato pode aumentar o limite');
  }
  
  console.log(`⚙️ Aumentando limite para ${newLimit} mints por usuário...`);
  const tx = await petNFTContract.setMaxMintsPerUser(newLimit);
  const receipt = await tx.wait();
  
  console.log(`✓ Limite atualizado! Hash:`, receipt.transactionHash);
  return receipt;
}


