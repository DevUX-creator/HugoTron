"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import {
  createMapInteraction,
  type DeliveryRegion,
  type JourneyState,
  type MapController,
} from "./mapInteraction";
import { DELIVERY_STOPS, formatRunTime, type RunSnapshot } from "./deliveryRun";
import DeliveryVan from "./DeliveryVan";
import { DELIVERY_MAP } from "@/content/deliveryMap";
import { useSound } from "@/components/sound/SoundProvider";

/** A local geographic atlas; changing the delivery text never moves or rebuilds it. */
function DeliveryMap({ label }: { label: string }) {
  const t = useTranslations("delivery.map.interaction");
  const game = useTranslations("delivery.map.game");
  const [run, setRun] = useState<RunSnapshot>({
    collected: 0,
    total: DELIVERY_STOPS.length,
    phase: "ready",
    elapsed: 0,
  });
  const regionNames = useTranslations("delivery.map.regions");
  const mount = useRef<HTMLDivElement>(null);
  const controls = useRef<MapController | null>(null);
  const [status, setStatus] = useState<JourneyState>("ready");
  const [speed, setSpeed] = useState(1);
  const [region, setRegion] = useState<DeliveryRegion>("DE-HH");
  const { setVehicle } = useSound();
  useEffect(() => {
    setVehicle(status === "driving", speed);
  }, [status, speed, setVehicle]);
  useEffect(() => () => setVehicle(false), [setVehicle]);
  useEffect(() => {
    if (!mount.current) return;
    const interaction = createMapInteraction(mount.current, setStatus, setRegion, setRun);
    controls.current = interaction;
    return () => {
      interaction.dispose();
      controls.current = null;
    };
  }, []);
  const germany = DELIVERY_MAP.countries.find((country) => country.id === "DEU")!;
  const [hamburgX, hamburgY] = DELIVERY_MAP.hamburg;
  return (
    <div ref={mount} className="delivery-map" role="group" aria-label={label} data-lenis-prevent>
      <div className="delivery-map__atmosphere" aria-hidden="true" />
      <svg
        className="delivery-map__canvas"
        viewBox="150 130 740 520"
        role="group"
        aria-label={t("keyboard")}
        aria-describedby="delivery-drive-hint"
        tabIndex={0}
      >
        <g aria-hidden="true">
          <defs>
            <radialGradient id="delivery-client-glow">
              <stop stopColor="var(--color-world-neon-hot)" stopOpacity="0.32" />
              <stop offset="0.3" stopColor="var(--color-world-neon)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="delivery-germany" cx="48%" cy="40%" r="75%">
              <stop stopColor="var(--color-map-low)" />
              <stop offset="0.5" stopColor="var(--color-map-night)" />
              <stop offset="1" stopColor="var(--color-map-night)" />
            </radialGradient>
            <radialGradient id="delivery-region-light" cx="48%" cy="42%" r="70%">
              <stop stopColor="var(--color-world-neon)" stopOpacity="0.06" />
              <stop offset="0.5" stopColor="var(--color-world-neon)" stopOpacity="0.02" />
              <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="delivery-road-light"
              gradientUnits="userSpaceOnUse"
              cx={hamburgX}
              cy={hamburgY}
              r="40"
            >
              <stop stopColor="var(--color-world-neon-hot)" stopOpacity="0.7" />
              <stop offset="0.45" stopColor="var(--color-world-neon)" stopOpacity="0.4" />
              <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="delivery-hamburg-glow">
              <stop stopColor="var(--color-world-neon)" stopOpacity="0.2" />
              <stop offset="0.45" stopColor="var(--color-world-neon)" stopOpacity="0.06" />
              <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
            </radialGradient>
            <clipPath id="delivery-germany-clip">
              <path d={germany.outline} />
            </clipPath>
            <path
              id="delivery-main-roads"
              d={DELIVERY_MAP.roads.major}
              vectorEffect="non-scaling-stroke"
            />
          </defs>
          <g className="delivery-map__neighbours">
            {DELIVERY_MAP.countries
              .filter((country) => country.id !== "DEU")
              .map((country) => (
                <path key={country.id} d={country.outline} fillRule="evenodd" />
              ))}
          </g>
          <path className="delivery-map__depth" d={germany.outline} transform="translate(0 4)" />
          <path className="delivery-map__germany" d={germany.outline} fillRule="evenodd" />
          <g clipPath="url(#delivery-germany-clip)">
            <image
              className="delivery-map__terrain"
              href="/images/delivery/germany-relief.webp"
              x="325.61"
              y="92.8"
              width="579.23"
              height="800"
              preserveAspectRatio="none"
            />
            <g className="delivery-map__regions">
              {DELIVERY_MAP.regions.map((region) => (
                <path
                  key={region.id}
                  d={region.outline}
                  fillRule="evenodd"
                  data-region={region.id}
                  data-active={region.id === "DE-HH"}
                />
              ))}
            </g>
            <circle cx={hamburgX} cy={hamburgY} r="45" fill="url(#delivery-hamburg-glow)" />
            <path className="delivery-map__roads-minor" d={DELIVERY_MAP.roads.minor} />
            <use href="#delivery-main-roads" className="delivery-map__roads-major" />
            <use href="#delivery-main-roads" className="delivery-map__roads-lit" />
          </g>
          <g className="delivery-map__destination" style={{ opacity: 0 }}>
            <circle r="5" />
            <circle r="10" />
          </g>
          <g className="delivery-map__hamburg" transform={`translate(${hamburgX} ${hamburgY})`}>
            <g className="delivery-map__origin-mark">
              <circle className="delivery-map__pulse" r="24" />
              <circle className="delivery-map__ring" r="12" />
              <path className="delivery-map__cross" d="M-20 0H-15M15 0H20M0-20V-15M0 15V20" />
              <circle className="delivery-map__pin" r="4" />
            </g>
            <g className="delivery-map__origin-label">
              <path className="delivery-map__leader" d="M0-23V-32" />
              <text className="delivery-map__city" x="0" y="-42" textAnchor="middle">
                HAMBURG
              </text>
            </g>
          </g>
          <g className="delivery-map__checkpoints">
            {DELIVERY_STOPS.map((stop) => (
              <g
                key={stop.id}
                data-stop={stop.id}
                data-collected="false"
                transform={`translate(${stop.x} ${stop.y})`}
              >
                <circle className="delivery-stop__aura" r="27" />
                <ellipse className="delivery-stop__pool" cx="0" cy="7" rx="19" ry="8" />
                <path
                  className="delivery-stop__orbit"
                  d="M-14 5a15 15 0 0 1 18-19M14-5a15 15 0 0 1-18 19"
                />
                <circle className="delivery-stop__collected-pulse" r="15" />
                <path className="delivery-stop__glint" d="M0-15V-25M-3-20H3" />
                <path
                  className="delivery-stop__package"
                  d="m-4-3 4-2 4 2v6L0 5-4 3Zm0 0 4 2 4-2M0-1v6"
                />
                <path className="delivery-stop__check" d="m-5 0 3 3 7-7" />
                <text y="28" textAnchor="middle">
                  {stop.id}
                </text>
              </g>
            ))}
          </g>
          <g className="delivery-map__next">
            <path d="m-4 2 4-6 4 6" />
            <text y="17" textAnchor="middle" />
          </g>
          <DeliveryVan />
          <g className="delivery-map__aim">
            <path d="M-9 0H-4M4 0H9M0-9V-4M0 4V9" />
          </g>
        </g>
      </svg>
      <canvas className="delivery-map__region-energy" aria-hidden="true" />
      <div className="delivery-map__motes" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--x": `${(i * 37 + 13) % 100}%`,
                "--y": `${(i * 61 + 9) % 100}%`,
                "--delay": `${-i * 1.7}s`,
                "--duration": `${12 + (i % 7) * 2}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <p id="delivery-drive-hint" className="sr-only" aria-live="polite">
        {t(status)}
      </p>
      <div className="delivery-map__instruments">
        <div className="delivery-map__run" data-phase={run.phase}>
          <span className="delivery-run__label">
            {game(run.phase === "complete" ? "complete" : "title")}
          </span>
          <div className="delivery-run__result">
            <output data-run-time aria-label={game("time")}>
              00:00.0
            </output>
            <button
              type="button"
              aria-label={game("retry")}
              onClick={() => controls.current?.reset()}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 8a8 8 0 1 1-1 6M5 3v5h5" />
              </svg>
            </button>
          </div>
          <span className="delivery-run__progress">
            {game("progress", { count: run.collected, total: run.total })}
          </span>
          <span className="sr-only" role="status">
            {run.phase === "complete"
              ? game("finished", { time: formatRunTime(run.elapsed) })
              : game("progress", { count: run.collected, total: run.total })}
          </span>
        </div>
        <p className="delivery-map__location" aria-live="polite" aria-atomic="true">
          <span>{t("currentRegion")}</span>
          <strong>{regionNames(region)}</strong>
        </p>
        <DeliveryCompass />
      </div>
      <div className="delivery-map__tip" hidden>
        <p>
          <span className="delivery-map__hint-keyboard">{t("tipKeyboard")}</span>
          <span className="delivery-map__hint-touch">{t("tipTouch")}</span>
          <span className="delivery-map__challenge-hint">
            {game("intro", { total: DELIVERY_STOPS.length })}
          </span>
        </p>
        <button type="button" className="delivery-map__tip-dismiss" aria-label={t("dismissTip")}>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m6 6 8 8M6 14l8-8" />
          </svg>
        </button>
      </div>
      <div
        className="delivery-map__steering"
        data-sound-click="none"
        role="group"
        aria-label={t("steering")}
      >
        {(["left", "up", "down", "right"] as const).map((direction) => (
          <button key={direction} type="button" data-drive={direction} aria-label={t(direction)}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 11 5-5 5 5M10 6v9" />
            </svg>
          </button>
        ))}
      </div>
      <div className="delivery-map__controls" role="group" aria-label={t("controls")}>
        <button
          className="delivery-map__speed"
          type="button"
          aria-label={t("speed", { speed })}
          onClick={() => {
            const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
            setSpeed(next);
            controls.current?.setSpeed(next);
          }}
        >
          <span>{speed}×</span>
        </button>
        <button type="button" aria-label={t("zoomOut")} onClick={() => controls.current?.zoom(0.8)}>
          <span aria-hidden="true">−</span>
        </button>
        <button type="button" aria-label={t("zoomIn")} onClick={() => controls.current?.zoom(1.25)}>
          <span aria-hidden="true">+</span>
        </button>
        <button type="button" aria-label={t("reset")} onClick={() => controls.current?.reset()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 8a8 8 0 1 1-1 7M5 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(DeliveryMap);

/** Compass needle and heading readout follow the van; north remains geographic north. */
export function DeliveryCompass() {
  return (
    <div className="delivery-compass" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="44" />
        <circle cx="60" cy="60" r="42" strokeDasharray="0.6 2.4" />
        <path d="M60 28L92 60L60 92L28 60Z" opacity="0.4" />
        <path d="M60 35L85 60L60 85L35 60Z" opacity="0.2" />
        <g className="delivery-compass__needle">
          <path className="delivery-compass__north" d="M60 21L65 29H55Z" />
        </g>
        <path d="M60 11V17M60 103V109M11 60H17M103 60H109" />
        <text className="delivery-compass__heading" x="60" y="60">
          N
        </text>
        <text className="delivery-compass__degrees" x="60" y="72">
          000°
        </text>
        <text x="60" y="7">
          N
        </text>
        <text x="60" y="120">
          S
        </text>
        <text x="5" y="63">
          W
        </text>
        <text x="115" y="63">
          E
        </text>
      </svg>
    </div>
  );
}
