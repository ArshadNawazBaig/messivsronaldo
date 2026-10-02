import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { playerPortraits } from "./player-artwork";

// Literal paths let Next trace only the two cutouts. A computed public path
// makes it copy unrelated photos and fonts into each image-rendering function.
const readPortrait = {
  messi: () => readFile(join(process.cwd(), "public/images/players/messi-world-cup-2026-cutout.webp")),
  ronaldo: () => readFile(join(process.cwd(), "public/images/players/ronaldo-world-cup-2026-cutout.webp")),
} satisfies Record<keyof typeof playerPortraits, () => Promise<Buffer>>;

const portraits: Partial<Record<keyof typeof playerPortraits, Promise<Buffer>>> = {};

// Keep the licensed originals untouched and reuse a bounded-size cutout across
// renders. PNG preserves its alpha; JPEG would give it an opaque background.
// Two PNGs are base64-embedded in an SVG, which is embedded again by Satori.
// Cap their working size to stay below the SVG decoder's 10 MB text limit.
export function loadPlayerPortrait(player: keyof typeof playerPortraits) {
  return portraits[player] ??= readPortrait[player]()
    .then(buffer => sharp(buffer).resize({ height: 1200, withoutEnlargement: true }).png().toBuffer())
    .catch(error => {
      delete portraits[player];
      throw error;
    });
}
