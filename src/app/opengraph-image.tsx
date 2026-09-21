import { ImageResponse } from "next/og";
export const alt = "The Rivalry: Messi vs Ronaldo. Goals, assists and trophies. Statistics updated September 2026.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ background: "#f7f6f2", color: "#1c2921", width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "70px 80px", fontFamily: "sans-serif" }}><div style={{ color: "#28563d", fontSize: 22, letterSpacing: 4, display: "flex" }}>THE RIVALRY.</div><div style={{ fontSize: 77, letterSpacing: -4, display: "flex", marginTop: 60 }}><span style={{ color: "#216581" }}>Messi</span><span style={{ color: "#627066", margin: "0 27px" }}>vs</span><span style={{ color: "#a84432" }}>Ronaldo</span></div><div style={{ fontSize: 31, color: "#536058", display: "flex", marginTop: 25 }}>Career goals. Assists. Trophies.</div><div style={{ fontSize: 20, color: "#536058", display: "flex", marginTop: "auto", borderTop: "1px solid #ced2c8", paddingTop: 25 }}>Independent football statistics · Updated September 2026</div></div>, size);
}
