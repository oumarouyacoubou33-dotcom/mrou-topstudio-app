const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
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

let songs = [];

// API Endpoint
app.get('/api/songs', (req, res) => res.json(songs));

app.post('/api/upload', upload.single('waka'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Zaɓi fayil ɗin waƙa." });
  
  const newSong = {
    id: Date.now(),
    title: req.body.title || "Unknown Title",
    artist: req.body.artist || "Mrou Artist",
    category: req.body.category || "General",
    url: '/uploads/' + req.file.filename,
    date: new Date().toLocaleDateString('ha-NG')
  };
  
  songs.unshift(newSong);
  res.json({ success: true, song: newSong });
});

// Route na Admin Dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log("==========================================");
  console.log("🚀 Mrou Topstudio App na aiki a:");
  console.log("👉 Frontend (Masu Sauraro): http://localhost:" + PORT);
  console.log("👉 Admin Panel (Masu Dora Waƙa): http://localhost:" + PORT + "/admin");
  console.log("==========================================");
});
