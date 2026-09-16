"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./mockups.module.css";

const concepts = [
  { href: "/mockups/linen", label: "01 · Linen" },
  { href: "/mockups/orbit", label: "02 · Orbit" },
];

export function DesignLabNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.labNav} aria-label="Design concepts">
      <span className={styles.labLabel}>TutorDesk design lab</span>
      <span className={styles.labDivider} aria-hidden="true" />
      {concepts.map((concept) => (
        <Link
          key={concept.href}
          href={concept.href}
          className={pathname === concept.href ? styles.labLinkActive : styles.labLink}
          aria-current={pathname === concept.href ? "page" : undefined}
        >
          {concept.label}
        </Link>
      ))}
      <span className={styles.labDivider} aria-hidden="true" />
      <Link href="/" className={styles.labExit}>
        Exit preview
      </Link>
    </nav>
  );
}
