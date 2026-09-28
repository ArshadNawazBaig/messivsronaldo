/* eslint-disable @next/next/no-img-element -- Shared branding for server-rendered PNGs. */
export const statImagePlayerNameStyle = {
  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: 21,
  letterSpacing: 2.2,
  lineHeight: "28px",
} as const;

export function renderStatImageBrand(mark: string) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <img src={mark} width={42} height={48} alt="" />
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 11, letterSpacing: 3.6 }}>THE</span>
      <span style={{ fontFamily: "Condensed", fontWeight: 800, fontSize: 33 }}>RIVALRY</span>
    </div>
  </div>;
}
