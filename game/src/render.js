// Hearth & Skillet — Canvas 2D renderer for kitchen, food illustrations, HUD, and overlays.

import {
  BURN_TOTAL_TIME,
  BURN_WARNING_TIME,
  CANVAS_H,
  CANVAS_W,
  CHOP_STEPS,
  GRID_COLS,
  GRID_ROWS,
  GRID_X,
  GRID_Y,
  INGREDIENTS,
  MAX_STRIKES,
  PALETTE,
  RECIPES,
  TARGET_REVENUE,
  TILE_SIZE,
} from './config.js';
import { findCandidateRecipes, getFacingStation } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawIngredientGraphic(ctx, id, cx, cy, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  switch (id) {
    case 'tomato_raw': {
      ctx.fillStyle = '#d92f22';
      ctx.beginPath();
      ctx.arc(0, 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f25b49';
      ctx.beginPath();
      ctx.arc(-4, -3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d8f34';
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -6);
      ctx.lineTo(6, -10);
      ctx.lineTo(2, -14);
      ctx.lineTo(0, -9);
      ctx.lineTo(-2, -14);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'tomato_diced': {
      ctx.fillStyle = '#f5eee4';
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0, Math.PI * 2);
      ctx.fill();
      const cubes = [[-5, -2], [3, -4], [-2, 4], [5, 3], [0, -1]];
      cubes.forEach(([ox, oy], i) => {
        ctx.fillStyle = i % 2 === 0 ? '#e33b2b' : '#f25a46';
        ctx.fillRect(ox - 3.5, oy - 3.5, 7, 7);
      });
      break;
    }
    case 'marinara': {
      ctx.fillStyle = '#b95c2d';
      ctx.beginPath();
      ctx.arc(0, 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c82b1d';
      ctx.beginPath();
      ctx.arc(0, 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f26f44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0.3, Math.PI * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#47943c';
      ctx.fillRect(-3, -1, 3, 3);
      ctx.fillRect(3, 4, 3, 3);
      break;
    }
    case 'pasta_raw': {
      ctx.strokeStyle = '#e5b342';
      ctx.lineWidth = 3.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(0, 2, 8 + Math.abs(i) * 1.6, i * 0.4, Math.PI + i * 0.4);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f7d574';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-1, 0, 9, 0, Math.PI * 1.6);
      ctx.stroke();
      break;
    }
    case 'pasta_cooked': {
      ctx.fillStyle = '#f5d167';
      ctx.beginPath();
      ctx.ellipse(0, 3, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff0ad';
      ctx.lineWidth = 2.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 3, 1, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
      break;
    }
    case 'steak_raw': {
      ctx.fillStyle = '#a8333a';
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5d2ca';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(0, -3, 7, 3);
      ctx.stroke();
      break;
    }
    case 'steak_prepped': {
      ctx.fillStyle = '#ba4245';
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f2b8ad';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(-2, 7);
      ctx.moveTo(2, -4);
      ctx.lineTo(7, 6);
      ctx.stroke();
      ctx.fillStyle = '#53a646';
      ctx.fillRect(-4, 0, 3, 3);
      ctx.fillRect(4, 2, 3, 3);
      break;
    }
    case 'steak_seared': {
      ctx.fillStyle = '#6d311f';
      ctx.beginPath();
      ctx.ellipse(0, 2, 15, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38150b';
      ctx.lineWidth = 2.2;
      for (let i = -7; i <= 7; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i - 3, -5);
        ctx.lineTo(i + 3, 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#f8dc75';
      ctx.fillRect(-3, -2, 6, 6);
      break;
    }
    case 'herbs_raw': {
      const leaves = [[-6, 1, -0.5], [6, 1, 0.5], [0, -5, 0]];
      leaves.forEach(([lx, ly, rot]) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.fillStyle = '#349944';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7cd973';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 7);
        ctx.stroke();
        ctx.restore();
      });
      break;
    }
    case 'herbs_chopped': {
      ctx.fillStyle = '#f5eee4';
      ctx.beginPath();
      ctx.arc(0, 2, 12, 0, Math.PI * 2);
      ctx.fill();
      const specks = [[-5, 0], [4, -3], [0, 4], [-2, -4], [5, 3], [-4, 5]];
      specks.forEach(([sx, sy], i) => {
        ctx.fillStyle = i % 2 === 0 ? '#2b8a3b' : '#5fc257';
        ctx.beginPath();
        ctx.arc(sx, sy + 1, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'cheese_raw': {
      ctx.fillStyle = '#fff3ca';
      ctx.beginPath();
      ctx.moveTo(-13, 8);
      ctx.lineTo(13, 8);
      ctx.lineTo(7, -8);
      ctx.lineTo(-10, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#dfc37d';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'cheese_grated': {
      ctx.fillStyle = '#fff6d6';
      ctx.beginPath();
      ctx.arc(0, 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ebd082';
      ctx.lineWidth = 2.2;
      for (let i = -6; i <= 6; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i - 2, -4);
        ctx.lineTo(i + 2, 6);
        ctx.stroke();
      }
      break;
    }
  }
  ctx.restore();
}

function drawPlateBase(ctx, cx, cy, scale = 1, glow = false) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  if (glow) {
    ctx.fillStyle = 'rgba(255, 214, 74, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 2, 27, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fcfaf4';
  ctx.beginPath();
  ctx.arc(0, 2, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#537ea8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 2, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawDishGraphic(ctx, dishId, cx, cy, scale = 1) {
  drawPlateBase(ctx, cx, cy, scale, true);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  if (dishId === 'bruschetta') {
    ctx.fillStyle = '#d4944e';
    ctx.beginPath();
    ctx.ellipse(-5, 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(6, 3, 8, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff5cf';
    ctx.beginPath();
    ctx.arc(-5, 1, 4, 0, Math.PI * 2);
    ctx.arc(6, 1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e03929';
    ctx.fillRect(-7, -2, 4, 4);
    ctx.fillRect(4, -2, 4, 4);
    ctx.fillStyle = '#389944';
    ctx.beginPath();
    ctx.ellipse(0, -3, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'marinara_pasta') {
    ctx.fillStyle = '#f6d163';
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c82b1d';
    ctx.beginPath();
    ctx.arc(0, 1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b9f49';
    ctx.beginPath();
    ctx.ellipse(0, -2, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'herb_steak') {
    ctx.fillStyle = '#6c311f';
    ctx.beginPath();
    ctx.ellipse(0, 2, 13, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38150b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(0, 7);
    ctx.moveTo(2, -4);
    ctx.lineTo(8, 6);
    ctx.stroke();
    ctx.fillStyle = '#f8dc75';
    ctx.fillRect(-3, -2, 5, 5);
    ctx.fillStyle = '#3aa147';
    ctx.beginPath();
    ctx.arc(7, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (dishId === 'steak_melt') {
    ctx.fillStyle = '#6c311f';
    ctx.beginPath();
    ctx.ellipse(0, 3, 13, 9, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff2be';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e23a29';
    ctx.fillRect(-4, -3, 4, 4);
    ctx.fillRect(2, -2, 4, 4);
  } else if (dishId === 'bistro_skillet') {
    ctx.fillStyle = '#f4cb5a';
    ctx.beginPath();
    ctx.arc(-3, 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca2d1f';
    ctx.beginPath();
    ctx.arc(-4, 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6d311f';
    ctx.beginPath();
    ctx.ellipse(5, 3, 8, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff5cf';
    ctx.beginPath();
    ctx.arc(1, -3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawItemOnSurface(ctx, item, cx, cy, scale = 1) {
  if (!item) return;
  if (item.kind === 'ingredient') {
    drawIngredientGraphic(ctx, item.id, cx, cy, scale);
  } else if (item.kind === 'burnt') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#261f1d';
    ctx.beginPath();
    ctx.arc(0, 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#473c38';
    ctx.beginPath();
    ctx.arc(-4, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (item.kind === 'plate') {
    drawPlateBase(ctx, cx, cy, scale, false);
    const n = item.ingredients.length;
    item.ingredients.forEach((ingId, idx) => {
      const ang = (idx / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      const ox = n === 1 ? 0 : Math.cos(ang) * 7;
      const oy = n === 1 ? 0 : Math.sin(ang) * 6;
      drawIngredientGraphic(ctx, ingId, cx + ox, cy + oy, scale * 0.62);
    });
  } else if (item.kind === 'dish') {
    drawDishGraphic(ctx, item.dishId, cx, cy, scale);
  }
}

function drawStationTile(ctx, st, isTargeted, isHovered, world) {
  const x = GRID_X + st.col * TILE_SIZE;
  const y = GRID_Y + st.row * TILE_SIZE;
  const pad = 2;

  if (st.type === 'floor') {
    const light = (st.col + st.row) % 2 === 0;
    ctx.fillStyle = light ? PALETTE.tileLight : PALETTE.tileDark;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = PALETTE.tileGrout;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    if (isHovered) {
      ctx.fillStyle = 'rgba(255, 224, 140, 0.25)';
      ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    }
    return;
  }

  // Counter shadow & body
  ctx.fillStyle = 'rgba(18, 10, 6, 0.28)';
  ctx.fillRect(x + 4, y + TILE_SIZE - 4, TILE_SIZE - 8, 8);

  // Base wood block
  ctx.fillStyle = PALETTE.woodEdge;
  roundRect(ctx, x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2, 8);
  ctx.fill();

  ctx.fillStyle = PALETTE.woodTop;
  roundRect(ctx, x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2 - 8, 7);
  ctx.fill();

  ctx.fillStyle = PALETTE.woodHighlight;
  ctx.fillRect(x + 6, y + 5, TILE_SIZE - 12, 3);

  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2 - 4;

  if (st.type === 'crate') {
    ctx.fillStyle = '#9c6333';
    roundRect(ctx, x + 10, y + 9, TILE_SIZE - 20, TILE_SIZE - 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#6c3e18';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredientGraphic(ctx, st.crateItem, cx, cy - 2, 1.08);
    drawTag(ctx, st.label, cx, y + TILE_SIZE - 12, '#3d2211', '#fdf4dc');
  } else if (st.type === 'chop') {
    ctx.fillStyle = PALETTE.boardWood;
    roundRect(ctx, x + 12, y + 10, TILE_SIZE - 24, TILE_SIZE - 30, 5);
    ctx.fill();
    ctx.strokeStyle = '#b98249';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (st.item) {
      drawItemOnSurface(ctx, st.item, cx, cy - 2, 1.02);
      if (INGREDIENTS[st.item.id]?.chopTo) {
        for (let i = 0; i < CHOP_STEPS; i++) {
          ctx.fillStyle = i < st.chopProgress ? '#37b85f' : 'rgba(45,28,18,0.28)';
          ctx.fillRect(x + 19 + i * 16, y + TILE_SIZE - 22, 13, 5);
        }
      }
    } else {
      // Decorative chef knife
      ctx.save();
      ctx.translate(cx, cy - 2);
      ctx.rotate(-0.55);
      ctx.fillStyle = '#d8dee6';
      ctx.fillRect(-14, -4, 20, 7);
      ctx.fillStyle = '#3c2618';
      ctx.fillRect(6, -3, 10, 5);
      ctx.restore();
    }
    drawTag(ctx, 'CHOP', cx, y + TILE_SIZE - 12, '#5c3818', '#fdf4dc');
  } else if (st.type === 'stove' || st.type === 'grill') {
    ctx.fillStyle = st.type === 'grill' ? '#363233' : PALETTE.stoveMetal;
    roundRect(ctx, x + 8, y + 7, TILE_SIZE - 16, TILE_SIZE - 24, 7);
    ctx.fill();

    if (st.type === 'grill') {
      ctx.strokeStyle = '#5a4236';
      ctx.lineWidth = 3;
      for (let gx = x + 16; gx <= x + TILE_SIZE - 16; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, y + 13);
        ctx.lineTo(gx, y + TILE_SIZE - 23);
        ctx.stroke();
      }
      ctx.fillStyle = st.item ? 'rgba(255, 110, 40, 0.32)' : 'rgba(255, 95, 30, 0.14)';
      ctx.fillRect(x + 12, y + 12, TILE_SIZE - 24, TILE_SIZE - 34);
    } else {
      ctx.strokeStyle = st.item ? PALETTE.flame : '#6f737d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 19, 0, Math.PI * 2);
      ctx.stroke();

      // Copper skillet
      ctx.fillStyle = PALETTE.copper;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d2827';
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8b4622';
      ctx.fillRect(cx + 14, cy - 5, 12, 5);
    }

    if (st.item) {
      drawItemOnSurface(ctx, st.item, cx, cy - 2, 0.92);
      if (st.item.kind === 'ingredient' && INGREDIENTS[st.item.id]?.cookTo) {
        const pct = Math.min(1, st.cookTimer / Math.max(0.1, st.cookDuration));
        drawRingProgress(ctx, cx, cy - 2, 23, pct, '#f5b82e');
      } else if (st.item.kind === 'ingredient') {
        const burnPct = Math.min(1, st.burnTimer / BURN_TOTAL_TIME);
        const warning = st.burnTimer >= BURN_WARNING_TIME;
        const ringColor = warning && Math.floor(world.elapsed * 8) % 2 === 0 ? '#ff3c2e' : '#35b968';
        drawRingProgress(ctx, cx, cy - 2, 23, 1 - burnPct, ringColor);
        if (warning) {
          drawTag(ctx, 'HOT!', cx, y + 13, '#d42c22', '#ffffff');
        } else {
          drawTag(ctx, 'DONE', cx, y + 13, '#258c4d', '#ffffff');
        }
      }
    }
    drawTag(ctx, st.label, cx, y + TILE_SIZE - 12, '#2d2f36', '#f7e6c4');
  } else if (st.type === 'plate_rack') {
    drawPlateBase(ctx, cx - 2, cy - 4, 0.85, false);
    drawPlateBase(ctx, cx + 2, cy - 7, 0.85, false);
    drawTag(ctx, 'PLATES', cx, y + TILE_SIZE - 12, '#415f7c', '#ffffff');
  } else if (st.type === 'assembly') {
    ctx.fillStyle = '#8f9b5e';
    roundRect(ctx, x + 11, y + 9, TILE_SIZE - 22, TILE_SIZE - 28, 6);
    ctx.fill();
    if (st.item) {
      drawItemOnSurface(ctx, st.item, cx, cy - 2, 1.0);
      if (st.item.kind === 'plate' && st.item.ingredients.length > 0) {
        const cands = findCandidateRecipes(st.item.ingredients);
        const need = cands[0] ? cands[0].ingredients.length : 3;
        drawTag(ctx, `${st.item.ingredients.length}/${need}`, cx, y + 13, '#3b2514', '#ffe79c');
      } else if (st.item.kind === 'dish') {
        drawTag(ctx, 'READY!', cx, y + 13, '#26944e', '#ffffff');
      }
    }
    drawTag(ctx, 'PLATE', cx, y + TILE_SIZE - 12, '#4a5528', '#fdf6e1');
  } else if (st.type === 'pass') {
    ctx.fillStyle = '#c89134';
    roundRect(ctx, x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 22, 6);
    ctx.fill();
    ctx.fillStyle = '#f2d38a';
    ctx.fillRect(x + 12, y + 12, TILE_SIZE - 24, TILE_SIZE - 36);
    // Brass bell
    ctx.fillStyle = '#e7b139';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4f3518';
    ctx.fillRect(cx - 12, cy - 4, 24, 4);
    ctx.fillStyle = '#fff5cf';
    ctx.beginPath();
    ctx.arc(cx, cy - 15, 3, 0, Math.PI * 2);
    ctx.fill();
    drawTag(ctx, 'SERVE', cx, y + TILE_SIZE - 12, '#8b5b13', '#fff9e6');
  } else if (st.type === 'trash') {
    ctx.fillStyle = '#5c5854';
    roundRect(ctx, x + 17, y + 12, TILE_SIZE - 34, TILE_SIZE - 32, 6);
    ctx.fill();
    ctx.fillStyle = '#7e7872';
    ctx.fillRect(x + 14, y + 11, TILE_SIZE - 28, 7);
    drawTag(ctx, 'TRASH', cx, y + TILE_SIZE - 12, '#3d3935', '#eee8e0');
  } else {
    // Plain wooden counter
    if (st.item) {
      drawItemOnSurface(ctx, st.item, cx, cy - 2, 1.0);
      if (st.item.kind === 'dish') {
        drawTag(ctx, 'READY!', cx, y + 13, '#26944e', '#ffffff');
      }
    }
  }

  if (isTargeted) {
    ctx.strokeStyle = '#ffe169';
    ctx.lineWidth = 3.5;
    roundRect(ctx, x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 8);
    ctx.stroke();
  } else if (isHovered) {
    ctx.strokeStyle = 'rgba(255, 240, 175, 0.7)';
    ctx.lineWidth = 2;
    roundRect(ctx, x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 8);
    ctx.stroke();
  }
}

function drawRingProgress(ctx, cx, cy, radius, pct, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, pct)));
  ctx.stroke();
  ctx.restore();
}

function drawTag(ctx, text, cx, cy, bg, fg) {
  ctx.save();
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  const w = Math.max(44, ctx.measureText(text).width + 12);
  ctx.fillStyle = bg;
  roundRect(ctx, cx - w / 2, cy - 9, w, 17, 4);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawChef(ctx, chef) {
  const px = GRID_X + chef.x * TILE_SIZE;
  const py = GRID_Y + chef.y * TILE_SIZE;
  const bob = Math.sin(chef.walkPhase) * 2.2;

  ctx.save();
  ctx.translate(px, py);

  // Floor shadow
  ctx.fillStyle = 'rgba(22, 12, 6, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body & Apron
  ctx.translate(0, bob);
  ctx.fillStyle = '#fcfaf4';
  roundRect(ctx, -17, -10, 34, 28, 12);
  ctx.fill();
  ctx.strokeStyle = '#c8bfb0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Terracotta apron
  ctx.fillStyle = '#cf5a32';
  roundRect(ctx, -12, 2, 24, 16, 6);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f5c79e';
  ctx.beginPath();
  ctx.arc(0, -14, 14, 0, Math.PI * 2);
  ctx.fill();

  // Eyes looking in facing direction
  const ex = chef.facingX * 3.5;
  const ey = chef.facingY * 2.5;
  ctx.fillStyle = '#2d1c12';
  ctx.beginPath();
  ctx.arc(-4.5 + ex, -14 + ey, 2.2, 0, Math.PI * 2);
  ctx.arc(4.5 + ex, -14 + ey, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(228, 102, 85, 0.45)';
  ctx.beginPath();
  ctx.arc(-7.5 + ex * 0.6, -10.5 + ey * 0.6, 2.6, 0, Math.PI * 2);
  ctx.arc(7.5 + ex * 0.6, -10.5 + ey * 0.6, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Toque blanche (chef hat)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -29, 9, 0, Math.PI * 2);
  ctx.arc(6, -29, 9, 0, Math.PI * 2);
  ctx.arc(0, -33, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f3eee2';
  ctx.fillRect(-12, -26, 24, 7);

  // Held item in front/above hands
  if (chef.holding) {
    const hx = chef.facingX * 16;
    const hy = chef.facingY * 12 - 6;
    ctx.fillStyle = '#f5c79e';
    ctx.beginPath();
    ctx.arc(hx - 10, hy + 4, 4.5, 0, Math.PI * 2);
    ctx.arc(hx + 10, hy + 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    drawItemOnSurface(ctx, chef.holding, hx, hy, 0.96);
  }

  ctx.restore();
}

function drawOrderRail(ctx, world, sound) {
  // Walnut header
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 0, CANVAS_W, 142);

  // Brass hanging rail
  ctx.fillStyle = PALETTE.railShadow;
  ctx.fillRect(274, 14, 836, 8);
  ctx.fillStyle = PALETTE.railBrass;
  ctx.fillRect(274, 12, 836, 5);

  // Left HUD panel
  ctx.fillStyle = '#3c2416';
  roundRect(ctx, 12, 10, 250, 122, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f6d887';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HEARTH & SKILLET', 24, 31);

  // Clock
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const clockStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const urgent = world.timeLeft <= 10;
  const flash = urgent && Math.floor(world.elapsed * 6) % 2 === 0;
  ctx.fillStyle = flash ? '#ff5f4f' : world.timeLeft <= 40 ? '#ffd257' : '#fff7e2';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.fillText(clockStr, 24, 70);

  // Strikes / Hearts
  for (let i = 0; i < MAX_STRIKES; i++) {
    const alive = i < MAX_STRIKES - world.strikes;
    ctx.fillStyle = alive ? '#f25749' : '#5e4333';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText('♥', 154 + i * 24, 66);
  }

  // Revenue bar
  ctx.fillStyle = '#7dffaa';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText(`$${world.revenue}`, 24, 104);
  ctx.fillStyle = '#c8aa8a';
  ctx.font = '14px "Trebuchet MS", sans-serif';
  ctx.fillText(`/ $${TARGET_REVENUE}`, 86, 104);

  // Streak badge
  const mult = 1 + 0.2 * Math.min(Math.max(0, world.streak - 1), 5);
  ctx.fillStyle = world.streak >= 2 ? '#f5b82e' : '#573a29';
  roundRect(ctx, 166, 85, 84, 26, 6);
  ctx.fill();
  ctx.fillStyle = world.streak >= 2 ? '#2b180b' : '#bda285';
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.streak >= 2 ? `STREAK x${mult.toFixed(1)}` : 'NO STREAK', 208, 102);

  // Phase badge
  ctx.textAlign = 'left';
  ctx.fillStyle = world.timeLeft <= 40 ? '#ff8b5c' : '#d8ba96';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.fillText(world.timeLeft <= 40 ? 'SERVICE RUSH ACTIVE' : 'DINNER SERVICE', 24, 124);

  // Active Order Tickets
  const cardW = 200;
  const cardH = 114;
  world.orders.forEach((order, idx) => {
    const ox = 278 + idx * (cardW + 10);
    const oy = 18;

    // Brass clip
    ctx.fillStyle = PALETTE.railBrass;
    ctx.fillRect(ox + cardW / 2 - 14, 10, 28, 12);

    ctx.fillStyle = PALETTE.parchment;
    roundRect(ctx, ox, oy, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.parchmentEdge;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dish icon
    drawDishGraphic(ctx, order.recipeId, ox + 30, oy + 35, 0.72);

    // Title & price
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(order.shortName, ox + 58, oy + 26);

    ctx.fillStyle = '#257d46';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText(`$${order.price}`, ox + 58, oy + 44);

    // Ingredient pills
    const spacing = Math.min(44, Math.floor((cardW - 24) / order.ingredients.length));
    order.ingredients.forEach((ingId, iIdx) => {
      const ix = ox + 26 + iIdx * spacing;
      const iy = oy + 76;
      ctx.fillStyle = '#efe0c0';
      ctx.beginPath();
      ctx.arc(ix, iy, 15, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientGraphic(ctx, ingId, ix, iy - 1, 0.68);
    });

    // Countdown bar
    const ratio = Math.max(0, Math.min(1, order.timeLeft / order.maxTime));
    const barColor =
      ratio > 0.5 ? PALETTE.good : ratio > 0.25 ? PALETTE.warn : PALETTE.danger;
    ctx.fillStyle = '#d9c5a0';
    roundRect(ctx, ox + 10, oy + cardH - 14, cardW - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, ox + 10, oy + cardH - 14, Math.max(6, (cardW - 20) * ratio), 8, 4);
    ctx.fill();
  });

  // Top-right Pause & Mute pills
  drawButtonPill(ctx, 1126, 10, 62, 28, 'PAUSE', '#4b3121', '#f7e6c4');
  drawButtonPill(ctx, 1196, 10, 70, 28, sound?.muted ? 'MUTED' : 'SOUND', sound?.muted ? '#7a332b' : '#2e6b46', '#ffffff');

  // Target Dish Reminder mini-badge right under top-right buttons
  ctx.fillStyle = '#382215';
  roundRect(ctx, 1126, 46, 140, 84, 8);
  ctx.fill();
  ctx.strokeStyle = '#6b472f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#f2d38a';
  ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PREP GUIDE', 1196, 62);
  ctx.fillStyle = '#e7d5be';
  ctx.font = '11px "Trebuchet MS", sans-serif';
  ctx.fillText('Tom→Chop→Stove', 1196, 80);
  ctx.fillText('Cutlet→Chop→Grill', 1196, 97);
  ctx.fillText('Pasta→Stove · Plate!', 1196, 114);
}

function drawButtonPill(ctx, x, y, w, h, label, bg, fg) {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.textBaseline = 'alphabetic';
}

function describeContextHint(world, targeted) {
  const { chef } = world;
  if (!targeted) {
    return 'WASD / Arrows or Click any counter to move and interact · Shift / Right-Click: Dash';
  }
  if (targeted.type === 'crate') {
    const spec = INGREDIENTS[targeted.crateItem];
    return `SPACE / E: Pick up ${spec?.label ?? 'Ingredient'}`;
  }
  if (targeted.type === 'chop') {
    if (targeted.item?.kind === 'ingredient') {
      const spec = INGREDIENTS[targeted.item.id];
      if (spec?.chopTo) {
        return `SPACE / E: Chop ${spec.label} (${targeted.chopProgress}/${CHOP_STEPS})`;
      }
      return `SPACE / E: Pick up ${spec?.label ?? 'Item'}`;
    }
    if (chef.holding?.kind === 'ingredient' && INGREDIENTS[chef.holding.id]?.chopTo) {
      return `SPACE / E: Place ${INGREDIENTS[chef.holding.id].label} on Chopping Board`;
    }
    return 'Chopping Board — bring Tomato, Cutlet, Herbs, or Cheese';
  }
  if (targeted.type === 'stove' || targeted.type === 'grill') {
    if (targeted.item) {
      if (targeted.item.kind === 'burnt') return 'SPACE / E: Pick up charred mess and Trash it';
      const spec = INGREDIENTS[targeted.item.id];
      if (spec && !spec.cookTo) {
        return `SPACE / E: Take ready ${spec.label}!`;
      }
      return `Cooking ${spec?.label ?? 'Dish'}...`;
    }
    if (chef.holding?.kind === 'ingredient' && INGREDIENTS[chef.holding.id]?.cookTo) {
      return `SPACE / E: Cook ${INGREDIENTS[chef.holding.id].label}`;
    }
    return targeted.type === 'grill'
      ? 'Hearth Grill — sears Cutlets fast!'
      : 'Copper Skillet — boils Pasta & simmers Marinara';
  }
  if (targeted.type === 'pass') {
    return chef.holding?.kind === 'dish'
      ? 'SPACE / E: SERVE COMPLETED DISH!'
      : 'Service Pass — deliver completed plated dishes here';
  }
  if (targeted.type === 'assembly' || targeted.type === 'counter') {
    if (targeted.item?.kind === 'dish') {
      return 'SPACE / E: Pick up completed dish and take to SERVE pass!';
    }
    if (targeted.item?.kind === 'plate') {
      if (chef.holding?.kind === 'ingredient') {
        return `SPACE / E: Plate ${INGREDIENTS[chef.holding.id]?.label ?? 'Ingredient'}`;
      }
      return 'Plating Counter — add prepared ingredients onto the plate';
    }
  }
  return 'SPACE / E: Interact · Shift / Right-Click: Dash · P: Pause · M: Mute';
}

function drawFooterBar(ctx, world, targeted) {
  ctx.fillStyle = '#24150d';
  ctx.fillRect(0, 668, CANVAS_W, 52);
  ctx.fillStyle = '#603f29';
  ctx.fillRect(0, 668, CANVAS_W, 2);

  const hint = world.toastTimer > 0 ? world.toast : describeContextHint(world, targeted);
  ctx.fillStyle = world.toastTimer > 0 ? '#ffd76b' : '#f5e4c8';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(hint, 22, 698);

  ctx.fillStyle = '#bda07f';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD / Click: Move  ·  Space / E: Act  ·  Shift / R-Click: Dash  ·  P: Pause  ·  M: Mute', CANVAS_W - 22, 698);
}

function drawTitleOverlay(ctx) {
  ctx.fillStyle = 'rgba(26, 15, 9, 0.74)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bw = 720;
  const bh = 470;
  const bx = (CANVAS_W - bw) / 2;
  const by = (CANVAS_H - bh) / 2;

  ctx.fillStyle = '#fbf0d9';
  roundRect(ctx, bx, by, bw, bh, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Emblem
  drawDishGraphic(ctx, 'bistro_skillet', bx + 78, by + 76, 1.25);
  drawDishGraphic(ctx, 'herb_steak', bx + bw - 78, by + 76, 1.25);

  ctx.fillStyle = '#2d1c12';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillText('HEARTH & SKILLET', CANVAS_W / 2, by + 78);

  ctx.fillStyle = '#9c4c22';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('SUNLIT TRATTORIA KITCHEN · SERVE FAST, BUILD STREAKS', CANVAS_W / 2, by + 108);

  // Recipe strip
  ctx.fillStyle = '#efe0c0';
  roundRect(ctx, bx + 34, by + 140, bw - 68, 186, 12);
  ctx.fill();

  ctx.fillStyle = '#4f321f';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.fillText('HOW TO RUN THE LINE', CANVAS_W / 2, by + 165);

  const steps = [
    ['1. GRAB', 'Fresh crates', 'on south wall'],
    ['2. CHOP', 'Tomato, Cutlet,', 'Herbs & Cheese'],
    ['3. COOK', 'Skillet & Grill', '(watch the ring!)'],
    ['4. SERVE', 'Plate combo &', 'ring the Pass bell'],
  ];
  steps.forEach(([title, l1, l2], idx) => {
    const sx = bx + 52 + idx * 160;
    ctx.fillStyle = '#d48d3b';
    roundRect(ctx, sx, by + 180, 146, 68, 8);
    ctx.fill();
    ctx.fillStyle = '#fff9eb';
    ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
    ctx.fillText(title, sx + 73, by + 201);
    ctx.font = '12px "Trebuchet MS", sans-serif';
    ctx.fillText(l1, sx + 73, by + 221);
    ctx.fillText(l2, sx + 73, by + 237);
  });

  // Mini recipe previews
  RECIPES.slice(0, 4).forEach((rec, i) => {
    const rx = bx + 98 + i * 164;
    drawDishGraphic(ctx, rec.id, rx - 38, by + 284, 0.72);
    ctx.fillStyle = '#2d1c12';
    ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(rec.shortName, rx - 10, by + 280);
    ctx.fillStyle = '#257d46';
    ctx.fillText(`$${rec.price}`, rx - 10, by + 296);
  });
  ctx.textAlign = 'center';

  // Play CTA
  ctx.fillStyle = '#2c8c4c';
  roundRect(ctx, CANVAS_W / 2 - 150, by + 350, 300, 58, 12);
  ctx.fill();
  ctx.strokeStyle = '#1b6032';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
  ctx.fillText('OPEN THE KITCHEN', CANVAS_W / 2, by + 386);

  ctx.fillStyle = '#6f513d';
  ctx.font = '13px "Trebuchet MS", sans-serif';
  ctx.fillText('Press SPACE / ENTER or Click anywhere · Shift/Right-Click to Dash · M to Mute', CANVAS_W / 2, by + 440);
}

function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(24, 14, 8, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#fbf0d9';
  roundRect(ctx, CANVAS_W / 2 - 210, 220, 420, 290, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.railBrass;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#2d1c12';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.fillText('KITCHEN PAUSED', CANVAS_W / 2, 286);

  ctx.fillStyle = '#6f513d';
  ctx.font = '15px "Trebuchet MS", sans-serif';
  ctx.fillText('Take a breather before the next ticket!', CANVAS_W / 2, 320);

  drawButtonPill(ctx, CANVAS_W / 2 - 130, 360, 260, 54, 'RESUME SHIFT [P]', '#2c8c4c', '#ffffff');
  drawButtonPill(ctx, CANVAS_W / 2 - 130, 434, 260, 54, 'RESTART SHIFT', '#b8492e', '#ffffff');
}

function drawEndOverlay(ctx, world) {
  const won = world.screen === 'won';
  ctx.fillStyle = 'rgba(22, 12, 7, 0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bw = 560;
  const bh = 420;
  const bx = (CANVAS_W - bw) / 2;
  const by = (CANVAS_H - bh) / 2;

  ctx.fillStyle = '#fbf0d9';
  roundRect(ctx, bx, by, bw, bh, 18);
  ctx.fill();
  ctx.strokeStyle = won ? PALETTE.railBrass : '#b83b32';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#227541' : '#a83129';
  ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
  ctx.fillText(won ? 'SHIFT COMPLETE!' : 'KITCHEN CLOSED', CANVAS_W / 2, by + 68);

  const stars = !won ? 0 : world.revenue >= 960 ? 3 : world.revenue >= 720 ? 2 : 1;
  ctx.font = 'bold 36px "Trebuchet MS", sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#f2b129' : '#d6c4a3';
    ctx.fillText('★', CANVAS_W / 2 - 48 + i * 48, by + 114);
  }

  ctx.fillStyle = '#efe0c0';
  roundRect(ctx, bx + 44, by + 138, bw - 88, 174, 12);
  ctx.fill();

  const rows = [
    ['Total Revenue', `$${world.revenue} (Goal $${TARGET_REVENUE})`],
    ['Dishes Served', `${world.servedCount}`],
    ['Tips & Streak Bonus', `$${world.tipsEarned}`],
    ['Best Streak', `x${world.bestStreak}`],
  ];
  rows.forEach(([k, v], i) => {
    const ry = by + 174 + i * 36;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5c412f';
    ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
    ctx.fillText(k, bx + 70, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#24150d';
    ctx.fillText(v, bx + bw - 70, ry);
  });

  ctx.textAlign = 'center';
  drawButtonPill(ctx, CANVAS_W / 2 - 140, by + 336, 280, 56, 'PLAY AGAIN [R]', '#2c8c4c', '#ffffff');
}

export function renderWorld(ctx, world, sound) {
  ctx.save();

  if (world.shakeTimer > 0) {
    const mag = world.shakeTimer * 16;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  // Kitchen backdrop
  ctx.fillStyle = PALETTE.wallWarm;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Warm floor border frame
  ctx.fillStyle = '#5c3822';
  roundRect(
    ctx,
    GRID_X - 8,
    GRID_Y - 8,
    GRID_COLS * TILE_SIZE + 16,
    GRID_ROWS * TILE_SIZE + 16,
    10
  );
  ctx.fill();

  const targeted = getFacingStation(world);

  // Draw tiles
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const st = world.grid[r][c];
      const isTargeted = targeted === st;
      const isHovered = world.hoverTile && world.hoverTile.col === c && world.hoverTile.row === r;
      drawStationTile(ctx, st, isTargeted, isHovered, world);
    }
  }

  // Click path indicator
  if (world.autoTarget) {
    const tgt = world.autoTarget;
    ctx.strokeStyle = 'rgba(255, 228, 117, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      GRID_X + (tgt.col + 0.5) * TILE_SIZE,
      GRID_Y + (tgt.row + 0.5) * TILE_SIZE,
      16,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // Chef
  drawChef(ctx, world.chef);

  // Order rail & HUD
  drawOrderRail(ctx, world, sound);

  // Particles & floating popups drawn above HUD rail so score popups never clip
  world.particles.forEach((p) => {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(GRID_X + p.x * TILE_SIZE, GRID_Y + p.y * TILE_SIZE, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  world.popups.forEach((pop) => {
    const alpha = Math.max(0, Math.min(1, pop.life / pop.maxLife));
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${pop.size}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    const px = GRID_X + pop.x * TILE_SIZE;
    const py = GRID_Y + pop.y * TILE_SIZE;
    ctx.fillStyle = '#24130a';
    ctx.fillText(pop.text, px + 1.5, py + 1.5);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, px, py);
  });
  ctx.globalAlpha = 1;

  // Rush banner (placed cleanly over walkway so stations remain readable)
  if (world.rushBannerTimer > 0 && world.screen === 'playing') {
    const bw = 470;
    ctx.fillStyle = 'rgba(184, 34, 28, 0.92)';
    roundRect(ctx, CANVAS_W / 2 - bw / 2, 260, bw, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd55a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#fff9e6';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERVICE RUSH! FAST ORDERS INCOMING!', CANVAS_W / 2, 287);
  }

  drawFooterBar(ctx, world, targeted);

  if (world.screen === 'title') drawTitleOverlay(ctx);
  if (world.screen === 'paused') drawPauseOverlay(ctx);
  if (world.screen === 'won' || world.screen === 'lost') drawEndOverlay(ctx, world);

  ctx.restore();
}
