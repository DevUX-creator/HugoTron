import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Contrast invariants for the colour tokens.
 *
 * theme.css carries comments asserting specific ratios — that `ink-600` was
 * darkened to clear 4.5:1 on the surface ground, that tertiary text is NOT
 * permitted on `muted`. Those claims are only worth writing down if something
 * checks them, otherwise the next person to regenerate the ramps silently
 * breaks them.
 *
 * Regenerate the ramps with `python3 scripts/palette.py` if an anchor changes.
 */

const theme = readFileSync(new URL("../src/styles/theme.css", import.meta.url), "utf8");

/** Every `--color-<name>-<step>: #rrggbb;` declaration in the ramps. */
function token(name: string): string {
  const match = theme.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6});`, "i"));
  if (!match) throw new Error(`Token --color-${name} not found in theme.css`);
  return match[1]!;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;

describe("colour tokens", () => {
  it("pins the brand navy to harbor-800", () => {
    /* Sampled from the HUGO TRON logo — 89% of its pixels. NOT #00294d, which
       is the Händlerbund badge in the footer and was the original mistake. */
    expect(token("harbor-800")).toBe("#053c74");
  });

  describe("text on the light grounds clears AA", () => {
    const grounds = { base: token("linen-100"), surface: token("linen-50") };

    for (const [groundName, ground] of Object.entries(grounds)) {
      for (const fg of ["ink-900", "ink-700", "ink-600", "harbor-800", "saffron-600"]) {
        it(`${fg} on bg-${groundName}`, () => {
          expect(contrast(token(fg), ground)).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    }
  });

  it("documents that fg-tertiary does NOT clear AA on bg-muted", () => {
    /* Deliberate, and the reason the rule "no tertiary text on a muted
       surface" exists. If a future ramp makes this pass, the limitation is
       gone and the note in theme.css should be deleted — so this asserts the
       state the comment describes rather than silently drifting from it. */
    expect(contrast(token("ink-600"), token("linen-200"))).toBeLessThan(AA_NORMAL);
  });

  describe("inverse sections clear AA on harbor-900", () => {
    const inverse = token("harbor-900");

    for (const fg of ["linen-50", "harbor-200", "harbor-300", "sand-300"]) {
      it(`${fg} on bg-inverse`, () => {
        expect(contrast(token(fg), inverse)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  });

  it("keeps the primary button label legible on its own fill", () => {
    expect(contrast(token("linen-50"), token("saffron-600"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("keeps the announcement chip label legible on its fill", () => {
    expect(contrast(token("ink-900"), token("sand-300"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe("theme hygiene", () => {
  it("declares every ramp step referenced by a semantic alias", () => {
    const aliases = [
      ...theme.matchAll(/--color-(?:bg|fg|accent|border|ring)[\w-]*:\s*var\(--color-([\w-]+)\)/g),
    ];
    expect(aliases.length).toBeGreaterThan(10);

    for (const [, ref] of aliases) {
      expect(theme).toContain(`--color-${ref}:`);
    }
  });

  it("keeps the vertical rhythm tiers in ascending order", () => {
    /* --gap-block < --gap-section-header < --gap-section is a hard rule in
       theme.css; inverting them silently wrecks every section's spacing. */
    const order = ["--gap-block", "--gap-section-header", "--gap-section"];
    const positions = order.map((name) => theme.indexOf(`${name}:`));
    expect(positions.every((p) => p > -1)).toBe(true);

    const maxima = order.map((name) => {
      const decl = theme.match(new RegExp(`${name}:\\s*clamp\\([^)]*?([\\d.]+)rem\\s*\\)`));
      return Number(decl?.[1] ?? 0);
    });
    expect(maxima[0]).toBeLessThan(maxima[1]!);
    expect(maxima[1]).toBeLessThan(maxima[2]!);
  });
});

describe("no CSS references a colour token that does not exist", () => {
  /**
   * This catches the class of bug that made the primary button invisible and
   * `<Section inverse>` inert: CSS ported from the reference project kept
   * referring to ITS ramps (`--color-hunter-900`, `--color-accent-gold`).
   *
   * `var(--missing)` is not an error — it resolves to nothing, so the whole
   * declaration is dropped and the element renders transparent. Nothing else
   * in the toolchain notices, which is exactly why it needs a test.
   *
   * Only bare `var(--color-x)` is checked. `var(--color-x, fallback)` is the
   * deliberate override hook — button.css reads `--color-btn-alt` and hero.css
   * sets it — and a fallback means a missing token degrades rather than
   * disappears.
   */
  const files = globSync("../src/**/*.css", { cwd: new URL(".", import.meta.url) });

  const declared = new Set([...theme.matchAll(/(--color-[\w-]+):/g)].map(([, name]) => name));

  it("finds the stylesheets and the tokens", () => {
    expect(files.length).toBeGreaterThan(5);
    expect(declared.size).toBeGreaterThan(50);
  });

  for (const file of files) {
    it(file, () => {
      const css = readFileSync(new URL(file, import.meta.url), "utf8");

      /* `var(--color-x)` with no comma before the closing paren. */
      const bare = [...css.matchAll(/var\(\s*(--color-[\w-]+)\s*\)/g)].map(([, name]) => name);
      const local = new Set([...css.matchAll(/(--color-[\w-]+):/g)].map(([, name]) => name));

      const dangling = [...new Set(bare)].filter((name) => !declared.has(name) && !local.has(name));

      expect(dangling).toEqual([]);
    });
  }
});
