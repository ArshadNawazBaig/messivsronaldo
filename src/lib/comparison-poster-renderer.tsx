/* eslint-disable @next/next/no-img-element -- Embedded local artwork for ImageResponse. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { playerArtworkColors, transparentPlayerPortraits } from "./player-artwork";
import { imageFormats } from "./stat-image";
import { renderStatImageBrand, statImagePlayerNameStyle } from "./stat-image-brand";
import { comparisonBarShare, comparisonDifference, comparisonLayouts, comparisonRows, comparisonRowValue, type ComparisonPoster, type ComparisonPosterRequest } from "./comparison-poster";

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

// Portraits, names and figures share the same player columns in every format.
const playerColumns = { messi: { left: 56, center: 286 }, ronaldo: { left: 564, center: 794 } } as const;

export async function renderComparisonPoster(request: ComparisonPosterRequest, poster: ComparisonPoster) {
  const [messi, ronaldo, argentina, portugal, mark, regular, bold, condensed] = await (assets ??= loadAssets().catch(error => {
    assets = undefined;
    throw error;
  }));
  const { format, theme } = request;
  const { width, height } = imageFormats[format];
  const colors = playerArtworkColors[theme];
  const dark = theme === "dark";
  const layout = comparisonLayouts[format];
  const tableBottom = height - layout.footerHeight;
  const rows = comparisonRows(poster, request.metrics);
  const showBars = request.showBars !== false;
  const barWidth = format === "story" ? 200 : 164;
  const rowHeight = (tableBottom - layout.tableTop) / rows.length;
  const competition = request.scope === "career" ? "Career comparison" : poster.competition;
  const fadeStart = layout.portraitBottom - (format === "square" ? 36 : 58);
  // One type scale for the entire table, including unusually long values.
  const valueFontSize = Math.min(
    layout.valueSize * (9 / rows.length) ** .2,
    380 / Math.max(3, ...rows.flatMap(row => [comparisonRowValue(row, "messi").length, comparisonRowValue(row, "ronaldo").length])),
  );
  // Keep the approved name spacing stable when the admin removes statistics.
  const statsTextInset = ((tableBottom - layout.tableTop) / poster.rows.length - layout.valueSize) / 2 + layout.valueSize * .12;
  const pictures = (["messi", "ronaldo"] as const).map((player, index) => {
    // Retain the approved framing and Ronaldo's ten-percent smaller crop.
    const scale = layout.photoScale * (player === "messi" ? 1 : 594 / 330 * .9);
    const portrait = transparentPlayerPortraits[player];
    const x = playerColumns[player].center - (player === "messi" ? 192 : 199) * scale;
    const y = layout.headTop - (player === "messi" ? 38 : 40) * scale;
    return `<g clip-path="url(#half${index})"><image x="${x}" y="${y}" width="${portrait.width * scale}" height="${portrait.height * scale}" href="${uri(player === "messi" ? messi : ronaldo, "image/png")}"/></g>`;
  }).join("");
  const artwork = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <clipPath id="half0"><rect width="540" height="${height}"/></clipPath>
    <clipPath id="half1"><rect x="540" width="540" height="${height}"/></clipPath>
    <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${fadeStart}" x2="0" y2="${layout.portraitBottom}"><stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <mask id="portraits" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#fade)"/></mask>
    </defs><g mask="url(#portraits)">${pictures}</g></svg>`));
  const texture = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <pattern id="messi-dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="2" fill="${colors.messi}" opacity="${dark ? .09 : .075}"/></pattern>
    <pattern id="ronaldo-dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="2" fill="${colors.ronaldo}" opacity="${dark ? .09 : .075}"/></pattern>
    </defs><rect width="540" height="${height}" fill="url(#messi-dots)"/><rect x="540" width="540" height="${height}" fill="url(#ronaldo-dots)"/></svg>`));
  const date = new Date(`${poster.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const renderValue = (row: ComparisonPoster["rows"][number], player: "messi" | "ronaldo") => {
    const leading = comparisonDifference(row).player === player;
    const text = comparisonRowValue(row, player);
    return <span key={player} style={{ display: "flex", position: "absolute", left: playerColumns[player].center - 56 - 100, width: 200, justifyContent: "center", fontFamily: "Condensed", fontWeight: 800, fontSize: valueFontSize, lineHeight: 1, letterSpacing: -.5, color: leading ? colors[player] : colors.ink }}>{text}</span>;
  };
  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", fontFamily: "Inter", color: colors.ink, background: colors.canvas }}>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", left: index * 540, top: 0, width: 540, height: layout.tableTop + 100, backgroundImage: `radial-gradient(ellipse at 50% 42%, ${colors[player === "messi" ? "messiTint" : "ronaldoTint"]}, ${colors.canvas} 75%)` }} />)}
      {/* The broad stripe and twin pinstripes echo the Player poster artwork. */}
      {(["messi", "ronaldo"] as const).map(player => <div key={player} style={{ display: "flex", position: "absolute", left: playerColumns[player].center - 110, top: 126, width: 140, height: layout.portraitBottom - 30 }}>
        <div style={{ display: "flex", width: 110, opacity: dark ? .18 : .12, backgroundImage: `linear-gradient(${colors[player]} 0%, ${colors[player]} 65%, ${colors[player]}00 100%)` }} />
        <div style={{ display: "flex", width: 5, marginLeft: 10, opacity: .35, backgroundImage: `linear-gradient(${colors[player]} 0%, ${colors[player]} 65%, ${colors[player]}00 100%)` }} />
        <div style={{ display: "flex", width: 2, marginLeft: 7, opacity: .2, backgroundImage: `linear-gradient(${colors[player]} 0%, ${colors[player]} 65%, ${colors[player]}00 100%)` }} />
      </div>)}
      <img src={texture} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      {(["messi", "ronaldo"] as const).map((player, index) => <span key={player} style={{ display: "flex", position: "absolute", top: layout.headTop + 24, left: index ? 836 : 70, fontFamily: "Condensed", fontWeight: 800, fontSize: format === "story" ? 220 : 150, lineHeight: 1, color: colors[player], opacity: dark ? .09 : .055 }}>{index ? "07" : "10"}</span>)}
      <img src={artwork} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: 40, left: 56, right: 56, alignItems: "center", justifyContent: "space-between" }}>
        {renderStatImageBrand(uri(mark))}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, maxWidth: 660 }}>
          <span style={{ fontSize: 12, letterSpacing: 2.4, color: colors.muted }}>THE RIVALRY IN NUMBERS</span>
          <span style={{ fontSize: competition.length > 32 ? 19 : 22, fontWeight: 800, textAlign: "right" }}>{competition.toUpperCase()}</span>
        </div>
      </div>
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", flexDirection: "column", position: "absolute", top: layout.headTop + 6, left: index ? 900 : 76, width: 104, alignItems: index ? "flex-end" : "flex-start", gap: 10 }}>
        <img src={uri(index ? portugal : argentina)} width={44} height={33} alt={index ? "Portugal flag" : "Argentina flag"} />
        <span style={{ color: colors.muted, fontSize: 11, letterSpacing: 1.1 }}>{index ? "PORTUGAL" : "ARGENTINA"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.headTop + (layout.portraitBottom - layout.headTop) * .48, left: 514, width: 52, height: 52, borderRadius: 26, border: `1px solid ${colors.border}`, background: colors.canvas, alignItems: "center", justifyContent: "center", fontFamily: "Condensed", fontSize: 19, fontWeight: 800, color: colors.muted }}>VS</div>
      {/* Center the lettering between the portrait fade and the stats. Optical
          padding accounts for the condensed capitals' extra space below the baseline. */}
      {(["messi", "ronaldo"] as const).map((player, index) => <div key={player} style={{ display: "flex", position: "absolute", top: layout.portraitBottom, height: layout.tableTop + statsTextInset - layout.portraitBottom, paddingTop: format === "square" ? 4 : 10, left: playerColumns[player].left, width: 460, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...statImagePlayerNameStyle, color: colors[player] }}>{index ? "CRISTIANO" : "LIONEL"}</span>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: layout.nameSize, lineHeight: 1, letterSpacing: -1.5, color: colors[player], marginTop: 6 }}>{index ? "RONALDO" : "MESSI"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop, left: 56, right: 56, flexDirection: "column", borderRadius: 14, background: dark ? "#101a22ed" : "#fffffff0", overflow: "hidden" }}>
        {rows.map((row, index) => <div key={row.id} style={{ display: "flex", position: "relative", height: rowHeight, alignItems: "center", background: index % 2 ? dark ? "#ffffff03" : "#21658104" : "transparent" }}>
            {renderValue(row, "messi")}
            <div style={{ display: "flex", position: "absolute", left: 324, width: 320, flexDirection: "column", alignItems: "center", gap: format === "square" ? 5 : 8 }}>
              <span style={{ display: "flex", justifyContent: "center", textAlign: "center", color: colors.muted, fontSize: layout.labelSize, lineHeight: 1.15 }}>{row.label}</span>
              {showBars && <div style={{ display: "flex", width: barWidth, height: format === "story" ? 5 : 3, borderRadius: 4, overflow: "hidden", background: colors.border }}>
                {row.values.messi !== null && row.values.ronaldo !== null && row.values.messi + row.values.ronaldo > 0 && <>
                  <div style={{ display: "flex", width: barWidth * comparisonBarShare(row), flexShrink: 0, height: "100%", background: colors.messi }} />
                  <div style={{ display: "flex", width: barWidth * (1 - comparisonBarShare(row)), flexShrink: 0, height: "100%", background: colors.ronaldo }} />
                </>}
              </div>}
            </div>
            {renderValue(row, "ronaldo")}
            {index < rows.length - 1 && <div style={{ display: "flex", position: "absolute", bottom: 0, left: 24, right: 24, height: 1, background: colors.border, opacity: .45 }} />}
        </div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", top: tableBottom + 16, left: 56, right: 56, flexDirection: "column", fontSize: format === "story" ? 16 : 14, lineHeight: 1.4, color: colors.muted }}>
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
