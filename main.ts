// Hearth & Skillet — make.fun entry packager (Node 22, standard library only).
// Copies game/ and screenshots/ into the output directory and writes dossier.json
// using the vendored makefun-game library under the competition's gate caps.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

function assertEntrySources(sourceRoot: string): { gameSrc: string; shotsSrc: string } {
  const gameSrc = join(sourceRoot, 'game');
  const indexHtml = join(gameSrc, 'index.html');
  if (!existsSync(gameSrc) || !statSync(gameSrc).isDirectory()) {
    throw new Error(`Hearth & Skillet packager: missing game/ directory at ${gameSrc}`);
  }
  if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
    throw new Error(`Hearth & Skillet packager: missing game/index.html at ${indexHtml}`);
  }
  const shotsSrc = join(sourceRoot, 'screenshots');
  return { gameSrc, shotsSrc };
}

function copyEntryAssets(sourceRoot: string, targetRoot: string): void {
  const { gameSrc, shotsSrc } = assertEntrySources(sourceRoot);

  mkdirSync(targetRoot, { recursive: true });
  const gameDst = join(targetRoot, 'game');
  const shotsDst = join(targetRoot, 'screenshots');

  rmSync(gameDst, { recursive: true, force: true });
  rmSync(shotsDst, { recursive: true, force: true });

  cpSync(gameSrc, gameDst, { recursive: true });
  mkdirSync(shotsDst, { recursive: true });
  if (existsSync(shotsSrc) && statSync(shotsSrc).isDirectory()) {
    cpSync(shotsSrc, shotsDst, { recursive: true });
  }
}

function packageSubmission(): void {
  copyEntryAssets(REPO_ROOT, OUTPUT_DIR);
  const dossierBytes = buildDossier(OUTPUT_DIR, GATE_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierBytes);
}

try {
  packageSubmission();
} catch (err) {
  const detail = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Hearth & Skillet packager failed: ${detail}\n`);
  process.exitCode = 1;
}
