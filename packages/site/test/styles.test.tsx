import { describe, expect, it } from 'vitest';
import { disabledControl, focusRing, hitTarget, hoverFade } from 'lause-ds';

// This is a lause-ds public-API contract test, not a site test: it needs the built `lause-ds`
// package (this project already depends on packages/ui/dist), so it lives here rather than in
// packages/ui/test. Keep it here; a change to any of these four strings should fail this test.
describe('lause-ds style constants', () => {
  it('exports the four shared class strings the site used to copy', () => {
    expect(focusRing).toBe('focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent');
    expect(hitTarget).toBe('min-h-[44px]');
    expect(hoverFade).toBe('transition-colors duration-120 motion-reduce:transition-none');
    expect(disabledControl).toBe('disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)');
  });
});
