# Hearth & Skillet

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/diko23/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/diko23/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Hearth & Skillet** is an original offline Mediterranean bistro cooking game built with vanilla HTML5 Canvas 2D and procedural WebAudio synthesis. Manage incoming tickets on the brass rail, prep fresh ingredients on butcher-block boards, sear steaks on the hearth grill and simmer marinara in copper skillets, plate combinations, and serve fast before the Service Rush overwhelms the pass.

## Run it

Play locally in any desktop browser (requires Node.js 22.18+):

```sh
node serve.ts
```

Then open `http://localhost:8080`.

Build the submission dossier output (`out/dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Controls

- **Move**: `WASD` / `Arrow Keys` or **Left-Click** any kitchen tile or station to pathfind and interact
- **Interact / Chop / Plate / Serve**: `Space` or `E` (hold to auto-chop on boards)
- **Dash**: `Shift` or **Right-Click**
- **Pause**: `P` or `Escape`
- **Mute Audio**: `M`

<sub>Entered on [make.fun](https://make.fun/?ref=3y509cnb&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
