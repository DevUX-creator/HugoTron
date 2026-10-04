export type PackFinish = "natural" | "midnight" | "blue";
export type LabelRoomScene = {
  setProgress: (progress: number) => void;
  cycleFinish: () => void;
  turnPack: (direction?: number) => void;
  enterDoor: (done: () => void) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};
