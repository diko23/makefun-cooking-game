// Hearth & Skillet — Simulation state, station interactions, cooking, plating, pathing, and orders.

import {
  BURN_TOTAL_TIME,
  BURN_WARNING_TIME,
  CHEF_DASH_COOLDOWN,
  CHEF_DASH_DURATION,
  CHEF_DASH_SPEED,
  CHEF_SPEED,
  CHOP_STEPS,
  COOK_TIME_GRILL,
  COOK_TIME_STOVE,
  GRID_COLS,
  GRID_ROWS,
  INGREDIENTS,
  MAX_ACTIVE_ORDERS,
  MAX_STRIKES,
  RECIPES,
  SHIFT_DURATION,
  TARGET_REVENUE,
  createKitchenLayout,
} from './config.js';
import { createRng } from './random.js';

export function findRecipeMatch(ingredientIds) {
  const sorted = [...ingredientIds].sort();
  for (const recipe of RECIPES) {
    if (recipe.ingredients.length !== sorted.length) continue;
    const target = [...recipe.ingredients].sort();
    if (target.every((id, idx) => id === sorted[idx])) {
      return recipe;
    }
  }
  return null;
}

export function findCandidateRecipes(ingredientIds) {
  return RECIPES.filter((recipe) =>
    ingredientIds.every((id) => recipe.ingredients.includes(id))
  );
}

export function canAddIngredientToPlate(plateIngredients, newId) {
  if (!INGREDIENTS[newId]) return false;
  if (plateIngredients.includes(newId)) return false;
  const next = [...plateIngredients, newId];
  return findCandidateRecipes(next).length > 0;
}

function isWalkable(grid, col, row) {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  return grid[row][col].type === 'floor';
}

export function createWorld(seed = 1) {
  const rng = createRng(seed);
  const layout = createKitchenLayout();
  const grid = layout.map((row, r) =>
    row.map((cell, c) => {
      const station = {
        ...cell,
        col: c,
        row: r,
        item: null,
        chopProgress: 0,
        cookTimer: 0,
        cookDuration: 0,
        burnTimer: 0,
        readyPinged: false,
        restockTimer: 0,
        pulse: 0,
      };
      if (cell.type === 'assembly') {
        station.item = { kind: 'plate', ingredients: [] };
      }
      return station;
    })
  );

  const world = {
    seed,
    rng,
    screen: 'title', // 'title' | 'playing' | 'paused' | 'won' | 'lost'
    grid,
    chef: {
      x: 6.5,
      y: 3.5,
      vx: 0,
      vy: 0,
      facingX: 0,
      facingY: -1,
      holding: null,
      dashTimer: 0,
      dashCooldown: 0,
      chopHoldCooldown: 0,
      walkPhase: 0,
      actionAnim: 0,
    },
    autoTarget: null,
    hoverTile: null,
    orders: [],
    nextOrderId: 1,
    spawnTimer: 1.5,
    elapsed: 0,
    timeLeft: SHIFT_DURATION,
    revenue: 0,
    tipsEarned: 0,
    servedCount: 0,
    streak: 0,
    bestStreak: 0,
    strikes: 0,
    rushTriggered: false,
    rushBannerTimer: 0,
    lastSecondTick: 11,
    particles: [],
    popups: [],
    toast: '',
    toastTimer: 0,
    shakeTimer: 0,
  };

  spawnOrder(world);
  spawnOrder(world);
  return world;
}

export function resetShift(world, seed = world.seed) {
  const fresh = createWorld(seed);
  Object.assign(world, fresh);
  world.screen = 'playing';
}

export function showToast(world, text, duration = 1.6) {
  world.toast = text;
  world.toastTimer = duration;
}

export function addPopup(world, gx, gy, text, color = '#fff7df', size = 18) {
  world.popups.push({
    x: gx,
    y: gy,
    text,
    color,
    size,
    life: 1.25,
    maxLife: 1.25,
  });
}

export function spawnParticles(world, gx, gy, color, count = 8, speed = 1.6, rise = 0.5) {
  for (let i = 0; i < count; i++) {
    const angle = world.rng.next() * Math.PI * 2;
    const mag = (0.35 + world.rng.next() * 0.75) * speed;
    world.particles.push({
      x: gx,
      y: gy,
      vx: Math.cos(angle) * mag,
      vy: Math.sin(angle) * mag - rise,
      size: 3 + world.rng.next() * 4,
      color,
      life: 0.45 + world.rng.next() * 0.45,
      maxLife: 0.9,
    });
  }
}

export function spawnOrder(world) {
  if (world.orders.length >= MAX_ACTIVE_ORDERS) return false;
  const available = RECIPES.filter((r) => world.elapsed >= r.minElapsed);
  const recipe = world.rng.pick(available.length ? available : [RECIPES[0]]);
  const rushFactor = world.timeLeft <= 40 ? 0.86 : 1.0;
  const maxTime = Math.round(recipe.orderTime * rushFactor);
  world.orders.push({
    id: world.nextOrderId++,
    recipeId: recipe.id,
    name: recipe.name,
    shortName: recipe.shortName,
    ingredients: [...recipe.ingredients],
    price: recipe.price,
    timeLeft: maxTime,
    maxTime,
    pulse: 1,
  });
  return true;
}

export function getFacingStation(world) {
  const { chef, grid } = world;
  const probeX = Math.floor(chef.x + chef.facingX * 0.75);
  const probeY = Math.floor(chef.y + chef.facingY * 0.75);
  if (probeX >= 0 && probeX < GRID_COLS && probeY >= 0 && probeY < GRID_ROWS) {
    if (grid[probeY][probeX].type !== 'floor') {
      return grid[probeY][probeX];
    }
  }

  let best = null;
  let bestScore = -Infinity;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      if (cell.type === 'floor') continue;
      const dx = c + 0.5 - chef.x;
      const dy = r + 0.5 - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1.32) continue;
      const dot = (dx * chef.facingX + dy * chef.facingY) / (dist || 1);
      const score = dot * 1.4 - dist;
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
  }
  return best;
}

function findPathToAdjacent(grid, startCol, startRow, targetCol, targetRow) {
  const goals = [];
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  for (const [dc, dr] of dirs) {
    const nc = targetCol + dc;
    const nr = targetRow + dr;
    if (isWalkable(grid, nc, nr)) {
      goals.push(`${nc},${nr}`);
    }
  }
  if (goals.length === 0) return null;
  const goalSet = new Set(goals);
  const startKey = `${startCol},${startRow}`;
  if (goalSet.has(startKey)) return [];

  const queue = [[startCol, startRow]];
  const parent = new Map();
  parent.set(startKey, null);

  let foundKey = null;
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    const key = `${c},${r}`;
    if (goalSet.has(key)) {
      foundKey = key;
      break;
    }
    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      const nKey = `${nc},${nr}`;
      if (!isWalkable(grid, nc, nr) || parent.has(nKey)) continue;
      parent.set(nKey, key);
      queue.push([nc, nr]);
    }
  }

  if (!foundKey) return null;
  const path = [];
  let cur = foundKey;
  while (cur && cur !== startKey) {
    const [c, r] = cur.split(',').map(Number);
    path.push({ col: c, row: r });
    cur = parent.get(cur);
  }
  path.reverse();
  return path;
}

function findPathToFloor(grid, startCol, startRow, targetCol, targetRow) {
  if (!isWalkable(grid, targetCol, targetRow)) return null;
  const startKey = `${startCol},${startRow}`;
  const targetKey = `${targetCol},${targetRow}`;
  if (startKey === targetKey) return [];
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const queue = [[startCol, startRow]];
  const parent = new Map();
  parent.set(startKey, null);
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    const key = `${c},${r}`;
    if (key === targetKey) break;
    for (const [dc, dr] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      const nKey = `${nc},${nr}`;
      if (!isWalkable(grid, nc, nr) || parent.has(nKey)) continue;
      parent.set(nKey, key);
      queue.push([nc, nr]);
    }
  }
  if (!parent.has(targetKey)) return null;
  const path = [];
  let cur = targetKey;
  while (cur && cur !== startKey) {
    const [c, r] = cur.split(',').map(Number);
    path.push({ col: c, row: r });
    cur = parent.get(cur);
  }
  path.reverse();
  return path;
}

export function setClickTarget(world, col, row) {
  if (world.screen !== 'playing') return;
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;
  const startCol = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(world.chef.x)));
  const startRow = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(world.chef.y)));
  const cell = world.grid[row][col];
  if (cell.type === 'floor') {
    const path = findPathToFloor(world.grid, startCol, startRow, col, row);
    if (path) {
      world.autoTarget = { col, row, path, interactOnArrive: false };
    }
    return;
  }
  const path = findPathToAdjacent(world.grid, startCol, startRow, col, row);
  if (path !== null) {
    world.autoTarget = { col, row, path, interactOnArrive: true };
  }
}

export function triggerDash(world, sound) {
  const { chef } = world;
  if (world.screen !== 'playing') return false;
  if (chef.dashCooldown > 0 || chef.dashTimer > 0) return false;
  chef.dashTimer = CHEF_DASH_DURATION;
  chef.dashCooldown = CHEF_DASH_COOLDOWN;
  spawnParticles(world, chef.x, chef.y + 0.2, '#f5e8d0', 7, 1.4, 0.2);
  sound?.playDash();
  return true;
}

function tryPlateCombination(world, targetPlate, ingId, sound, gx, gy) {
  if (!canAddIngredientToPlate(targetPlate.ingredients, ingId)) {
    sound?.playError();
    showToast(world, 'Ingredients do not combine into a menu dish');
    return false;
  }
  targetPlate.ingredients.push(ingId);
  sound?.playPlate();
  spawnParticles(world, gx, gy, '#fff3b8', 7, 1.2, 0.7);
  const match = findRecipeMatch(targetPlate.ingredients);
  if (match) {
    sound?.playCookReady();
    addPopup(world, gx, gy - 0.3, `${match.shortName} Ready!`, '#ffe270', 16);
    spawnParticles(world, gx, gy, '#ffd447', 14, 1.9, 1.1);
    return { kind: 'dish', dishId: match.id, ingredients: [...targetPlate.ingredients] };
  }
  return targetPlate;
}

export function interactAt(world, station, sound) {
  if (!station || world.screen !== 'playing') return false;
  const { chef } = world;
  const gx = station.col + 0.5;
  const gy = station.row + 0.5;
  station.pulse = 1;

  // Face the station
  const dx = gx - chef.x;
  const dy = gy - chef.y;
  const len = Math.hypot(dx, dy) || 1;
  chef.facingX = dx / len;
  chef.facingY = dy / len;

  // 1. Trash bin
  if (station.type === 'trash') {
    if (chef.holding) {
      if (chef.holding.kind === 'plate' && chef.holding.ingredients.length > 0) {
        chef.holding = { kind: 'plate', ingredients: [] };
        showToast(world, 'Cleared plate');
      } else if (chef.holding.kind === 'dish') {
        chef.holding = { kind: 'plate', ingredients: [] };
        showToast(world, 'Discarded dish');
      } else {
        chef.holding = null;
        showToast(world, 'Trashed item');
      }
      sound?.playPlace();
      spawnParticles(world, gx, gy, '#8f877e', 6, 1.1, 0.5);
      return true;
    }
    return false;
  }

  // 2. Service pass
  if (station.type === 'pass') {
    if (!chef.holding || chef.holding.kind !== 'dish') {
      sound?.playError();
      showToast(world, 'Bring a completed plated dish to serve!');
      return false;
    }
    const dishId = chef.holding.dishId;
    const matching = world.orders
      .filter((o) => o.recipeId === dishId)
      .sort((a, b) => a.timeLeft - b.timeLeft);

    chef.holding = null;
    chef.actionAnim = 0.25;

    if (matching.length > 0) {
      const ticket = matching[0];
      const idx = world.orders.indexOf(ticket);
      world.orders.splice(idx, 1);

      world.streak += 1;
      if (world.streak > world.bestStreak) world.bestStreak = world.streak;
      world.servedCount += 1;

      const mult = 1 + 0.2 * Math.min(world.streak - 1, 5);
      const fastBonus = ticket.timeLeft >= ticket.maxTime * 0.5 ? Math.round(ticket.price * 0.25) : 0;
      const total = Math.round(ticket.price * mult) + fastBonus;
      world.revenue += total;
      world.tipsEarned += total - ticket.price;

      sound?.playServe();
      spawnParticles(world, gx, gy, '#ffd447', 18, 2.5, 1.3);
      addPopup(world, gx, gy - 0.35, `+$${total}`, '#7aff9e', 24);
      if (fastBonus > 0) {
        addPopup(world, gx, gy - 0.72, `FAST TIP +$${fastBonus}!`, '#ffd447', 15);
      } else if (world.streak >= 2) {
        addPopup(world, gx, gy - 0.72, `STREAK x${mult.toFixed(1)}`, '#ffd447', 15);
      }

      if (world.orders.length === 0) {
        spawnOrder(world);
      }
    } else {
      const walkIn = 30;
      world.revenue += walkIn;
      world.streak = 0;
      sound?.playPlace();
      addPopup(world, gx, gy - 0.35, `Walk-In +$${walkIn}`, '#f5c26b', 18);
      showToast(world, 'No active ticket for that dish — served as Walk-In');
    }
    return true;
  }

  // 3. Pantry crates
  if (station.type === 'crate') {
    if (!chef.holding) {
      chef.holding = { kind: 'ingredient', id: station.crateItem };
      sound?.playPickup();
      spawnParticles(world, gx, gy, INGREDIENTS[station.crateItem]?.color ?? '#f5d487', 5, 1.0, 0.5);
      return true;
    }
    sound?.playError();
    showToast(world, 'Hands full — set item down first');
    return false;
  }

  // 4. Plate rack
  if (station.type === 'plate_rack') {
    if (!chef.holding) {
      chef.holding = { kind: 'plate', ingredients: [] };
      sound?.playPickup();
      return true;
    }
    if (chef.holding.kind === 'ingredient') {
      const res = tryPlateCombination(world, { kind: 'plate', ingredients: [] }, chef.holding.id, sound, gx, gy);
      if (res) {
        chef.holding = res;
        return true;
      }
    }
    return false;
  }

  // 5. Chopping board
  if (station.type === 'chop') {
    if (station.item) {
      const spec = INGREDIENTS[station.item.id];
      if (spec && spec.chopTo) {
        station.chopProgress += 1;
        chef.actionAnim = 0.22;
        spawnParticles(world, gx, gy, spec.color, 7, 1.4, 0.6);
        if (station.chopProgress >= CHOP_STEPS) {
          station.item = { kind: 'ingredient', id: spec.chopTo };
          station.chopProgress = 0;
          sound?.playChopDone();
          addPopup(world, gx, gy - 0.25, INGREDIENTS[spec.chopTo].short, '#ffffff', 14);
        } else {
          sound?.playChop();
        }
        return true;
      }

      // Already chopped on board
      if (!chef.holding) {
        chef.holding = station.item;
        station.item = null;
        station.chopProgress = 0;
        sound?.playPickup();
        return true;
      }
      if (chef.holding.kind === 'plate') {
        const res = tryPlateCombination(world, chef.holding, station.item.id, sound, gx, gy);
        if (res) {
          chef.holding = res;
          station.item = null;
          station.chopProgress = 0;
          return true;
        }
      }
      return false;
    }

    // Empty board
    if (chef.holding && chef.holding.kind === 'ingredient') {
      const spec = INGREDIENTS[chef.holding.id];
      if (spec && spec.chopTo) {
        station.item = chef.holding;
        station.chopProgress = 0;
        chef.holding = null;
        sound?.playPlace();
        return true;
      }
      sound?.playError();
      showToast(world, `${spec.label} cannot be chopped`);
      return false;
    }
    return false;
  }

  // 6. Stove & Hearth Grill
  if (station.type === 'stove' || station.type === 'grill') {
    if (station.item) {
      const isReady = station.item.kind === 'ingredient' && !INGREDIENTS[station.item.id].cookTo;
      if (station.item.kind === 'burnt' || isReady) {
        if (!chef.holding) {
          chef.holding = station.item;
          station.item = null;
          station.cookTimer = 0;
          station.burnTimer = 0;
          station.readyPinged = false;
          sound?.playPickup();
          return true;
        }
        if (chef.holding.kind === 'plate' && station.item.kind === 'ingredient') {
          const res = tryPlateCombination(world, chef.holding, station.item.id, sound, gx, gy);
          if (res) {
            chef.holding = res;
            station.item = null;
            station.cookTimer = 0;
            station.burnTimer = 0;
            station.readyPinged = false;
            return true;
          }
        }
        return false;
      }
      showToast(world, 'Cooking in progress...');
      return false;
    }

    if (chef.holding && chef.holding.kind === 'ingredient') {
      const spec = INGREDIENTS[chef.holding.id];
      if (spec && spec.cookTo) {
        station.item = chef.holding;
        station.cookTimer = 0;
        station.burnTimer = 0;
        station.readyPinged = false;
        station.cookDuration =
          station.type === 'grill' && chef.holding.id === 'steak_prepped'
            ? COOK_TIME_GRILL
            : COOK_TIME_STOVE;
        chef.holding = null;
        sound?.playPlace();
        return true;
      }
      if (spec && spec.chopTo) {
        sound?.playError();
        showToast(world, `Chop ${spec.label} on a board before cooking!`);
        return false;
      }
      sound?.playError();
      showToast(world, `${spec.label} is already prepped for plating`);
      return false;
    }
    return false;
  }

  // 7. Counters & Assembly stations
  if (station.type === 'counter' || station.type === 'assembly') {
    const stItem = station.item;
    const held = chef.holding;

    if (!stItem && held) {
      station.item = held;
      chef.holding = null;
      sound?.playPlace();
      return true;
    }
    if (stItem && !held) {
      chef.holding = stItem;
      station.item = null;
      if (station.type === 'assembly') {
        station.restockTimer = 2.4;
      }
      sound?.playPickup();
      return true;
    }
    if (stItem && held) {
      // Plate on counter + held ingredient
      if (stItem.kind === 'plate' && held.kind === 'ingredient') {
        const res = tryPlateCombination(world, stItem, held.id, sound, gx, gy);
        if (res) {
          station.item = res;
          chef.holding = null;
          return true;
        }
        return false;
      }
      // Held plate + ingredient on counter
      if (held.kind === 'plate' && stItem.kind === 'ingredient') {
        const res = tryPlateCombination(world, held, stItem.id, sound, gx, gy);
        if (res) {
          chef.holding = res;
          station.item = null;
          return true;
        }
        return false;
      }
    }
  }

  return false;
}

export function stepWorld(world, dt, inputState, sound) {
  if (world.screen !== 'playing') return;

  const clampedDt = Math.min(dt, 0.05);
  world.elapsed += clampedDt;
  world.timeLeft = Math.max(0, world.timeLeft - clampedDt);

  if (world.toastTimer > 0) world.toastTimer = Math.max(0, world.toastTimer - clampedDt);
  if (world.rushBannerTimer > 0) world.rushBannerTimer = Math.max(0, world.rushBannerTimer - clampedDt);
  if (world.shakeTimer > 0) world.shakeTimer = Math.max(0, world.shakeTimer - clampedDt);

  // Service rush trigger at <= 40s
  if (!world.rushTriggered && world.timeLeft <= 40) {
    world.rushTriggered = true;
    world.rushBannerTimer = 3.2;
    sound?.playRush();
    spawnOrder(world);
  }

  // Countdown tick under 10s
  if (world.timeLeft <= 10 && world.timeLeft > 0) {
    const sec = Math.ceil(world.timeLeft);
    if (sec < world.lastSecondTick) {
      world.lastSecondTick = sec;
      sound?.playTick();
    }
  }

  // Chef movement (keyboard overrides click pathing)
  const { chef } = world;
  if (chef.dashTimer > 0) chef.dashTimer = Math.max(0, chef.dashTimer - clampedDt);
  if (chef.dashCooldown > 0) chef.dashCooldown = Math.max(0, chef.dashCooldown - clampedDt);
  if (chef.chopHoldCooldown > 0) chef.chopHoldCooldown = Math.max(0, chef.chopHoldCooldown - clampedDt);
  if (chef.actionAnim > 0) chef.actionAnim = Math.max(0, chef.actionAnim - clampedDt);

  let moveX = inputState.moveX || 0;
  let moveY = inputState.moveY || 0;
  if (moveX !== 0 || moveY !== 0) {
    world.autoTarget = null;
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
  } else if (world.autoTarget) {
    const tgt = world.autoTarget;
    if (tgt.path.length > 0) {
      const nextCell = tgt.path[0];
      const tx = nextCell.col + 0.5;
      const ty = nextCell.row + 0.5;
      const dx = tx - chef.x;
      const dy = ty - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.09) {
        chef.x = tx;
        chef.y = ty;
        tgt.path.shift();
      } else {
        moveX = dx / dist;
        moveY = dy / dist;
      }
    } else {
      world.autoTarget = null;
      if (tgt.interactOnArrive) {
        const station = world.grid[tgt.row][tgt.col];
        interactAt(world, station, sound);
      }
    }
  }

  const speedTiles = (chef.dashTimer > 0 ? CHEF_DASH_SPEED : CHEF_SPEED) / 84;
  if (moveX !== 0 || moveY !== 0) {
    chef.facingX = moveX;
    chef.facingY = moveY;
    chef.walkPhase += clampedDt * (chef.dashTimer > 0 ? 18 : 11);

    const radius = 0.29;
    const nextX = chef.x + moveX * speedTiles * clampedDt;
    if (canStandAt(world.grid, nextX, chef.y, radius)) {
      chef.x = nextX;
    }
    const nextY = chef.y + moveY * speedTiles * clampedDt;
    if (canStandAt(world.grid, chef.x, nextY, radius)) {
      chef.y = nextY;
    }
  }

  // Hold-to-chop support
  if (inputState.chopHeld && chef.chopHoldCooldown <= 0) {
    const facing = getFacingStation(world);
    if (facing && facing.type === 'chop' && facing.item && INGREDIENTS[facing.item.id]?.chopTo) {
      interactAt(world, facing, sound);
      chef.chopHoldCooldown = 0.22;
    }
  }

  // Station timers (cooking, burning, restocking plates)
  const nowMs = world.elapsed * 1000;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const st = world.grid[r][c];
      if (st.pulse > 0) st.pulse = Math.max(0, st.pulse - clampedDt * 4);

      if (st.type === 'assembly' && !st.item && st.restockTimer > 0) {
        st.restockTimer -= clampedDt;
        if (st.restockTimer <= 0) {
          st.restockTimer = 0;
          st.item = { kind: 'plate', ingredients: [] };
        }
      }

      if ((st.type === 'stove' || st.type === 'grill') && st.item) {
        const gx = c + 0.5;
        const gy = r + 0.42;
        if (st.item.kind === 'ingredient' && INGREDIENTS[st.item.id]?.cookTo) {
          st.cookTimer += clampedDt;
          if (world.rng.next() < clampedDt * 5) {
            spawnParticles(world, gx, gy, '#fff4dc', 1, 0.45, 0.9);
          }
          sound?.playSizzle(nowMs);
          if (st.cookTimer >= st.cookDuration) {
            const nextId = INGREDIENTS[st.item.id].cookTo;
            st.item = { kind: 'ingredient', id: nextId };
            st.burnTimer = 0;
            if (!st.readyPinged) {
              st.readyPinged = true;
              sound?.playCookReady();
              addPopup(world, gx, gy - 0.2, `${INGREDIENTS[nextId].short}!`, '#ffe270', 14);
              spawnParticles(world, gx, gy, '#ffd447', 8, 1.1, 0.8);
            }
          }
        } else if (st.item.kind === 'ingredient') {
          st.burnTimer += clampedDt;
          if (st.burnTimer >= BURN_WARNING_TIME && world.rng.next() < clampedDt * 8) {
            spawnParticles(world, gx, gy, '#4e423b', 1, 0.6, 1.1);
          }
          if (st.burnTimer >= BURN_TOTAL_TIME) {
            st.item = { kind: 'burnt', label: 'Charred' };
            sound?.playBurn();
            world.shakeTimer = 0.22;
            addPopup(world, gx, gy - 0.2, 'BURNT!', '#ff5c4d', 16);
          }
        }
      }
    }
  }

  // Order spawning & expiration
  world.spawnTimer -= clampedDt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    if (world.timeLeft <= 40) {
      world.spawnTimer = 6.2;
    } else if (world.elapsed >= 40) {
      world.spawnTimer = 9.5;
    } else {
      world.spawnTimer = 13.0;
    }
  }

  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.timeLeft -= clampedDt;
    if (order.pulse > 0) order.pulse = Math.max(0, order.pulse - clampedDt * 2.5);
    if (order.timeLeft <= 0) {
      world.orders.splice(i, 1);
      world.strikes += 1;
      world.streak = 0;
      world.shakeTimer = 0.28;
      sound?.playError();
      showToast(world, `${order.shortName} expired! Strike ${world.strikes}/${MAX_STRIKES}`, 2.0);
      if (world.orders.length === 0 && world.strikes < MAX_STRIKES) {
        spawnOrder(world);
      }
      if (world.strikes >= MAX_STRIKES) {
        world.screen = 'lost';
        sound?.playLose();
        return;
      }
    }
  }

  // Particles & popups
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx * clampedDt;
    p.y += p.vy * clampedDt;
    p.vy += 1.2 * clampedDt;
    p.life -= clampedDt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }

  for (let i = world.popups.length - 1; i >= 0; i--) {
    const pop = world.popups[i];
    pop.y -= 0.55 * clampedDt;
    pop.life -= clampedDt;
    if (pop.life <= 0) world.popups.splice(i, 1);
  }

  // End of shift check
  if (world.timeLeft <= 0) {
    if (world.revenue >= TARGET_REVENUE) {
      world.screen = 'won';
      sound?.playWin();
    } else {
      world.screen = 'lost';
      sound?.playLose();
    }
  }
}

function canStandAt(grid, x, y, radius) {
  const minC = Math.floor(x - radius);
  const maxC = Math.floor(x + radius);
  const minR = Math.floor(y - radius);
  const maxR = Math.floor(y + radius);
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (!isWalkable(grid, c, r)) return false;
    }
  }
  return true;
}
