import { ImageResponse } from "next/og";

export const alt = "TutorDesk: run your tutoring business from one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Flat brand card used for link previews on every public page.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#155f3f",
        color: "#ecede8",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>TutorDesk</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
          Run your tutoring business from one place.
        </div>
        <div style={{ fontSize: 34, opacity: 0.85 }}>
          Scheduling, homework and payments for private tutors.
        </div>
      </div>
    </div>,
    size,
  );
}
