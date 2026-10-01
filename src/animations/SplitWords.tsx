import type { CSSProperties } from "react";
import "./flyAway.css";

/** A stable 0–1 value per element, so the same words always fly the same way. */
export function flySeed(index: number, seed = 0) {
  const n = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Splits text into words that each fly away on their own (see flyAway.css). */
export default function SplitWords({ text, seed = 0 }: { text: string; seed?: number }) {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part, index) =>
      /\s/.test(part) ? (
        part
      ) : (
        <span
          key={index}
          className="split-word flies"
          style={{ "--r": flySeed(index, seed).toFixed(3) } as CSSProperties}
        >
          {part}
        </span>
      ),
    );
}
