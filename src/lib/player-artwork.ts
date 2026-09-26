// Shared by comparison cards, profiles, admin exports, and Open Graph artwork.
export const playerArtworkColors = {
  light: {
    canvas: "#ffffff",
    ink: "#1c2921",
    muted: "#536058",
    messi: "#216581",
    ronaldo: "#a84432",
    messiTint: "#e7f3f9",
    messiCenter: "#f7fbfd",
    ronaldoTint: "#f8e9e7",
    ronaldoCenter: "#fffbfa",
    // Explicit white alpha avoids grey bands from transparent-black interpolation.
    veil: "linear-gradient(#ffffff 0%,rgba(255,255,255,0) 44%,rgba(255,255,255,0) 75%,#ffffff 100%)",
    badge: "#ffffff",
    badgeBorder: "#c9d5d7",
    badgeText: "#536058",
    border: "#d2dbd7",
    starOutline: "#9b761d",
  },
  dark: {
    canvas: "#0b1117",
    ink: "#f8f8f4",
    muted: "#aab5bc",
    messi: "#83cff5",
    ronaldo: "#eda29a",
    messiTint: "#132d39",
    messiCenter: "#0c141b",
    ronaldoTint: "#302127",
    ronaldoCenter: "#171116",
    veil: "linear-gradient(#080e14 0%,transparent 44%,transparent 75%,#0b1117 100%)",
    badge: "#101920",
    badgeBorder: "#ffffff22",
    badgeText: "#bcc7cf",
    border: "#ffffff20",
    starOutline: "#dbb367",
  },
} as const;

export const transparentPlayerPortraits = {
  messi: { src: "/images/transparent-argentina-portraits-fifa-world-cup-2026-removebg-preview.png", width: 384, height: 594 },
  ronaldo: { src: "/images/transparent-portugal-portraits-fifa-world-cup-2026-removebg-preview.png", width: 396, height: 594 },
} as const;

export function playerArtworkStyle(player: keyof typeof transparentPlayerPortraits) {
  return Object.fromEntries((["dark", "light"] as const).flatMap(theme => {
    const palette = playerArtworkColors[theme];
    const colors = {
      ink: palette.ink,
      muted: palette.muted,
      accent: palette[player],
      tint: palette[player === "messi" ? "messiTint" : "ronaldoTint"],
      center: palette[player === "messi" ? "messiCenter" : "ronaldoCenter"],
      border: palette.border,
      badge: palette.badge,
      canvas: palette.canvas,
    };
    return Object.entries(colors).map(([key, value]) => [`--art-${theme}-${key}`, value]);
  }));
}
