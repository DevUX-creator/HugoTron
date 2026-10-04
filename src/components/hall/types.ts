export type HallScene = {
  setProgress: (progress: number) => void;
  setDoor: (open: number) => void;
  /** Opens the leaves and walks to the threshold before handing off to navigation. */
  enterDoor: (onThreshold: () => void) => boolean;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

export type HallOptions = {
  reduced: boolean;
  onReady: () => void;
  onError: () => void;
};
