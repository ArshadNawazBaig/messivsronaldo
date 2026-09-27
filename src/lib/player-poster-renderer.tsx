/* eslint-disable @next/next/no-img-element -- Local images embedded into a server-rendered PNG. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { imageFormats } from "./stat-image";
import { playerArtworkColors, transparentPlayerPortraits } from "./player-artwork";
import type { PlayerPoster, PlayerPosterRequest } from "./player-poster";
import { renderStatImageBrand } from "./stat-image-brand";

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

export async function renderPlayerPoster(request: PlayerPosterRequest, poster: PlayerPoster) {
  const [messi, ronaldo, argentina, portugal, mark, regular, bold, condensed] = await (assets ??= loadAssets().catch(error => {
    assets = undefined;
    throw error;
  }));
  const { player, theme, format } = request;
  const { width, height } = imageFormats[format];
  const colors = playerArtworkColors[theme];
  const accent = colors[player];
  const tint = colors[player === "messi" ? "messiTint" : "ronaldoTint"];
  const isMessi = player === "messi";
  const story = format === "story";
  const statsTop = height - 338;
  const portraitTop = format === "square" ? 220 : story ? 445 : 265;
  const portraitHeight = (statsTop + 100 - portraitTop) * 1.12;
  // Ronaldo's source includes his arms and torso. Frame its head and shoulders
  // to match Messi's close-up, with aligned head tops and comparable face sizes.
  const photoScale = isMessi ? portraitHeight / 594 : (portraitHeight / 330) * 0.9;
  const photoHeight = transparentPlayerPortraits[player].height * photoScale;
  const photoWidth = transparentPlayerPortraits[player].width * photoScale;
  const photoLeft = 652 - (isMessi ? 192 : 199) * photoScale;
  const photoTop = portraitTop - (isMessi ? 0 : 19) * photoScale;
  const flagTop = story ? 264 : 190;
  const nameTop = flagTop + (story ? 245 : 168);
  const date = new Date(`${poster.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  // Fade the cutout into the canvas without washing out the player's face.
  const photo = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}">
    <defs>
      <linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${statsTop - 120}" x2="0" y2="${statsTop + 35}">
        <stop stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="edges" gradientUnits="userSpaceOnUse" x1="${photoLeft}" x2="${photoLeft + photoWidth}">
        <stop stop-color="white" stop-opacity="0"/><stop offset=".07" stop-color="white"/><stop offset=".93" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <mask id="bottom" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#fade)"/></mask>
      <mask id="sides" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#edges)"/></mask>
    </defs>
    <g mask="url(#bottom)"><image x="${photoLeft}" y="${photoTop}" width="${photoWidth}" height="${photoHeight}" href="${uri(isMessi ? messi : ronaldo, "image/png")}" mask="url(#sides)"/></g>
  </svg>`));
  const pattern = uri(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><defs><pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M24 18l6 6-6 6-6-6z" fill="${accent}" opacity="${theme === "dark" ? ".05" : ".06"}"/></pattern></defs><rect width="1080" height="${height}" fill="url(#p)"/></svg>`));

  return new ImageResponse(
    <div style={{ display: "flex", width, height, position: "relative", overflow: "hidden", background: colors.canvas, color: colors.ink, fontFamily: "Inter" }}>
      <div style={{ display: "flex", position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse at 64% 48%, ${tint}, ${colors.canvas})` }} />
      <img src={pattern} width={width} height={height} alt="" style={{ position: "absolute", inset: 0 }} />
      <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: 477, width: 170, background: accent, opacity: theme === "dark" ? .18 : .12 }} />
      <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: 661, width: 8, background: accent, opacity: .35 }} />
      <div style={{ display: "flex", position: "absolute", top: 0, bottom: 0, left: 682, width: 3, background: accent, opacity: .2 }} />
      <img src={photo} width={width} height={height} alt="" style={{ position: "absolute", inset: 0 }} />

      <div style={{ display: "flex", position: "absolute", top: 45, left: 56, right: 56, alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${colors.border}`, paddingBottom: 25 }}>
        {renderStatImageBrand(uri(mark))}
        <span style={{ fontSize: 18, letterSpacing: 3, color: colors.muted }}>PLAYER SPOTLIGHT</span>
      </div>
      <div style={{ display: "flex", position: "absolute", left: 56, right: 56, top: 133, color: accent, fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
        {poster.competition}
      </div>
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 56, top: flagTop, gap: 16 }}>
        <img src={uri(isMessi ? argentina : portugal)} width={112} height={84} alt={isMessi ? "Argentina flag" : "Portugal flag"} style={{ borderRadius: 4, border: `1px solid ${colors.border}` }} />
        <span style={{ fontSize: 17, letterSpacing: 3, color: colors.muted }}>{isMessi ? "ARGENTINA" : "PORTUGAL"}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", position: "absolute", left: 56, top: nameTop }}>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: 44, letterSpacing: 3, lineHeight: 1.2 }}>{isMessi ? "LIONEL" : "CRISTIANO"}</span>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: isMessi ? 113 : 89, color: accent, letterSpacing: -2, lineHeight: 1.05 }}>{isMessi ? "MESSI" : "RONALDO"}</span>
        <span style={{ fontSize: 19, color: colors.muted, marginTop: 20, letterSpacing: 2 }}>NO. {isMessi ? "10" : "7"}</span>
      </div>
      <div style={{ display: "flex", position: "absolute", right: 54, top: flagTop - 22, width: 272, flexDirection: "column", alignItems: "flex-end" }}>
        <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: poster.goals.length > 4 ? 140 : 188, letterSpacing: -6, lineHeight: 1 }}>{poster.goals}</span>
        <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: 5, color: accent, marginTop: 8 }}>GOALS</span>
      </div>

      <div style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: 0, height: 430, backgroundImage: `linear-gradient(${theme === "dark" ? "rgba(11,17,23,0)" : "rgba(255,255,255,0)"}, ${colors.canvas} 27%)` }} />
      <div style={{ display: "flex", position: "absolute", top: statsTop, left: 56, right: 56, paddingTop: 28, borderTop: `2px solid ${accent}` }}>
        {poster.metrics.map((metric, index) => <div key={metric.label} style={{ display: "flex", flexDirection: "column", width: "25%", alignItems: "center", borderLeft: index ? `1px solid ${colors.border}` : "0px solid transparent", gap: 16 }}>
          <span style={{ fontSize: 21, color: colors.muted }}>{metric.label.toUpperCase()}</span>
          <span style={{ fontFamily: "Condensed", fontSize: metric.value.length > 6 ? 46 : 55, fontWeight: 800, lineHeight: 1 }}>{metric.value}</span>
        </div>)}
      </div>
      <div style={{ display: "flex", position: "absolute", left: 56, right: 56, bottom: 108, height: 76, alignItems: "center", color: colors.muted, fontSize: 18, lineHeight: 1.4 }}>{poster.coverage}</div>
      <div style={{ display: "flex", position: "absolute", bottom: 43, left: 56, right: 56, justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: 21 }}>
        <span style={{ fontWeight: 800, fontSize: 20 }}>messivsronaldo17.com</span>
        <span style={{ color: colors.muted, fontSize: 17 }}>AS OF {date.toUpperCase()}</span>
      </div>
    </div>,
    { width, height, fonts: [
      { name: "Inter", data: regular, weight: 400 },
      { name: "Inter", data: bold, weight: 800 },
      { name: "Condensed", data: condensed, weight: 800 },
    ] },
  );
}
