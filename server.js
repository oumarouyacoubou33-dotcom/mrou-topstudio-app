const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin Password
const ADMIN_PASSWORD = "mrou2026password"; 

// Tsara Cloudinary Credentials
cloudinary.config({
  cloud_name: 'fbtfccom',
  api_key: '759698651832687',
  api_secret: 'x85MDo8JWIfH1DJBahXFxa3OH1Q'
});

// Set up Storage din Cloudinary don fayilolin Audio/MP3
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mrou_topstudio_songs',
    resource_type: 'auto'
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fayil din adana bayanan wakoki (Data JSON)
const dataFile = path.join(__dirname, 'songs.json');
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

function getSongs() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveSongs(songs) {
  fs.writeFileSync(dataFile, JSON.stringify(songs, null, 2));
}

// API Endpoints
app.get('/api/songs', (req, res) => res.json(getSongs()));

app.post('/api/verify-admin', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: "Mot de passe incorrect !" });
});

// Upload Track API zuwa Cloudinary
app.post('/api/upload', upload.single('waka'), (req, res) => {
  const authHeader = req.headers['x-admin-password'];
  
  if (authHeader !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Accès refusé! Mot de passe incorrect." });
  }

  if (!req.file) return res.status(400).json({ error: "Fichier audio requis." });
  
  const songs = getSongs();
  const newSong = {
    id: Date.now(),
    title: req.body.title || "Titre inconnu",
    artist: req.body.artist || "Artiste inconnu",
    category: req.body.category || "General",
    url: req.file.path, // Direct URL daga Cloudinary
    date: new Date().toLocaleDateString('fr-FR')
  };
  
  songs.unshift(newSong);
  saveSongs(songs);
  res.json({ success: true, song: newSong });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log("🚀 Mrou Topstudio App with Cloudinary active on port " + PORT);
});
