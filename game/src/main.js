// Hearth & Skillet — Application entrypoint, game loop, and screen state machine.

import { SoundEngine } from './audio.js';
import { createInputController } from './input.js';
import { renderWorld } from './render.js';
import { prepareShotScene } from './shots.js';
import { createWorld, resetShift, stepWorld } from './world.js';

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seedRaw = Number(params.get('seed'));
  const seed = Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1;
  return { shot, seed };
}

function boot() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const { shot, seed } = readParams();

  const sound = new SoundEngine();
  const world = createWorld(seed);

  const input = createInputController(canvas, world, sound, {
    onStart() {
      resetShift(world, seed);
    },
    onRestart() {
      resetShift(world, seed);
    },
  });

  if (shot) {
    prepareShotScene(world, shot);
    renderWorld(ctx, world, sound);
    window.__shotReady = true;
    return;
  }

  let lastTime = performance.now();
  function frame(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    stepWorld(world, dt, input.getState(), sound);
    renderWorld(ctx, world, sound);
    requestAnimationFrame(frame);
  }

  renderWorld(ctx, world, sound);
  requestAnimationFrame(frame);
}

boot();
