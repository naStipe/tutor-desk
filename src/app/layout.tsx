import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TutorDesk",
  description:
    "Management SaaS for independent private tutors to manage students, schedules, lessons, homework, and invoicing.",
  openGraph: {
    title: "TutorDesk",
    description:
      "Management SaaS for independent private tutors to manage students, schedules, lessons, homework, and invoicing.",
    type: "website",
  },
};

const THEME_INIT_SCRIPT = `
try {
  var stored = localStorage.getItem("td-theme");
  var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme class before first paint to avoid a light/dark flash on load. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, non-user-controlled inline script */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
