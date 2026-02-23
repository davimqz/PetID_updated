/**
 * Pinata IPFS Upload Helper
 * Classe para fazer upload de imagens para Pinata/IPFS
 */

// Client-side wrapper that calls backend proxy endpoints
// Backend endpoints (server/index.js):
// POST /api/pin-file  -> form-data file (field name: 'file'), optional 'name'
// POST /api/pin-json  -> JSON body

const BACKEND_BASE = '';

/**
 * Upload de arquivo via backend (proxy para Pinata)
 * @param {File} file
 * @param {string} name
 */
async function uploadImageToBackend(file, name = null) {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);

  const resp = await fetch(`${BACKEND_BASE}/api/pin-file`, { method: 'POST', body: form });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload failed: ${resp.statusText}`);
  }
  const data = await resp.json();
  const r = data.result;
  return {
    ipfsHash: r.IpfsHash,
    pinataUrl: `https://gateway.pinata.cloud/ipfs/${r.IpfsHash}`,
    gatewayUrl: `ipfs://${r.IpfsHash}`
  };
}

/**
 * Upload de JSON via backend
 */
async function uploadJSONToBackend(metadata) {
  const resp = await fetch(`${BACKEND_BASE}/api/pin-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Upload JSON failed: ${resp.statusText}`);
  }
  const data = await resp.json();
  const r = data.result;
  return { ipfsHash: r.IpfsHash, gatewayUrl: `ipfs://${r.IpfsHash}`, pinataUrl: `https://gateway.pinata.cloud/ipfs/${r.IpfsHash}` };
}

/**
 * Validar imagem antes do upload
 * @param {File} file - Arquivo a validar
 * @param {number} maxSizeMB - Tamanho máximo em MB (padrão: 10MB)
 * @returns {boolean}
 */
function validateImage(file, maxSizeMB = 10) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WebP.');
  }

  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
  }

  return true;
}

// Client wrappers
async function uploadImageToPinata(file, petName = null) {
  return uploadImageToBackend(file, petName);
}

async function uploadPetWithImage(imageFile, petData) {
  // 1) upload image
  const imageResult = await uploadImageToBackend(imageFile, `${petData.name}-photo`);
  // 2) create metadata
  const metadata = {
    name: petData.name,
    description: `Pet NFT para ${petData.name}, um ${petData.species} da raça ${petData.breed}`,
    image: imageResult.gatewayUrl,
    external_url: imageResult.pinataUrl,
    attributes: [
      { trait_type: 'Species', value: petData.species },
      { trait_type: 'Breed', value: petData.breed },
      { trait_type: 'Color', value: petData.color },
      { trait_type: 'Birth Date', display_type: 'date', value: petData.birthDate }
    ]
  };

  const metadataResult = await uploadJSONToBackend(metadata);
  return {
    imageUrl: imageResult.gatewayUrl,
    imageHash: imageResult.ipfsHash,
    imagePinataUrl: imageResult.pinataUrl,
    metadataUrl: metadataResult.gatewayUrl,
    metadataHash: metadataResult.ipfsHash,
    metadataPinataUrl: metadataResult.pinataUrl
  };
}
