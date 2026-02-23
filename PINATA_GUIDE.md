# 📸 Guia de Upload de Imagens com Pinata

## O que mudou?

Agora você **NÃO precisa mais fornecer URIs IPFS manualmente**. O sistema faz upload automático das imagens para o Pinata (IPFS) quando você seleciona um arquivo.

## 🚀 Como Configurar

### 1. Criar Conta no Pinata

1. Acesse [https://app.pinata.cloud](https://app.pinata.cloud)
2. Crie uma conta gratuita (100MB de armazenamento grátis)
3. Faça login

### 2. Gerar API Keys

1. No painel do Pinata, clique em **API Keys** no menu lateral
2. Clique em **New Key**
3. Configure as permissões:
   - ✅ `pinFileToIPFS` (obrigatório)
   - ✅ `pinJSONToIPFS` (obrigatório)
   - ✅ `pinByHash` (opcional)
4. Dê um nome para a chave (ex: "PetID App")
5. Clique em **Create Key**
6. **COPIE IMEDIATAMENTE** as chaves:
   - **API Key** (começa com letras/números)
   - **API Secret** (string longa)
   
   ⚠️ **IMPORTANTE:** Você só verá o Secret uma vez! Guarde-o em local seguro.

### 3. Configurar no App

#### Opção A: Interface Web (contract-test.html)

1. Abra `contract-test.html` no navegador
2. Na seção "🔑 Configuração Pinata":
   - Cole sua **API Key**
   - Cole sua **Secret API Key**
3. Clique em "Inicializar Pinata"
4. Aguarde a confirmação ✓

#### Opção B: Arquivo .env (Para produção)

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env e adicione suas chaves
PINATA_API_KEY=sua_api_key_aqui
PINATA_SECRET_API_KEY=sua_secret_key_aqui
```

## 📤 Como Usar

### Opção 1: Mintar NFT com Upload

1. Configure o Pinata (etapa anterior)
2. Conecte sua carteira MetaMask
3. Na seção "Mintar NFT do Pet":
   - Clique em "Escolher arquivo"
   - Selecione uma foto do seu pet (JPEG, PNG, GIF, WebP)
   - Veja o preview da imagem
4. Clique em "Upload & Mintar NFT"
5. O sistema automaticamente:
   - ✅ Faz upload da imagem para IPFS
   - ✅ Retorna a URI (ipfs://...)
   - ✅ Minta o NFT com essa URI
6. Receba o Token ID e link para visualizar no IPFS

### Opção 2: Registrar Pet com Upload

1. Configure o Pinata
2. Conecte sua carteira
3. Na seção "Registrar Pet":
   - Preencha: Nome, Espécie, Raça, Cor, Data de Nascimento
   - Selecione a foto do pet
   - Veja o preview
4. Clique em "Upload & Registrar Pet"
5. O sistema automaticamente:
   - ✅ Faz upload da imagem para IPFS
   - ✅ Registra o pet no blockchain com a URI

### Opção 3: Criar Pet NFT Completo (RECOMENDADO) 🌟

Esta é a forma mais completa e segue o padrão **OpenSea/ERC721 Metadata**.

1. Configure o Pinata
2. Conecte sua carteira
3. Na seção "🚀 Criar Pet NFT Completo":
   - Preencha todos os dados do pet
   - Selecione a foto
4. Clique em "✨ Criar Tudo"
5. O sistema faz automaticamente:
   - ✅ Upload da imagem para IPFS
   - ✅ Cria arquivo JSON de metadata (padrão OpenSea)
   - ✅ Upload da metadata para IPFS
   - ✅ Minta o NFT com URI da metadata
   - ✅ Registra o pet no PetID

**Resultado:**
```json
{
  "petId": 1,
  "tokenId": 1,
  "imageUrl": "ipfs://QmXXX...",
  "metadataUrl": "ipfs://QmYYY..."
}
```

## 📋 Padrão de Metadata OpenSea

O sistema cria automaticamente um JSON compatível com OpenSea:

```json
{
  "name": "Rex",
  "description": "Pet NFT para Rex, um Cachorro da raça Labrador",
  "image": "ipfs://QmImageHash...",
  "external_url": "https://gateway.pinata.cloud/ipfs/QmImageHash...",
  "attributes": [
    {
      "trait_type": "Species",
      "value": "Cachorro"
    },
    {
      "trait_type": "Breed",
      "value": "Labrador"
    },
    {
      "trait_type": "Color",
      "value": "Amarelo"
    },
    {
      "trait_type": "Birth Date",
      "display_type": "date",
      "value": 1640995200
    }
  ]
}
```

Este formato permite que o NFT seja visualizado no OpenSea, Rarible, etc.

## 🔧 Integração no Seu Frontend

### JavaScript Vanilla

```javascript
// 1. Carregar os scripts
<script src="./public/pinata-upload.js"></script>
<script src="./public/contract-helper.js"></script>

// 2. Inicializar Pinata
initPinata('YOUR_API_KEY', 'YOUR_SECRET_KEY');

// 3. Mintar NFT com imagem
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];

const result = await mintPetNFTWithUpload(file, 'Rex');
console.log('NFT Token ID:', result.tokenId);
console.log('IPFS URL:', result.ipfsUrl);

// 4. Registrar pet com imagem
const petData = {
  name: 'Rex',
  species: 'Cachorro',
  breed: 'Labrador',
  color: 'Amarelo',
  birthDate: 1640995200
};

const result = await registerPetWithUpload(petData, file);
console.log('Pet ID:', result.petId);

// 5. Criar Pet NFT completo
const result = await createCompletePetNFT(petData, file);
console.log('Pet ID:', result.petId);
console.log('NFT Token ID:', result.tokenId);
console.log('Metadata URL:', result.metadataUrl);
```

### React/Next.js

```jsx
import { initPinata, mintPetNFTWithUpload } from './public/pinata-upload';

function MintNFT() {
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Inicializar Pinata
    initPinata(
      process.env.NEXT_PUBLIC_PINATA_API_KEY,
      process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
    );
  }, []);

  const handleMint = async () => {
    const result = await mintPetNFTWithUpload(file, 'My Pet');
    alert(`NFT mintado! Token ID: ${result.tokenId}`);
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      <button onClick={handleMint}>Mintar NFT</button>
    </div>
  );
}
```

## ⚠️ Limitações e Especificações

### Tipos de Arquivo Aceitos
- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### Tamanho Máximo
- **Padrão:** 10MB por arquivo
- **Plano Grátis Pinata:** 100MB total
- **Plano Pago:** Até 100GB+

### Validação Automática
O sistema valida automaticamente:
- Tipo de arquivo (só aceita imagens)
- Tamanho (máx. 10MB)
- Formato correto

## 🔐 Segurança

### ⚠️ NUNCA exponha suas chaves diretamente no frontend!

**Problemas:**
- Qualquer pessoa pode ver suas chaves no código JavaScript
- Podem usar sua conta Pinata gratuitamente
- Risco de exceder limites e custos inesperados

**Solução Recomendada (Produção):**

1. Criar um backend/API proxy
2. Backend faz upload para Pinata
3. Frontend chama seu backend

```javascript
// Backend (Node.js/Express)
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  const formData = new FormData();
  formData.append('file', req.file.buffer, req.file.originalname);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    headers: {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
    },
    body: formData
  });
  
  const data = await response.json();
  res.json({ ipfsHash: data.IpfsHash });
});

// Frontend
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData
});

const { ipfsHash } = await response.json();
```

## 📚 Funções Disponíveis

### `initPinata(apiKey, secretApiKey)`
Inicializa o uploader com suas credenciais.

### `uploadImageToPinata(file, name)`
Upload simples de imagem.
- **Retorna:** `{ ipfsHash, gatewayUrl, pinataUrl }`

### `mintPetNFTWithUpload(imageFile, petName)`
Upload + Mint NFT.
- **Retorna:** `{ tokenId, ipfsUrl, ipfsHash, pinataUrl }`

### `registerPetWithUpload(petData, imageFile)`
Upload + Registro de Pet.
- **Retorna:** `{ petId, ipfsUrl, ipfsHash, pinataUrl }`

### `createCompletePetNFT(petData, imageFile)`
Upload completo (imagem + metadata JSON) + Mint + Registro.
- **Retorna:** `{ petId, tokenId, metadataUrl, imageUrl, metadataHash, imageHash }`

## 🆘 Troubleshooting

### Erro: "Pinata não foi inicializado"
**Solução:** Chame `initPinata(apiKey, secretKey)` antes de usar qualquer função de upload.

### Erro: "Tipo de arquivo inválido"
**Solução:** Use apenas JPEG, PNG, GIF ou WebP.

### Erro: "Arquivo muito grande"
**Solução:** Redimensione a imagem para menos de 10MB.

### Erro: "401 Unauthorized"
**Solução:** Verifique se suas API Keys estão corretas.

### Upload lento
**Causas:**
- Tamanho grande da imagem
- Conexão lenta
- Servidor Pinata sobrecarregado

**Solução:** Comprimir imagem antes do upload.

## 🔗 Links Úteis

- [Pinata Dashboard](https://app.pinata.cloud)
- [Pinata Docs](https://docs.pinata.cloud)
- [IPFS Gateway](https://gateway.pinata.cloud)
- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
