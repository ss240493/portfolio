import {
  GRID_SIZE,
  createLevelState,
  isBlocked,
  moveShade as calculateShadeMove,
} from "./game-logic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const startButton = document.getElementById("startButton");
const statusText = document.getElementById("statusText");

const tileSize = canvas.width / GRID_SIZE;
let walls = new Set();
let keys = [];
let exitDoor = { x: 9, y: 9, unlocked: false };
let player = { x: 0, y: 0 };
let shade = { x: 9, y: 0 };
let collectedKeys = 0;
let running = false;
let paused = false;
let gameLoopId;

const ambience = {
  flicker: 0,
  whisperTimer: 0,
};

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function applyLevelState() {
  const state = createLevelState();
  walls = state.walls;
  keys = state.keys;
  exitDoor = state.exitDoor;
  player = state.player;
  shade = state.shade;
  collectedKeys = state.collectedKeys;
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const flicker = 0.85 + Math.sin(ambience.flicker) * 0.1;
  ctx.fillStyle = `rgba(4, 4, 8, ${flicker})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  walls.forEach((wall) => {
    const [x, y] = wall.split(",").map(Number);
    drawTile(x, y, "#1a1825");
  });

  keys.forEach((key) => {
    if (!key.collected) {
      drawTile(key.x, key.y, "#ffb86c");
    }
  });

  drawTile(exitDoor.x, exitDoor.y, exitDoor.unlocked ? "#3ddc97" : "#6b1d1d");

  drawTile(player.x, player.y, "#7f5af0");
  drawTile(shade.x, shade.y, "#ff4d6d");

  drawGrid();

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lightRadius = tileSize * 2.2;
  const gradient = ctx.createRadialGradient(
    (player.x + 0.5) * tileSize,
    (player.y + 0.5) * tileSize,
    tileSize * 0.4,
    (player.x + 0.5) * tileSize,
    (player.y + 0.5) * tileSize,
    lightRadius
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * tileSize, (player.y + 0.5) * tileSize, lightRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillText(`Keys: ${collectedKeys}/3`, 16, 28);
  ctx.fillText(`Exit: ${exitDoor.unlocked ? "Unlocked" : "Locked"}`, 16, 48);
}

function movePlayer(dx, dy) {
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  if (isBlocked(nextX, nextY, GRID_SIZE, walls)) {
    statusText.textContent = "You hit a cold wall.";
    return;
  }
  player.x = nextX;
  player.y = nextY;
  statusText.textContent = "Footsteps echo behind you...";
  checkKeyPickup();
  checkExit();
}

function checkKeyPickup() {
  keys.forEach((key) => {
    if (!key.collected && key.x === player.x && key.y === player.y) {
      key.collected = true;
      collectedKeys += 1;
      statusText.textContent = "A key glints in the dark.";
      if (collectedKeys === keys.length) {
        exitDoor.unlocked = true;
        statusText.textContent = "The exit unlocks with a groan.";
      }
    }
  });
}

function checkExit() {
  if (player.x === exitDoor.x && player.y === exitDoor.y && exitDoor.unlocked) {
    endGame(true);
  }
}

function moveShade() {
  shade = calculateShadeMove(shade, player, GRID_SIZE, walls);
  if (shade.x === player.x && shade.y === player.y) {
    endGame(false);
  }
}

function endGame(survived) {
  running = false;
  cancelAnimationFrame(gameLoopId);
  overlay.classList.remove("hidden");
  overlayTitle.textContent = survived ? "You escaped." : "The Shade found you.";
  overlayBody.textContent = survived
    ? "The corridor exhales. You live to tell the tale. Want to try again?"
    : "Your flashlight sputters out. Try again, if you dare.";
  startButton.textContent = "Play Again";
  statusText.textContent = survived ? "You survived the corridor." : "The corridor grows silent.";
}

function gameLoop() {
  if (!running) {
    return;
  }
  if (!paused) {
    ambience.flicker += 0.08;
    ambience.whisperTimer += 1;
    if (ambience.whisperTimer % 120 === 0) {
      statusText.textContent = "Whispers trace the walls.";
    }
    if (ambience.whisperTimer % 30 === 0) {
      moveShade();
    }
  }
  drawScene();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
  applyLevelState();
  running = true;
  paused = false;
  overlay.classList.add("hidden");
  statusText.textContent = "The air is cold. Find the keys.";
  gameLoop();
}

function togglePause() {
  paused = !paused;
  statusText.textContent = paused ? "You hold your breath." : "You move again.";
}

window.addEventListener("keydown", (event) => {
  const direction = directions[event.key];
  if (direction && running && !paused) {
    movePlayer(direction.x, direction.y);
  } else if (event.key === " " && running) {
    togglePause();
  } else if (event.key.toLowerCase() === "r") {
    startGame();
  }
});

startButton.addEventListener("click", startGame);

applyLevelState();
startButton.focus();
drawScene();
