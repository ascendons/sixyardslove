import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Procedural rangoli / mandala ornament.
 * Each ring is its own SVG layer so rings can rotate independently
 * (alternating direction, different speeds). Colors use currentColor —
 * set them with a text-* class on the component.
 */

type Variant = "lotus" | "mandala" | "star";

interface RangoliProps {
  variant?: Variant;
  /** Seconds for one full turn of the slowest ring. */
  speed?: number;
  /** Disable rotation (e.g. for small static accents). */
  still?: boolean;
  className?: string;
  /** Opacity of the petal fills (strokes stay solid). */
  fillOpacity?: number;
  strokeWidth?: number;
}

// Teardrop petal pointing outward (up), from inner radius r1 to tip r2.
function petal(r1: number, r2: number, w: number) {
  const mid = (r1 + r2) / 2;
  return `M 0 ${-r1} C ${w} ${-mid + w * 0.2} ${w * 0.55} ${-r2 + w * 0.4} 0 ${-r2} C ${-w * 0.55} ${-r2 + w * 0.4} ${-w} ${-mid + w * 0.2} 0 ${-r1} Z`;
}

// Pointed leaf (vesica) from r1 to r2.
function leaf(r1: number, r2: number, w: number) {
  const mid = (r1 + r2) / 2;
  return `M 0 ${-r1} Q ${w} ${-mid} 0 ${-r2} Q ${-w} ${-mid} 0 ${-r1} Z`;
}

function starPolygon(points: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const repeat = (n: number, render: (angle: number, i: number) => ReactNode) =>
  Array.from({ length: n }, (_, i) => render((360 / n) * i, i));

interface Ring {
  /** Relative speed multiplier (higher = slower). */
  pace: number;
  reverse?: boolean;
  content: (fo: number) => ReactNode;
}

const RINGS: Record<Variant, Ring[]> = {
  lotus: [
    {
      pace: 1,
      content: (fo) => (
        <>
          {repeat(16, (a) => (
            <path
              key={a}
              d={petal(62, 96, 13)}
              transform={`rotate(${a})`}
              fillOpacity={fo}
            />
          ))}
          {repeat(16, (a) => (
            <circle
              key={`d${a}`}
              cx={0}
              cy={-99}
              r={2.2}
              transform={`rotate(${a + 11.25})`}
              fillOpacity={1}
              stroke="none"
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.7,
      reverse: true,
      content: (fo) => (
        <>
          <circle r={60} fill="none" strokeDasharray="1 5" strokeLinecap="round" />
          {repeat(12, (a) => (
            <path
              key={a}
              d={leaf(30, 58, 11)}
              transform={`rotate(${a})`}
              fillOpacity={fo * 1.4}
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.5,
      content: (fo) => (
        <>
          <polygon points={starPolygon(8, 28, 16)} fillOpacity={fo} />
          <circle r={12} fillOpacity={fo * 2} />
          <circle r={4} stroke="none" fillOpacity={1} />
        </>
      ),
    },
  ],
  mandala: [
    {
      pace: 1,
      reverse: true,
      content: (fo) => (
        <>
          <circle r={96} fill="none" />
          <circle r={90} fill="none" strokeDasharray="2 4" />
          {repeat(24, (a) => (
            <path
              key={a}
              d={leaf(66, 88, 7)}
              transform={`rotate(${a})`}
              fillOpacity={fo}
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.75,
      content: (fo) => (
        <>
          {repeat(8, (a) => (
            <path
              key={a}
              d={petal(26, 64, 20)}
              transform={`rotate(${a})`}
              fillOpacity={fo}
            />
          ))}
          {repeat(8, (a) => (
            <circle
              key={`c${a}`}
              cx={0}
              cy={-52}
              r={5}
              transform={`rotate(${a + 22.5})`}
              fillOpacity={fo * 2}
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.45,
      reverse: true,
      content: (fo) => (
        <>
          <rect x={-17} y={-17} width={34} height={34} fillOpacity={fo} />
          <rect
            x={-17}
            y={-17}
            width={34}
            height={34}
            transform="rotate(45)"
            fillOpacity={fo}
          />
          <circle r={9} fillOpacity={fo * 2} />
          <circle r={3} stroke="none" fillOpacity={1} />
        </>
      ),
    },
  ],
  star: [
    {
      pace: 1,
      content: (fo) => (
        <>
          <polygon points={starPolygon(12, 97, 74)} fillOpacity={fo * 0.6} />
          {repeat(12, (a) => (
            <circle
              key={a}
              cx={0}
              cy={-84}
              r={3}
              transform={`rotate(${a + 15})`}
              stroke="none"
              fillOpacity={1}
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.65,
      reverse: true,
      content: (fo) => (
        <>
          {repeat(6, (a) => (
            <path
              key={a}
              d={petal(14, 66, 24)}
              transform={`rotate(${a})`}
              fillOpacity={fo}
            />
          ))}
          {repeat(6, (a) => (
            <path
              key={`l${a}`}
              d={leaf(20, 52, 9)}
              transform={`rotate(${a + 30})`}
              fillOpacity={fo * 1.6}
            />
          ))}
        </>
      ),
    },
    {
      pace: 0.4,
      content: (fo) => (
        <>
          <circle r={14} fillOpacity={fo * 2} />
          <circle r={8} fill="none" strokeDasharray="1 3" />
          <circle r={3} stroke="none" fillOpacity={1} />
        </>
      ),
    },
  ],
};

export function Rangoli({
  variant = "lotus",
  speed = 90,
  still = false,
  className,
  fillOpacity = 0.12,
  strokeWidth = 1,
}: RangoliProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative aspect-square pointer-events-none", className)}
    >
      {RINGS[variant].map((ring, i) => (
        <svg
          key={i}
          viewBox="-100 -100 200 200"
          className={cn("absolute inset-0 h-full w-full", !still && "animate-rangoli")}
          style={
            {
              "--rangoli-duration": `${Math.round(speed * ring.pace)}s`,
              "--rangoli-direction": ring.reverse ? "reverse" : "normal",
            } as CSSProperties
          }
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        >
          {ring.content(fillOpacity)}
        </svg>
      ))}
    </div>
  );
}
