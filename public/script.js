let allSongs = [];

const musicGrid = document.getElementById('musicGrid');
const adminSongList = document.getElementById('adminSongList');
const audioPlayer = document.getElementById('audioPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const uploadForm = document.getElementById('uploadForm');
const statusDiv = document.getElementById('status');

// Fetch Songs From Server
async function fetchSongs() {
  try {
    const res = await fetch('/api/songs');
    allSongs = await res.json();

    if (musicGrid) renderUserGrid(allSongs);
    if (adminSongList) renderAdminList(allSongs);
  } catch (err) {
    if (musicGrid) musicGrid.innerHTML = "<p style='color:red;'>Erreur lors du chargement des chansons !</p>";
  }
}

// Render User Frontend Grid
function renderUserGrid(songs) {
  musicGrid.innerHTML = "";
  if (songs.length === 0) {
    musicGrid.innerHTML = "<p style='color:var(--text-sub);'>Aucune chanson disponible pour le moment.</p>";
    return;
  }

  songs.forEach(song => {
    musicGrid.innerHTML += `
      <div class="music-card">
        <div class="card-info">
          <h4>${song.title}</h4>
          <p>👤 ${song.artist}</p>
          <span class="card-tag">${song.category}</span>
        </div>
        <div class="card-actions">
          <button class="btn-play" onclick="playSong('${song.title}', '${song.artist}', '${song.url}')">▶ Écouter</button>
          <a href="${song.url}" download class="btn-download">⬇ Télécharger</a>
        </div>
      </div>
    `;
  });
}

// Render Admin Dashboard List
function renderAdminList(songs) {
  adminSongList.innerHTML = "";
  if (songs.length === 0) {
    adminSongList.innerHTML = "<p style='color:var(--text-sub);'>Aucune chanson ajoutée pour le moment.</p>";
    return;
  }

  songs.forEach(song => {
    adminSongList.innerHTML += `
      <div class="admin-song-item">
        <div>
          <strong>${song.title}</strong>
          <br><small style="color:var(--text-sub);">${song.artist} • ${song.category}</small>
        </div>
        <span style="color:var(--accent-color); font-size:0.8rem;">Publié ✅</span>
      </div>
    `;
  });
}

// Play Song Function
function playSong(title, artist, url) {
  if (audioPlayer) {
    playerTitle.textContent = title;
    playerArtist.textContent = artist;
    audioPlayer.src = url;
    audioPlayer.play();
  }
}

// Search Filter
function searchMusic() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allSongs.filter(song => 
    song.title.toLowerCase().includes(query) || 
    song.artist.toLowerCase().includes(query) ||
    song.category.toLowerCase().includes(query)
  );
  renderUserGrid(filtered);
}

// Handle Song Upload (Admin Page)
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const category = document.getElementById('category').value;
    const fileInput = document.getElementById('file');

    if (!fileInput.files[0]) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('category', category);
    formData.append('waka', fileInput.files[0]);

    statusDiv.style.color = "gold";
    statusDiv.textContent = "⏳ Chargement en cours...";

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        statusDiv.style.color = "var(--accent-color)";
        statusDiv.textContent = "✅ Chanson ajoutée avec succès !";
        uploadForm.reset();
        fetchSongs();
      } else {
        statusDiv.style.color = "red";
        statusDiv.textContent = data.error || "Une erreur est survenue !";
      }
    } catch (err) {
      statusDiv.style.color = "red";
      statusDiv.textContent = "❌ Erreur de connexion avec le serveur.";
    }
  });
}

// Initialize
fetchSongs();
