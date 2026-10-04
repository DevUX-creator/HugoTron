"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DeliveryMap from "./DeliveryMap";

const TOPICS = ["coverage", "timing", "quantity", "costs"] as const;
type Topic = (typeof TOPICS)[number];

export default function DeliveryExplorer() {
  const t = useTranslations("delivery");
  const [selected, setSelected] = useState<Topic>("coverage");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = (index + 1) % TOPICS.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = (index + TOPICS.length - 1) % TOPICS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = TOPICS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const topic = TOPICS[next];
    if (!topic) return;
    setSelected(topic);
    tabs.current[next]?.focus();
  };

  return (
    <section className="delivery-explorer" aria-labelledby="delivery-title">
      <h1 id="delivery-title" className="sr-only">
        {t("map.pageTitle")}
      </h1>
      <DeliveryMap label={t("map.label")} />
      <div className="delivery-explorer__shade" aria-hidden="true" />
      <nav className="delivery-explorer__crumbs" aria-label={t("breadcrumbLabel")}>
        <ol>
          <li>
            <Link href="/">{t("home")}</Link>
          </li>
          <li aria-current="page">{t("name")}</li>
        </ol>
      </nav>

      <div className="delivery-explorer__content">
        <div className="delivery-explorer__panels">
          {TOPICS.map((topic) => (
            <section
              key={topic}
              id={`delivery-panel-${topic}`}
              className="delivery-info"
              role="tabpanel"
              aria-labelledby={`delivery-tab-${topic}`}
              tabIndex={0}
              hidden={selected !== topic}
            >
              <h2>
                <span>{t(`topics.${topic}.lead`)}</span>
                <span>{t(`topics.${topic}.accent`)}</span>
              </h2>
              <p className="delivery-info__text">{t(`topics.${topic}.body`)}</p>
            </section>
          ))}
        </div>
        <div className="delivery-tabs" role="tablist" aria-label={t("topicsLabel")}>
          {TOPICS.map((topic, index) => (
            <button
              key={topic}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              id={`delivery-tab-${topic}`}
              type="button"
              role="tab"
              aria-selected={selected === topic}
              aria-controls={`delivery-panel-${topic}`}
              tabIndex={selected === topic ? 0 : -1}
              data-cursor="wrap"
              data-sound-hover
              onClick={() => setSelected(topic)}
              onKeyDown={(event) => selectWithKeyboard(event, index)}
            >
              <span>{t(`topics.${topic}.label`)}</span>
              <i className="world__marker" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <nav className="delivery-explorer__legal" aria-label={t("legalLabel")}>
        <Link href="/imprint">{t("imprint")}</Link>
        <Link href="/privacy">{t("privacy")}</Link>
      </nav>
    </section>
  );
}
