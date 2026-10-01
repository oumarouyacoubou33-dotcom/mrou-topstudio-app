const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your Admin Password Here
const ADMIN_PASSWORD = "mrou2026password"; 

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const dataFile = path.join(__dirname, 'songs.json');
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'mrou-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

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

// Verification Password API
app.post('/api/verify-admin', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: "Mot de passe incorrect !" });
});

// Upload Track API (Requires Admin Password in Headers)
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
    url: '/uploads/' + req.file.filename,
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
  console.log("🚀 Mrou Topstudio App operational on port " + PORT);
});
