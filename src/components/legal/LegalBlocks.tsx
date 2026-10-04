import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { LegalBlock } from "@/content/legal/types";

/** A legal text's blocks, shared by the legal pages and the checkout's policy dialog. */
export default function LegalBlocks({
  blocks,
  slot,
}: {
  blocks: readonly LegalBlock[];
  /** What stands in for `{ slot }` blocks (the withdrawal function, or a link to it). */
  slot?: ReactNode;
}) {
  return blocks.map((block, index) => {
    if ("h2" in block)
      return (
        <h2 key={index} id={block.id}>
          {block.h2}
        </h2>
      );
    if ("h3" in block) return <h3 key={index}>{block.h3}</h3>;
    if ("p" in block) return <p key={index}>{block.p}</p>;
    if ("list" in block)
      return (
        <ul key={index}>
          {block.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    if ("address" in block)
      return (
        <address key={index}>
          {block.address.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
      );
    if ("link" in block)
      return (
        <p key={index}>
          <Link href={block.link.href as "/withdrawal"} className="commerce-link">
            {block.link.label}
          </Link>
        </p>
      );
    return <div key={index}>{slot}</div>;
  });
}
