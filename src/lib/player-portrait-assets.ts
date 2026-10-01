import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { playerPortraits } from "./player-artwork";

const portraits: Partial<Record<keyof typeof playerPortraits, Promise<Buffer>>> = {};

// Keep the licensed originals untouched and reuse a bounded-size cutout across
// renders. PNG preserves its alpha; JPEG would give it an opaque background.
// Two PNGs are base64-embedded in an SVG, which is embedded again by Satori.
// Cap their working size to stay below the SVG decoder's 10 MB text limit.
export function loadPlayerPortrait(player: keyof typeof playerPortraits) {
  return portraits[player] ??= readFile(join(process.cwd(), `public${playerPortraits[player].src}`))
    .then(buffer => sharp(buffer).resize({ height: 1200, withoutEnlargement: true }).png().toBuffer())
    .catch(error => {
      delete portraits[player];
      throw error;
    });
}
