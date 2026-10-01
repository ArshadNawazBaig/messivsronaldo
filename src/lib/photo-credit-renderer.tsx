import { playerPhotoLicense } from "./player-artwork";

// Embedded in the bitmap so attribution travels with downloads and social shares.
export function renderPhotoCredit(color: string, options: { player?: "messi" | "ronaldo"; compact?: boolean; bottom?: number } = {}) {
  const { player, compact = false, bottom = 10 } = options;
  const crops = player === "messi" ? "Crop: THIAGOW13" : player === "ronaldo" ? "Crop: Bryan Berlin" : "Crops: THIAGOW13 (Messi), Bryan Berlin (Ronaldo)";
  return <div style={{ display: "flex", position: "absolute", bottom, left: compact ? 46 : 56, right: compact ? 46 : 56, flexDirection: "column", gap: 3, color, fontFamily: "Inter", fontWeight: 400, fontSize: compact ? 11 : 13, lineHeight: 1.2 }}>
    <span>{`Photos © ${playerPhotoLicense.credit} · ${crops}`}</span>
    <span>{`Background removed / adapted by The Rivalry · CC BY-SA 4.0 · messivsronaldo17.com/credits`}</span>
  </div>;
}
