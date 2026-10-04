import type { CSSProperties } from "react";
import "./revealWords.css";

/**
 * A heading whose words rise into place from behind a mask, one after another, when an ancestor
 * marks itself `data-visible="true"` (the story sets this as a chapter enters). The words stay
 * plain inline text for assistive technology and search.
 */
export default function RevealWords({ text }: { text: string }) {
  return text.split(/(\s+)/).map((part, index) =>
    /\s/.test(part) || !part ? (
      part
    ) : (
      <span key={index} className="reveal-word">
        <span style={{ "--w": index / 2 } as CSSProperties}>{part}</span>
      </span>
    ),
  );
}
