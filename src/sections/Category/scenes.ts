import type { IngredientId } from "@/components/world/specimen";
import type { CategorySceneKind } from "@/content/categoryStories";

export type CategoryHeroScene = {
  setLeave: (value: number) => void;
  /** 0–1: the camera's approach and the ingredient's response to the pointer. */
  setExplore: (value: number) => void;
  activate: () => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

type Options = { reduced: boolean; onReady: () => void; onError: () => void };
type Factory = (
  mount: HTMLElement,
  ingredient: IngredientId,
  options: Options,
) => CategoryHeroScene;

/**
 * One renderer per page. Every range is presented in the home's courtyard, with its ingredient
 * at the centre and its own camera move and pointer behaviour (components/world/specimen):
 * rice is brushed in its dish, pistachio shells open, saffron threads separate, and so on.
 */
export const CATEGORY_SCENES: Record<CategorySceneKind, () => Promise<Factory>> = {
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
