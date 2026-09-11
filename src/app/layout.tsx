import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
