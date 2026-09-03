import { describe, it, expect } from 'vitest';
import { flatten, isAlias, resolve, type Group } from '../src/dtcg.js';

const prim: Group = {
  color: { navy: { '900': { $type: 'color', $value: '#0f2238' } } },
};
const sem: Group = {
  color: {
    ink: { $type: 'color', $value: '{color.navy.900}' },
    text: { $type: 'color', $value: '{color.ink}' },
    loop: { $type: 'color', $value: '{color.loop}' },
    missing: { $type: 'color', $value: '{color.nope}' },
  },
};

describe('dtcg', () => {
  it('flattens to dot paths', () => {
    expect([...flatten(prim).keys()]).toEqual(['color.navy.900']);
  });
  it('detects aliases', () => {
    expect(isAlias('{color.navy.900}')).toBe(true);
    expect(isAlias('#fff')).toBe(false);
  });
  it('resolves aliases across groups, transitively', () => {
    expect(resolve('color.text', sem, prim).$value).toBe('#0f2238');
  });
  it('throws on a missing path', () => {
    expect(() => resolve('color.missing', sem, prim)).toThrow('unresolved alias {color.nope}');
  });
  it('throws on a cycle', () => {
    expect(() => resolve('color.loop', sem, prim)).toThrow();
  });
});
