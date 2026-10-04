import { DELIVERY_MAP } from "@/content/deliveryMap";

export const DELIVERY_VAN_OUTLINE =
  "M-4-14H4Q6-14 6.5-10L7 11Q7 14 4 14H-4Q-7 14-7 11L-6.5-10Q-6-14-4-14Z";

/** Lightweight overhead model: body, raised cargo roof, cab, tyres and a blue underglow. */
export default function DeliveryVan() {
  return (
    <g
      className="delivery-van"
      transform={`translate(${DELIVERY_MAP.hamburg.join(" ")}) rotate(180)`}
    >
      <defs>
        <linearGradient id="delivery-van-body" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="var(--color-map-edge)" />
          <stop offset="0.25" stopColor="var(--color-world-accent)" />
          <stop offset="0.65" stopColor="var(--color-claim-white)" />
          <stop offset="1" stopColor="var(--color-map-edge)" />
        </linearGradient>
        <linearGradient id="delivery-van-glass" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--color-world-neon-hot)" />
          <stop offset="0.6" stopColor="var(--color-world-surface)" />
          <stop offset="1" stopColor="var(--color-map-night)" />
        </linearGradient>
        <radialGradient id="delivery-van-glow">
          <stop stopColor="var(--color-world-neon)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="delivery-headlight" cx="50%" cy="95%" r="95%">
          <stop stopColor="var(--color-world-neon-hot)" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="var(--color-world-neon)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="delivery-nitro" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--color-claim-white)" />
          <stop offset="0.18" stopColor="var(--color-world-neon-hot)" />
          <stop offset="0.55" stopColor="var(--color-world-neon)" stopOpacity="0.65" />
          <stop offset="1" stopColor="var(--color-world-neon)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse rx="12" ry="19" fill="url(#delivery-van-glow)" />
      <ellipse
        className="delivery-van__headlight"
        cx="-4"
        cy="-35"
        rx="8"
        ry="22"
        fill="url(#delivery-headlight)"
        transform="rotate(-4 -4 -13)"
      />
      <ellipse
        className="delivery-van__headlight"
        cx="4"
        cy="-35"
        rx="8"
        ry="22"
        fill="url(#delivery-headlight)"
        transform="rotate(4 4 -13)"
      />
      <g className="delivery-van__thrust" opacity="0" transform="translate(0 14)">
        <path className="delivery-van__nitro-halo" d="M-4 0V37M4 0V37" />
        <path className="delivery-van__nitro-core" d="M-4 0V34M4 0V34M-6 2V19M6 2V22" />
      </g>
      <rect
        x="-6"
        y="-12"
        width="14"
        height="29"
        rx="3"
        fill="var(--color-claim-black)"
        opacity="0.7"
      />
      <g fill="var(--color-map-night)" stroke="var(--color-map-edge)" strokeWidth="0.4">
        <rect x="-7.8" y="-8.5" width="2" height="5" rx="0.7" />
        <rect x="5.8" y="-8.5" width="2" height="5" rx="0.7" />
        <rect x="-7.8" y="6" width="2" height="5" rx="0.7" />
        <rect x="5.8" y="6" width="2" height="5" rx="0.7" />
      </g>
      <path
        d={DELIVERY_VAN_OUTLINE}
        fill="url(#delivery-van-body)"
        stroke="var(--color-world-neon-hot)"
        strokeWidth="0.35"
      />
      <path d="M-5-10H5L5.5-5H-5.5Z" fill="url(#delivery-van-glass)" />
      <path d="M-4-9H3M-5-1V9" stroke="var(--color-claim-white)" strokeWidth="0.5" opacity="0.7" />
      <rect
        x="-5.4"
        y="-2.6"
        width="10.8"
        height="14.8"
        rx="1.4"
        fill="var(--color-world-accent)"
        stroke="var(--color-claim-white)"
        strokeWidth="0.45"
      />
      <path
        d="M-3.5 0V10M3.5 0V10"
        stroke="var(--color-map-edge)"
        strokeWidth="0.4"
        opacity="0.55"
      />
      <path d="M-2 3V8M2 3V8M-2 5.5H2" stroke="var(--color-world-surface)" strokeWidth="0.8" />
      <path
        d="M-6-4.5H-8M6-4.5H8"
        stroke="var(--color-world-accent)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <g fill="var(--color-world-neon-hot)">
        <rect x="-5.5" y="-13" width="3" height="1.4" rx="0.4" />
        <rect x="2.5" y="-13" width="3" height="1.4" rx="0.4" />
      </g>
      <path d="M-5 13.3H-3M3 13.3H5" stroke="var(--color-grain-light)" strokeWidth="0.8" />
    </g>
  );
}
