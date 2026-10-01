import { RANGE_FILMS, type RangeFilm } from "./rangeFilms";

/** Three sheets for the home journey; the rice page keeps its own range playlist. */
export const WORLD_FILMS = [
  RANGE_FILMS[0],
  RANGE_FILMS[1],
  {
    id: "tea-ritual",
    base: "/video/world/tea-ritual",
    mobileBase: "/video/world/tea-ritual-mobile",
    poster: "/video/world/tea-ritual-poster.webp",
  },
] as const satisfies readonly RangeFilm[];
