/* eslint-disable @next/next/no-img-element -- ImageResponse renders local assets with Satori, not next/image. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import {
  imageFormats,
  imageLeader,
  imageValue,
  type StatImageRequest,
} from "./stat-image";

function loadAssets() {
  return Promise.all([
    readFile(
      join(
        process.cwd(),
        "public/images/transparent-argentina-portraits-fifa-world-cup-2026-removebg-preview.png",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "public/images/transparent-portugal-portraits-fifa-world-cup-2026-removebg-preview.png",
      ),
    ),
    readFile(join(process.cwd(), "public/images/brand/the-rivalry-mark.svg")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-400.woff")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-800.woff")),
    readFile(join(process.cwd(), "public/fonts/og/roboto-condensed-800.ttf")),
  ]);
}
let assets: ReturnType<typeof loadAssets> | undefined;
const dataUri = (data: Buffer, type = "image/png") =>
  `data:${type};base64,${data.toString("base64")}`;

// Compose portrait fades in SVG; light artwork keeps faces opaque.
function portraitLayer(
  messi: Buffer,
  ronaldo: Buffer,
  shown: readonly ("messi" | "ronaldo")[],
  height: number,
  theme: StatImageRequest["theme"],
  imageHeight = height,
) {
  const half = 1080 / shown.length;
  const pictures = shown
    .map((player, index) => {
      const h = imageHeight * (player === "messi" ? 1.45 : 2.48);
      const w = (h * (player === "messi" ? 384 : 396)) / 594;
      const left = index * half;
      return `<g clip-path="url(#crop${index})"><image href="${dataUri(player === "messi" ? messi : ronaldo)}" x="${left + (half - w) / 2}" y="${-imageHeight * (player === "messi" ? 0.03 : 0.1)}" width="${w}" height="${h}" mask="url(#sides${index})"/></g>`;
    })
    .join("");
  const defs = shown
    .map((player, index) => {
      const imageWidth =
        (imageHeight * (player === "messi" ? 1.45 * 384 : 2.48 * 396)) / 594;
      const maskWidth = Math.min(half, imageWidth);
      const maskLeft = index * half + (half - maskWidth) / 2;
      return `<clipPath id="crop${index}"><rect x="${index * half}" width="${half}" height="${height}"/></clipPath><mask id="sides${index}" maskUnits="userSpaceOnUse" x="${index * half}" y="0" width="${half}" height="${height}"><rect x="${maskLeft}" width="${maskWidth}" height="${height}" fill="url(#horizontal)"/></mask>`;
    })
    .join("");
  // A pale fade across the head or cheeks looks like glare on a light canvas.
  // Keep faces intact and blend only the bottom of the shirts in light mode.
  const verticalStops =
    theme === "light"
      ? '<stop stop-color="white"/><stop offset=".86" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>'
      : '<stop stop-color="white" stop-opacity="0"/><stop offset=".14" stop-color="white"/><stop offset=".64" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/>';
  // Only soften the cropped shirt edges on light artwork, well outside the faces.
  const sideFade = theme === "light" ? 0.04 : 0.19;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}"><defs><linearGradient id="vertical" x2="0" y2="1">${verticalStops}</linearGradient><linearGradient id="horizontal"><stop stop-color="white" stop-opacity="0"/><stop offset="${sideFade}" stop-color="white"/><stop offset="${1 - sideFade}" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="${height}"><rect width="1080" height="${height}" fill="url(#vertical)"/></mask>${defs}</defs><g mask="url(#fade)">${pictures}</g></svg>`;
  return dataUri(Buffer.from(svg), "image/svg+xml");
}

export async function renderStatImage({
  stat,
  format,
  players,
  theme,
}: StatImageRequest) {
  const [messi, ronaldo, mark, regular, bold, condensed] = await (assets ??=
    loadAssets().catch((error) => {
      assets = undefined;
      throw error;
    }));
  const { width, height } = imageFormats[format];
  const colors =
    theme === "light"
      ? {
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
        }
      : {
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
        };
  const both = players === "both";
  const shown = both ? (["messi", "ronaldo"] as const) : [players];
  const story = format === "story";
  const square = format === "square";
  const top = story ? 125 : 45;
  const portraitAreaHeight = story ? 860 : 630;
  const preferredFaceHeight = Math.round(
    portraitAreaHeight * 0.9 * (story ? 0.9 : 1),
  );
  const note = [stat.note, stat.lowerIsBetter ? "Lower is better." : ""]
    .filter(Boolean)
    .join(" ");
  const noteHeight = note ? Math.ceil(note.length / 87) * 25 + 10 : 0;
  const footerBottom = story ? 155 : 34;
  const playerStats = shown.map((player) => {
    const value = imageValue(stat, player);
    // Smaller square-format values leave more room for the portraits above them.
    const baseSize = Math.min(
      both ? 210 : 270,
      ((both ? 660 : 1200) / Math.max(3, value.length)) * 1.1,
    );
    return { player, value, baseSize, size: baseSize * (square ? 0.65 : 1) };
  });
  const nameHeight = 28;
  const valueGap = 12;
  const statsHeight =
    nameHeight + valueGap + Math.max(...playerStats.map(({ size }) => size));
  const statsTop = height - footerBottom - 83 - noteHeight - statsHeight;
  const title = stat.title.toUpperCase();
  const baseFontSize =
    title.length > 65
      ? 50
      : title.length > 38
        ? 64
        : title.length > 22
          ? 78
          : 104;
  const titleWidth = width - 120;
  const context = stat.context.toUpperCase();
  const contextFontSize = context.length > 80 ? 15 : 16;
  const contextSpacing = context.length > 80 ? 1.8 : 3.6;
  const contextHeight =
    Math.ceil(
      (context.length * (contextFontSize * 0.6 + contextSpacing)) / titleWidth,
    ) * 24;
  // Wrapped headings need a smaller scale to leave breathing room above the faces.
  const regularTitleSize =
    title.length * baseFontSize * 0.5 > titleWidth
      ? Math.round(baseFontSize * 0.75)
      : baseFontSize;
  const fontSize = square ? Math.min(regularTitleSize, 78) : regularTitleSize;
  const titleHeight = (size: number) =>
    Math.ceil((title.length * size * 0.5) / titleWidth) * size * 1.04;
  const headingTop = top + (square ? 75 : 105);
  const titleGap = square ? 10 : 18;
  const headingBottom = headingTop + contextHeight + titleGap + titleHeight(fontSize);
  const faceTop = square
    ? headingBottom + 16
    : Math.max(
        (story ? 450 : 340) + (portraitAreaHeight - preferredFaceHeight) / 2,
        headingBottom + 24,
      );
  // Reserve the name and value rows first so portraits always end above the names.
  const faceHeight = Math.min(
    preferredFaceHeight,
    statsTop - faceTop - 24,
  );
  let imageHeight = faceHeight;
  if (square) {
    // Slightly reduce the portrait scale so shirts remain visible in the square frame.
    const portraitHeadingBottom =
      45 + 105 + contextHeight + 18 + titleHeight(regularTitleSize);
    const portraitFaceTop = Math.max(
      340 + (portraitAreaHeight - preferredFaceHeight) / 2,
      portraitHeadingBottom + 24,
    );
    const portraitStatsTop =
      imageFormats.portrait.height - footerBottom - 83 - noteHeight -
      nameHeight - valueGap - Math.max(...playerStats.map(({ baseSize }) => baseSize));
    imageHeight =
      Math.min(preferredFaceHeight, portraitStatsTop - portraitFaceTop - 24) * 0.9;
  }
  const date = stat.date.split("-");
  const dateLabel = `${Number(date[2])} ${["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][Number(date[1]) - 1]} ${date[0]}`;
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width,
        height,
        position: "relative",
        overflow: "hidden",
        background: colors.canvas,
        color: colors.ink,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundImage: both
            ? `linear-gradient(90deg,${colors.messiTint} 0%,${colors.messiCenter} 48%,${colors.ronaldoCenter} 52%,${colors.ronaldoTint} 100%)`
            : `linear-gradient(90deg,${players === "messi" ? colors.messiTint : colors.ronaldoTint},${colors.canvas})`,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundImage: colors.veil,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top,
          left: 60,
          right: 60,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={dataUri(mark, "image/svg+xml")}
            width={42}
            height={48}
            alt=""
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11, letterSpacing: 3.6 }}>THE</span>
            <span
              style={{
                fontFamily: "Condensed",
                fontWeight: 800,
                fontSize: 33,
              }}
            >
              RIVALRY
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 635,
            textAlign: "right",
            fontSize: 20,
            lineHeight: 1.4,
            color: colors.muted,
          }}
        >
          {both
            ? "Messi vs Ronaldo"
            : players === "messi"
              ? "Lionel Messi"
              : "Cristiano Ronaldo"}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: headingTop,
          left: 60,
          right: 60,
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: contextFontSize,
            letterSpacing: contextSpacing,
            lineHeight: "24px",
            height: contextHeight,
            color: colors.muted,
          }}
        >
          {context}
        </span>
        <div
          style={{
            display: "flex",
            marginTop: titleGap,
            fontFamily: "Condensed",
            fontSize,
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </div>
      </div>
      <img
        src={portraitLayer(messi, ronaldo, shown, faceHeight, theme, imageHeight)}
        width={1080}
        height={faceHeight}
        alt=""
        style={{ position: "absolute", left: 0, top: faceTop }}
      />
      {both && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 512,
            top: faceTop + faceHeight * 0.5,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: colors.badge,
            border: `1px solid ${colors.badgeBorder}`,
            alignItems: "center",
            justifyContent: "center",
            color: colors.badgeText,
            fontSize: 16,
          }}
        >
          VS
        </div>
      )}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: statsTop,
          left: 0,
          right: 0,
        }}
      >
        {playerStats.map(({ player, value, size }) => {
          return (
            <div
              key={player}
              style={{
                display: "flex",
                width: both ? 540 : 1080,
                alignItems: "center",
                flexDirection: "column",
                color: colors[player],
              }}
            >
              <span
                style={{
                  fontSize: 21,
                  letterSpacing: 2.2,
                  lineHeight: `${nameHeight}px`,
                }}
              >
                {player === "messi" ? "LIONEL MESSI" : "CRISTIANO RONALDO"}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: valueGap,
                }}
              >
                <span
                  style={{
                    fontFamily: "Condensed",
                    fontWeight: 800,
                    fontSize: size,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </span>
                {both && imageLeader(stat, player) && (
                  <svg
                    width="29"
                    height="29"
                    viewBox="0 0 24 24"
                    style={{ alignSelf: "flex-start", marginTop: 20 }}
                  >
                    <path
                      fill="#dbb367"
                      stroke={colors.starOutline}
                      strokeWidth={theme === "light" ? 0.8 : 0}
                      d="m12 2 3 6.1 6.7 1-4.9 4.8 1.2 6.7-6-3.2-6 3.2 1.2-6.7L2.3 9.1l6.7-1z"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {note && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: footerBottom + 62,
            left: 60,
            right: 60,
            height: noteHeight,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 19,
            lineHeight: 1.3,
            color: colors.muted,
          }}
        >
          {note}
        </div>
      )}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: footerBottom,
          left: 60,
          right: 60,
          paddingTop: 22,
          borderTop: `1px solid ${colors.border}`,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 21, fontWeight: 800 }}>
          messivsronaldo17.com
        </span>
        <span style={{ fontSize: 16, color: colors.muted }}>
          AS OF {dateLabel}
        </span>
      </div>
    </div>,
    {
      width,
      height,
      fonts: [
        { name: "Inter", data: regular, weight: 400 },
        { name: "Inter", data: bold, weight: 800 },
        { name: "Condensed", data: condensed, weight: 800 },
      ],
    },
  );
}
