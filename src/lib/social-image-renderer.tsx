/* eslint-disable @next/next/no-img-element -- ImageResponse uses embedded assets, not next/image. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  playerArtworkColors,
  transparentPlayerPortraits,
} from "./player-artwork";

type Player = "messi" | "ronaldo";
type SocialImageData = { goals: Record<Player, number>; asOf: string };
export type SocialImageTheme = keyof typeof playerArtworkColors;

// The approved landscape design shares the admin export palette and portraits.
const width = 1200,
  height = 630;
const uri = (buffer: Buffer, type = "image/png") =>
  `data:${type};base64,${buffer.toString("base64")}`;
function portraits(images: Record<"messi" | "ronaldo", Buffer>) {
  const cropHeight = 452,
    imageHeight = 450;
  const pictures = (["messi", "ronaldo"] as const)
    .map((player, index) => {
      const h = imageHeight * (player === "messi" ? 1.45 : 2.48),
        w = (h * transparentPlayerPortraits[player].width) / 594;
      const center = index === 0 ? 180 : 1020;
      return `<g clip-path="url(#clip${index})"><image href="${uri(images[player])}" x="${center - w / 2}" y="${-imageHeight * (player === "messi" ? 0.03 : 0.1)}" width="${w}" height="${h}" mask="url(#side${index})"/></g>`;
    })
    .join("");
  const masks = [0, 810]
    .map(
      (left, index) =>
        `<clipPath id="clip${index}"><rect x="${left}" width="390" height="${cropHeight}"/></clipPath><mask id="side${index}" maskUnits="userSpaceOnUse" x="${left}" y="0" width="390" height="${cropHeight}"><rect x="${left}" width="390" height="${cropHeight}" fill="url(#sides)"/></mask>`,
    )
    .join("");
  return uri(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${cropHeight}" viewBox="0 0 1200 ${cropHeight}"><defs><linearGradient id="vertical" x2="0" y2="1"><stop stop-color="white"/><stop offset=".82" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><linearGradient id="sides"><stop stop-color="white" stop-opacity="0"/><stop offset=".04" stop-color="white"/><stop offset=".96" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="fade"><rect width="1200" height="${cropHeight}" fill="url(#vertical)"/></mask>${masks}</defs><g mask="url(#fade)">${pictures}</g></svg>`,
    ),
    "image/svg+xml",
  );
}
function loadAssets() {
  return Promise.all([
    readFile(
      join(process.cwd(), `public${transparentPlayerPortraits.messi.src}`),
    ),
    readFile(
      join(process.cwd(), `public${transparentPlayerPortraits.ronaldo.src}`),
    ),
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
    loadAssets().catch((error) => {
      assets = undefined;
      throw error;
    }));
  const photo = portraits({ messi, ronaldo });
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${asOf}T00:00:00Z`))
    .toUpperCase();
  const c = playerArtworkColors[theme];
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        overflow: "hidden",
        fontFamily: "Inter",
        background: c.canvas,
        color: c.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          backgroundImage: `linear-gradient(90deg,${c.messiTint} 0%,${c.messiCenter} 42%,${c.ronaldoCenter} 58%,${c.ronaldoTint} 100%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          backgroundImage: c.veil,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 28,
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <img src={uri(mark, "image/svg+xml")} width={34} height={40} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 8, letterSpacing: 3.2 }}>THE</span>
          <span
            style={{
              fontFamily: "Condensed",
              fontWeight: 800,
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            RIVALRY
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 50,
          left: 46,
          width: 283,
          justifyContent: "space-between",
          color: c.messi,
          fontSize: 13,
          letterSpacing: 2,
        }}
      >
        <span>ARGENTINA</span>
        <span style={{ letterSpacing: 0 }}>NO. 10</span>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 50,
          right: 46,
          width: 283,
          justifyContent: "space-between",
          color: c.ronaldo,
          fontSize: 13,
          letterSpacing: 2,
        }}
      >
        <span>PORTUGAL</span>
        <span style={{ letterSpacing: 0 }}>NO. 7</span>
      </div>
      <img
        src={photo}
        width={1200}
        height={452}
        alt=""
        style={{ position: "absolute", left: 0, top: 96 }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 119,
          left: 380,
          width: 440,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Condensed",
            fontWeight: 800,
            fontSize: 99,
            letterSpacing: -2,
            lineHeight: 1,
            color: c.messi,
          }}
        >
          MESSI
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 15,
            marginTop: 7,
            marginBottom: 11,
          }}
        >
          <span style={{ width: 44, height: 1, background: c.border }} />
          <span style={{ fontSize: 17, color: c.muted }}>VS</span>
          <span style={{ width: 44, height: 1, background: c.border }} />
        </div>
        <span
          style={{
            fontFamily: "Condensed",
            fontWeight: 800,
            fontSize: 90,
            letterSpacing: -2,
            lineHeight: 1,
            color: c.ronaldo,
          }}
        >
          RONALDO
        </span>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 371,
          left: 410,
          width: 380,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.2 }}>
          CAREER GOALS
        </span>
        <div
          style={{
            display: "flex",
            width: "100%",
            marginTop: 14,
            alignItems: "center",
          }}
        >
          {(["messi", "ronaldo"] as const).map((player, index) => (
            <div
              key={player}
              style={{
                display: "flex",
                position: "relative",
                width: 190,
                justifyContent: "center",
                alignItems: "center",
                borderLeft: index === 1 ? `1px solid ${c.border}` : "none",
                color: c[player],
              }}
            >
              <span
                style={{
                  fontFamily: "Condensed",
                  fontWeight: 800,
                  fontSize: 82,
                  lineHeight: 1,
                  letterSpacing: -1.5,
                }}
              >
                {goals[player]}
              </span>
              {goals[player] >=
                goals[player === "messi" ? "ronaldo" : "messi"] && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  style={{ position: "absolute", top: 8, right: 13 }}
                >
                  <path
                    fill="#dbb367"
                    stroke={c.starOutline}
                    strokeWidth={theme === "light" ? 0.8 : 0}
                    d="m12 2 3 6.1 6.7 1-4.9 4.8 1.2 6.7-6-3.2-6 3.2 1.2-6.7L2.3 9.1l6.7-1z"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: c.muted, marginTop: 12 }}>
          Club + country
        </span>
      </div>
      {(["messi", "ronaldo"] as const).map((player, index) => (
        <div
          key={player}
          style={{
            display: "flex",
            position: "absolute",
            top: 535,
            left: index === 0 ? 42 : 842,
            width: 316,
            justifyContent: "center",
            fontSize: 13,
            letterSpacing: 1.8,
            color: c[player],
          }}
        >
          {player === "messi" ? "LIONEL MESSI" : "CRISTIANO RONALDO"}
        </div>
      ))}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 23,
          left: 46,
          right: 46,
          borderTop: `1px solid ${c.border}`,
          paddingTop: 16,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: c.muted }}>
          GOALS · ASSISTS · TROPHIES
        </span>
        <span style={{ fontSize: 17, fontWeight: 800 }}>
          messivsronaldo17.com
        </span>
        <span style={{ fontSize: 12, color: c.muted }}>AS OF {date}</span>
      </div>
    </div>,
    {
      width,
      height,
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
      },
      fonts: [
        { name: "Inter", data: regular, weight: 400 },
        { name: "Inter", data: bold, weight: 800 },
        { name: "Condensed", data: condensed, weight: 800 },
      ],
    },
  );
}
