/** Replace assets here without changing interaction code. Levels are intentionally quiet. */
export const SOUND_ASSETS = {
  ambience: { src: "/audio/world/background.mp3", gain: 0.45 },
  hover: { src: "/audio/world/menu.mp3", gain: 0.32, cooldown: 0.45 },
  product: { src: "/audio/world/menu.mp3", gain: 0.55, cooldown: 0.5 },
  click: { src: "/audio/world/click.mp3", gain: 0.22, cooldown: 0.18 },
  cart: { src: "/audio/world/cart-added.mp3", gain: 0.2, cooldown: 0.35 },
  transition: { src: "/audio/world/fly-away.mp3", gain: 0.22, cooldown: 2.2 },
} as const;

export const SOUND_MIX = { level: 0.65, fadeIn: 3.5, fadeOut: 0.12 } as const;

export type SoundCue = Exclude<keyof typeof SOUND_ASSETS, "ambience">;
