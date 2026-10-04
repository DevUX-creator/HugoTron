import { notFound } from "next/navigation";

/** Any unknown path inside a locale shows that locale's not-found page, not Next's default. */
export default function CatchAll() {
  notFound();
}
