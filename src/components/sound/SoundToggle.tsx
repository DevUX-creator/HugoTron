"use client";

import { useTranslations } from "next-intl";
import { useSound } from "./SoundProvider";
import "./soundToggle.css";

export default function SoundToggle() {
  const t = useTranslations("sound");
  const { status, toggle } = useSound();
  const enabled = status === "on" || status === "loading" || status === "armed";
  return (
    <>
      <button
        type="button"
        className="sound-toggle"
        data-state={status}
        data-cursor="wrap"
        aria-label={t("label")}
        aria-pressed={enabled}
        title={t(enabled ? "disable" : "enable")}
        onClick={toggle}
      >
        <svg viewBox="0 0 32 24" fill="none" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4Z" />
          <path
            className="sound-toggle__wave sound-toggle__wave--near"
            d="M18 8c2.2 2.2 2.2 5.8 0 8"
          />
          <path
            className="sound-toggle__wave sound-toggle__wave--far"
            d="M23 4c4.4 4.4 4.4 11.6 0 16"
          />
          <path className="sound-toggle__mute" d="m3 20 12-16" />
        </svg>
      </button>
      <span className="visually-hidden" role="status">
        {status === "unavailable"
          ? t("unavailable")
          : status === "loading"
            ? t("loading")
            : status === "armed"
              ? t("ready")
              : ""}
      </span>
    </>
  );
}
