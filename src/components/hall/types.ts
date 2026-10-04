export type HallScene = {
  setProgress: (progress: number) => void;
  setDoor: (open: number) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

export type HallOptions = {
  reduced: boolean;
  onReady: () => void;
  onError: () => void;
};
