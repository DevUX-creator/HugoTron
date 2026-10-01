"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { RangeFilm } from "@/content/rangeFilms";
import "./filmPlaylist.css";

/** Two decoding slots keep the last frame visible until the next film is ready. */
export default function FilmPlaylist({ films }: { films: readonly RangeFilm[] }) {
  const t = useTranslations("paperChapter");
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<() => void>(() => {});
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element || !films.length) return;
    const slots = Array.from(element.querySelectorAll("video"));
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    const mobile = matchMedia("(width < 48rem)").matches || connection?.saveData;
    const webm = !!slots[0]?.canPlayType('video/webm; codecs="vp9"');
    let current = 0,
      index = 0,
      near = false,
      visible = false,
      userPaused = false,
      userStarted = false,
      waiting = false,
      cancelled = false;
    const failed = new Set<number>();
    const mp4Fallback = new Set<number>();
    const pending = new Set<HTMLVideoElement>();
    const allowed = () => userStarted || (!motion.matches && !connection?.saveData);
    const shouldPlay = () => !cancelled && visible && !document.hidden && !userPaused && allowed();
    const nextIndex = () => {
      for (let step = 1; step <= films.length; step++) {
        const next = (index + step) % films.length;
        if (!failed.has(next)) return next;
      }
      return index;
    };
    const prepare = (slot: number, filmIndex: number, mp4 = false) => {
      const video = slots[slot],
        film = films[filmIndex];
      if (!video || !film) return;
      const base = mobile ? film.mobileBase : film.base;
      const source = `${base}.${webm && !mp4 && !mp4Fallback.has(filmIndex) ? "webm" : "mp4"}`;
      if (video.getAttribute("src") === source) return;
      video.dataset.filmIndex = String(filmIndex);
      video.dataset.filmId = film.id;
      video.poster = film.poster;
      video.src = source;
      video.preload = "auto";
      video.load();
    };
    const play = (video: HTMLVideoElement | undefined) => {
      if (!video || pending.has(video) || !video.paused || !shouldPlay()) return;
      pending.add(video);
      void video
        .play()
        .then(() => {
          pending.delete(video);
          if (!shouldPlay()) video.pause();
        })
        .catch(() => pending.delete(video));
    };
    const sync = () => {
      if (near && allowed() && !slots[current]?.hasAttribute("src")) prepare(current, index);
      if (!shouldPlay()) {
        slots.forEach((video) => video.pause());
        setPlaying(false);
        return;
      }
      if (waiting) {
        const next = 1 - current;
        prepare(next, nextIndex());
        if ((slots[next]?.readyState ?? 0) >= 2) play(slots[next]);
      } else play(slots[current]);
    };
    const onPlaying = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (!shouldPlay()) {
        video.pause();
        return;
      }
      if (video !== slots[current] && waiting) {
        slots[current]?.pause();
        current = slots.indexOf(video);
        index = Number(video.dataset.filmIndex);
        waiting = false;
        setActive(current);
      }
      if (video === slots[current]) setPlaying(true);
    };
    const ended = (event: Event) => {
      if (event.currentTarget !== slots[current]) return;
      waiting = true;
      sync();
    };
    const warmNext = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (video === slots[current] && shouldPlay() && video.duration - video.currentTime < 2.5)
        prepare(1 - current, nextIndex());
    };
    const onError = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      const slot = slots.indexOf(video),
        failedIndex = Number(video.dataset.filmIndex);
      if (video.getAttribute("src")?.endsWith(".webm")) {
        mp4Fallback.add(failedIndex);
        prepare(slot, failedIndex, true);
        return;
      }
      failed.add(failedIndex);
      if (failed.size >= films.length) {
        userPaused = true;
        setPlaying(false);
        return;
      }
      waiting = true;
      prepare(1 - current, nextIndex());
      sync();
    };
    toggle.current = () => {
      userPaused = !userPaused && playingRef();
      if (!userPaused) userStarted = true;
      sync();
    };
    function playingRef() {
      return !slots[current]?.paused;
    }
    const preferencesChanged = () => {
      userStarted = false;
      sync();
    };
    const warm = new IntersectionObserver(
      ([entry]) => {
        near = !!entry?.isIntersecting;
        sync();
      },
      { rootMargin: "400px" },
    );
    const view = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting && entry.intersectionRatio > 0.05;
        sync();
      },
      { threshold: [0, 0.05] },
    );
    warm.observe(element);
    view.observe(element);
    for (const video of slots) {
      video.addEventListener("playing", onPlaying);
      video.addEventListener("ended", ended);
      video.addEventListener("canplay", sync);
      video.addEventListener("timeupdate", warmNext);
      video.addEventListener("error", onError);
    }
    motion.addEventListener("change", preferencesChanged);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelled = true;
      warm.disconnect();
      view.disconnect();
      toggle.current = () => {};
      motion.removeEventListener("change", preferencesChanged);
      document.removeEventListener("visibilitychange", sync);
      for (const video of slots) {
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("ended", ended);
        video.removeEventListener("canplay", sync);
        video.removeEventListener("timeupdate", warmNext);
        video.removeEventListener("error", onError);
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [films]);
  return (
    <>
      <div ref={root} className="film-playlist" data-active-slot={active}>
        {[0, 1].map((slot) => (
          <video
            key={slot}
            className="film-playlist__video"
            data-active={active === slot}
            poster={slot === 0 ? films[0]?.poster : undefined}
            width={1920}
            height={1080}
            muted
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        ))}
      </div>
      <button
        className="range-reveal__toggle"
        type="button"
        onClick={() => toggle.current()}
        aria-label={playing ? t("pause") : t("play")}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={playing ? "M6 4h4v16H6zm8 0h4v16h-4z" : "m7 3 15 9-15 9z"} />
        </svg>
      </button>
    </>
  );
}
