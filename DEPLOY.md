# PetID Smart Contracts - Guia de Deploy e Integração

## 📋 Contratos Deployados (Localhost)

- **PetNFT**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **PetID**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- **Network**: Hardhat Localhost (Chain ID: 31337)
- **RPC URL**: `http://127.0.0.1:8545`

## 🚀 Como Rodar o Projeto Localmente

### 1. Instalar Dependências
```bash
npm install
```

### 2. Compilar Contratos
```bash
npx hardhat compile
```

### 3. Iniciar Nó Local (Terminal 1)
```bash
npx hardhat node
```
Deixe este terminal rodando. Ele mostrará 20 contas de teste com ETH.

### 4. Deploy dos Contratos (Terminal 2)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Anote os endereços dos contratos exibidos no console.

### 5. Configurar MetaMask

1. Abra MetaMask
2. Adicione nova rede:
   - **Nome da Rede**: Hardhat Localhost
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Símbolo da Moeda**: `ETH`

3. Importe uma conta de teste do Hardhat:
   - Copie uma das private keys exibidas no terminal do `hardhat node`
   - No MetaMask: Importar conta → Cole a private key

### 6. Testar Contratos

Abra o arquivo `contract-test.html` no navegador:
```bash
# Servir com live server ou similar
npx live-server --port=3000
```

Acesse: `http://localhost:3000/contract-test.html`

## 📚 Arquitetura dos Contratos

### PetNFT.sol
- **Propósito**: NFT ERC721 para representar pets
- **Funcionalidades**:
  - Mint de NFT (até 2 por usuário por padrão)
  - Burn de NFT (decrementa contador)
  - Admin mint (sem limite de quantidade)
  - Update de tokenURI
  - Meta-transactions via ERC2771Context

### PetID.sol
- **Propósito**: Registro central de informações de pets
- **Funcionalidades**:
  - Registro de pet com informações básicas e estendidas
  - Vinculação de NFT ao pet
  - Consulta de pets por dono
  - Armazenamento de dados on-chain

### Integração entre Contratos
1. `PetID` conhece o endereço do `PetNFT`
2. Ao linkar NFT ao pet, `PetID` verifica ownership no `PetNFT`
3. Apenas o dono do NFT pode vinculá-lo a um pet

## 🛠 Como Integrar no Frontend

### Opção 1: Usar Helper Pré-configurado

```html
<!-- Carregar ethers.js -->
<script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>

<!-- Carregar contract helper -->
<script src="./public/contract-helper.js"></script>

<script>
  // Conectar carteira
  const { provider, signer, address } = await connectWallet();
  
  // Mintar NFT
  const tokenId = await mintPetNFT('ipfs://QmYourImageHash');
  
  // Registrar pet
  const petId = await registerPet(
    'Rex',           // nome
    'Cachorro',      // espécie
    'Labrador',      // raça
    'Amarelo',       // cor
    1640995200,      // birthDate (Unix timestamp)
    'ipfs://QmHash'  // imageURI
  );
  
  // Listar meus pets
  const myPets = await getMyPets();
</script>
```

### Opção 2: Integração Manual

```javascript
// 1. Conectar ao MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send('eth_requestAccounts', []);
const signer = provider.getSigner();

// 2. Criar instância do contrato
const PetNFT_ABI = [...]; // Ver public/contract-helper.js
const petNFT = new ethers.Contract(
  '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  PetNFT_ABI,
  signer
);

// 3. Chamar funções do contrato
const tx = await petNFT.mintToSelf('ipfs://QmHash');
await tx.wait();
```

## 📁 Estrutura de Arquivos

```
petid/
├── contracts/
│   ├── PetNFT.sol          # Contrato NFT
│   └── PetID.sol           # Contrato Registry
├── scripts/
│   └── deploy.js           # Script de deploy
├── public/
│   ├── contracts-config.json  # Endereços dos contratos
│   └── contract-helper.js     # Helper JS para integração
├── contract-test.html      # Página de teste
└── hardhat.config.js       # Configuração Hardhat
```

## 🔧 Funções Principais

### PetNFT

```solidity
// Mintar NFT para si mesmo
function mintToSelf(string uri) returns (uint256)

// Consultar quantidade de NFTs mintados
function getMintCount(address user) view returns (uint256)

// Consultar NFTs restantes disponíveis
function getRemainingMints(address user) view returns (uint256)

// Queimar NFT
function burn(uint256 tokenId)
```

### PetID

```solidity
// Registrar novo pet
function registerPet(
  string name,
  string species,
  string breed,
  string color,
  uint256 birthDate,
  string imageURI
) returns (uint256 petId)

// Linkar NFT ao pet
function linkNFTToPet(
  uint256 petId,
  address nftContract,
  uint256 tokenId
)

// Buscar pets do usuário
function getPetsByOwner(address owner) returns (uint256[])
```

## ⚠️ Limitações e Correções Aplicadas

### Correções de Segurança Implementadas:
✅ Pattern de saque de taxas (withdrawFees) - *removido posteriormente*  
✅ adminMint incrementa userMintCount corretamente  
✅ burn decrementa userMintCount  
✅ Imports do OpenZeppelin corrigidos (security/ReentrancyGuard)  
✅ Ownership pattern correto com _transferOwnership  
✅ Ordem de herança correta (ERC2771Context primeiro)

### Recursos Removidos:
❌ Taxas de mint (mintFee, accumulatedFees, withdrawFees) - conforme solicitação do usuário

### Limitações Conhecidas:
- ⚠️ Transferência de NFT não atualiza automaticamente `PetID.petOwner`
- ⚠️ Não há prevenção de double-linking (mesmo NFT em múltiplos pets)
- ⚠️ maxMintsPerUser = 2 (configurável pelo owner)

## 🧪 Testando com Dados de Exemplo

```javascript
// Registrar um pet de teste
await registerPet(
  'Thor',
  'Cachorro',
  'Golden Retriever',
  'Dourado',
  Math.floor(new Date('2020-05-15').getTime() / 1000),
  'ipfs://QmExampleHash123'
);

// Mintar NFT do pet
const tokenId = await mintPetNFT('ipfs://QmPetPhotoHash456');
```

## 📝 Próximos Passos Sugeridos

1. ✅ Deploy local concluído
2. 🔄 Testar todas as funções via interface
3. 📝 Escrever testes unitários (Hardhat + Chai)
4. 🔧 Implementar sincronização de ownership NFT ↔ PetID
5. 🚀 Deploy em testnet (Sepolia, Mumbai, etc.)
6. 🎨 Integrar com app.html principal

## 🆘 Troubleshooting

### Erro: "Cannot read properties of undefined (reading 'AddressZero')"
**Solução**: Usar `ethers.ZeroAddress` (ethers v6) ou `ethers.constants.AddressZero` (ethers v5)

### Erro: "Wrong argument count for modifier invocation"
**Solução**: Usar `_transferOwnership(initialOwner)` dentro do constructor em vez de `Ownable(initialOwner)` na lista de herança

### Erro: "Immutable variables cannot be read before they are initialized"
**Solução**: Colocar `ERC2771Context` primeiro na lista de herança

### Transação rejeitada no MetaMask
**Verificar**:
- 🔗 Conectado à rede correta (Chain ID 31337)
- 💰 Conta tem ETH suficiente
- ⚡ Nó Hardhat está rodando
