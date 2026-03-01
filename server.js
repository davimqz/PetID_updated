/**
 * Backend Server - PetID dApp
 * Proxy seguro para upload no Pinata IPFS
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// CORS - Permitir requisições do frontend
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS - Origem da requisição:', origin);

    // Permitir requisições sem origin (ex: Postman, curl)
    if (!origin) {
      console.log('✅ CORS - Sem origin, permitindo...');
      return callback(null, true);
    }

    try {
      const u = new URL(origin);
      const host = u.hostname;

      // Permitir qualquer origem localhost ou 127.0.0.1 (qualquer porta)
      if (host === 'localhost' || host === '127.0.0.1') {
        console.log('✅ CORS - Origem localhost permitida:', origin);
        return callback(null, origin);
      }
    } catch (e) {
      // se origin não for uma URL válida, seguir checagem padrão
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS - Origem permitida pela lista:', origin);
      return callback(null, origin);
    }

    console.log('❌ CORS - Origem bloqueada:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'PetID Backend',
    pinataConfigured: !!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET)
  });
});

// Upload de imagem para Pinata
app.post('/api/upload-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    console.log(`📤 Uploading image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Validar tipo de arquivo
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Arquivo deve ser uma imagem' });
    }

    // Criar FormData para Pinata
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Metadata opcional
    const metadata = JSON.stringify({
      name: req.body.petName || req.file.originalname,
      keyvalues: {
        type: 'pet-image',
        uploadedAt: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    // Upload para Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Pinata error:', error);
      return res.status(response.status).json({ 
        error: `Pinata upload failed: ${error.error || response.statusText}` 
      });
    }

    const result = await response.json();
    console.log(`✅ Image uploaded to Pinata: ${result.IpfsHash}`);

    res.json({
      ipfsHash: result.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload de metadata JSON para Pinata
app.post('/api/upload-json', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'Metadata é obrigatório' });
    }

    console.log(`📤 Uploading JSON metadata...`);

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name || 'Pet Metadata',
          keyvalues: {
            type: 'pet-metadata',
            uploadedAt: new Date().toISOString()
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Pinata error:', error);
      return res.status(response.status).json({ 
        error: `Pinata upload failed: ${error.error || response.statusText}` 
      });
    }

    const result = await response.json();
    console.log(`✅ Metadata uploaded to Pinata: ${result.IpfsHash}`);

    res.json({
      ipfsHash: result.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend Server rodando em http://localhost:${PORT}`);
  console.log(`📸 Pinata configurado: ${!!(process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET)}`);
});
