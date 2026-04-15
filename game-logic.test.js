import assert from "node:assert/strict";
import { test } from "node:test";
import { GRID_SIZE, buildWallSet, isBlocked, moveShade } from "./game-logic.js";

test("isBlocked reports walls and bounds", () => {
  const walls = buildWallSet();
  assert.ok(isBlocked(-1, 0, GRID_SIZE, walls));
  assert.ok(isBlocked(0, -1, GRID_SIZE, walls));
  assert.ok(isBlocked(GRID_SIZE, 0, GRID_SIZE, walls));
  assert.ok(isBlocked(2, 1, GRID_SIZE, walls));
  assert.equal(isBlocked(1, 1, GRID_SIZE, walls), false);
});

test("moveShade steps toward the player", () => {
  const walls = new Set();
  const shade = { x: 5, y: 5 };
  const player = { x: 7, y: 5 };
  const nextShade = moveShade(shade, player, GRID_SIZE, walls);
  assert.deepEqual(nextShade, { x: 6, y: 5 });
});

test("moveShade avoids blocked tiles", () => {
  const walls = new Set(["6,5"]);
  const shade = { x: 5, y: 5 };
  const player = { x: 7, y: 5 };
  const nextShade = moveShade(shade, player, GRID_SIZE, walls);
  assert.notDeepEqual(nextShade, { x: 6, y: 5 });
  assert.ok(!walls.has(`${nextShade.x},${nextShade.y}`));
});
