import type { MetadataRoute } from "next";

// Colors match the light-theme canvas token in globals.css (`--td2-bg-page`) and the light
// `themeColor` in layout.tsx; the splash/background uses it too so launch has no color flash.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TutorDesk",
    short_name: "TutorDesk",
    description: "Students, schedule, lessons and homework for independent tutors.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ecede8",
    theme_color: "#ecede8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
