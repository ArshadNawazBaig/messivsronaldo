import { z } from "zod";

// A snapshot of the visible comparison, never a second calculation of its filters.
export type StatImage = {
  title: string;
  context: string;
  values: { messi: number | null; ronaldo: number | null };
  date?: string;
  note?: string;
  decimals?: number;
  unit?: string;
  lowerIsBetter?: boolean;
};
export const imageFormats = {
  square: { width: 1080, height: 1080, label: "Square" },
  portrait: { width: 1080, height: 1350, label: "Portrait" },
  story: { width: 1080, height: 1920, label: "Story" },
} as const;
export type ImageFormat = keyof typeof imageFormats;
export type ImagePlayers = "both" | "messi" | "ronaldo";
export type ImageTheme = "dark" | "light";
const value = z.number().min(0).max(1e9).nullable();
export const statImageSchema = z
  .object({
    stat: z
      .object({
        title: z.string().trim().min(1).max(140),
        context: z.string().trim().min(1).max(180),
        values: z.object({ messi: value, ronaldo: value }).strict(),
        date: z.iso.date(),
        note: z.string().max(700).optional(),
        decimals: z.number().int().min(0).max(3).default(0),
        unit: z.string().max(16).default(""),
        lowerIsBetter: z.boolean().default(false),
      })
      .strict(),
    format: z.enum(["square", "portrait", "story"]),
    players: z.enum(["both", "messi", "ronaldo"]),
    // Older open previews keep the approved dark artwork until refreshed.
    theme: z.enum(["dark", "light"]).default("dark"),
  })
  .strict();
export type StatImageRequest = z.infer<typeof statImageSchema>;

export function imageValue(stat: StatImage, player: "messi" | "ronaldo") {
  const n = stat.values[player];
  return n === null
    ? "—"
    : n.toLocaleString("en-US", {
        minimumFractionDigits: stat.decimals ?? 0,
        maximumFractionDigits: stat.decimals ?? 0,
      }) + (stat.unit ?? "");
}
export function imageLeader(stat: StatImage, player: "messi" | "ronaldo") {
  const a = stat.values[player],
    b = stat.values[player === "messi" ? "ronaldo" : "messi"];
  if (a === null || b === null) return false;
  return stat.lowerIsBetter ? a <= b : a >= b;
}
export function imageFilename({
  stat,
  format,
  players,
  theme,
}: Pick<StatImageRequest, "stat" | "format" | "players" | "theme">) {
  const slug = `${stat.context}-${stat.title}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
  return `${players === "both" ? "messi-vs-ronaldo" : players}-${slug}-${stat.date}-${theme}-${format}.png`;
}
