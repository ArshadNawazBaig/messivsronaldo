/* eslint-disable @next/next/no-img-element -- Embedded local artwork for ImageResponse. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { playerArtworkColors, transparentPlayerPortraits } from "./player-artwork";
import { imageFormats } from "./stat-image";
import { renderStatImageBrand, statImagePlayerNameStyle } from "./stat-image-brand";
import { comparisonRowValue, type ComparisonPoster, type ComparisonPosterRequest } from "./comparison-poster";

function loadAssets() {
  return Promise.all([
    readFile(join(process.cwd(), `public${transparentPlayerPortraits.messi.src}`)),
    readFile(join(process.cwd(), `public${transparentPlayerPortraits.ronaldo.src}`)),
    readFile(join(process.cwd(), "public/images/flags/ar.svg")),
    readFile(join(process.cwd(), "public/images/flags/pt.svg")),
    readFile(join(process.cwd(), "public/images/brand/the-rivalry-mark.svg")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-400.woff")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-800.woff")),
    readFile(join(process.cwd(), "public/fonts/og/roboto-condensed-800.ttf")),
  ]);
}
let assets: ReturnType<typeof loadAssets> | undefined;
const uri = (buffer: Buffer, type = "image/svg+xml") => `data:${type};base64,${buffer.toString("base64")}`;

// Each format reserves separate space for portraits, names, statistics and notes.
const layouts = {
  square: { headTop: 156, photoScale: .68, nameTop: 380, nameSize: 72, tableTop: 498, featuredHeight: 76, valueSize: 31, labelSize: 18, footerHeight: 194 },
  portrait: { headTop: 166, photoScale: 1.1, nameTop: 520, nameSize: 98, tableTop: 690, featuredHeight: 90, valueSize: 38, labelSize: 20, footerHeight: 204 },
  story: { headTop: 238, photoScale: 1.6, nameTop: 756, nameSize: 112, tableTop: 960, featuredHeight: 122, valueSize: 50, labelSize: 25, footerHeight: 214 },
} as const;

export async function renderComparisonPoster(request: ComparisonPosterRequest, poster: ComparisonPoster) {
  const [messi, ronaldo, argentina, portugal, mark, regular, bold, condensed] = await (assets ??= loadAssets().catch(error => {
    assets = undefined;
    throw error;
  }));
  const { format, theme } = request;
  const { width, height } = imageFormats[format];
  const colors = playerArtworkColors[theme];
  const dark = theme === "dark";
  const layout = layouts[format];
  const tableBottom = height - layout.footerHeight;
  const goalRow = poster.rows.find(row => row.id === "goals");
  const otherRows = poster.rows.filter(row => row.id !== "goals");
  const rows = goalRow ? [goalRow, ...otherRows] : otherRows;
  const rowHeight = (tableBottom - layout.tableTop - (goalRow ? layout.featuredHeight : 0)) / otherRows.length;
  const competition = request.scope === "career" ? "Career comparison" : poster.competition;
  const surface = dark ? "#101b23" : "#f3f6f5";
  const fadeStart = layout.nameTop - (format === "square" ? 40 : 58);
  const pictures = (["messi", "ronaldo"] as const).map((player, index) => {
    // Retain the approved framing and Ronaldo's ten-percent smaller crop.
    const scale = layout.photoScale * (player === "messi" ? 1 : 594 / 330 * .9);
    const portrait = transparentPlayerPortraits[player];
    const x = (index ? 786 : 294) - (player === "messi" ? 192 : 199) * scale;
    const y = layout.headTop - (player === "messi" ? 38 : 40) * scale;
    return `<g clip-path="url(#half${index})"><image x="${x}" y="${y}" width="${portrait.width * scale}" height="${portrait.height * scale}" href="${uri(player === "messi" ? messi : ronaldo, "image/png")}"/></g>`;
  }).join("");
  const artwork = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <clipPath id="half0"><rect width="540" height="${height}"/></clipPath>
    <clipPath id="half1"><rect x="540" width="540" height="${height}"/></clipPath>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${fadeStart}" x2="0" y2="${layout.nameTop + 6}"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <mask id="portraits" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#fade)"/></mask>
    </defs><g mask="url(#portraits)">${pictures}</g></svg>`));
  const date = new Date(`${poster.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", fontFamily: "Inter", color: colors.ink, background: colors.canvas }}>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", left: index ? 540 : 32, top: 128, width: 508, height: layout.nameTop - 80, backgroundImage: `radial-gradient(ellipse at 50% 42%, ${colors[player === "messi" ? "messiTint" : "ronaldoTint"]}, ${colors.canvas} 72%)` }} />)}
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", left: index ? 806 : 246, top: 128, width: 102, height: layout.nameTop - 128, overflow: "hidden" }}>
        <div style={{ display: "flex", width: 78, backgroundImage: `linear-gradient(${colors[player]}18, ${colors[player]}00)` }} />
        <div style={{ display: "flex", width: 3, marginLeft: 10, backgroundImage: `linear-gradient(${colors[player]}40, ${colors[player]}00)` }} />
      </div>)}
      <img src={artwork} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: 38, left: 56, right: 56, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${colors.border}`, paddingBottom: 23 }}>
        {renderStatImageBrand(uri(mark))}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, maxWidth: 660 }}>
          <span style={{ fontSize: 12, letterSpacing: 3, color: colors.muted }}>HEAD TO HEAD</span>
          <span style={{ fontSize: competition.length > 32 ? 20 : 23, fontWeight: 800, textAlign: "right" }}>{competition.toUpperCase()}</span>
        </div>
      </div>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", flexDirection: "column", position: "absolute", top: layout.headTop + 4, left: index ? 970 : 56, alignItems: index ? "flex-end" : "flex-start", gap: 9 }}>
        <img src={uri(index ? portugal : argentina)} width={54} height={40.5} alt={index ? "Portugal flag" : "Argentina flag"} style={{ borderRadius: 3, border: `1px solid ${colors.border}` }} />
        <span style={{ color: colors.muted, fontSize: 13, letterSpacing: 1.2 }}>{index ? "POR · 7" : "ARG · 10"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.headTop + 26, left: 539, width: 1, height: layout.nameTop - layout.headTop - 10, backgroundImage: `linear-gradient(${colors.canvas}, ${colors.border}, ${colors.canvas})` }} />
      <div style={{ display: "flex", position: "absolute", top: layout.headTop + (layout.nameTop - layout.headTop) * .48, left: 517, width: 46, height: 46, borderRadius: 23, background: colors.canvas, border: `1px solid ${colors.border}`, alignItems: "center", justifyContent: "center", fontFamily: "Condensed", fontSize: 20, fontWeight: 800, color: colors.muted }}>VS</div>
      {/* Center the lettering between the portrait fade and the stats. Optical
          padding accounts for the condensed capitals' extra space below the baseline. */}
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", top: layout.nameTop + 6, height: layout.tableTop - layout.nameTop - 6, paddingTop: format === "square" ? 4 : 10, left: index ? 556 : 64, width: 460, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...statImagePlayerNameStyle, color: colors[player] }}>{index ? "CRISTIANO" : "LIONEL"}</span>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: layout.nameSize, lineHeight: 1, letterSpacing: -1.5, color: colors[player], marginTop: 6 }}>{index ? "RONALDO" : "MESSI"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop, left: 56, right: 56, flexDirection: "column" }}>
        {rows.map(row => {
          const featured = row.id === "goals";
          return <div key={row.id} style={{ display: "flex", position: "relative", height: featured ? layout.featuredHeight : rowHeight, alignItems: "center", borderBottom: `1px solid ${colors.border}`, background: featured ? surface : "transparent" }}>
            {(["messi", "label", "ronaldo"] as const).map(column => {
              if (column === "label") return <span key={column} style={{ display: "flex", width: 392, justifyContent: "center", textAlign: "center", color: featured ? colors.ink : colors.muted, fontWeight: featured ? 800 : 400, fontSize: layout.labelSize, letterSpacing: featured ? 3 : 0 }}>{featured ? "GOALS" : row.label}</span>;
              const value = row.values[column];
              const other = row.values[column === "messi" ? "ronaldo" : "messi"];
              const leading = value !== null && other !== null && value > other;
              return <span key={column} style={{ display: "flex", width: 288, justifyContent: "center", fontFamily: "Condensed", fontWeight: 800, fontSize: featured ? layout.valueSize * 1.6 : layout.valueSize, lineHeight: 1, color: leading ? colors[column] : colors.ink }}>{comparisonRowValue(row, column)}</span>;
            })}
          </div>;
        })}
      </div>
      <div style={{ display: "flex", position: "absolute", top: tableBottom + 20, left: 56, right: 56, flexDirection: "column", fontSize: format === "story" ? 16 : 14, lineHeight: 1.45, color: colors.muted }}>
        {poster.notes.map(note => <div key={note} style={{ display: "flex" }}>{note}</div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", bottom: 28, left: 56, right: 56, alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: 17 }}>
        <span style={{ fontWeight: 800, fontSize: 18 }}>messivsronaldo17.com</span>
        <span style={{ color: colors.muted, fontSize: 14, letterSpacing: .6 }}>CORE STATS · {date.toUpperCase()}</span>
      </div>
    </div>,
    { width, height, fonts: [
      { name: "Inter", data: regular, weight: 400 },
      { name: "Inter", data: bold, weight: 800 },
      { name: "Condensed", data: condensed, weight: 800 },
    ] },
  );
}
