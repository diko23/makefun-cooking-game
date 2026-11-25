// Hearth & Skillet — Keyboard and mouse input controller.

import { CANVAS_H, CANVAS_W, GRID_COLS, GRID_ROWS, GRID_X, GRID_Y, TILE_SIZE } from './config.js';
import { getFacingStation, interactAt, setClickTarget, triggerDash } from './world.js';

export function createInputController(canvas, world, sound, callbacks) {
  const keys = new Set();

  function toCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function tileAtCanvas(cx, cy) {
    const col = Math.floor((cx - GRID_X) / TILE_SIZE);
    const row = Math.floor((cy - GRID_Y) / TILE_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }

  function handleKeyDown(e) {
    sound.unlock();
    const code = e.code;

    if (code === 'KeyM') {
      sound.toggleMute();
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (world.screen === 'playing') {
        world.screen = 'paused';
      } else if (world.screen === 'paused') {
        world.screen = 'playing';
      }
      return;
    }

    if (world.screen === 'title') {
      if (code === 'Space' || code === 'Enter') {
        e.preventDefault();
        callbacks.onStart();
      }
      return;
    }

    if (world.screen === 'won' || world.screen === 'lost') {
      if (code === 'KeyR' || code === 'Space' || code === 'Enter') {
        e.preventDefault();
        callbacks.onRestart();
      }
      return;
    }

    if (world.screen !== 'playing') return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    if (!keys.has(code)) {
      keys.add(code);
      if (code === 'Space' || code === 'KeyE' || code === 'KeyF') {
        const station = getFacingStation(world);
        if (station) interactAt(world, station, sound);
      } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
        triggerDash(world, sound);
      }
    }
  }

  function handleKeyUp(e) {
    keys.delete(e.code);
  }

  function handleMouseMove(e) {
    const pos = toCanvasCoords(e.clientX, e.clientY);
    world.hoverTile = tileAtCanvas(pos.x, pos.y);
  }

  function handleMouseDown(e) {
    sound.unlock();
    const pos = toCanvasCoords(e.clientX, e.clientY);

    if (e.button === 2) {
      e.preventDefault();
      if (world.screen === 'playing') triggerDash(world, sound);
      return;
    }

    // Mute pill top-right corner
    if (pos.x >= 1196 && pos.x <= 1266 && pos.y >= 10 && pos.y <= 38) {
      sound.toggleMute();
      return;
    }

    if (world.screen === 'title') {
      callbacks.onStart();
      return;
    }

    if (world.screen === 'paused') {
      if (pos.y >= 360 && pos.y <= 420) {
        world.screen = 'playing';
      } else if (pos.y >= 435 && pos.y <= 495) {
        callbacks.onRestart();
      }
      return;
    }

    if (world.screen === 'won' || world.screen === 'lost') {
      callbacks.onRestart();
      return;
    }

    if (world.screen !== 'playing') return;

    // Pause button in HUD
    if (pos.x >= 1126 && pos.x <= 1188 && pos.y >= 10 && pos.y <= 38) {
      world.screen = 'paused';
      return;
    }

    const tile = tileAtCanvas(pos.x, pos.y);
    if (tile) {
      setClickTarget(world, tile.col, tile.row);
    }
  }

  function handleContextMenu(e) {
    e.preventDefault();
  }

  function getState() {
    let moveX = 0;
    let moveY = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) moveY -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveY += 1;
    return {
      moveX,
      moveY,
      chopHeld: keys.has('Space') || keys.has('KeyE') || keys.has('KeyF'),
    };
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('contextmenu', handleContextMenu);

  return {
    getState,
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    },
  };
}
