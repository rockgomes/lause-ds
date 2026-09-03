import type { Group, Token } from './dtcg.js';

export type ScaleRules = {
  type: { base: number; ratio: number; stepsDown: number; stepsUp: number; tuned: Record<string, { value: number; note: string }> };
  leading: Record<string, number>;
  space: number[];
  radius: Record<string, number>;
  shadow: Record<string, string>;
  font: Record<string, string[]>;
  opacity: Record<string, number>;
};

const px = (value: number, $description?: string): Token => ({ $type: 'dimension', $value: { value, unit: 'px' }, ...($description ? { $description } : {}) });

export function typeSizes(t: ScaleRules['type']): number[] {
  const out: number[] = [];
  for (let i = -t.stepsDown; i <= t.stepsUp; i++) out.push(Math.round(t.base * Math.pow(t.ratio, i)));
  return [...new Set(out)];
}

export function buildScales(rules: ScaleRules): Group {
  const size: Group = {};
  for (const s of typeSizes(rules.type)) {
    const tuned = rules.type.tuned[String(s)];
    size[String(s)] = tuned ? px(tuned.value, tuned.note) : px(s);
  }
  const leading: Group = Object.fromEntries(Object.entries(rules.leading).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  const space: Group = Object.fromEntries(rules.space.map((v) => [String(v), px(v)]));
  const radius: Group = Object.fromEntries(Object.entries(rules.radius).map(([k, v]) => [k, px(v)]));
  const shadow: Group = Object.fromEntries(Object.entries(rules.shadow).map(([k, v]) => [k, { $type: 'shadow', $value: v }]));
  const family: Group = Object.fromEntries(Object.entries(rules.font).map(([k, v]) => [k, { $type: 'fontFamily', $value: v }]));
  const opacity: Group = Object.fromEntries(Object.entries(rules.opacity).map(([k, v]) => [k, { $type: 'number', $value: v }]));
  return { type: { size, leading }, space, radius, shadow, font: { family }, opacity };
}
