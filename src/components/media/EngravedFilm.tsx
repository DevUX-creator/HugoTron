"use client";

import { useRef } from "react";
import type { RangeFilm } from "@/content/rangeFilms";
import FilmPlaylist from "./FilmPlaylist";
import { useEngraving } from "./useEngraving";

/** A film playlist redrawn as an engraving in the paper story's ink. */
export default function EngravedFilm({
  films,
  weight = 1,
  cross = 1,
  strength = 1,
  pitchPx = 5,
}: {
  films: readonly RangeFilm[];
  weight?: number;
  cross?: number;
  strength?: number;
  pitchPx?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEngraving(root, '.film-playlist__video[data-active="true"]', {
    weight,
    cross,
    strength,
    pitchPx,
  });
  return (
    <div ref={root} className="engraved-film">
      <FilmPlaylist films={films} />
    </div>
  );
}
