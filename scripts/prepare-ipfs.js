/**
 * Script de Build para IPFS
 * Prepara todos os arquivos necessários para deploy descentralizado
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ROOT_DIR = path.join(__dirname, '..');

// Arquivos e pastas a incluir no build
const INCLUDE_PATTERNS = [
  // HTML files
  'index.html',
  'index-dark.html',
  'contract-test.html',
  'mint-test.html',
  
  // Config files
  'manifest.json',
  'sw.js',
  
  // Public folder (JavaScript, CSS, JSON)
  'public/',
  
  // Assets folder
  'assets/',
  
  // Contracts artifacts (ABIs)
  'artifacts/contracts/'
];

// Pastas a excluir
const EXCLUDE_PATTERNS = [
  'node_modules',
  'server',
  'scripts',
  'cache',
  'dist',
  'src',
  '.git',
  '.env',
  'hardhat.config.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'DEPLOY.md',
  'PINATA_GUIDE.md',
  '.gitignore'
];

/**
 * Copiar arquivo ou diretório recursivamente
 */
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    // Criar diretório de destino
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Copiar conteúdo
    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    // Copiar arquivo
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${path.relative(ROOT_DIR, dest)}`);
  }
}

/**
 * Limpar diretório dist/
 */
function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    console.log('🗑️  Limpando diretório dist/...');
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  console.log('✅ Diretório dist/ criado\n');
}

/**
 * Copiar arquivos para dist/
 */
function buildForIPFS() {
  console.log('📦 Preparando build para IPFS...\n');
  
  cleanDist();
  
  console.log('📋 Copiando arquivos:\n');
  
  INCLUDE_PATTERNS.forEach(pattern => {
    const srcPath = path.join(ROOT_DIR, pattern);
    
    if (!fs.existsSync(srcPath)) {
      console.log(`  ⚠️  Não encontrado: ${pattern}`);
      return;
    }
    
    // Se termina com /, é um diretório
    if (pattern.endsWith('/')) {
      const dirName = pattern.slice(0, -1);
      const destPath = path.join(DIST_DIR, dirName);
      console.log(`\n📁 ${dirName}/`);
      copyRecursive(srcPath, destPath);
    } else {
      // É um arquivo
      const destPath = path.join(DIST_DIR, pattern);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${pattern}`);
    }
  });
  
  console.log('\n');
}

/**
 * Gerar arquivo de informações do build
 */
function generateBuildInfo() {
  const buildInfo = {
    buildDate: new Date().toISOString(),
    version: '1.0.0-web3',
    mode: '100% Decentralized',
    storage: 'Web3.Storage (IPFS)',
    files: []
  };
  
  // Listar todos os arquivos no dist/
  function listFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      const relativePath = path.join(prefix, file);
      
      if (stats.isDirectory()) {
        listFiles(filePath, relativePath);
      } else {
        buildInfo.files.push({
          path: relativePath,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2) + ' KB'
        });
      }
    });
  }
  
  listFiles(DIST_DIR);
  
  // Salvar build-info.json
  const buildInfoPath = path.join(DIST_DIR, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('📊 Build Info:');
  console.log(`   Total de arquivos: ${buildInfo.files.length}`);
  const totalSize = buildInfo.files.reduce((sum, f) => sum + f.size, 0);
  console.log(`   Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Build: ${buildInfo.buildDate}\n`);
}

/**
 * Criar arquivo README para IPFS
 */
function createIPFSReadme() {
  const readme = `# PetID - 100% Web3 DApp

Esta é a versão descentralizada da PetID, hospedada no IPFS.

## 🌐 Características

- **100% Web3**: Sem servidores backend centralizados
- **IPFS Storage**: Uploads via Web3.Storage
- **Smart Contracts**: Ethereum (Sepolia Testnet)
- **PWA Ready**: Pode ser instalado como app

## 🚀 Como Usar

1. **Acesse via Gateway IPFS**:
   - https://w3s.link/ipfs/[CID]
   - https://[CID].ipfs.dweb.link
   - https://cloudflare-ipfs.com/ipfs/[CID]

2. **Conecte sua Wallet**:
   - MetaMask ou carteira compatível
   - Rede: Sepolia Testnet

3. **Faça Login no Web3.Storage**:
   - Primeira vez: insira seu email
   - Confirme o magic link recebido
   - Credenciais salvas no navegador

4. **Crie NFTs dos seus Pets**:
   - Upload de foto descentralizado
   - Metadata no IPFS
   - NFT mintado on-chain

## 📝 Tecnologias

- Ethereum Smart Contracts (Solidity)
- Ethers.js
- Web3.Storage SDK
- IPFS
- Tailwind CSS

## 🔗 Links

- Contratos: Ver public/contracts-config.json
- Source Code: [GitHub Repository]

---

Build: ${new Date().toISOString()}
Mode: Decentralized
Storage: IPFS via Web3.Storage
`;

  const readmePath = path.join(DIST_DIR, 'README-IPFS.md');
  fs.writeFileSync(readmePath, readme);
  console.log('📄 README-IPFS.md criado\n');
}

/**
 * Main
 */
function main() {
  console.log('\n🚀 PetID - IPFS Build Script\n');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    buildForIPFS();
    generateBuildInfo();
    createIPFSReadme();
    
    console.log('═══════════════════════════════════════════\n');
    console.log('✅ Build concluído com sucesso!\n');
    console.log('📁 Arquivos prontos em: ./dist/\n');
    console.log('📤 Próximos passos:\n');
    console.log('   1. Acesse https://web3.storage');
    console.log('   2. Faça login e crie um space');
    console.log('   3. Upload da pasta dist/');
    console.log('   4. Obtenha o CID do IPFS');
    console.log('   5. Acesse via gateway: https://w3s.link/ipfs/[CID]\n');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante o build:', error.message);
    process.exit(1);
  }
}

// Execute
main();
