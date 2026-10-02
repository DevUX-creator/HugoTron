"use client";

import { useRef } from "react";
import type { RangeFilm } from "@/content/rangeFilms";
import FilmPlaylist from "./FilmPlaylist";
import { useEngraving } from "./useEngraving";

/** A film playlist redrawn as an engraving in the paper story's ink. */
export default function EngravedFilm({ films }: { films: readonly RangeFilm[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEngraving(root, '.film-playlist__video[data-active="true"]');
  return (
    <div ref={root} className="engraved-film">
      <FilmPlaylist films={films} />
    </div>
  );
}
