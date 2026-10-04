import type { IngredientId } from "@/components/world/specimen";
import type { CategorySceneKind } from "@/content/categoryStories";

export type CategoryHeroScene = {
  setLeave: (value: number) => void;
  setExplore: (value: number) => void;
  activate: () => void;
  nudge?: (x: number, y: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

type Options = { reduced: boolean; onReady: () => void; onError: () => void };
type Factory = (
  mount: HTMLElement,
  ingredient: IngredientId,
  options: Options,
) => CategoryHeroScene;

/** One renderer per page: the original rice physics, or the courtyard with a bespoke ingredient behaviour. */
export const CATEGORY_SCENES: Record<CategorySceneKind, () => Promise<Factory>> = {
  rice: async () => {
    const { createRiceScene } = await import("@/components/rice/scene");
    return (mount, _ingredient, options) => {
      let progress = 0;
      const scene = createRiceScene(
        mount,
        {
          onReady: options.onReady,
          onFailure: options.onError,
          onPlaying: (value) => {
            mount.dataset.playing = String(value);
          },
          onCameraProgress: (value) => {
            mount.dataset.explore = value.toFixed(3);
          },
        },
        {
          viewport: mount.parentElement!,
          entrance: true,
          heroScale: 1.32,
          heroElevation: 0.14,
          sculptedLight: true,
        },
      );
      scene.setDark(true);
      scene.setReducedMotion(options.reduced);
      return {
        setLeave: (value) => {
          scene.setCovered(value >= 1);
          mount.dataset.covered = String(value >= 1);
        },
        setExplore: (value) => {
          progress = value;
          scene.setScrollProgress(value);
        },
        activate: () => {
          if (progress < 0.85) scene.toss();
          else scene.brushWithKey(1, 0);
        },
        nudge: scene.brushWithKey,
        setReducedMotion: scene.setReducedMotion,
        dispose: scene.dispose,
      };
    };
  },
  courtyard: async () => {
    const { createWorldScene } = await import("@/components/world/scene");
    return (mount, ingredient, options) => {
      const scene = createWorldScene(mount, {
        dark: true,
        reduced: options.reduced,
        presentation: ingredient,
        onProgress: () => {},
        onReady: options.onReady,
        onError: options.onError,
      });
      scene.setCategory(ingredient);
      return {
        setLeave: scene.setLeave,
        setExplore: scene.setProductProgress,
        activate: scene.activateProduct,
        setReducedMotion: scene.setReducedMotion,
        dispose: scene.dispose,
      };
    };
  },
};
