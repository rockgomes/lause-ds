import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Components } from '../src/sections/Components.js';
import { componentDocs } from '../src/data/manifest.js';
import { EXAMPLES } from '../src/sections/examples.js';

describe('Components section', () => {
  it('has one card per manifest component, in manifest order, each with a live example', async () => {
    await render(<Components />);
    const cards = Array.from(document.querySelectorAll('[data-component]')).map((c) => c.getAttribute('data-component'));
    expect(cards).toEqual(componentDocs().map((d) => d.name));
    for (const d of componentDocs()) expect(EXAMPLES[d.name], d.name).toBeTypeOf('function');
  });

  it('links every card to Storybook and the source', async () => {
    await render(<Components />);
    for (const d of componentDocs()) {
      const card = document.querySelector(`[data-component="${d.name}"]`)!;
      expect(card.querySelector(`a[href="${d.storybookUrl}"]`)).not.toBeNull();
      expect(card.querySelector(`a[href="${d.sourceUrl}"]`)).not.toBeNull();
    }
  });

  it('shows the example panel before the name on every card', async () => {
    await render(<Components />);
    for (const d of componentDocs()) {
      const card = document.querySelector(`[data-component="${d.name}"]`)!;
      const panel = card.querySelector('.bg-ground')!;
      const h3 = card.querySelector('h3')!;
      expect(panel, d.name).not.toBeNull();
      expect(h3, d.name).not.toBeNull();
      expect(panel.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING, d.name).toBeTruthy();
    }
  });

  it('gives Progress and Bar their full rendered width, not a collapsed one', async () => {
    await render(<Components />);
    const progressBar = document.querySelector('[data-component="Progress"] [role="progressbar"]');
    const barImg = document.querySelector('[data-component="Bar"] [role="img"]');
    expect((progressBar as HTMLElement | null)?.offsetWidth ?? 0).toBeGreaterThan(100);
    expect((barImg as HTMLElement | null)?.offsetWidth ?? 0).toBeGreaterThan(100);
  });

  it('drops the Button example\'s click counter', async () => {
    await render(<Components />);
    const card = document.querySelector('[data-component="Button"]')!;
    expect(card.textContent).not.toMatch(/Vajutatud/);
  });
});
