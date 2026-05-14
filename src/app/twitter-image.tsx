import { ImageResponse } from "next/og";

export const alt = "ADORA Basketball Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 72,
        color: "#ffffff",
        background: "linear-gradient(135deg, #120B2C 0%, #1D0E3A 55%, #CCFF00 160%)",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, textTransform: "uppercase", color: "#CCFF00" }}>ADORA Basketball Club</div>
      <div style={{ marginTop: 22, fontSize: 76, lineHeight: 0.96, fontWeight: 900, letterSpacing: -2, maxWidth: 900 }}>Bina karakter, kejar prestasi.</div>
      <div style={{ marginTop: 20, fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.84)", maxWidth: 860 }}>Klub basket anak dan remaja di Depok dengan program latihan modern dan jalur kompetisi resmi.</div>
      <div style={{ marginTop: 42, fontSize: 24, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }}>adorabbc.com</div>
    </div>,
    {
      ...size,
    },
  );
}
