/* eslint-disable @next/next/no-img-element -- ImageResponse renders embedded image bytes, not browser images. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { socialImageAlt } from "@/lib/social-image";

export const alt = socialImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const covers = [
  { id: "messi", first: "Lionel", last: "Messi", country: "ARGENTINA", number: "10", role: "THE PLAYMAKER", ink: "#142c39", edge: "#2b4b5b", accent: "#83cff5", height: 653, top: -14, sourceWidth: 384 },
  { id: "ronaldo", first: "Cristiano", last: "Ronaldo", country: "PORTUGAL", number: "7", role: "THE GOAL MACHINE", ink: "#302329", edge: "#50373e", accent: "#eda29a", height: 1116, top: -45, sourceWidth: 396 },
] as const;

export default async function OpenGraphImage() {
  // Local assets keep the social preview independent of API/database availability.
  const [messi, ronaldo, regular, bold, mark] = await Promise.all([
    readFile(join(process.cwd(), "public/images/argentina-portraits-fifa-world-cup-2026.jpg")),
    readFile(join(process.cwd(), "public/images/portugal-portraits-fifa-world-cup-2026.jpg")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-400.woff")),
    readFile(join(process.cwd(), "public/fonts/og/inter-latin-800.woff")),
    readFile(join(process.cwd(), "public/images/brand/the-rivalry-mark.svg")),
  ]);
  const portraits = { messi, ronaldo };

  return new ImageResponse(
    <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: "#0b1016", color: "#f6f6f7", fontFamily: "Inter", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "25px 38px", height: 90 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src={`data:image/svg+xml;base64,${mark.toString("base64")}`} width={39} height={39} alt="" />
          <div style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>THE RIVALRY</div>
        </div>
        <div style={{ display: "flex", fontSize: 19, color: "#aab6c1", letterSpacing: 1 }}>TWO CAREERS. EVERY CHAPTER.</div>
      </div>

      <div style={{ display: "flex", position: "relative", margin: "0 24px", gap: 24 }}>
        {covers.map(player => {
          const width = player.height * player.sourceWidth / 594;
          return <div key={player.id} style={{ display: "flex", position: "relative", width: 564, height: 450, overflow: "hidden", borderRadius: 18, border: `1px solid ${player.edge}`, background: player.ink }}>
            <img src={`data:image/jpeg;base64,${portraits[player.id].toString("base64")}`} width={width} height={player.height} alt="" style={{ position: "absolute", left: 425 - width / 2, top: player.top }} />
            <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(90deg, ${player.ink} 40%, ${player.ink}00 90%)` }} />
            <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: "100%", height: "100%", backgroundImage: `linear-gradient(0deg, ${player.ink} 0%, ${player.ink}00 62%)` }} />
            <div style={{ display: "flex", position: "absolute", top: 31, left: 32, alignItems: "center", gap: 10 }}>
              {player.id === "messi" ? <svg width="25" height="17" viewBox="0 0 25 17"><rect width="25" height="17" rx="2" fill="#7fb8db" /><path fill="#f3f3e9" d="M0 5.7h25v5.6H0z" /><circle cx="12.5" cy="8.5" r="2" fill="#bf9e30" /></svg> : <svg width="25" height="17" viewBox="0 0 25 17"><rect width="25" height="17" rx="2" fill="#bb3945" /><path fill="#2b7250" d="M2 0h8v17H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2" /><circle cx="10" cy="8.5" r="3" fill="#edd585" /></svg>}
              <div style={{ display: "flex", fontSize: 16, letterSpacing: 2, color: "#c5d0d7" }}>{player.country}</div>
            </div>
            <div style={{ display: "flex", position: "absolute", left: 32, top: 115, flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 27, letterSpacing: -0.6 }}>{player.first}</div>
              <div style={{ display: "flex", fontSize: player.id === "messi" ? 76 : 67, fontWeight: 800, letterSpacing: -3, lineHeight: 1.12, marginTop: 6 }}>{player.last}<span style={{ color: player.accent }}>.</span></div>
            </div>
            <div style={{ display: "flex", position: "absolute", left: 32, bottom: 34, flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", width: 42, height: 3, background: player.accent, marginBottom: 3 }} />
              <div style={{ display: "flex", fontSize: 17, fontWeight: 800, letterSpacing: 1.4, color: player.accent }}>{player.role}</div>
              <div style={{ display: "flex", fontSize: 16, color: "#bac6cf" }}>NO. {player.number}</div>
            </div>
          </div>;
        })}
        <div style={{ display: "flex", position: "absolute", left: 536, top: 184, width: 80, height: 80, alignItems: "center", justifyContent: "center", borderRadius: 40, border: "8px solid #0b1016", background: "#19242e", color: "#e0e5eb", fontSize: 23, fontWeight: 800 }}>VS</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 90, padding: "0 38px" }}>
        <div style={{ display: "flex", fontSize: 23, color: "#d3dbe2", letterSpacing: -0.4 }}>Goals. Assists. Trophies.</div>
        <div style={{ display: "flex", fontSize: 19, color: "#9eacb8" }}>messivsronaldo17.com</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Inter", data: regular, weight: 400, style: "normal" }, { name: "Inter", data: bold, weight: 800, style: "normal" }] },
  );
}
