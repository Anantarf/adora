import { ImageResponse } from "next/og";

export const alt = "ADORA Basketball Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        color: "#ffffff",
        background: "linear-gradient(135deg, #120B2C 0%, #27104F 35%, #F68B1E 100%)",
        position: "relative",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at top right, rgba(204, 255, 0, 0.24), transparent 30%), radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.14), transparent 28%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 24,
            background: "#CCFF00",
            color: "#111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 900,
            letterSpacing: 1,
            boxShadow: "10px 10px 0px rgba(0,0,0,0.28)",
          }}
        >
          AD
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 6, textTransform: "uppercase" }}>ADORA Basketball Club</div>
          <div style={{ marginTop: 8, fontSize: 16, color: "rgba(255,255,255,0.82)", letterSpacing: 2, textTransform: "uppercase" }}>Akademi Basket Profesional di Depok</div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 74, lineHeight: 0.95, fontWeight: 900, letterSpacing: -2 }}>
          Membangun karakter.
          <br />
          Meraih prestasi.
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.88)" }}>Program usia 7-16 tahun, pembinaan modern, dan jalur kompetisi untuk pemain muda.</div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ padding: "14px 20px", border: "2px solid rgba(255,255,255,0.18)", borderRadius: 999, background: "rgba(0,0,0,0.24)", fontSize: 22, fontWeight: 700 }}>KU-8 s.d. KU-16</div>
          <div style={{ padding: "14px 20px", border: "2px solid rgba(255,255,255,0.18)", borderRadius: 999, background: "rgba(0,0,0,0.24)", fontSize: 22, fontWeight: 700 }}>Depok, Jawa Barat</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }}>adorabbc.com</div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
