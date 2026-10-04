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
  /* Accepts the 3-digit form too — stylelint shortens #ffffff to #fff. */
  const match = theme.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{3,6});`, "i"));
  if (!match) throw new Error(`Token --color-${name} not found in theme.css`);
  const hex = match[1]!;
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
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
  it("pins the brand blue to harbor-800", () => {
    /* Sampled from the brand-blue reference board. NOT the logo's
       own #053c74 — same lightness, two-thirds the chroma, flat at panel
       scale. And not #00294d, the Händlerbund badge, which was the first
       mistake in this file's history. */
    expect(token("harbor-800")).toBe("#00348d");
  });

  describe("text on the light grounds clears AA", () => {
    const grounds = { base: token("paper-50"), surface: token("paper-100") };

    for (const [groundName, ground] of Object.entries(grounds)) {
      for (const fg of ["ink-900", "ink-700", "ink-600", "harbor-800", "harbor-600"]) {
        it(`${fg} on bg-${groundName}`, () => {
          expect(contrast(token(fg), ground)).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    }
  });

  /* THE LIVE THEME IS THE DARK ONE (concept v2). The light-ground block above
     still holds — those pairs remain true of the ramps and the `inverse`
     section class puts them back on screen — but these are the pairs the page
     is actually painted with, so they are the ones that must not drift. */
  describe("text on the dark grounds clears AA", () => {
    const grounds = { base: token("ink-900"), surface: token("ink-800") };

    for (const [groundName, ground] of Object.entries(grounds)) {
      for (const fg of ["ink-50", "ink-100", "ink-200", "ink-300"]) {
        it(`${fg} on bg-${groundName}`, () => {
          expect(contrast(token(fg), ground)).toBeGreaterThanOrEqual(AA_NORMAL);
        });
      }
    }
  });

  it("brightens rather than dims for emphasis on the dark ground", () => {
    /* `accent-strong` is ink-50 and `fg-heading` is ink-100. A hover has to
       move UP the ramp here, which is the opposite of what the same token did
       on paper — assert the direction, not just the ratio. */
    expect(contrast(token("ink-50"), token("ink-900"))).toBeGreaterThan(
      contrast(token("ink-100"), token("ink-900")),
    );
  });

  it("keeps the focus ring unmistakable on the dark ground", () => {
    /* It is the one place a saturated colour earns its keep. */
    expect(contrast(token("lime-100"), token("ink-900"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("documents that fg-tertiary does NOT clear AA on bg-muted", () => {
    /* Deliberate, and the reason the rule "no tertiary text on a muted
       surface" exists. If a future ramp makes this pass, the limitation is
       gone and the note in theme.css should be deleted — so this asserts the
       state the comment describes rather than silently drifting from it. */
    /* Light theme: ink-600 on paper-200. */
    expect(contrast(token("ink-600"), token("paper-200"))).toBeLessThan(AA_NORMAL);
    /* Dark theme: ink-400 on ink-700 — the same limitation, the same rule. */
    expect(contrast(token("ink-400"), token("ink-700"))).toBeLessThan(AA_NORMAL);
  });

  describe("inverse sections clear AA on harbor-900", () => {
    const inverse = token("harbor-800");

    for (const fg of ["paper-50", "harbor-100", "harbor-200", "lime-100"]) {
      it(`${fg} on bg-inverse`, () => {
        expect(contrast(token(fg), inverse)).toBeGreaterThanOrEqual(AA_NORMAL);
      });
    }
  });

  it("keeps the primary button label legible on its own fill", () => {
    expect(contrast(token("ink-900"), token("lime-100"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("keeps the announcement chip label legible on its fill", () => {
    expect(contrast(token("ink-900"), token("taupe-300"))).toBeGreaterThanOrEqual(AA_NORMAL);
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

describe("the accent matches the reference it was sampled from", () => {
  it("pins lime-100 to the acid value", () => {
    /* L 0.96. An earlier ramp put the accent at L 0.82, which is olive rather
       than acid — the single thing that made the palette read wrong. */
    expect(token("lime-100")).toBe("#eeff80");
  });
});

describe("the primary button reads on both grounds", () => {
  /**
   * Its hover fill is a token because the right one depends on what it stands
   * on. Every dark fill measures about 1.3:1 against the blue panel, so a
   * button that darkens on hover disappears there. On the inverse ground it
   * lightens instead.
   */
  const white = token("paper-50");
  const panel = token("stage");

  it("rest: the label is legible on the accent", () => {
    expect(contrast(token("ink-900"), token("lime-100"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  describe("on a light page it darkens", () => {
    const fill = token("harbor-900");

    it("the label is legible on the fill", () => {
      expect(contrast(white, fill)).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it("the button is still visible against the page", () => {
      expect(contrast(fill, white)).toBeGreaterThanOrEqual(3);
    });
  });

  describe("on the hero's graphite panel it lightens", () => {
    const fill = token("paper-50");

    it("the label is legible on the fill", () => {
      expect(contrast(token("harbor-800"), fill)).toBeGreaterThanOrEqual(AA_NORMAL);
    });

    it("the button is still visible against the panel", () => {
      /* The whole point: a dark fill here measures ~1.3 and vanishes. */
      expect(contrast(fill, panel)).toBeGreaterThanOrEqual(3);
      expect(contrast(token("harbor-900"), panel)).toBeLessThan(3);
    });
  });
});

describe("the hero's graphite panel", () => {
  const stage = token("stage");

  it("is a grey, not the brand blue", () => {
    /* Warmed from #33353a to #1a1917 in concept v2. The old value was a COOL
       graphite, which was right beside a cool page ground and wrong beside a
       warm one — it read as the only blue-grey left on the page.

       The pin is kept rather than loosened: this token is a raw value with no
       ramp behind it, so nothing else would notice it drifting. */
    expect(stage).toBe("#1a1917");
  });

  it("stays neutral — no channel runs away from the others", () => {
    /* What "a grey, not the brand blue" actually means, asserted directly
       rather than through a hex that has now changed once. A warm grey keeps
       its channels within a few points; the brand blue spans 141. */
    const n = parseInt(stage.slice(1), 16);
    const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    expect(Math.max(...channels) - Math.min(...channels)).toBeLessThan(12);
  });

  for (const [name, fg] of [
    ["white body copy", "paper-50"],
    ["the lead", "ink-200"],
    ["the lime eyebrow", "lime-100"],
  ] as const) {
    it(`carries ${name}`, () => {
      expect(contrast(token(fg), stage)).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }
});
