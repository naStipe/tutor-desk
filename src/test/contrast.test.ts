import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the key semantic token pairs from src/app/globals.css against dropping below WCAG AA.

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function readVars(selector: string) {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf("\n}", start);
  const vars: Record<string, string> = {};
  for (const match of css.slice(start, end).matchAll(/--(td2-[\w-]+):\s*([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

const light = readVars(":root");
const themes = { light, dark: { ...light, ...readVars(".dark") } };

function color(theme: Record<string, string>, name: string): [number, number, number] {
  let value = theme[`td2-${name}`];
  while (value?.startsWith("var(")) value = theme[value.slice(6, -1)];
  const hex = value.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: [number, number, number], b: [number, number, number]) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const backgrounds = ["bg-page", "bg-card", "bg-inset"];
const textOnBackground = ["text-primary", "text-secondary", "text-muted", "text-faint"];
const accents = ["brand", "cyan", "violet", "danger", "warning"];

describe.each(Object.entries(themes))("%s theme contrast", (_name, theme) => {
  it("body text tokens meet 4.5:1 on every background", () => {
    for (const text of textOnBackground) {
      for (const bg of backgrounds) {
        expect(
          ratio(color(theme, text), color(theme, bg)),
          `${text} on ${bg}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("accent text meets 4.5:1 on card and page backgrounds", () => {
    for (const accent of accents) {
      for (const bg of ["bg-card", "bg-page"]) {
        expect(
          ratio(color(theme, accent), color(theme, bg)),
          `${accent} on ${bg}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("on-* text meets 4.5:1 on its solid accent", () => {
    for (const accent of accents) {
      expect(
        ratio(color(theme, `on-${accent}`), color(theme, accent)),
        `on-${accent}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
