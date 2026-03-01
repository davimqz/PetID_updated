/**
 * IPFS Upload Helper - Web3.Storage (100% Decentralized)
 * Wrapper para manter compatibilidade com código existente
 * Agora usa Web3.Storage ao invés do backend Pinata
 */

/**
 * Upload de imagem para IPFS (via Web3.Storage)
 * @param {File} file - Arquivo de imagem
 * @param {string} petName - Nome do pet (opcional)
 * @returns {Promise<Object>} Resultado do upload
 */
async function uploadImageToPinata(file, petName = null) {
  // Validar imagem
  window.Web3Storage.validateImage(file);

  // Verificar autenticação
  if (!window.Web3Storage.isAuthenticated()) {
    throw new Error('Usuário não autenticado no Web3.Storage. Faça login primeiro.');
  }

  console.log(`📤 Uploading image: ${petName || file.name}`);
  
  // Upload via Web3.Storage
  const result = await window.Web3Storage.uploadFile(file);
  
  return {
    ipfsHash: result.ipfsHash,
    pinataUrl: result.w3sUrl,
    gatewayUrl: result.gatewayUrl
  };
}

/**
 * Upload de pet completo (imagem + metadata) para IPFS
 * @param {File} imageFile - Arquivo de imagem do pet
 * @param {Object} petData - Dados do pet (name, species, breed, color, birthDate)
 * @returns {Promise<Object>} URLs da imagem e metadata no IPFS
 */
async function uploadPetWithImage(imageFile, petData) {
  // Verificar autenticação
  if (!window.Web3Storage.isAuthenticated()) {
    throw new Error('Usuário não autenticado no Web3.Storage. Faça login primeiro.');
  }

  // 1) Upload da imagem
  console.log('📸 Step 1/2: Uploading pet image...');
  const imageResult = await window.Web3Storage.uploadFile(imageFile);
  
  // 2) Criar metadata NFT (padrão OpenSea)
  const metadata = {
    name: petData.name,
    description: `Pet NFT para ${petData.name}, um ${petData.species} da raça ${petData.breed}`,
    image: imageResult.gatewayUrl,
    external_url: imageResult.w3sUrl,
    attributes: [
      { trait_type: 'Species', value: petData.species },
      { trait_type: 'Breed', value: petData.breed },
      { trait_type: 'Color', value: petData.color },
      { trait_type: 'Birth Date', display_type: 'date', value: petData.birthDate }
    ]
  };

  // 3) Upload do metadata
  console.log('📝 Step 2/2: Uploading metadata...');
  const metadataResult = await window.Web3Storage.uploadJSON(metadata);

  console.log('✅ Pet NFT completo criado no IPFS!');
  console.log('  Image CID:', imageResult.ipfsHash);
  console.log('  Metadata CID:', metadataResult.ipfsHash);

  return {
    imageUrl: imageResult.gatewayUrl,
    imageHash: imageResult.ipfsHash,
    imagePinataUrl: imageResult.w3sUrl,
    metadataUrl: metadataResult.gatewayUrl,
    metadataHash: metadataResult.ipfsHash,
    metadataPinataUrl: metadataResult.w3sUrl
  };
}

/**
 * Validar imagem antes do upload
 * @param {File} file - Arquivo a validar
 * @param {number} maxSizeMB - Tamanho máximo em MB (padrão: 10MB)
 * @returns {boolean}
 */
function validateImage(file, maxSizeMB = 10) {
  return window.Web3Storage.validateImage(file, maxSizeMB);
}

console.log('✅ IPFS Upload Helper (Web3.Storage) loaded!');
