/* eslint-disable @next/next/no-img-element -- ImageResponse uses embedded assets, not next/image. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { playerArtworkColors, playerPortraits } from "./player-artwork";
import { loadPlayerPortrait } from "./player-portrait-assets";
import { renderPhotoCredit } from "./photo-credit-renderer";

type Player = "messi" | "ronaldo";
type SocialImageData = { goals: Record<Player, number>; asOf: string };
export type SocialImageTheme = keyof typeof playerArtworkColors;

const width = 1200;
const height = 630;
const players = ["messi", "ronaldo"] as const;
const uri = (buffer: Buffer, type = "image/png") =>
  `data:${type};base64,${buffer.toString("base64")}`;

function portraitLayer(images: Record<Player, Buffer>) {
  // Fade the sides and lower shirt into either theme without washing out faces.
  const cropHeight = 350;
  const imageHeight = 600;
  const edges = [20, 830].map((left, index) =>
    `<clipPath id="portrait-${index}"><rect x="${left}" width="350" height="${cropHeight}"/></clipPath><mask id="portrait-sides-${index}" maskUnits="userSpaceOnUse" x="${left}" y="0" width="350" height="${cropHeight}"><rect x="${left}" width="350" height="${cropHeight}" fill="url(#side-fade)"/></mask>`,
  ).join("");
  const pictures = players.map((player, index) => {
    const imageWidth = imageHeight * playerPortraits[player].width / playerPortraits[player].height;
    const center = index === 0 ? 205 : 995;
    const top = player === "messi" ? -55 : -20;
    return `<g clip-path="url(#portrait-${index})" mask="url(#portrait-sides-${index})"><image href="${uri(images[player])}" x="${center - imageWidth / 2}" y="${top}" width="${imageWidth}" height="${imageHeight}"/></g>`;
  }).join("");
  return uri(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${cropHeight}" viewBox="0 0 1200 ${cropHeight}"><defs><linearGradient id="shirt-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".72" stop-color="white"/><stop offset=".86" stop-color="white" stop-opacity=".6"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><linearGradient id="side-fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".08" stop-color="white" stop-opacity=".35"/><stop offset=".22" stop-color="white"/><stop offset=".78" stop-color="white"/><stop offset=".92" stop-color="white" stop-opacity=".35"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="portrait-fade"><rect width="1200" height="${cropHeight}" fill="url(#shirt-fade)"/></mask>${edges}</defs><g mask="url(#portrait-fade)">${pictures}</g></svg>`,
  ), "image/svg+xml");
}

function loadAssets() {
  return Promise.all([
    loadPlayerPortrait("messi"),
    loadPlayerPortrait("ronaldo"),
    readFile(join(process.cwd(), "public/images/brand/the-rivalry-mark.svg")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-400.woff")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-800.woff")),
    readFile(join(process.cwd(), "public/fonts/og/roboto-condensed-800.ttf")),
  ]);
}
let assets: ReturnType<typeof loadAssets> | undefined;

export async function renderSocialImage(
  theme: SocialImageTheme,
  { goals, asOf }: SocialImageData,
) {
  const [messi, ronaldo, mark, regular, bold, condensed] = await (assets ??=
    loadAssets().catch(error => {
      assets = undefined;
      throw error;
    }));
  const c = playerArtworkColors[theme];
  const dark = theme === "dark";
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${asOf}T00:00:00Z`));

  return new ImageResponse(
    <div style={{
      display: "flex", position: "relative", width, height, overflow: "hidden",
      fontFamily: "Inter", color: c.ink, background: c.canvas,
    }}>
      <div style={{
        display: "flex", position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(110deg,${c.messiTint} 0%,${c.canvas} 45%,${c.canvas} 55%,${c.ronaldoTint} 100%)`,
      }}/>
      {/* Original geometric artwork provides depth without extra photography. */}
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx="194" cy="305" r="196" fill={c.messi} opacity={dark ? 0.055 : 0.045}/>
        <circle cx="194" cy="305" r="217" fill="none" stroke={c.messi} strokeWidth="1" opacity="0.15"/>
        <circle cx="1006" cy="305" r="196" fill={c.ronaldo} opacity={dark ? 0.055 : 0.045}/>
        <circle cx="1006" cy="305" r="217" fill="none" stroke={c.ronaldo} strokeWidth="1" opacity="0.15"/>
        <path d="M48 89h1104" stroke={c.border} strokeWidth="1"/>
      </svg>

      <div style={{
        display: "flex", position: "absolute", left: 48, top: 30, right: 48,
        alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <img src={uri(mark, "image/svg+xml")} width={31} height={38} alt=""/>
          <span style={{ fontFamily: "Condensed", fontSize: 30, fontWeight: 800, letterSpacing: 0.4 }}>
            THE RIVALRY
          </span>
        </div>
        <span style={{ fontSize: 16, letterSpacing: 2, color: c.muted }}>
          GOALS. RECORDS. PERSPECTIVE.
        </span>
      </div>

      <img src={portraitLayer({ messi, ronaldo })} width={1200} height={350} alt=""
        style={{ position: "absolute", top: 111, left: 0 }}/>

      <div style={{
        display: "flex", position: "absolute", left: 370, top: 121, width: 460,
        flexDirection: "column", alignItems: "center",
      }}>
        <span style={{ fontFamily: "Condensed", fontSize: 105, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
          MESSI
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4, marginBottom: 7 }}>
          <span style={{ width: 45, height: 1, background: c.border }}/>
          <span style={{ fontSize: 19, color: c.muted }}>vs</span>
          <span style={{ width: 45, height: 1, background: c.border }}/>
        </div>
        <span style={{ fontFamily: "Condensed", fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
          RONALDO
        </span>
        <span style={{ fontSize: 16, color: c.muted, marginTop: 19 }}>
          Two careers. One comparison.
        </span>
      </div>

      <div style={{ display: "flex", position: "absolute", top: 404, left: 48, right: 48, gap: 20 }}>
        {players.map(player => {
          const value = goals[player].toLocaleString("en-US");
          const blue = player === "messi";
          return <div key={player} style={{
            display: "flex", position: "relative", width: 542, height: 146,
            overflow: "hidden", borderRadius: 22,
            border: `1px solid ${dark ? (blue ? "#507e995c" : "#a570765c") : (blue ? "#c9ddea" : "#e8d1cb")}`,
            backgroundImage: dark
              ? (blue ? "linear-gradient(125deg,#1c3544,#12212d)" : "linear-gradient(125deg,#402e37,#271b23)")
              : (blue ? "linear-gradient(125deg,#ffffff,#e7f2fc)" : "linear-gradient(125deg,#ffffff,#fbece5)"),
            boxShadow: dark ? "0 8px 20px #00000030" : "0 6px 14px #24364a0c",
            padding: "16px 28px", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", position: "absolute", top: 0, left: 28, height: 3, width: 90, background: c[player], borderRadius: 2 }}/>
            <div style={{ display: "flex", position: "absolute", top: 0, right: 0, width: 194, height: 146,
              backgroundImage: `linear-gradient(90deg,${dark ? "#ffffff00,#ffffff06" : "#ffffff00,#ffffff88"})`,
            }}/>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 13, letterSpacing: 1.6, color: c.muted }}>
                ALL-TIME CAREER
              </span>
              <span style={{ fontSize: 24, color: c.ink, fontWeight: 800, letterSpacing: -0.5 }}>
                {blue ? "Lionel Messi" : "Cristiano Ronaldo"}
              </span>
              <span style={{ fontSize: 15, color: c.muted }}>Club + international</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", width: 180, alignItems: "center", flexShrink: 0, gap: 3 }}>
              <span style={{
                fontFamily: "Condensed", fontSize: value.length > 4 ? 88 : 110,
                fontWeight: 800, lineHeight: 0.86, letterSpacing: -2, color: c[player],
              }}>
                {value}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.2, letterSpacing: 2, color: c[player] }}>
                GOALS
              </span>
            </div>
          </div>;
        })}
      </div>

      <div style={{
        display: "flex", position: "absolute", top: 560, left: 48, right: 48,
        justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 21, fontWeight: 800 }}>messivsronaldo17.com</span>
        <span style={{ fontSize: 16, color: c.muted }}>Stats as of {date}</span>
      </div>
      {renderPhotoCredit(c.muted, { compact: true, bottom: 6 })}
    </div>,
    {
      width, height,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60" },
      fonts: [
        { name: "Inter", data: regular, weight: 400 },
        { name: "Inter", data: bold, weight: 800 },
        { name: "Condensed", data: condensed, weight: 800 },
      ],
    },
  );
}
