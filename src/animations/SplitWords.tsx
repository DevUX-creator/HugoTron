import type { CSSProperties } from "react";
import "./flyAway.css";

/** A stable 0–1 value per element, so the same words always fly the same way. */
export function flySeed(index: number, seed = 0) {
  const n = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Keep whole words for wrapping; optionally let their individual letters leave independently. */
export default function SplitWords({
  text,
  seed = 0,
  letters = false,
}: {
  text: string;
  seed?: number;
  letters?: boolean;
}) {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part, index) =>
      /\s/.test(part) ? (
        part
      ) : (
        <span
          key={index}
          className={letters ? "split-word" : "split-word flies"}
          style={{ "--r": flySeed(index, seed).toFixed(3) } as CSSProperties}
        >
          {letters
            ? Array.from(part).map((letter, i) => (
                <span
                  key={i}
                  className="split-letter flies"
                  style={{ "--r": flySeed(index * 31 + i, seed).toFixed(3) } as CSSProperties}
                >
                  {letter}
                </span>
              ))
            : part}
        </span>
      ),
    );
}
