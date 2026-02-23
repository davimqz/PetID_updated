require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const app = express();
const upload = multer();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
  console.warn('Pinata keys not set in .env. /api endpoints will fail without keys.');
}

app.use(cors());
app.use(express.json());

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Serve public folder explicitly
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '..', 'contract-test.html')));
app.get('/mint', (req, res) => res.sendFile(path.join(__dirname, '..', 'mint-test.html')));

// Upload file to Pinata
app.post('/api/pin-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const form = new FormData();
    form.append('file', req.file.buffer, { filename: req.file.originalname });

    if (req.body.name) {
      form.append('pinataMetadata', JSON.stringify({ name: req.body.name }));
    }
    form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const headers = {
      ...form.getHeaders(),
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_API_KEY
    };

    const response = await axios.post(url, form, { headers, maxBodyLength: Infinity });
    return res.json({ success: true, result: response.data });
  } catch (err) {
    console.error('pin-file error', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Upload JSON metadata to Pinata
app.post('/api/pin-json', async (req, res) => {
  try {
    const metadata = req.body;
    if (!metadata) return res.status(400).json({ error: 'No metadata provided' });

    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const headers = {
      'Content-Type': 'application/json',
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_API_KEY
    };

    const response = await axios.post(url, { pinataContent: metadata }, { headers });
    return res.json({ success: true, result: response.data });
  } catch (err) {
    console.error('pin-json error', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
});

const PORT = process.env.PINATA_SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 PetID Server running on http://localhost:${PORT}`);
  console.log(`📄 Landing page: http://localhost:${PORT}/`);
  console.log(`📄 Main app (after login): http://localhost:${PORT}/contract-test.html`);
  console.log(`📦 Pinata proxy ready at /api/pin-file and /api/pin-json\n`);
});
