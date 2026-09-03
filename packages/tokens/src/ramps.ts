import { oklch, parse, formatHex, clampChroma } from 'culori';
import type { Group } from './dtcg.js';

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
export type Step = (typeof STEPS)[number];

// Target lightness per step, and how much of the anchor's chroma each step keeps.
const LIGHTNESS: Record<Step, number> = { '50': 0.97, '100': 0.94, '200': 0.89, '300': 0.83, '400': 0.76, '500': 0.68, '600': 0.58, '700': 0.48, '800': 0.38, '900': 0.28, '950': 0.20 };
const CHROMA: Record<Step, number> = { '50': 0.15, '100': 0.25, '200': 0.45, '300': 0.70, '400': 0.90, '500': 1.0, '600': 1.0, '700': 0.90, '800': 0.80, '900': 0.70, '950': 0.55 };

export type Anchors = { hues: Record<string, string>; white: string; black: string };

function toOklch(hex: string) {
  const parsed = parse(hex);
  if (!parsed) throw new Error(`invalid anchor colour: ${hex}`);
  return oklch(parsed)!;
}

export function nearestStep(anchorHex: string): Step {
  const l = toOklch(anchorHex).l;
  return STEPS.reduce((best, s) => (Math.abs(LIGHTNESS[s] - l) < Math.abs(LIGHTNESS[best] - l) ? s : best), STEPS[0]);
}

export function buildRamp(anchorHex: string): Record<Step, string> {
  const a = toOklch(anchorHex);
  const home = nearestStep(anchorHex);
  const baseChroma = (a.c ?? 0) / CHROMA[home];
  const out = {} as Record<Step, string>;
  for (const s of STEPS) {
    if (s === home) { out[s] = anchorHex.toLowerCase(); continue; }
    const c = clampChroma({ mode: 'oklch', l: LIGHTNESS[s], c: baseChroma * CHROMA[s], h: a.h }, 'oklch');
    out[s] = formatHex(c);
  }
  return out;
}

export function buildColors(anchors: Anchors): Group {
  const color: Group = {};
  for (const [hue, hex] of Object.entries(anchors.hues)) {
    const ramp = buildRamp(hex);
    color[hue] = Object.fromEntries(STEPS.map((s) => [s, { $type: 'color', $value: ramp[s] }]));
  }
  color.white = { $type: 'color', $value: anchors.white };
  color.black = { $type: 'color', $value: anchors.black };
  return { color };
}
