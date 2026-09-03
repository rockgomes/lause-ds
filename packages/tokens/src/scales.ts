import type { Group, Token } from './dtcg.js';

export type ShadowColor = { hue: string; step: string; alpha: number };

export type ScaleRules = {
  type: { base: number; ratio: number; stepsDown: number; stepsUp: number; tuned: Record<string, { value: number; note: string }> };
  leading: Record<string, number>;
  space: number[];
  radius: Record<string, number>;
  stroke: Record<string, number>;
  shadow: Record<string, { color: ShadowColor; offsetX: number; offsetY: number; blur: number; spread: number }>;
  font: Record<string, string[]>;
  opacity: Record<string, number>;
};

const px = (value: number, $description?: string): Token => ({ $type: 'dimension', $value: { value, unit: 'px' }, ...($description ? { $description } : {}) });
const dim = (value: number) => ({ value, unit: 'px' });

export function typeSizes(t: ScaleRules['type']): number[] {
  const out: number[] = [];
  for (let i = -t.stepsDown; i <= t.stepsUp; i++) out.push(Math.round(t.base * Math.pow(t.ratio, i)));
  return [...new Set(out)];
}

function shadowTint(c: ShadowColor, colors: Group): string {
  const hue = (colors.color as Group | undefined)?.[c.hue] as Group | undefined;
  const stepToken = hue?.[c.step] as Token | undefined;
  if (!stepToken || typeof stepToken.$value !== 'string') {
    throw new Error(`unknown color step: color.${c.hue}.${c.step}`);
  }
  const hex = stepToken.$value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${c.alpha.toFixed(2)})`;
}

export function buildScales(rules: ScaleRules, colors: Group): Group {
  const size: Group = {};
  for (const s of typeSizes(rules.type)) {
    const tuned = rules.type.tuned[String(s)];
    size[String(s)] = tuned ? px(tuned.value, tuned.note) : px(s);
  }
  const leading: Group = Object.fromEntries(Object.entries(rules.leading).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  const space: Group = Object.fromEntries(rules.space.map((v) => [String(v), px(v)]));
  const radius: Group = Object.fromEntries(Object.entries(rules.radius).map(([k, v]) => [k, px(v)]));
  const stroke: Group = Object.fromEntries(Object.entries(rules.stroke).map(([k, v]) => [k, px(v)]));
  const shadow: Group = Object.fromEntries(Object.entries(rules.shadow).map(([k, v]) => [k, { $type: 'shadow', $value: { color: shadowTint(v.color, colors), offsetX: dim(v.offsetX), offsetY: dim(v.offsetY), blur: dim(v.blur), spread: dim(v.spread) } }]));
  const family: Group = Object.fromEntries(Object.entries(rules.font).map(([k, v]) => [k, { $type: 'fontFamily', $value: v }]));
  const opacity: Group = Object.fromEntries(Object.entries(rules.opacity).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  return { type: { size, leading }, space, radius, stroke, shadow, font: { family }, opacity };
}
