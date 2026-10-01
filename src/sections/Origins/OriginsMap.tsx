"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ORIGINS_MAP } from "@/content/originsMap";
import { ORIGIN_HUB, type Origin } from "@/content/origins";

const { cols: COLS, rows: ROWS, lonMin, lonMax, latMin, latMax, tones } = ORIGINS_MAP;

/** Longitude/latitude to map cells; the generated grid is equirectangular over its framing. */
function toCell(lon: number, lat: number) {
  return {
    x: ((lon - lonMin) / (lonMax - lonMin)) * COLS,
    y: ((latMax - lat) / (latMax - latMin)) * ROWS,
  };
}

const HUB = toCell(ORIGIN_HUB.lon, ORIGIN_HUB.lat);

/**
 * A gentle arc from an origin to Hamburg, bowed to the north like a great-circle route. Each
 * route bows a little further than the last, so neighbouring origins fan out instead of merging.
 */
function routePath(origin: Origin, index: number) {
  const from = toCell(origin.lon, origin.lat);
  const mx = (from.x + HUB.x) / 2;
  const my = (from.y + HUB.y) / 2;
  const dx = HUB.x - from.x;
  const dy = HUB.y - from.y;
  const length = Math.hypot(dx, dy);
  const bow = length * (0.12 + index * 0.06);
  const cx = mx + (dy / length) * bow;
  const cy = my - Math.abs(dx / length) * bow;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${HUB.x.toFixed(2)} ${HUB.y.toFixed(2)}`;
}

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const BUCKETS = 10;

/**
 * The Origins map: land engraved as vertical strokes on a canvas (wider inland, lit neon around
 * the chosen origin and Hamburg), routes as SVG, places as real buttons for pointer and keyboard.
 */
export default function OriginsMap({
  origins,
  active,
  revealed,
  reduced,
  onSelect,
  labelFor,
}: {
  origins: readonly Origin[];
  active: string;
  revealed: boolean;
  reduced: boolean;
  onSelect: (id: string) => void;
  labelFor: (origin: Origin) => string;
}) {
  const t = useTranslations("origins");
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ reveal: 0, glow: new Map<string, number>(), frame: 0 });
  const props = useRef({ active, revealed, reduced });

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const current = state.current;
    let width = 0;
    let height = 0;
    let ink = "";
    let hot = "";

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = element.clientWidth;
      height = element.clientHeight;
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const style = getComputedStyle(element);
      ink = style.getPropertyValue("--origins-ink").trim();
      hot = style.getPropertyValue("--origins-hot").trim();
      paint();
    };

    const paint = () => {
      const { reveal, glow } = current;
      const cell = width / COLS;
      const lit = [
        { ...HUB, strength: 0.75 },
        ...origins.map((origin) => ({
          ...toCell(origin.lon, origin.lat),
          strength: glow.get(origin.id) ?? 0,
        })),
      ].filter((point) => point.strength > 0.01);
      const paths = Array.from({ length: BUCKETS }, () => new Path2D());
      const hotPaths = Array.from({ length: BUCKETS }, () => new Path2D());
      for (let y = 0; y < ROWS; y++) {
        const row = tones[y]!;
        for (let x = 0; x < COLS; x++) {
          const tone = row.charCodeAt(x) - 48;
          if (tone <= 0) continue;
          // The engraving sweeps in from the west, each stroke arriving a moment apart.
          const arrival = reveal * 1.35 - x / COLS - hash(x, y) * 0.25;
          if (arrival <= 0) continue;
          let heat = 0;
          for (const point of lit) {
            const d2 = (point.x - x) ** 2 + (point.y - y) ** 2;
            heat = Math.max(heat, Math.exp(-d2 / 70) * point.strength);
          }
          const weight = (0.14 + tone * 0.09 + heat * 0.32) * Math.min(1, arrival * 5);
          const bar = cell * Math.min(0.92, weight);
          const level = Math.min(BUCKETS - 1, Math.floor(heat * BUCKETS));
          (heat > 0.08 ? hotPaths : paths)[level]!.rect(
            x * cell + (cell - bar) / 2,
            y * cell,
            bar,
            cell + 0.5,
          );
        }
      }
      context.clearRect(0, 0, width, height);
      context.fillStyle = ink;
      for (const path of paths) context.fill(path);
      context.fillStyle = hot;
      hotPaths.forEach((path, level) => {
        context.globalAlpha = 0.35 + (level / BUCKETS) * 0.65;
        context.fill(path);
      });
      context.globalAlpha = 1;
    };

    const step = () => {
      current.frame = 0;
      const { active: chosen, revealed: open, reduced: still } = props.current;
      let moving = false;
      const target = open ? 1 : 0;
      if (current.reveal !== target) {
        current.reveal = still ? target : Math.min(target, current.reveal + 1 / (60 * 1.8));
        moving ||= current.reveal !== target;
      }
      for (const origin of origins) {
        const goal = origin.id === chosen ? 1 : 0;
        const value = current.glow.get(origin.id) ?? 0;
        const next = still ? goal : value + (goal - value) * 0.12;
        const settled = Math.abs(next - goal) < 0.005 ? goal : next;
        current.glow.set(origin.id, settled);
        moving ||= settled !== goal;
      }
      paint();
      if (moving) current.frame = requestAnimationFrame(step);
    };

    const wake = () => {
      if (!current.frame) current.frame = requestAnimationFrame(step);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    element.addEventListener("origins:wake", wake);
    resize();
    wake();
    return () => {
      observer.disconnect();
      element.removeEventListener("origins:wake", wake);
      cancelAnimationFrame(current.frame);
      current.frame = 0;
    };
  }, [origins]);

  // Selection and the reveal both restart the painter, which sleeps once everything settles.
  useEffect(() => {
    props.current = { active, revealed, reduced };
    canvas.current?.dispatchEvent(new Event("origins:wake"));
  }, [active, revealed, reduced]);

  return (
    <div className="origins-map" data-revealed={revealed || undefined}>
      <canvas ref={canvas} className="origins-map__land" aria-hidden="true" />
      <svg
        className="origins-map__routes"
        viewBox={`0 0 ${COLS} ${ROWS}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {origins.map((origin, index) => {
          const d = routePath(origin, index);
          return (
            <g
              key={origin.id}
              className="origins-map__route"
              data-active={origin.id === active || undefined}
            >
              <path d={d} pathLength={1} className="origins-map__route-glow" />
              <path d={d} pathLength={1} className="origins-map__route-line" />
              <path d={d} pathLength={1} className="origins-map__route-pulse" />
            </g>
          );
        })}
      </svg>
      <span
        className="origins-map__hub"
        style={{ left: `${(HUB.x / COLS) * 100}%`, top: `${(HUB.y / ROWS) * 100}%` }}
      >
        <i aria-hidden="true" />
        <span>
          {t("hub")}
          <small>{t("hubNote")}</small>
        </span>
      </span>
      {origins.map((origin) => {
        const point = toCell(origin.lon, origin.lat);
        return (
          <button
            key={origin.id}
            type="button"
            className="origins-map__place"
            style={{ left: `${(point.x / COLS) * 100}%`, top: `${(point.y / ROWS) * 100}%` }}
            data-active={origin.id === active || undefined}
            // The list beside the map is the accessible control; these are its pointer twin.
            aria-hidden="true"
            tabIndex={-1}
            title={labelFor(origin)}
            onPointerEnter={() => onSelect(origin.id)}
            onClick={() => onSelect(origin.id)}
          >
            <i aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
