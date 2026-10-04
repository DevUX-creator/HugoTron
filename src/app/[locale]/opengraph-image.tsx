import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/* The share card for every page in a locale: the wordmark on the paper of the story.
   Colours mirror --color-world-paper and --color-world-paper-ink in styles/theme.css. */
const PAPER = "#d9cdb7";
const INK = "#172c3e";

export const alt = "Hugo Tron";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "world",
  });
  const tagline = t("metaTitle").split("—").pop()!.trim();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: PAPER,
        color: INK,
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 6 }}>HAMBURG</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 132, letterSpacing: -4, lineHeight: 1 }}>HUGO TRON</div>
        <div style={{ fontSize: 44, marginTop: 24 }}>{tagline}</div>
      </div>
      <div style={{ height: 4, width: 160, background: INK }} />
    </div>,
    size,
  );
}
