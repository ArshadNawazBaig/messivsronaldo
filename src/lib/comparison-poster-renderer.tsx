/* eslint-disable @next/next/no-img-element -- Embedded local artwork for ImageResponse. */
import { loadPlayerPortrait } from "./player-portrait-assets";
import { renderPhotoCredit } from "./photo-credit-renderer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { playerArtworkColors, playerPortraits } from "./player-artwork";
import { imageFormats } from "./stat-image";
import { renderStatImageBrand } from "./stat-image-brand";
import { comparisonBarShare, comparisonBrandHeaderHeight, comparisonLayouts, comparisonRows, comparisonRowValue, type ComparisonPoster, type ComparisonPosterRequest } from "./comparison-poster";

function loadAssets() {
  return Promise.all([
    loadPlayerPortrait("messi"),
    loadPlayerPortrait("ronaldo"),
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
const players = ["messi", "ronaldo"] as const;
const frame = { left: 56, width: 968 };

export async function renderComparisonPoster(request: ComparisonPosterRequest, poster: ComparisonPoster) {
  const [messi, ronaldo, argentina, portugal, mark, regular, bold, condensed] = await (assets ??= loadAssets().catch(error => {
    assets = undefined;
    throw error;
  }));
  const { format, theme } = request;
  const { width, height } = imageFormats[format];
  const colors = playerArtworkColors[theme];
  const dark = theme === "dark";
  const story = format === "story";
  const layout = comparisonLayouts[format];
  const tableBottom = height - layout.footerHeight;
  const rows = comparisonRows(poster, request.metrics);
  const showBars = request.showBars !== false;
  const barWidth = story ? 190 : 156;
  const rowHeight = (tableBottom - layout.tableTop) / rows.length;
  const pillWidth = story ? 194 : 166;
  const pillHeight = Math.min(rowHeight - 8, layout.valueSize + 14);
  const competition = request.scope === "career" ? "Career statistics" : poster.competition;
  const headingSize = Math.min(layout.headingSize, 1720 / competition.length);
  const photoHeight = layout.tableHeaderTop - layout.photoTop;
  const portraitBottom = tableBottom + 12;
  const halfWidth = width / 2;
  const portraitWidth = 384 * layout.photoScale;
  const portraitHeight = 576 * layout.photoScale;
  // Every row uses the same size, including long counts and decimal rates.
  const valueFontSize = Math.min(
    layout.valueSize,
    (pillWidth - 26) / (.56 * Math.max(3, ...rows.flatMap(row => [comparisonRowValue(row, "messi").length, comparisonRowValue(row, "ronaldo").length]))),
    pillHeight / 1.15,
  );
  const pictures = players.map((player, index) => {
    const portrait = playerPortraits[player];
    const center = halfWidth * (index + .5);
    const photoWidth = portraitHeight * portrait.width / portrait.height;
    const x = center - photoWidth / 2;
    const y = layout.headTop;
    const bottom = Math.min(portraitBottom, layout.headTop + portraitHeight);
    const left = Math.max(index * halfWidth, center - portraitWidth / 2);
    const right = Math.min((index + 1) * halfWidth, center + portraitWidth / 2);
    return `<defs>
      <linearGradient id="portrait-fade-${index}" gradientUnits="userSpaceOnUse" x1="0" y1="${bottom - 90 * layout.photoScale}" x2="0" y2="${bottom}">
        <stop stop-color="white"/><stop offset=".35" stop-color="white" stop-opacity=".85"/><stop offset=".75" stop-color="white" stop-opacity=".25"/><stop offset="1" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="portrait-edges-${index}" gradientUnits="userSpaceOnUse" x1="${left}" x2="${right}">
        <stop stop-color="white" stop-opacity="0"/><stop offset=".04" stop-color="white" stop-opacity=".7"/><stop offset=".08" stop-color="white"/><stop offset=".92" stop-color="white"/><stop offset=".96" stop-color="white" stop-opacity=".7"/><stop offset="1" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <mask id="portrait-mask-${index}" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#portrait-fade-${index})"/></mask>
      <mask id="portrait-side-mask-${index}" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#portrait-edges-${index})"/></mask>
    </defs><g clip-path="url(#half${index})" mask="url(#portrait-mask-${index})"><image x="${x}" y="${y}" width="${photoWidth}" height="${portraitHeight}" href="${uri(player === "messi" ? messi : ronaldo, "image/png")}" mask="url(#portrait-side-mask-${index})"/></g>`;
  }).join("");
  const artwork = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <clipPath id="half0"><rect x="0" y="${layout.photoTop}" width="${halfWidth}" height="${portraitBottom - layout.photoTop}"/></clipPath>
    <clipPath id="half1"><rect x="${halfWidth}" y="${layout.photoTop}" width="${halfWidth}" height="${portraitBottom - layout.photoTop}"/></clipPath>
    </defs>${pictures}</svg>`));
  const texture = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs>
    <pattern id="messi-dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="2" fill="${colors.messi}" opacity="${dark ? .09 : .075}"/></pattern>
    <pattern id="ronaldo-dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="2" fill="${colors.ronaldo}" opacity="${dark ? .09 : .075}"/></pattern>
    </defs><rect width="540" height="${height}" fill="url(#messi-dots)"/><rect x="540" width="540" height="${height}" fill="url(#ronaldo-dots)"/></svg>`));
  const date = new Date(`${poster.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const renderValue = (row: ComparisonPoster["rows"][number], player: "messi" | "ronaldo") => <span key={player} style={{
    display: "flex", position: "absolute", left: player === "messi" ? 32 : frame.width - pillWidth - 32,
    width: pillWidth, height: pillHeight, borderRadius: pillHeight / 2,
    alignItems: "center", justifyContent: "center", background: colors[player], color: colors.canvas,
    fontFamily: "Condensed", fontWeight: 800, fontSize: valueFontSize, lineHeight: 1, letterSpacing: -.3,
  }}>{comparisonRowValue(row, player)}</span>;

  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", fontFamily: "Inter", color: colors.ink, background: colors.canvas }}>
      <div style={{ display: "flex", position: "absolute", inset: 0, backgroundImage: `linear-gradient(100deg, ${colors.messiTint}, ${colors.canvas} 48%, ${colors.ronaldoTint})` }} />
      <img src={texture} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: tableBottom, left: 0, width, bottom: 0, background: colors.canvas }} />
      <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width, height: portraitBottom, overflow: "hidden" }}>
        {players.map((player, index) => <div key={player} style={{ display: "flex", position: "relative", width: halfWidth, height: portraitBottom, overflow: "hidden", backgroundImage: `radial-gradient(ellipse at 50% 38%, ${colors[player === "messi" ? "messiTint" : "ronaldoTint"]}, ${colors.canvas} 95%)` }}>
          <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: halfWidth / 2 - 104, width: 110, background: colors[player], opacity: dark ? .18 : .12 }} />
          <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: halfWidth / 2 + 16, width: 5, background: colors[player], opacity: .35 }} />
          <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: halfWidth / 2 + 28, width: 2, background: colors[player], opacity: .2 }} />
          <img src={texture} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: -index * halfWidth }} />
          <span style={{ display: "flex", position: "absolute", top: layout.photoTop + photoHeight * .22, left: index ? halfWidth - 154 : 16, color: colors[player], opacity: dark ? .09 : .06, fontFamily: "Condensed", fontSize: story ? 190 : 140, fontWeight: 800 }}>{index ? "07" : "10"}</span>
        </div>)}
      </div>
      <img src={artwork} width={width} height={height} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ display: "flex", position: "absolute", left: 0, top: layout.tableHeaderTop - 64, width, height: portraitBottom - layout.tableHeaderTop + 64, backgroundImage: `linear-gradient(${colors.canvas}00, ${colors.canvas}cc 20%, ${colors.canvas}99 48%, ${colors.canvas}b3 86%, ${colors.canvas} 100%)` }} />
      <div style={{ display: "flex", position: "absolute", top: layout.photoTop - comparisonBrandHeaderHeight, left: 80, right: 80, height: comparisonBrandHeaderHeight, alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        {renderStatImageBrand(uri(mark))}
        <span style={{ color: colors.muted, fontSize: 10, letterSpacing: 1.3, textAlign: "right" }}>THE RIVALRY IN NUMBERS</span>
      </div>
      {players.map((player, index) => <div key={player} style={{ display: "flex", alignItems: "center", flexDirection: index ? "row-reverse" : "row", position: "absolute", top: layout.photoTop + 20, left: index ? 871 : 80, width: 129, gap: 8 }}>
        <img src={uri(index ? portugal : argentina)} width={32} height={24} alt={index ? "Portugal flag" : "Argentina flag"} />
        <span style={{ fontSize: 11, letterSpacing: 1.1, color: colors.muted }}>{index ? "PORTUGAL" : "ARGENTINA"}</span>
      </div>)}
      <div style={{ display: "flex", position: "absolute", left: 88, top: layout.tableHeaderTop - 18, height: 36, padding: "0 18px", alignItems: "center", borderRadius: 18, background: colors.messi, color: colors.canvas, fontFamily: "Condensed", fontWeight: 800, fontSize: 22, letterSpacing: .5 }}>FOOTBALL</div>
      <div style={{ display: "flex", position: "absolute", left: 88, right: 88, top: layout.tableHeaderTop + (story ? 48 : 36), flexDirection: "column", gap: story ? 12 : 8 }}>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: story ? 28 : 23, lineHeight: 1.1, letterSpacing: .5 }}>HEAD-TO-HEAD COMPARISON</span>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: headingSize, lineHeight: 1.05, letterSpacing: -1, color: colors.messi }}>{competition.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", position: "absolute", left: 88, right: 88, top: layout.tableTop - 30, justifyContent: "space-between", color: colors.muted, fontSize: story ? 15 : 12, letterSpacing: 1 }}>
        <span>{rows.length} STATISTICS</span><span>CORE STATS · {date.toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", position: "absolute", top: layout.tableTop, left: frame.left, width: frame.width, flexDirection: "column" }}>
        {rows.map((row, index) => <div key={row.id} style={{ display: "flex", position: "relative", height: rowHeight, alignItems: "center" }}>
          {index % 2 === 1 && <div style={{ display: "flex", position: "absolute", left: -frame.left, top: 0, width, height: rowHeight, background: `${colors.messiCenter}33` }} />}
          {renderValue(row, "messi")}
          <div style={{ display: "flex", position: "absolute", left: 254, width: 460, flexDirection: "column", alignItems: "center", gap: format === "square" ? 3 : 6 }}>
            <span style={{ display: "flex", justifyContent: "center", textAlign: "center", color: colors.ink, fontFamily: "Condensed", fontWeight: 800, fontSize: layout.labelSize, lineHeight: 1.1 }}>{row.label}</span>
            {showBars && <div style={{ display: "flex", width: barWidth, height: story ? 4 : 2, borderRadius: 2, overflow: "hidden", background: colors.border }}>
              {row.values.messi !== null && row.values.ronaldo !== null && row.values.messi + row.values.ronaldo > 0 && <>
                <div style={{ display: "flex", width: barWidth * comparisonBarShare(row), flexShrink: 0, height: "100%", background: colors.messi }} />
                <div style={{ display: "flex", width: barWidth * (1 - comparisonBarShare(row)), flexShrink: 0, height: "100%", background: colors.ronaldo }} />
              </>}
            </div>}
          </div>
          {renderValue(row, "ronaldo")}
        </div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", top: tableBottom + 14, left: frame.left, width: frame.width, fontSize: story ? 16 : 13, lineHeight: 1.4, color: colors.muted }}>
        {poster.notes.join(" ")}
      </div>
      {renderPhotoCredit(colors.muted)}
    </div>,
    { width, height, fonts: [
      { name: "Inter", data: regular, weight: 400 },
      { name: "Inter", data: bold, weight: 800 },
      { name: "Condensed", data: condensed, weight: 800 },
    ] },
  );
}
