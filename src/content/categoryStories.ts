import type { IngredientId } from "@/components/world/specimen";
import type { ProductCategory } from "./categories";
import { RANGE_FILMS, type RangeFilm } from "./rangeFilms";
import { WORLD_FILMS } from "./worldFilms";

/** Category-only art, independent of the home's paper-world illustrations. */
export type ChapterLayout = "flanked" | "horizon" | "offset";
export type StoryChapter = { key: string; layout: ChapterLayout };
export type CategorySceneKind = "courtyard" | "rice";
export type CategorySlug =
  "rice" | "nuts" | "spices" | "saffron" | "pulses" | "tea" | "raw-materials";
export type CategoryStory = {
  slug: CategorySlug;
  href: `/range/${CategorySlug}`;
  catalogue?: ProductCategory["id"];
  relatedCatalogue?: ProductCategory["id"];
  scene: CategorySceneKind;
  specimen: IngredientId;
  night: string;
  accent: string;
  chapters: readonly StoryChapter[];
  onRequest: readonly string[];
  /** Only ranges with relevant footage get a film. Other ranges use their own illustrated study. */
  film?: RangeFilm;
  artwork: { botanical: string; landscape: string };
};

const art = (name: string) => `/images/category-editorial/${name}.webp`;

/** Confirmed sourcing scope; illustrations are editorial, not named supplier locations. */
export const CATEGORY_STORIES: readonly CategoryStory[] = [
  {
    slug: "rice",
    href: "/range/rice",
    catalogue: "rice",
    specimen: "rice",
    night: "var(--color-cat-rice-night)",
    accent: "var(--color-cat-rice-accent)",
    film: RANGE_FILMS[0],
    scene: "rice",
    chapters: [
      { key: "land", layout: "flanked" },
      { key: "origins", layout: "horizon" },
    ],
    onRequest: ["more"],
    artwork: { botanical: art("rice-botanical"), landscape: art("rice-landscape") },
  },
  {
    slug: "nuts",
    href: "/range/nuts",
    catalogue: "pistachios",
    specimen: "pistachios",
    night: "var(--color-cat-nuts-night)",
    accent: "var(--color-cat-nuts-accent)",
    relatedCatalogue: "nuts",
    scene: "courtyard",
    chapters: [
      { key: "orchard", layout: "horizon" },
      { key: "harvest", layout: "flanked" },
    ],
    onRequest: [],
    artwork: { botanical: art("nuts-botanical"), landscape: art("nuts-orchard") },
  },
  {
    slug: "spices",
    href: "/range/spices",
    catalogue: "spices",
    specimen: "spices",
    night: "var(--color-cat-spices-night)",
    accent: "var(--color-cat-spices-accent)",
    scene: "courtyard",
    chapters: [
      { key: "market", layout: "flanked" },
      { key: "botanicals", layout: "offset" },
    ],
    onRequest: ["more"],
    artwork: { botanical: art("spices-botanical"), landscape: art("spices-study") },
  },
  {
    slug: "saffron",
    href: "/range/saffron",
    catalogue: "saffron",
    specimen: "saffron",
    night: "var(--color-cat-saffron-night)",
    accent: "var(--color-cat-saffron-accent)",
    scene: "courtyard",
    chapters: [
      { key: "field", layout: "flanked" },
      { key: "thread", layout: "offset" },
    ],
    onRequest: ["more"],
    artwork: { botanical: art("saffron-botanical"), landscape: art("saffron-study") },
  },
  {
    slug: "pulses",
    href: "/range/pulses",
    catalogue: "pulses",
    specimen: "pulses",
    night: "var(--color-cat-pulses-night)",
    accent: "var(--color-cat-pulses-accent)",
    scene: "courtyard",
    chapters: [
      { key: "fields", layout: "flanked" },
      { key: "sacks", layout: "horizon" },
    ],
    onRequest: [],
    artwork: { botanical: art("pulses-botanical"), landscape: art("pulses-study") },
  },
  {
    slug: "tea",
    href: "/range/tea",
    catalogue: "tea",
    specimen: "tea",
    night: "var(--color-cat-tea-night)",
    accent: "var(--color-cat-tea-accent)",
    film: WORLD_FILMS[2],
    scene: "courtyard",
    chapters: [
      { key: "garden", layout: "horizon" },
      { key: "leaf", layout: "flanked" },
    ],
    onRequest: ["more"],
    artwork: { botanical: art("tea-botanical"), landscape: art("tea-garden") },
  },
  {
    slug: "raw-materials",
    href: "/range/raw-materials",
    catalogue: "grains",
    specimen: "grains",
    night: "var(--color-cat-raw-night)",
    accent: "var(--color-cat-raw-accent)",
    scene: "courtyard",
    chapters: [
      { key: "mill", layout: "horizon" },
      { key: "bulk", layout: "offset" },
    ],
    onRequest: ["ingredients", "requested"],
    artwork: { botanical: art("raw-materials-botanical"), landscape: art("raw-materials-mill") },
  },
];

export function getCategoryStory(slug: string) {
  return CATEGORY_STORIES.find((story) => story.slug === slug);
}

export const LEGACY_CATEGORY_SLUGS: Record<string, CategorySlug> = {
  pistachios: "nuts",
  grains: "raw-materials",
};

export const SERVICE_CHAPTERS: readonly StoryChapter[] = [
  { key: "import", layout: "offset" },
  { key: "distribution", layout: "horizon" },
];
