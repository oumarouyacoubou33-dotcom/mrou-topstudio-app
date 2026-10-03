const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = "mrou2026password"; 

cloudinary.config({
  cloud_name: 'fbtfccom',
  api_key: '759698651832687',
  api_secret: 'x85MDo8JWIfH1DJBahXFxa3OH1Q'
});

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

const dataFile = path.join(__dirname, 'songs.json');
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

function getSongs() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveSongs(songs) {
  fs.writeFileSync(dataFile, JSON.stringify(songs, null, 2));
}

// Keep-Alive Self Ping
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://mrou-topstudio-app.onrender.com';
setInterval(() => {
  if (RENDER_URL) {
    const protocol = RENDER_URL.startsWith('https') ? https : http;
    protocol.get(RENDER_URL, (res) => {}).on('error', () => {});
  }
}, 10 * 60 * 1000);

// API Endpoints
app.get('/api/songs', (req, res) => res.json(getSongs()));

app.post('/api/verify-admin', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: "Mot de passe incorrect !" });
});

// Increment Play / Download count
app.post('/api/songs/:id/stats', (req, res) => {
  const { type } = req.body; // 'plays' or 'downloads'
  const songs = getSongs();
  const song = songs.find(s => s.id == req.params.id);
  if (song) {
    if (type === 'play') song.plays = (song.plays || 0) + 1;
    if (type === 'download') song.downloads = (song.downloads || 0) + 1;
    saveSongs(songs);
    return res.json({ success: true, plays: song.plays, downloads: song.downloads });
  }
  res.status(404).json({ error: "Waƙa ba ta samuu ba." });
});

// Upload Track
app.post('/api/upload', upload.single('waka'), (req, res) => {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Accès refusé!" });
  }
  if (!req.file) return res.status(400).json({ error: "Fichier audio requis." });

  const songs = getSongs();
  const newSong = {
    id: Date.now(),
    title: req.body.title || "Titre inconnu",
    artist: req.body.artist || "Artiste inconnu",
    category: req.body.category || "General",
    url: req.file.path,
    plays: 0,
    downloads: 0,
    date: new Date().toLocaleDateString('fr-FR')
  };

  songs.unshift(newSong);
  saveSongs(songs);
  res.json({ success: true, song: newSong });
});

// Delete Track (Admin Only)
app.delete('/api/songs/:id', (req, res) => {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Accès refusé!" });
  }
  let songs = getSongs();
  songs = songs.filter(s => s.id != req.params.id);
  saveSongs(songs);
  res.json({ success: true });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));
