import { useId } from "react";

/** Grey engraved routes receive blue ink with scroll; nothing circulates while idle. */
export function PaperRoute({ reverse = false }: { reverse?: boolean }) {
  const d = reverse
    ? "M1220 -40C1160 190 380 65 340 265S1020 520 720 760"
    : "M-60 -20C-100 340 920 65 940 330S370 565 580 780";
  return (
    <svg
      className="paper-route"
      viewBox="0 0 1200 760"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="paper-route__ghost" d={d} />
      <path className="paper-route__draw" d={d} pathLength="1" />
    </svg>
  );
}

/** Small drawn scenes extend the illustration language into the three buying paths. */
export function BuyingSketch({ kind }: { kind: "home" | "kitchen" | "trade" }) {
  const id = useId();
  return (
    <svg className="buying-sketch" viewBox="0 0 300 160" fill="none" aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 0V5" stroke="currentColor" strokeWidth=".4" />
        </pattern>
      </defs>
      {kind === "home" ? (
        <>
          <ellipse cx="150" cy="99" rx="72" ry="17" />
          <path d="M78 99Q92 153 150 151Q208 153 222 99Q175 126 78 99Z" fill={`url(#${id})`} />
          <path d="M80 99Q150 67 220 99M137 144h27" />
          {Array.from({ length: 17 }, (_, i) => (
            <ellipse
              key={i}
              cx={105 + i * 5.5}
              cy={93 - Math.sin(i * 0.6) * 9}
              rx="5"
              ry="1.5"
              transform={`rotate(${i * 17} ${105 + i * 5.5} ${93 - Math.sin(i * 0.6) * 9})`}
            />
          ))}
          <path d="M134 67C119 44 150 42 137 20M159 66C146 48 173 38 161 18" opacity=".45" />
        </>
      ) : kind === "kitchen" ? (
        <>
          <ellipse cx="147" cy="60" rx="63" ry="15" />
          <path d="M84 60V114Q147 151 210 114V60Q147 87 84 60Z" fill={`url(#${id})`} />
          <path d="M84 76H69Q49 94 82 101M210 76h15q20 18-13 25M94 52q53-58 107 0M130 28h31M147 29v-8M182 42l36-26" />
          <path d="M75 146h140M90 152h111M115 139v7M182 139v7" />
        </>
      ) : (
        <>
          <path
            d="M68 133 162 150 240 127 143 111Z M68 133v9l94 18 78-23v-10M162 150v10"
            fill={`url(#${id})`}
          />
          <path
            d="M85 121V51l57 10v70M85 51l37-13 57 9-37 14M142 61l37-14v71M153 115V63l43 8v54M153 63l29-13 43 9-29 12M196 71l29-12v62"
            fill={`url(#${id})`}
          />
          <path d="M101 54v70M116 57v69M165 66v51M182 69v52M81 148l76 14" />
        </>
      )}
    </svg>
  );
}
