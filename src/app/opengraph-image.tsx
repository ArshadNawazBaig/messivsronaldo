import { ImageResponse } from "next/og";
export const alt = "The Rivalry: Messi vs Ronaldo. Two legends. Every angle. Statistics updated September 2026.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ background: "#0b0f16", color: "#f0f1f3", width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "70px 80px", fontFamily: "sans-serif" }}><div style={{ color: "#d2ec8c", fontSize: 22, letterSpacing: 4, display: "flex" }}>THE RIVALRY.</div><div style={{ fontSize: 77, letterSpacing: -4, display: "flex", marginTop: 60 }}><span style={{ color: "#83cff5" }}>Messi</span><span style={{ color: "#778393", margin: "0 27px" }}>vs</span><span style={{ color: "#eda29a" }}>Ronaldo.</span></div><div style={{ fontSize: 31, color: "#a5adba", display: "flex", marginTop: 25 }}>The greatest debate. A clearer perspective.</div><div style={{ fontSize: 20, color: "#a5adba", display: "flex", marginTop: "auto", borderTop: "1px solid #27303d", paddingTop: 25 }}>Sourced comparisons · Updated September 2026</div></div>, size);
}
