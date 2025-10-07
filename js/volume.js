const SIZE = 4;
let board = [];
let score = 0;
const goalScore = 30_000; // originalmente pensaba dejarlo en 983_040 pero es mucho (puntaje mínimo para sacar 65536)

const gridEl = document.getElementById('grid');
const tileLayer = document.getElementById('tile-layer');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');


// DOM / board helpers
function initDOM() {
  gridEl.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      gridEl.appendChild(cell);
    }
  }
}

function emptyBoard() {
  board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function spawnRandom() {
  const empties = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empties.push([r, c]);
    }
  }

  if (empties.length === 0) return false;

  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  board[r][c] = Math.random() < 0.9 ? 1 : 2;
  return true;
}


// Rendering
function render() {
  tileLayer.innerHTML = '';

  const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'), 10);
  const tileSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size'), 10);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = board[r][c];
      if (val === 0) continue;

      const tile = document.createElement('div');
      const display = Math.pow(2, val);
      tile.className = `tile t-${val > 9 ? 'large' : val} t-val-${val}`;
      tile.style.width = tileSize + 'px';
      tile.style.height = tileSize + 'px';
      tile.style.left = (c * (tileSize + gap)) + 'px';
      tile.style.top = (r * (tileSize + gap)) + 'px';
      tile.innerHTML = `<div class="value">${display}</div>`;
      tile.classList.add('t-' + Math.min(val, 9));
      tileLayer.appendChild(tile);
    }
  }

  scoreEl.textContent = score;
}


// Matrix utilities
function rotateLeft(m) {
  const n = m.length;
  const res = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      res[n - 1 - j][i] = m[i][j];
    }
  }

  return res;
}


// Game logic
function moveLeftOnce(grid) {
  let moved = false;
  let gained = 0;
  const n = grid.length;

  for (let r = 0; r < n; r++) {
    let row = grid[r].filter(x => x !== 0);

    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] = row[i] + 1;
        gained += Math.pow(2, row[i]);
        row.splice(i + 1, 1);
        moved = true;
      }
    }

    while (row.length < n) row.push(0);

    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== row[c]) moved = true;
      grid[r][c] = row[c];
    }
  }

  return { moved, gained };
}


function move(direction) {
  let g = board.map(r => r.slice()); // clone
  let moved = false;
  let gained = 0;

  if (direction === 'left') {
    ({ moved, gained } = moveLeftOnce(g));

  } else if (direction === 'right') {
    // reverse each row, move left, reverse back
    g = g.map(r => r.slice().reverse());
    ({ moved, gained } = moveLeftOnce(g));
    g = g.map(r => r.slice().reverse());

  } else if (direction === 'up') {
    // rotate left, move left, rotate right (3x left)
    g = rotateLeft(g);
    ({ moved, gained } = moveLeftOnce(g));
    g = rotateLeft(rotateLeft(rotateLeft(g)));

  } else if (direction === 'down') {
    g = rotateLeft(g);
    g = g.map(r => r.slice().reverse());
    ({ moved, gained } = moveLeftOnce(g));
    g = g.map(r => r.slice().reverse());
    g = rotateLeft(rotateLeft(rotateLeft(g)));
  }

  if (moved) {
    board = g;
    score += gained;

    updateMusicVolume();
    spawnRandom();
    render();

    if (checkGameOver()) showOverlay('Game Over');
  }

  return moved;
}


// Game state / overlay
function checkGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false;
    }
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 1; c++) {
      if (board[r][c] === board[r][c + 1]) return false;
    }
  }

  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 1; r++) {
      if (board[r][c] === board[r + 1][c]) return false;
    }
  }

  return true;
}


function showOverlay(text) {
  overlay.style.display = 'flex';
  overlay.textContent = text + ' — Score: ' + score;
}

function hideOverlay() {
  overlay.style.display = 'none';
}


function reset() {
  score = 0;
  updateMusicVolume();
  hideOverlay();
  emptyBoard();
  initDOM();
  spawnRandom();
  spawnRandom();
  render();
}


// Input handling
window.addEventListener('keydown', e => {
  if (overlay.style.display === 'flex') return;

  const key = e.key;
  let moved = false;

  if (key === 'ArrowLeft' || key === 'a' || key === 'A') moved = move('left');
  else if (key === 'ArrowRight' || key === 'd' || key === 'D') moved = move('right');
  else if (key === 'ArrowUp' || key === 'w' || key === 'W') moved = move('up');
  else if (key === 'ArrowDown' || key === 's' || key === 'S') moved = move('down');

  if (moved) e.preventDefault();
});


let touchStart = null;

window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) touchStart = [e.touches[0].clientX, e.touches[0].clientY];
});

window.addEventListener('touchend', e => {
  if (!touchStart) return;

  const x = (e.changedTouches[0].clientX - touchStart[0]);
  const y = (e.changedTouches[0].clientY - touchStart[1]);

  // small move = tap
  if (Math.abs(x) < 20 && Math.abs(y) < 20) return;

  if (Math.abs(x) > Math.abs(y)) {
    if (x > 0) move('right'); else move('left');
  } else {
    if (y > 0) move('down'); else move('up');
  }

  touchStart = null;
});


// UI buttons
const resetBtn = document.getElementById('reset');
const bgMusic = document.getElementById('bg-music');

if (resetBtn) resetBtn.addEventListener('click', reset);

function setMusicState(on) {
  if (!bgMusic) return;
  if (on) {
    updateMusicVolume();
    bgMusic.play().then(() => {
      localStorage.setItem('music_on', '1');
    }).catch((err) => {
      console.warn('Music play blocked:', err);
      localStorage.setItem('music_on', '0');
    });
  } else {
    bgMusic.pause();
    localStorage.setItem('music_on', '0');
  }
}


function updateMusicVolume() {
  if (!bgMusic) return;
  const v = Number.isFinite(score) && Number.isFinite(goalScore) && goalScore > 0 ? (score / goalScore) : 0;
  const vol = Math.max(0, Math.min(1, v));
  bgMusic.volume = vol;
  // update UI percent if present
  const mmVol = document.getElementById('mm-volume');
  if (mmVol) mmVol.textContent = (vol * 100).toFixed(3) + '%';
}


// Music manager
const playlist = [
  { title: 'Shop - Toby Fox', src: '../music/Shop - Toby Fox.mp3' },
  {
    title: 'Aquatic Ambience (Donkey Kong Country) - The OneUps',
    src: '../music/Donkey Kong Country - Aquatic Ambience [Restored] [2023 Mix] - Jammin\' Sam Miller.mp3'
  },
  { title: 'Vitality - Mittsies', src: '../music/Mittsies - Vitality - Mittsies.mp3' },
  {
    title: 'Greenpath (Hollow Knight) - Christopher Larkin',
    src: '../music/Hollow Knight OST - Greenpath - Amellifera.mp3'
  },
  {
    title: 'Quiet and Falling (Celeste) - Lena Raine',
    src: '../music/[Official] Celeste Original Soundtrack - 11 - Quiet and Falling - Lena Raine.mp3'
  }
];
let currentTrack = 0;

function loadTrack(index) {
  if (!bgMusic) return;
  index = (index + playlist.length) % playlist.length;
  currentTrack = index;
  bgMusic.src = playlist[currentTrack].src;
  const mmTrack = document.getElementById('mm-track');
  if (mmTrack) mmTrack.textContent = playlist[currentTrack].title;
}

function playPauseToggle() {
  if (!bgMusic) return;
  if (bgMusic.paused) setMusicState(true);
  else setMusicState(false);
}

function nextTrack() { loadTrack(currentTrack + 1); if (bgMusic && !bgMusic.paused) { bgMusic.play(); } }
function prevTrack() { loadTrack(currentTrack - 1); if (bgMusic && !bgMusic.paused) { bgMusic.play(); } }

const mmPlay = document.getElementById('mm-play');
const mmPrev = document.getElementById('mm-prev');
const mmNext = document.getElementById('mm-next');

if (mmPlay) mmPlay.addEventListener('click', () => {
  playPauseToggle();
  mmPlay.textContent = (bgMusic && bgMusic.paused) ? 'Play' : 'Pause';
});
if (mmPrev) mmPrev.addEventListener('click', () => { prevTrack(); });
if (mmNext) mmNext.addEventListener('click', () => { nextTrack(); });

if (bgMusic) {
  bgMusic.addEventListener('ended', () => {
    nextTrack();
  });
}

loadTrack(currentTrack);
updateMusicVolume();

if (bgMusic) {
  const musicPref = localStorage.getItem('music_on') === '1';
  if (musicPref) {
    setMusicState(true);
  }
}


// Initialize
initDOM();
emptyBoard();
spawnRandom();
spawnRandom();
render();