export const GRID_SIZE = 10;

const WALL_COORDINATES = [
  [2, 1],
  [2, 2],
  [2, 3],
  [4, 0],
  [4, 1],
  [4, 2],
  [4, 4],
  [5, 4],
  [6, 4],
  [6, 6],
  [6, 7],
  [1, 6],
  [2, 6],
  [3, 6],
  [7, 2],
  [8, 2],
  [7, 8],
  [8, 8],
];

export const START_PLAYER = { x: 0, y: 0 };
export const START_SHADE = { x: 9, y: 0 };
export const EXIT_DOOR = { x: 9, y: 9 };

export function buildWallSet() {
  return new Set(WALL_COORDINATES.map(([x, y]) => `${x},${y}`));
}

export function createKeys() {
  return [
    { x: 1, y: 8, collected: false },
    { x: 5, y: 2, collected: false },
    { x: 8, y: 6, collected: false },
  ];
}

export function createLevelState() {
  return {
    walls: buildWallSet(),
    keys: createKeys(),
    exitDoor: { ...EXIT_DOOR, unlocked: false },
    player: { ...START_PLAYER },
    shade: { ...START_SHADE },
    collectedKeys: 0,
  };
}

export function isBlocked(x, y, gridSize, walls) {
  return x < 0 || y < 0 || x >= gridSize || y >= gridSize || walls.has(`${x},${y}`);
}

export function moveShade(shade, player, gridSize, walls) {
  const dx = Math.sign(player.x - shade.x);
  const dy = Math.sign(player.y - shade.y);
  const options = [
    { x: shade.x + dx, y: shade.y },
    { x: shade.x, y: shade.y + dy },
    { x: shade.x + dx, y: shade.y + dy },
  ];

  for (const option of options) {
    if (!isBlocked(option.x, option.y, gridSize, walls)) {
      return option;
    }
  }

  return shade;
}
