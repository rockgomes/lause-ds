export type Token = { $type: string; $value: unknown; $description?: string };
export type Group = { [key: string]: Token | Group };

export function isToken(v: unknown): v is Token {
  return typeof v === 'object' && v !== null && '$value' in v;
}

export function flatten(group: Group, prefix = ''): Map<string, Token> {
  const out = new Map<string, Token>();
  for (const [k, v] of Object.entries(group)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (isToken(v)) out.set(path, v);
    else for (const [p, t] of flatten(v as Group, path)) out.set(p, t);
  }
  return out;
}

export function isAlias(value: unknown): value is string {
  return typeof value === 'string' && /^\{[^{}]+\}$/.test(value);
}

export function resolve(path: string, ...groups: Group[]): Token {
  const maps = groups.map((g) => flatten(g));
  const seen = new Set<string>();
  let current = path;
  for (;;) {
    if (seen.has(current)) throw new Error(`alias cycle at {${current}}`);
    seen.add(current);
    const token = maps.map((m) => m.get(current)).find((t) => t !== undefined);
    if (!token) throw new Error(`unresolved alias {${current}}`);
    if (!isAlias(token.$value)) return token;
    current = token.$value.slice(1, -1);
  }
}
