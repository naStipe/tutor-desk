import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DesignLabNav } from "../../features/design-lab/components/DesignLabNav";

export const metadata: Metadata = {
  title: "TutorDesk Design Lab",
  description: "Exploratory visual directions for the TutorDesk dashboard.",
};

export default function MockupsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DesignLabNav />
    </>
  );
}
