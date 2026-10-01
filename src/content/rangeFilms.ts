export type RangeFilm = {
  id: string;
  base: string;
  mobileBase: string;
  poster: string;
};

/** Ordered playlist. Additional films only need an entry and encoded delivery files. */
export const RANGE_FILMS = [
  {
    id: "rice-fields",
    base: "/video/rice-fields",
    mobileBase: "/video/rice-fields-mobile",
    poster: "/video/rice-fields-poster.webp",
  },
  {
    id: "dining-room",
    base: "/video/range/dining-room",
    mobileBase: "/video/range/dining-room-mobile",
    poster: "/video/range/dining-room-poster.webp",
  },
  {
    id: "light-and-grain",
    base: "/video/range/light-and-grain",
    mobileBase: "/video/range/light-and-grain-mobile",
    poster: "/video/range/light-and-grain-poster.webp",
  },
] as const satisfies readonly RangeFilm[];
