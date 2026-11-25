# Hearth & Skillet — Game Design Document

## Overview
**Hearth & Skillet** is an original, fast-paced Mediterranean bistro cooking game built from scratch with vanilla HTML5 Canvas 2D and procedural WebAudio synthesis. You play as the head chef of a sunlit terracotta-and-oak trattoria kitchen, juggling incoming dining-room tickets across prep boards, copper skillets, a hearth grill, and a brass service pass.

## Why It Will Be Fun
- **Spatial Route Optimization**: The U-shaped bistro kitchen places raw ingredient crates along the south and west walls, two prep chopping boards in the center-left, two copper stove skillets and a hearth grill along the north counter, plating/assembly stations in the center-right, and the service pass bell on the east wall. Orders arrive in staggered combinations so planning a tight loop—grabbing ingredients on the way back from plating, keeping a skillet simmering while chopping herbs—separates frantic scrambling from crisp flow.
- **Combinatorial Recipes**: Five core ingredients (Heirloom Tomato, Artisan Pasta, Prime Cutlet, Fresh Basil & Greens, Mozzarella Wheel) combine across raw, chopped, boiled/simmered, seared, and plated states to build five distinct bistro dishes.
- **Escalating Pressure Without Busywork**: A 120-second dinner shift progresses through *Opening Doors* (0–40s), *Dinner Peak* (40–80s), and *Service Rush* (80–120s), where ticket frequency ramps up, higher-value multi-step dishes appear, and a golden rush banner + audio sting heighten urgency while keeping controls one-button responsive.

## Core Loop
1. **Read the Order Rail**: Up to 4–5 parchment tickets hang on the top brass rail, showing the dish illustration, required component badges, remaining time bar, and tip value.
2. **Fetch & Prep**: Pick up raw ingredients from pantry crates and bring them to a Chopping Board (`Space` / `E` / Click) to dice tomatoes, shred mozzarella, mince herbs, or tenderize cutlets.
3. **Cook & Watch the Ring**: Place Pasta, Cutlets, or Diced Tomatoes onto a Stove Skillet or the Hearth Grill. Circular rings show cooking progress, chime when ready, and pulse amber-red if left too long before burning.
4. **Assemble & Plate**: Take a clean plate from the Plate Stack onto an Assembly Counter (or plate directly at an Assembly Counter), layer the prepared ingredients in any order, and watch the dish visually assemble layer by layer.
5. **Serve at the Brass Bell**: Carry the completed dish to the Service Pass to score points, earn Fast Service Tips (>50% ticket time remaining), and build a Bistro Streak multiplier (`x1.0` up to `x3.0`).

## Controls (Keyboard & Mouse)
- **Move**: `WASD` or `Arrow Keys`, OR **Left-Click** any kitchen tile/station to pathfind smoothly toward it and automatically interact upon arrival.
- **Smart Interact / Chop / Plate / Serve**: `Space` or `E` (or clicking the target station). At a Chopping Board with a raw choppable item, tapping or holding `Space`/`E`/`F` performs crisp, rhythmic knife chops.
- **Dash**: `Shift` or `Right-Click` for a quick burst of chef speed with dust puffs (1.6s cooldown).
- **Pause**: `P` or `Escape`.
- **Mute Audio**: `M`.
- **Restart (End Screen)**: `R` or click Play Again.

## Recipes & Values
1. **Caprese Bruschetta** (`$75`): Diced Tomato + Shredded Cheese + Fresh Herbs (cold plated dish — quick combo saver).
2. **Herb Marinara Pasta** (`$110`): Cooked Pasta + Simmered Marinara (cooked Diced Tomato) + Fresh Herbs.
3. **Seared Herb Steak** (`$125`): Seared Cutlet (chopped then grilled/seared) + Fresh Herbs.
4. **Cheesy Steak Melt** (`$155`): Seared Cutlet + Shredded Cheese + Diced Tomato.
5. **Grand Bistro Skillet** (`$210`): Cooked Pasta + Seared Cutlet + Simmered Marinara + Shredded Cheese.

## Progression, Win & Lose
- **Shift Goal**: Reach `$480` in revenue before the 120-second Dinner Shift ends (with 1-Star at `$480`, 2-Star at `$720`, 3-Star at `$960+`).
- **Kitchen Strikes**: Up to 3 expired tickets cost 3 Reputation Stars; losing all 3 closes the kitchen early (**Shift Failed**). Reaching the end of the shift below `$480` also ends in **Shift Failed**.

## Visuals & Audio Juice
- Warm sunlit palette: terracotta tile floor, honey-oak butcher-block counters, hammered copper cookware, cream parchment tickets, and saturated, glossy vector-drawn ingredients.
- Particle bursts for chopping confetti, skillet steam, golden grill sparks, serve celebration stars, and dash dust clouds.
- Floating score/tip popups (`+$165`, `FAST TIP +$35`, `STREAK x2.0`).
- Timer flash and urgent heartbeat tick below 10 seconds; animated Service Rush alert banner.
- Procedural WebAudio oscillator & filtered-noise synthesizer (`chop`, `sizzle`, `readyDing`, `plateSnap`, `serveChime`, `rushSting`, `burnBuzz`, `winFanfare`, `loseBuzzer`).
