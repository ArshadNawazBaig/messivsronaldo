import React from "react";
import { ImageResponse } from "next/og";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Original editorial graphics. Regenerate when the cited article snapshot changes.
const directory = join(process.cwd(), "public/images/articles");
const paper = "#f5f3ed", ink = "#18271f", muted = "#647067", gold = "#74941d";
const blue = "#85d2ed", coral = "#eeaaa0";

function Brand() {
  return <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <svg width="36" height="38" viewBox="0 0 36 38"><path d="M0 33 11 4h6L6 33zm12 5L26 0h6L18 38zm13-9 8-22h6l-8 22z" fill={gold}/></svg>
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}><span style={{ fontSize: 12, letterSpacing: 3 }}>THE</span><span style={{ fontFamily: "Condensed", fontSize: 28 }}>RIVALRY</span></div>
  </div>;
}
function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "36px 48px 28px", background: paper, color: ink, fontFamily: "Inter" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 22, borderBottom: "1px solid #cbd1c5" }}><Brand/><span style={{ color: muted, fontSize: 15, letterSpacing: 2 }}>{label}</span></div>
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>{children}</div>
    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd1c5", paddingTop: 16, fontSize: 14, color: muted }}><span>MESSIVSRONALDO17.COM</span><span>REVIEWED 27 SEPTEMBER 2026</span></div>
  </div>;
}
function Heading({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "Condensed", fontSize: 62, marginTop: 20, marginBottom: 16, lineHeight: 1.04 }}>{children}</div>;
}
function Tile({ name, value, label, context, color }: { name: string; value: string; label: string; context: string; color: string }) {
  return <div style={{ display: "flex", flex: 1, flexDirection: "column", background: "#14242a", borderRadius: 14, padding: "22px 20px", color: "#fff", borderTop: `4px solid ${color}` }}>
    <span style={{ fontFamily: "Condensed", fontSize: 28 }}>{name}</span>
    <span style={{ fontFamily: "Condensed", fontSize: 64, color, margin: "12px 0 6px" }}>{value}</span>
    <span style={{ fontSize: 14, letterSpacing: 1 }}>{label}</span><span style={{ fontSize: 13, color: "#b5c5c8", marginTop: 8 }}>{context}</span>
  </div>;
}
const graphics = [
  { name: "ballon-dor-2026-contenders", element: <Frame label="THE CONTENDERS / 2026"><Heading>THE BALLON D’OR DEBATE</Heading><div style={{ display: "flex", gap: 14 }}>
    <Tile name="HARRY KANE" value="61" label="CLUB GOALS" context="All competitions · 2025/26" color={blue}/>
    <Tile name="KYLIAN MBAPPÉ" value="42" label="CLUB GOALS" context="All competitions · 2025/26" color={coral}/>
    <Tile name="KVARATSKHELIA" value="10 + 6" label="GOALS + ASSISTS" context="Champions League · 2025/26" color="#d6dea7"/>
    <Tile name="LAMINE YAMAL" value="16 + 11" label="GOALS + ASSISTS" context="La Liga · 2025/26" color="#dbc6ee"/>
  </div><span style={{ fontSize: 17, color: muted, marginTop: 20 }}>Different competitions. Clear context. An analysis of selected nominees.</span></Frame> },
  { name: "kane-vs-mbappe-2026", element: <Frame label="CLUB SEASON / 2025–26"><Heading>KANE vs MBAPPÉ</Heading><div style={{ display: "flex", gap: 20 }}>
    {[{name:"HARRY KANE",goals:61,games:51,color:blue,bg:"#152f3b"},{name:"KYLIAN MBAPPÉ",goals:42,games:44,color:coral,bg:"#372529"}].map(p=><div key={p.name} style={{display:"flex",flex:1,position:"relative",flexDirection:"column",padding:"20px 28px",borderRadius:14,background:p.bg,color:"white"}}><span style={{fontSize:17,letterSpacing:2}}>{p.name}</span><div style={{display:"flex",alignItems:"center",gap:18}}><span style={{fontFamily:"Condensed",fontSize:110,color:p.color,lineHeight:1.15}}>{p.goals}</span><span style={{fontSize:16}}>CLUB GOALS</span></div><span style={{fontSize:15,color:"#cbd1d2"}}>{p.games} appearances · All club competitions</span></div>)}
  </div><div style={{display:"flex",justifyContent:"space-between",marginTop:18,fontSize:18}}><span>Champions League goals</span><span>Kane 14 · Mbappé 15</span></div></Frame> },
  { name: "ballon-dor-2026-guide", element: <Frame label="AWARD GUIDE / 2026"><Heading>BALLON D’OR 2026</Heading><div style={{display:"flex",gap:32,alignItems:"center"}}><div style={{display:"flex",flexDirection:"column",width:280,background:ink,color:paper,borderRadius:14,padding:"14px 26px 22px"}}><span style={{fontFamily:"Condensed",fontSize:144,lineHeight:1,color:"#d6dea7"}}>26</span><span style={{fontSize:23,letterSpacing:4}}>OCTOBER</span></div><div style={{display:"flex",flexDirection:"column",gap:16,flex:1}}><span style={{fontFamily:"Condensed",fontSize:40}}>LONDON PALLADIUM THEATRE</span><span style={{fontSize:16,color:muted,letterSpacing:2}}>THE JUDGING WINDOW</span><span style={{fontSize:27}}>3 AUG 2025 — 19 JUL 2026</span><span style={{fontSize:18,color:muted}}>Dates. Journalists’ votes. World Cup context.</span></div></div></Frame> },
];
async function main() {
  await mkdir(directory, { recursive: true });
  const fonts = [
    { name: "Inter", data: await readFile("public/fonts/og/inter-latin-400.woff"), weight: 400 as const },
    { name: "Condensed", data: await readFile("public/fonts/og/roboto-condensed-800.ttf"), weight: 800 as const },
  ];
  for (const graphic of graphics) {
    const response = new ImageResponse(graphic.element, { width: 1200, height: 630, fonts });
    await writeFile(join(directory, `${graphic.name}.png`), Buffer.from(await response.arrayBuffer()));
    console.log(`Generated ${graphic.name}.png`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
