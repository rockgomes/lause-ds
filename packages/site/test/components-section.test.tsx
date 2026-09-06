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
});
