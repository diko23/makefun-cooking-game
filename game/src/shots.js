// Hearth & Skillet — Deterministic screenshot autopilot (?shot=start|play|rush|end&seed=1).
// Plays the real simulation rules forward so screenshots reflect authentic gameplay.

import { GRID_COLS, GRID_ROWS, INGREDIENTS } from './config.js';
import { canAddIngredientToPlate, getFacingStation, interactAt, setClickTarget, stepWorld, triggerDash } from './world.js';

function findStations(world, predicate) {
  const out = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const st = world.grid[r][c];
      if (predicate(st)) out.push(st);
    }
  }
  return out;
}

function rawSourceFor(targetIngId) {
  if (targetIngId === 'tomato_diced') return { crate: 'tomato_raw', needsChop: true, needsCook: false };
  if (targetIngId === 'marinara') return { crate: 'tomato_raw', needsChop: true, needsCook: true };
  if (targetIngId === 'pasta_cooked') return { crate: 'pasta_raw', needsChop: false, needsCook: true };
  if (targetIngId === 'steak_seared') return { crate: 'steak_raw', needsChop: true, needsCook: true };
  if (targetIngId === 'herbs_chopped') return { crate: 'herbs_raw', needsChop: true, needsCook: false };
  if (targetIngId === 'cheese_grated') return { crate: 'cheese_raw', needsChop: true, needsCook: false };
  return null;
}

function isCookingFor(world, targetIngId) {
  return findStations(world, (s) => {
    if (s.type !== 'stove' && s.type !== 'grill') return false;
    if (!s.item || s.item.kind !== 'ingredient') return false;
    return s.item.id === targetIngId || INGREDIENTS[s.item.id]?.cookTo === targetIngId;
  }).length > 0;
}

function guideAutopilot(world, mode) {
  const { chef } = world;
  if (world.autoTarget) {
    if (world.autoTarget.path.length >= 3 && chef.dashCooldown <= 0) {
      triggerDash(world, null);
    }
    return;
  }

  // Standing next to a chopping board that has a raw item -> chop it immediately
  const facing = getFacingStation(world);
  if (facing && facing.type === 'chop' && facing.item?.kind === 'ingredient' && INGREDIENTS[facing.item.id]?.chopTo) {
    interactAt(world, facing, null);
    return;
  }

  // If holding a finished dish -> serve at pass (unless play shot pauses briefly with ready plate)
  if (chef.holding?.kind === 'dish') {
    const pass = findStations(world, (s) => s.type === 'pass')[0];
    if (pass) {
      setClickTarget(world, pass.col, pass.row);
      return;
    }
  }

  // Pick up burnt item to trash
  if (chef.holding?.kind === 'burnt') {
    const trash = findStations(world, (s) => s.type === 'trash')[0];
    if (trash) setClickTarget(world, trash.col, trash.row);
    return;
  }
  const burnt = findStations(world, (s) => s.item?.kind === 'burnt');
  if (burnt.length > 0 && !chef.holding) {
    setClickTarget(world, burnt[0].col, burnt[0].row);
    return;
  }

  // Pick up any ready cooked item from stove/grill before it burns
  const readyStoves = findStations(
    world,
    (s) =>
      (s.type === 'stove' || s.type === 'grill') &&
      s.item?.kind === 'ingredient' &&
      !INGREDIENTS[s.item.id]?.cookTo
  );
  if (readyStoves.length > 0 && !chef.holding) {
    setClickTarget(world, readyStoves[0].col, readyStoves[0].row);
    return;
  }

  // Pick urgent active order
  const ordersSorted = world.orders.slice().sort((a, b) => a.timeLeft - b.timeLeft);
  const order = ordersSorted[0];
  if (!order) return;

  // Ready dish waiting on an assembly counter
  const readyDishStation = findStations(world, (s) => s.item?.kind === 'dish')[0];
  if (readyDishStation && !chef.holding) {
    if (!(mode === 'play' && world.servedCount >= 2 && world.elapsed > 32)) {
      setClickTarget(world, readyDishStation.col, readyDishStation.row);
      return;
    }
  }

  // Choose best assembly plate for the urgent order
  const plateStations = findStations(world, (s) => s.type === 'assembly' && s.item?.kind === 'plate');
  const matchingPlates = plateStations
    .filter((s) => s.item.ingredients.every((id) => order.ingredients.includes(id)))
    .sort((a, b) => b.item.ingredients.length - a.item.ingredients.length);
  const targetPlate = matchingPlates[0] ?? plateStations[0];

  // If chef is holding an ingredient, decide what to do with it
  if (chef.holding?.kind === 'ingredient') {
    const heldId = chef.holding.id;
    const spec = INGREDIENTS[heldId];

    // 1. Does a matching plate want this exact ingredient right now?
    const plateForHeld = plateStations
      .filter((s) => canAddIngredientToPlate(s.item.ingredients, heldId))
      .sort((a, b) => {
        const aMatch = a.item.ingredients.every((id) => order.ingredients.includes(id)) ? 1 : 0;
        const bMatch = b.item.ingredients.every((id) => order.ingredients.includes(id)) ? 1 : 0;
        return bMatch - aMatch || b.item.ingredients.length - a.item.ingredients.length;
      })[0];

    if (plateForHeld && order.ingredients.includes(heldId)) {
      setClickTarget(world, plateForHeld.col, plateForHeld.row);
      return;
    }

    // 2. Needs chopping?
    if (spec?.chopTo) {
      const emptyBoard = findStations(world, (s) => s.type === 'chop' && !s.item)[0];
      if (emptyBoard) {
        setClickTarget(world, emptyBoard.col, emptyBoard.row);
        return;
      }
    }

    // 3. Needs cooking?
    if (spec?.cookTo) {
      const preferGrill = heldId === 'steak_prepped';
      const stoves = findStations(world, (s) => (s.type === 'stove' || s.type === 'grill') && !s.item);
      stoves.sort((a, b) => (preferGrill && a.type === 'grill' ? -1 : 1));
      if (stoves[0]) {
        setClickTarget(world, stoves[0].col, stoves[0].row);
        return;
      }
    }

    // 4. Otherwise place on any compatible plate or staging counter
    if (plateForHeld) {
      setClickTarget(world, plateForHeld.col, plateForHeld.row);
      return;
    }
    const emptyCounter = findStations(world, (s) => s.type === 'counter' && !s.item)[0];
    if (emptyCounter) {
      setClickTarget(world, emptyCounter.col, emptyCounter.row);
      return;
    }
  }

  // Hands empty: advance next missing ingredient for the urgent order (or secondary order while stove cooks)
  if (!chef.holding) {
    const candidateOrders = targetPlate ? [order, ...ordersSorted.slice(1)] : ordersSorted;
    for (const ord of candidateOrders) {
      const plate = plateStations
        .filter((s) => s.item.ingredients.every((id) => ord.ingredients.includes(id)))
        .sort((a, b) => b.item.ingredients.length - a.item.ingredients.length)[0];
      if (!plate) continue;

      const missing = ord.ingredients.filter((id) => !plate.item.ingredients.includes(id));
      for (const neededId of missing) {
        // Already prepped and sitting on a counter or board?
        const readyOnCounter = findStations(
          world,
          (s) => s.type !== 'crate' && s.item?.kind === 'ingredient' && s.item.id === neededId
        )[0];
        if (readyOnCounter) {
          setClickTarget(world, readyOnCounter.col, readyOnCounter.row);
          return;
        }

        // If already cooking on a stove/grill, skip to next ingredient!
        if (isCookingFor(world, neededId)) continue;

        const plan = rawSourceFor(neededId);
        if (!plan) continue;

        const midId = INGREDIENTS[plan.crate]?.chopTo;
        if (plan.needsCook && midId) {
          const midSt = findStations(
            world,
            (s) => s.type !== 'stove' && s.type !== 'grill' && s.item?.kind === 'ingredient' && s.item.id === midId
          )[0];
          if (midSt) {
            setClickTarget(world, midSt.col, midSt.row);
            return;
          }
        }

        // Raw item waiting on a chop board?
        const rawBoard = findStations(
          world,
          (s) => s.type === 'chop' && s.item?.kind === 'ingredient' && INGREDIENTS[s.item.id]?.chopTo
        )[0];
        if (rawBoard) {
          setClickTarget(world, rawBoard.col, rawBoard.row);
          return;
        }

        // Fetch from south crate!
        const crate = findStations(world, (s) => s.type === 'crate' && s.crateItem === plan.crate)[0];
        if (crate) {
          setClickTarget(world, crate.col, crate.row);
          return;
        }
      }
    }
  }
}

export function prepareShotScene(world, shotName) {
  if (shotName === 'start') {
    world.screen = 'title';
    return;
  }

  world.screen = 'playing';
  const dt = 1 / 60;
  const maxSteps = shotName === 'end' ? 120 * 60 + 30 : 90 * 60;

  for (let i = 0; i < maxSteps; i++) {
    guideAutopilot(world, shotName);
    stepWorld(world, dt, { moveX: 0, moveY: 0, chopHeld: false }, null);

    if (shotName === 'play') {
      const hasReady =
        findStations(world, (s) => s.item?.kind === 'dish').length > 0 ||
        world.chef.holding?.kind === 'dish';
      const hasPartial =
        findStations(world, (s) => s.item?.kind === 'plate' && s.item.ingredients.length >= 1).length > 0;
      const hasActivePrep =
        findStations(
          world,
          (s) => (s.type === 'stove' || s.type === 'grill' || s.type === 'chop' || s.type === 'counter') && s.item !== null
        ).length >= 2;
      if (world.servedCount >= 2 && world.orders.length >= 3 && hasReady && hasPartial && hasActivePrep) {
        break;
      }
    }

    if (shotName === 'rush') {
      if (world.timeLeft <= 37.6 && world.orders.length >= 4) {
        break;
      }
    }

    if (world.screen === 'won' || world.screen === 'lost') {
      break;
    }
  }
}
