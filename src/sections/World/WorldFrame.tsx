"use client";

import { useTranslations } from "next-intl";
import SoundToggle from "@/components/sound/SoundToggle";

/** Page furniture belongs outside either scene so a chapter can never carry it away. */
export default function WorldFrame() {
  const t = useTranslations("world");
  return (
    <>
      <div className="world__frame" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="world__identity">
        <p className="world__kicker world__eyebrow">{t("eyebrow")}</p>
        <SoundToggle />
      </div>
    </>
  );
}
