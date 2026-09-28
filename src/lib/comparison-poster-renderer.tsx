/* eslint-disable @next/next/no-img-element -- Embedded local artwork for ImageResponse. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { playerArtworkColors, transparentPlayerPortraits } from "./player-artwork";
import { imageFormats } from "./stat-image";
import { renderStatImageBrand } from "./stat-image-brand";
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

// Use the portrait, texture, stripe and typography treatment from Player poster.
const layouts = {
  square: { headTop: 174, photoScale: .66, nameTop: 378, nameSize: 78, tableTop: 514, valueSize: 34, labelSize: 18 },
  portrait: { headTop: 204, photoScale: 1.1, nameTop: 548, nameSize: 98, tableTop: 704, valueSize: 41, labelSize: 20 },
  story: { headTop: 252, photoScale: 1.72, nameTop: 806, nameSize: 116, tableTop: 990, valueSize: 53, labelSize: 24 },
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
  const tableBottom = height - 192;
  const rowHeight = (tableBottom - layout.tableTop) / poster.rows.length;
  const pictures = (["messi", "ronaldo"] as const).map((player, index) => {
    // Retain the approved framing and Ronaldo's ten-percent smaller crop.
    const scale = layout.photoScale * (player === "messi" ? 1 : 594 / 330 * .9);
    const portrait = transparentPlayerPortraits[player];
    const x = (index ? 780 : 300) - (player === "messi" ? 192 : 199) * scale;
    const y = layout.headTop - (player === "messi" ? 38 : 40) * scale;
    return `<g clip-path="url(#half${index})"><image x="${x}" y="${y}" width="${portrait.width * scale}" height="${portrait.height * scale}" href="${uri(player === "messi" ? messi : ronaldo, "image/png")}"/></g>`;
  }).join("");
  const artwork = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <pattern id="texture" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 18l6 6-6 6-6-6z" fill="${colors.muted}" opacity="${dark ? .065 : .055}"/></pattern>
    <clipPath id="half0"><rect width="540" height="${height}"/></clipPath>
    <clipPath id="half1"><rect x="540" width="540" height="${height}"/></clipPath>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${layout.nameTop - 76}" x2="0" y2="${layout.nameTop + 110}"><stop stop-color="white"/><stop offset=".55" stop-color="white" stop-opacity=".2"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <mask id="portraits" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#fade)"/></mask>
    </defs><rect width="1080" height="${height}" fill="url(#texture)"/><g mask="url(#portraits)">${pictures}</g></svg>`));
  const date = new Date(`${poster.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", fontFamily: "Inter", color: colors.ink, background: colors.canvas }}>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", left: index * 540, top: 120, width: 540, height: layout.tableTop, backgroundImage: `radial-gradient(ellipse at 50% 50%, ${colors[player === "messi" ? "messiTint" : "ronaldoTint"]}, ${colors.canvas} 72%)` }} />)}
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", left: index ? 706 : 226, top: 0, width: 148, height: layout.tableTop + 80 }}>
        <div style={{ display: "flex", width: 126, background: colors[player], opacity: dark ? .14 : .09 }} />
        <div style={{ display: "flex", width: 5, marginLeft: 10, background: colors[player], opacity: .3 }} />
        <div style={{ display: "flex", width: 2, marginLeft: 5, background: colors[player], opacity: .18 }} />
      </div>)}
      <img src={artwork} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: 43, left: 56, right: 56, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${colors.border}`, paddingBottom: 25 }}>
        {renderStatImageBrand(uri(mark))}
        <span style={{ fontSize: 18, letterSpacing: 3, color: colors.muted }}>PLAYER COMPARISON</span>
      </div>
      <div style={{ display: "flex", position: "absolute", top: 139, left: 56, right: 56, justifyContent: "center", textAlign: "center", fontSize: 22, letterSpacing: 3, fontWeight: 800 }}>
        {request.scope === "career" ? "CAREER COMPARISON" : poster.competition.toUpperCase()}
      </div>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", flexDirection: "column", position: "absolute", top: layout.headTop + 24, left: index ? 958 : 56, alignItems: index ? "flex-end" : "flex-start", gap: 12 }}>
        <img src={uri(index ? portugal : argentina)} width={66} height={49.5} alt={index ? "Portugal flag" : "Argentina flag"} style={{ borderRadius: 3, border: `1px solid ${colors.border}` }} />
        <span style={{ color: colors.muted, fontSize: 16, letterSpacing: 2 }}>NO. {index ? "7" : "10"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.nameTop - 100, left: 513, width: 54, height: 54, borderRadius: 27, background: colors.canvas, border: `1px solid ${colors.border}`, alignItems: "center", justifyContent: "center", fontFamily: "Condensed", fontSize: 23, fontWeight: 800, color: colors.muted }}>VS</div>
      <div style={{ display: "flex", position: "absolute", left: 0, right: 0, top: layout.nameTop + 75, bottom: 0, backgroundImage: `linear-gradient(${dark ? "rgba(11,17,23,0)" : "rgba(255,255,255,0)"}, ${colors.canvas} 100px)` }} />
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", top: layout.nameTop, left: index ? 564 : 56, width: 460, flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: format === "square" ? 28 : format === "story" ? 38 : 32, lineHeight: 1.1, letterSpacing: 3, color: colors.ink, textShadow: `0 1px 8px ${colors.canvas}` }}>{index ? "CRISTIANO" : "LIONEL"}</span>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: layout.nameSize, lineHeight: 1.1, letterSpacing: -1, color: colors[player], marginTop: 4 }}>{index ? "RONALDO" : "MESSI"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop - 12, left: 56, width: 460, height: 2, background: colors.messi }} />
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop - 12, right: 56, width: 460, height: 2, background: colors.ronaldo }} />
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop, left: 56, right: 56, flexDirection: "column" }}>
        {poster.rows.map(row => <div key={row.id} style={{ display: "flex", height: rowHeight, alignItems: "center", borderBottom: `1px solid ${colors.border}`, background: row.id === "goals" ? (dark ? "#ffffff05" : "#1c292104") : "transparent" }}>
          {(["messi", "label", "ronaldo"] as const).map(column => {
            if (column === "label") return <span key={column} style={{ display: "flex", width: 448, justifyContent: "center", textAlign: "center", color: colors.muted, fontSize: layout.labelSize, letterSpacing: .8 }}>{row.label.toUpperCase()}</span>;
            const value = row.values[column];
            const other = row.values[column === "messi" ? "ronaldo" : "messi"];
            const leading = value !== null && other !== null && value > other;
            return <span key={column} style={{ display: "flex", width: 260, justifyContent: "center", fontFamily: "Condensed", fontWeight: 800, fontSize: layout.valueSize, lineHeight: 1, color: leading ? colors[column] : colors.ink }}>{comparisonRowValue(row, column)}</span>;
          })}
        </div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", top: height - 166, left: 56, right: 56, flexDirection: "column", fontSize: 15, lineHeight: 1.4, color: colors.muted }}>
        {poster.notes.map(note => <div key={note} style={{ display: "flex" }}>{note}</div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", bottom: 28, left: 56, right: 56, justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: 17 }}>
        <span style={{ fontWeight: 800, fontSize: 20 }}>messivsronaldo17.com</span>
        <span style={{ color: colors.muted, fontSize: 16 }}>CORE STATS: {date.toUpperCase()}</span>
      </div>
    </div>,
    { width, height, fonts: [
      { name: "Inter", data: regular, weight: 400 },
      { name: "Inter", data: bold, weight: 800 },
      { name: "Condensed", data: condensed, weight: 800 },
    ] },
  );
}
