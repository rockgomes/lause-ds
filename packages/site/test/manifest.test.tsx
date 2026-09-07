import { describe, expect, it } from 'vitest';
import { componentDocs } from '../src/data/manifest.js';

describe('componentDocs', () => {
  it('points TileStack and CellGrid at the Storybook doc for the master they compose', () => {
    const docs = componentDocs();
    expect(docs.find((d) => d.name === 'TileStack')?.storybookUrl).toBe('/storybook/?path=/docs/tile--docs');
    expect(docs.find((d) => d.name === 'CellGrid')?.storybookUrl).toBe('/storybook/?path=/docs/cell--docs');
  });
});
