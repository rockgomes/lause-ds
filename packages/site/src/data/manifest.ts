import manifest from '../../../../components.manifest.json';
import library from '../../../../figma/library.json';

// Minimal local copies of the shapes read off `components.manifest.json` and
// `figma/library.json` — not imported from `packages/mcp`, since the site
// must not depend on the server package.
type ManifestProp = { name: string; type: string; required: boolean; default?: string; doc: string };
type ManifestComponent = {
  name: string;
  kind: 'component' | 'hook';
  source: string;
  summary: string;
  props: ManifestProp[];
  states: string[];
  proofScreen: string;
};
type Manifest = { components: ManifestComponent[] };

type LibraryComponentEntry = { setId?: string; componentId?: string };
type Library = { fileKey: string; components: Record<string, LibraryComponentEntry> };

const manifestData = manifest as Manifest;
const libraryData = library as unknown as Library;

export type ComponentDoc = {
  name: string;
  kind: 'component' | 'hook';
  summary: string;
  props: ManifestProp[];
  states: string[];
  proofScreen: string;
  storybookUrl: string;
  figmaUrl?: string;
  sourceUrl: string;
};

// TileStack, CellGrid and usePeek have no set of their own in the library
// file: TileStack and CellGrid fall back to the master they compose (Tile,
// Cell); usePeek is a hook with no Figma component at all.
const FIGMA_FALLBACK_NAME: Record<string, string> = { TileStack: 'Tile', CellGrid: 'Cell' };

function figmaUrlFor(name: string): string | undefined {
  const entry = libraryData.components[FIGMA_FALLBACK_NAME[name] ?? name];
  if (!entry) return undefined;
  const nodeId = (entry.setId ?? entry.componentId)!.replace(':', '-');
  return `https://www.figma.com/design/${libraryData.fileKey}?node-id=${nodeId}`;
}

/** Every manifest component, joined with the library file's Figma master and Storybook/GitHub links. */
export function componentDocs(): ComponentDoc[] {
  return manifestData.components.map((component) => ({
    name: component.name,
    kind: component.kind,
    summary: component.summary,
    props: component.props,
    states: component.states,
    proofScreen: component.proofScreen,
    storybookUrl: `/storybook/?path=/docs/${component.name.toLowerCase()}--docs`,
    figmaUrl: figmaUrlFor(component.name),
    sourceUrl: `https://github.com/rockgomes/lause-ds/blob/main/${component.source}`,
  }));
}
