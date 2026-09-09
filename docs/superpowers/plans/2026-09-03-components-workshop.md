# Lause DS, Plan 2: Components and the Workshop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `lause-ds` package gains React components built on the token theme, a Storybook workshop where every story is also an automated test with an axe accessibility check, and a changesets release pipeline that publishes to npm on merge.

**Architecture:** `packages/ui` becomes a real package: React 19 + Tailwind v4 components, one folder per component with the component file and its stories beside it. Stories are the tests: Storybook's vitest addon runs every story in headless Chromium, replays each story's `play` function, and runs axe on the rendered result with failures as errors. Light and dark are a Storybook global; every component ships a `Dark` story so both modes are checked. The package builds with `tsc` to `dist/` (ESM + types); CSS ships from `src/tokens/` as before. Changesets versions the package and a release workflow publishes when a token is present.

**Tech Stack:** React 19.2, Tailwind 4.3 via `@tailwindcss/vite`, Vite 8, Storybook 10.6 (`@storybook/react-vite`, `addon-a11y`, `addon-vitest`, `addon-docs`), vitest 4.1 browser mode with `@vitest/browser-playwright` and Chromium, `clsx`, `@changesets/cli` 3.

**Spec:** `docs/specs/2026-09-03-lause-ds-design.md`, §2 decisions 5, 7, 8, 10; §4 components. Appearance rules come from the trainer's design decisions (`docs/design/2026-09-03-lause-design-decisions.md` in `rockgomes/estonian-citizenship-test`, branch `docs/lause-design-decisions`, PR #1 there): pills, keycaps with a 1.5px `ink` border, segmented bars with done `ink` / current `accent` / rest `ink` at 18%, hit targets never under 44px.

**Scope of this plan:** the workshop plus the six chrome components: `Keycap`, `Button`, `Progress`, `Bar`, `Dial`, `Tile` (with `TileStack`). The four reading components (`Sentence`, `Bubble`, `Cell`, `Nav`) are Plan 3; they need the language-layer behaviour and are worth their own plan.

**Proof screens:** spec §7 says a component merges only with its proof screen in the app. The app does not exist yet (the trainer repo holds content and the pipeline). Until it does, each component's stories, built from the Lause frames, are its proof; the rule applies in full once the app consumes `lause-ds`.

**Roadmap:** Plan 3 reading components; Plan 4 Figma library via the Figma MCP; Plan 5 MCP server on Netlify Functions; Plan 6 docs site and public Storybook.

## Global Constraints

- Node `24` (`.nvmrc`), npm workspaces, TypeScript strict, ESM only (`"type": "module"`).
- Components use the token theme only: Tailwind utilities that resolve to `--lause-*` variables (`bg-ink`, `text-dim`, `rounded-control`, `font-content`, `text-label`, `shadow-tile`, `gap-12`, `opacity-(--lause-opacity-faint)`). No raw hex, no raw font names, no raw px sizes except the WCAG 44px target minimum and 640px option width, which are rules, not tokens.
- Every interactive element has a `:focus-visible` outline (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`) and a disabled state. Hit targets are at least 44px tall.
- Every component has stories for each state, a `Dark` story, and a `play` function where it has behaviour. Every story passes axe (`parameters.a11y.test = 'error'`). A failing story fails `npm test` and the pull request.
- Component folders: `packages/ui/src/<Name>/<Name>.tsx` and `<Name>.stories.tsx`; `packages/ui/src/index.ts` re-exports. Imports inside the package use `.js` extensions (`'./Keycap.js'`).
- Generated outputs stay committed and CI's drift check stays green: any token change runs `npm run build:tokens` and commits the four outputs plus `index.css`.
- Commit messages: conventional (`feat:`, `test:`, `chore:`, `docs:`, `ci:`), each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Docs in English. Story copy (button labels, options) in Estonian, as in the app.

---

## File structure

```
packages/ui/package.json                    lause-ds: deps, scripts, exports, publish metadata
packages/ui/tsconfig.json                   typecheck (noEmit), bundler resolution, react-jsx
packages/ui/tsconfig.build.json             emits dist/ from src/, excludes stories
packages/ui/vitest.config.ts                browser mode + storybook plugin: stories are tests
packages/ui/.storybook/main.ts              framework, addons, tailwind vite plugin
packages/ui/.storybook/preview.tsx          theme global + decorator, a11y test: 'error'
packages/ui/.storybook/preview.css          tailwind + the token theme
packages/ui/.storybook/preview-head.html    Google Fonts link (Young Serif, Instrument Sans)
packages/ui/.storybook/vitest.setup.ts      project annotations for the test runner
packages/ui/src/index.ts                    public exports
packages/ui/src/Tokens/Tokens.stories.tsx   swatches and type roles (smoke + docs)
packages/ui/src/Keycap/Keycap.tsx           <kbd> hint with a held state
packages/ui/src/Button/Button.tsx           pill: filled / outline / dim, optional keycap
packages/ui/src/Progress/Progress.tsx       segmented progress bar: done / current / rest
packages/ui/src/Bar/Bar.tsx                 one segment per article: retained / covered / unread
packages/ui/src/Dial/Dial.tsx               segmented radiogroup, 2–3 positions, arrow keys
packages/ui/src/Tile/Tile.tsx               option tile: idle / selected / filled / dimmed; TileStack
.changeset/config.json                      changesets
.github/workflows/release.yml               version PR + publish when NPM_TOKEN is set
```

---

### Task 1: The ui package, Storybook, and stories-as-tests

**Files:**
- Modify: `packages/ui/package.json`, `package.json` (root scripts), `.github/workflows/ci.yml`, `.gitignore`, `tokens/semantic.light.tokens.json`, `tokens/semantic.dark.tokens.json`
- Create: `packages/ui/tsconfig.json`, `packages/ui/tsconfig.build.json`, `packages/ui/vitest.config.ts`, `packages/ui/.storybook/main.ts`, `packages/ui/.storybook/preview.tsx`, `packages/ui/.storybook/preview.css`, `packages/ui/.storybook/preview-head.html`, `packages/ui/.storybook/vitest.setup.ts`, `packages/ui/src/index.ts`, `packages/ui/src/Tokens/Tokens.stories.tsx`
- Generated: the token outputs (after the `radius.keycap` addition)

**Interfaces:**
- Consumes: `packages/ui/src/tokens/index.css` (Plan 1), the `--lause-*` variables and the Tailwind theme keys `--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--spacing-*`, `--leading-*`.
- Produces: the story-test harness every later task relies on: a story file under `src/<Name>/` is discovered, rendered in Chromium, its `play` run, and axe checked; the `theme` global (`'light' | 'dark'`) settable per story with `globals: { theme: 'dark' }`; the `radius.keycap` semantic token (`rounded-keycap`).

- [ ] **Step 1: Add the keycap radius token**

The design gives keycaps a small radius that is not the pill. Add to the `radius` group of BOTH `tokens/semantic.light.tokens.json` and `tokens/semantic.dark.tokens.json`, after `bubble`:

```json
    "keycap":  { "$type": "dimension", "$value": "{radius.sm}", "$description": "keyboard hints" }
```

Run: `npm run build:tokens && npm test`
Expected: five paths written; all tests pass (the semantic tests check key parity and one-hop aliases). `git status` shows the two semantic files plus `tokens/primitives.tokens.json` unchanged, `packages/ui/src/tokens/tokens.css`, `theme.css`, `figma/variables.json` changed.

- [ ] **Step 2: Install dependencies**

From the repo root:

```bash
npm install -w lause-ds clsx@2.1.1
npm install -w lause-ds -D react@19.2.8 react-dom@19.2.8 @types/react@19.2.18 @types/react-dom@19.2.7 \
  storybook@10.6.0 @storybook/react-vite@10.6.0 @storybook/addon-a11y@10.6.0 @storybook/addon-vitest@10.6.0 @storybook/addon-docs@10.6.0 \
  vite@8.2.2 tailwindcss@4.3.3 @tailwindcss/vite@4.3.3 @vitest/browser@4.1.11 @vitest/browser-playwright@4.1.11 playwright@1.62.1
npx playwright install chromium
```

Then set `packages/ui/package.json` to exactly:

```json
{
  "name": "lause-ds",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Lause design system: tokens and React components.",
  "files": ["dist", "src/tokens"],
  "sideEffects": ["*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./styles.css": "./src/tokens/index.css",
    "./tokens.css": "./src/tokens/tokens.css",
    "./theme.css": "./src/tokens/theme.css"
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "clsx": "2.1.1"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "10.6.0",
    "@storybook/addon-docs": "10.6.0",
    "@storybook/addon-vitest": "10.6.0",
    "@storybook/react-vite": "10.6.0",
    "@tailwindcss/vite": "4.3.3",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.7",
    "@vitest/browser": "4.1.11",
    "@vitest/browser-playwright": "4.1.11",
    "playwright": "1.62.1",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "storybook": "10.6.0",
    "tailwindcss": "4.3.3",
    "vite": "8.2.2"
  }
}
```

(`npm install` may have written caret ranges; replace them with the exact versions above, then run `npm install` once more so the lockfile matches.) `private` stays `true` until Task 8.

- [ ] **Step 3: TypeScript config**

`packages/ui/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src", ".storybook", "vitest.config.ts"]
}
```

`packages/ui/tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": false, "outDir": "dist", "rootDir": "src" },
  "include": ["src"],
  "exclude": ["src/**/*.stories.tsx"]
}
```

Root `package.json` scripts become:
```json
  "scripts": {
    "test": "vitest run",
    "build:tokens": "npm run build --workspace @lause-ds/tokens",
    "build:ui": "npm run build --workspace lause-ds",
    "storybook": "npm run storybook --workspace lause-ds",
    "typecheck": "tsc -b packages/tokens && tsc -p packages/ui"
  },
```

Append to root `.gitignore`:
```
storybook-static/
```

- [ ] **Step 4: Storybook config**

`packages/ui/.storybook/main.ts`:
```ts
import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  viteFinal: (viteConfig) => mergeConfig(viteConfig, { plugins: [tailwindcss()] }),
};

export default config;
```

`packages/ui/.storybook/preview.css`:
```css
@import 'tailwindcss';
@source '../src';
@import '../src/tokens/index.css';
```

`packages/ui/.storybook/preview-head.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&family=Young+Serif&display=swap" rel="stylesheet" />
```

`packages/ui/.storybook/preview.tsx`:
```tsx
import type { Preview } from '@storybook/react-vite';
import { useLayoutEffect } from 'react';
import './preview.css';

export type Theme = 'light' | 'dark';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Colour mode',
      toolbar: { title: 'Theme', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, { globals }) => {
      const theme = (globals.theme as Theme) ?? 'light';
      useLayoutEffect(() => {
        document.documentElement.dataset.theme = theme;
      }, [theme]);
      return (
        <div data-theme={theme} className="min-h-screen bg-ground p-32 font-chrome text-body text-ink">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
```

`packages/ui/.storybook/vitest.setup.ts`:
```ts
import { setProjectAnnotations } from '@storybook/react-vite';
import * as a11yAnnotations from '@storybook/addon-a11y/preview';
import * as previewAnnotations from './preview';

setProjectAnnotations([a11yAnnotations, previewAnnotations]);
```

`packages/ui/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), storybookTest({ configDir: join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'ui',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
});
```

If `@storybook/addon-vitest` or `@storybook/react-vite` exports differ from the names above at the installed version, read `node_modules/@storybook/addon-vitest/README.md` and `node_modules/@storybook/react-vite/dist/index.d.ts` and adapt; the intent is "run every story as a vitest browser test with the preview's annotations and the a11y addon applied".

- [ ] **Step 5: The package entry and the first story**

`packages/ui/src/index.ts`:
```ts
export {};
```
(Components add their exports in later tasks.)

`packages/ui/src/Tokens/Tokens.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

const colours = ['ground', 'ink', 'dim', 'accent', 'accent-text', 'accent-on-ink', 'surface', 'on-ink'] as const;
const roles = ['label', 'body', 'title', 'reading', 'headline', 'display'] as const;

function Tokens() {
  return (
    <div className="flex flex-col gap-32">
      <ul className="flex flex-wrap gap-16" aria-label="Semantic colours">
        {colours.map((name) => (
          <li key={name} className="flex flex-col items-center gap-4">
            <span
              aria-hidden="true"
              className="block h-48 w-48 rounded-card border-[1.5px] border-ink"
              style={{ background: `var(--lause-color-${name})` }}
            />
            <code className="text-label">{name}</code>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-12">
        {roles.map((role) => (
          <div key={role} className="flex items-baseline gap-16">
            <dt className="w-96 shrink-0 text-label text-dim">{role}</dt>
            <dd className={`text-${role} ${role === 'label' || role === 'body' || role === 'title' ? 'font-chrome' : 'font-content'}`}>
              Igaühel on õigus vabalt liikuda
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const meta = { title: 'Tokens', component: Tokens } satisfies Meta<typeof Tokens>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
```

Note: the class list uses every `text-<role>` name literally in the file (`text-label`, `text-body`, `text-title`, `text-reading`, `text-headline`, `text-display`) so Tailwind's scanner sees them. That is why the `roles` array and the template string both exist. If Tailwind drops them, add the six names in a comment.

- [ ] **Step 6: Run the stories as tests**

Run: `npx vitest run --project ui`
Expected: 2 tests (`Tokens › Light`, `Tokens › Dark`) pass, no a11y violations. If Chromium is missing, run `npx playwright install chromium`.

Run: `npm run storybook` briefly and open http://localhost:6006. The Tokens story shows eight swatches and six type samples; the toolbar has a Theme switch; the a11y panel is green. Stop the server.

Run: `npm test && npm run typecheck && npm run build:ui`
Expected: all green; `packages/ui/dist/index.js` and `index.d.ts` exist.

- [ ] **Step 7: CI installs Chromium and builds the package**

In `.github/workflows/ci.yml`, after `- run: npm ci` add:
```yaml
      - run: npx playwright install --with-deps chromium
```
and after the typecheck step add:
```yaml
      - run: npm run build:ui
```

- [ ] **Step 8: Commit**

```bash
git add tokens packages/ui figma package.json package-lock.json .gitignore .github/workflows/ci.yml
git commit -m "feat(ui): React + Tailwind package with Storybook; every story runs as a test with axe

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Keycap

**Files:**
- Create: `packages/ui/src/Keycap/Keycap.tsx`, `packages/ui/src/Keycap/Keycap.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: the harness from Task 1; `rounded-keycap`.
- Produces: `Keycap(props: KeycapProps)` where `KeycapProps = ComponentProps<'kbd'> & { held?: boolean }`. Renders a `<kbd>` with `data-held="true"` while held. Button and Tile place it inside themselves.

- [ ] **Step 1: Write the stories (they are the tests)**

`packages/ui/src/Keycap/Keycap.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Keycap } from './Keycap.js';

const meta = { title: 'Keycap', component: Keycap, args: { children: '↵' } } satisfies Meta<typeof Keycap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const kbd = within(canvasElement).getByText('↵');
    await expect(kbd.tagName).toBe('KBD');
    await expect(kbd).not.toHaveAttribute('data-held');
  },
};

export const Held: Story = {
  args: { children: '⌥', held: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('⌥')).toHaveAttribute('data-held', 'true');
  },
};

export const Row: Story = {
  render: () => (
    <p className="flex items-center gap-8 text-body">
      {['←', '→', '↵', '1', '2', '3', '4', 'Tühik', '⌥'].map((k) => (
        <Keycap key={k}>{k}</Keycap>
      ))}
    </p>
  ),
};

export const Dark: Story = { args: { children: '⌥', held: true }, globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Keycap`
Expected: FAIL, cannot resolve `./Keycap.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Keycap/Keycap.tsx`:
```tsx
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type KeycapProps = ComponentProps<'kbd'> & {
  /** Drawn filled while the key is physically held, as ⌥ is during a peek. */
  held?: boolean;
};

/** A keyboard hint. Inherits its colour, so it follows the text of whatever holds it. */
export function Keycap({ held = false, className, children, ...rest }: KeycapProps) {
  return (
    <kbd
      data-held={held ? 'true' : undefined}
      className={clsx(
        'inline-flex min-w-24 items-center justify-center rounded-keycap border-[1.5px] border-current px-4 py-2 font-chrome text-label font-semibold not-italic leading-none',
        held && 'bg-ink text-on-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
```

Add to `packages/ui/src/index.ts` (replace `export {};`):
```ts
export { Keycap, type KeycapProps } from './Keycap/Keycap.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Keycap`
Expected: 4 passed, no a11y violations.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Keycap packages/ui/src/index.ts
git commit -m "feat(ui): Keycap

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Button

**Files:**
- Create: `packages/ui/src/Button/Button.tsx`, `packages/ui/src/Button/Button.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `Keycap` (Task 2).
- Produces: `Button(props: ButtonProps)` where `ButtonProps = ComponentProps<'button'> & { variant?: 'filled' | 'outline' | 'dim'; keycap?: string }`. Renders `<button type="button">` by default.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Button/Button.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button.js';

const meta = {
  title: 'Button',
  component: Button,
  args: { children: 'Edasi', keycap: '↵', onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Outline: Story = { args: { variant: 'outline', children: 'Tagasi', keycap: '←' } };

export const Dim: Story = { args: { variant: 'dim', children: 'Peida tõlked · 3', keycap: undefined } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /Edasi/ });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Bar: Story = {
  render: (args) => (
    <div className="flex items-center justify-between gap-16">
      <Button {...args} variant="outline" keycap="←">Tagasi</Button>
      <span className="text-label text-dim">Tühik peatab</span>
      <Button {...args}>Edasi</Button>
    </div>
  ),
};

export const Dark: Story = { globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Button`
Expected: FAIL, cannot resolve `./Button.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Button/Button.tsx`:
```tsx
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';

export type ButtonVariant = 'filled' | 'outline' | 'dim';

export type ButtonProps = ComponentProps<'button'> & {
  /** filled: the one primary action. outline: secondary. dim: tertiary, text only. */
  variant?: ButtonVariant;
  /** The key that triggers this action; drawn as a Keycap after the label. */
  keycap?: string;
};

const variants: Record<ButtonVariant, string> = {
  filled: 'bg-ink text-on-ink',
  outline: 'border-[1.5px] border-ink text-ink',
  dim: 'text-dim',
};

/** A pill button. Every control in Lause shows its key, so pass `keycap` whenever there is one. */
export function Button({ variant = 'filled', keycap, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        // 44px: WCAG 2.5.8 target size, a rule rather than a token
        'inline-flex min-h-[44px] items-center justify-center gap-8 rounded-control px-24 font-chrome text-body font-semibold',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
      {keycap ? <Keycap aria-hidden="true">{keycap}</Keycap> : null}
    </button>
  );
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { Button, type ButtonProps, type ButtonVariant } from './Button/Button.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Button`
Expected: 6 passed, no a11y violations. If axe reports a contrast violation on `Dim`, the token pair `dim` on `ground` is wrong, not the component: stop and report.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Button packages/ui/src/index.ts
git commit -m "feat(ui): Button, filled, outline, dim; shows its key

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Progress

**Files:**
- Create: `packages/ui/src/Progress/Progress.tsx`, `packages/ui/src/Progress/Progress.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: the harness.
- Produces: `Progress({ total, current, label })`, `total` units, `current` the zero-based index of the current unit; a `role="progressbar"` with `aria-valuenow = current`.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Progress/Progress.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Progress } from './Progress.js';

const meta = {
  title: 'Progress',
  component: Progress,
  args: { total: 8, current: 4, label: 'Lause 5 / 8' },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Midway: Story = {
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Lause 5 / 8' });
    await expect(bar).toHaveAttribute('aria-valuemax', '8');
    await expect(bar).toHaveAttribute('aria-valuenow', '4');
    await expect(bar.querySelectorAll('[data-state="done"]')).toHaveLength(4);
    await expect(bar.querySelectorAll('[data-state="current"]')).toHaveLength(1);
    await expect(bar.querySelectorAll('[data-state="rest"]')).toHaveLength(3);
  },
};

export const First: Story = { args: { current: 0, label: 'Lause 1 / 8' } };

export const Last: Story = { args: { current: 7, label: 'Lause 8 / 8' } };

export const Complete: Story = {
  args: { current: 8, label: 'Lause 8 / 8 · valmis' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar');
    await expect(bar.querySelectorAll('[data-state="done"]')).toHaveLength(8);
    await expect(bar.querySelectorAll('[data-state="current"]')).toHaveLength(0);
  },
};

export const Exam: Story = { args: { total: 24, current: 11, label: 'Küsimus 12 / 24' } };

export const Dark: Story = { globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Progress`
Expected: FAIL, cannot resolve `./Progress.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Progress/Progress.tsx`:
```tsx
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type ProgressProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Number of units: sentences, cards, questions, arrows. */
  total: number;
  /** Zero-based index of the current unit. Units before it are done. Pass `total` when everything is done. */
  current: number;
  /** Accessible name, e.g. "Lause 5 / 8". */
  label: string;
};

type SegmentState = 'done' | 'current' | 'rest';

const fills: Record<SegmentState, string> = {
  done: 'bg-ink',
  current: 'bg-accent',
  rest: 'bg-ink opacity-(--lause-opacity-faint)',
};

/** The segmented bar under every screen: done in ink, current in accent, the rest faint. */
export function Progress({ total, current, label, className, ...rest }: ProgressProps) {
  const now = Math.max(0, Math.min(current, total));
  const stateOf = (i: number): SegmentState => (i < now ? 'done' : i === now ? 'current' : 'rest');
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={now}
      className={clsx('flex w-full gap-2', className)}
      {...rest}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true" data-state={stateOf(i)} className={clsx('h-4 flex-1 rounded-control', fills[stateOf(i)])} />
      ))}
    </div>
  );
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { Progress, type ProgressProps } from './Progress/Progress.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Progress`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Progress packages/ui/src/index.ts
git commit -m "feat(ui): Progress, segmented bar, done / current / rest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Bar

**Files:**
- Create: `packages/ui/src/Bar/Bar.tsx`, `packages/ui/src/Bar/Bar.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: the harness.
- Produces: `Bar({ segments, summary })`, one segment per article, each `'retained' | 'covered' | 'unread'`; a `role="img"` whose name is `summary`, so the counts never depend on colour.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Bar/Bar.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Bar, type BarSegment } from './Bar.js';

const riigikord: BarSegment[] = ['retained', 'retained', 'retained', 'retained', 'covered', 'covered', 'unread', 'unread', 'unread', 'unread'];

const meta = {
  title: 'Bar',
  component: Bar,
  args: { segments: riigikord, summary: 'Riigikord: 4 kinnistunud, 2 loetud, 4 lugemata, kokku 10' },
} satisfies Meta<typeof Bar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Domain: Story = {
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: /Riigikord/ });
    await expect(bar.querySelectorAll('[data-segment="retained"]')).toHaveLength(4);
    await expect(bar.querySelectorAll('[data-segment="covered"]')).toHaveLength(2);
    await expect(bar.querySelectorAll('[data-segment="unread"]')).toHaveLength(4);
  },
};

export const Untouched: Story = {
  args: { segments: Array.from({ length: 48 }, () => 'unread' as const), summary: 'Põhiõigused: 0 kinnistunud, 0 loetud, 48 lugemata, kokku 48' },
};

export const Rows: Story = {
  render: (args) => (
    <dl className="flex max-w-[640px] flex-col gap-16">
      {[
        ['Riigikord', riigikord],
        ['Põhiõigused', Array.from({ length: 48 }, (_, i) => (i < 20 ? 'retained' : i < 31 ? 'covered' : 'unread') as BarSegment)],
      ].map(([name, segments]) => (
        <div key={name as string} className="flex flex-col gap-4">
          <dt className="text-label text-dim">{name as string}</dt>
          <dd>
            <Bar {...args} segments={segments as BarSegment[]} summary={`${name as string}: ${(segments as BarSegment[]).length} paragrahvi`} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

export const Dark: Story = { globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Bar`
Expected: FAIL, cannot resolve `./Bar.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Bar/Bar.tsx`:
```tsx
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type BarSegment = 'retained' | 'covered' | 'unread';

export type BarProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** One entry per article, in article order. */
  segments: readonly BarSegment[];
  /** The counts in words, e.g. "Riigikord: 4 kinnistunud, 2 loetud, 4 lugemata, kokku 10". This is the accessible name. */
  summary: string;
};

const fills: Record<BarSegment, string> = {
  retained: 'bg-ink',
  covered: 'bg-accent',
  unread: 'bg-ink opacity-(--lause-opacity-faint)',
};

/** Coverage of one domain: one segment per article. Read and retained in ink, read but not retained in accent, unread faint. */
export function Bar({ segments, summary, className, ...rest }: BarProps) {
  return (
    <div role="img" aria-label={summary} className={clsx('flex w-full gap-2', className)} {...rest}>
      {segments.map((segment, i) => (
        <span key={i} aria-hidden="true" data-segment={segment} className={clsx('h-8 flex-1 rounded-control', fills[segment])} />
      ))}
    </div>
  );
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { Bar, type BarProps, type BarSegment } from './Bar/Bar.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Bar`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Bar packages/ui/src/index.ts
git commit -m "feat(ui): Bar, one segment per article, retained / covered / unread

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Dial

**Files:**
- Create: `packages/ui/src/Dial/Dial.tsx`, `packages/ui/src/Dial/Dial.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: the harness.
- Produces: `Dial<V extends string>({ options, value, onChange, label, disabled? })`, a `role="radiogroup"` of `role="radio"` buttons with roving tabindex; arrow keys and Home/End move the selection and call `onChange`.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Dial/Dial.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Dial, type DialProps } from './Dial.js';

type Support = 'et' | 'tugi' | 'korvuti';
const support = [
  { value: 'et', label: 'Eesti keeles' },
  { value: 'tugi', label: 'Tugi' },
  { value: 'korvuti', label: 'Kõrvuti' },
] as const satisfies readonly { value: Support; label: string }[];

function Controlled(props: DialProps<Support>) {
  const [value, setValue] = useState<Support>(props.value);
  return (
    <Dial
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

const meta = {
  title: 'Dial',
  component: Dial,
  render: (args) => <Controlled {...(args as DialProps<Support>)} />,
  args: { options: support, value: 'et', label: 'Tugi', onChange: fn() },
} satisfies Meta<typeof Dial<Support>>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Support: Story = {
  play: async ({ canvasElement, args }) => {
    const group = within(canvasElement).getByRole('radiogroup', { name: 'Tugi' });
    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(3);
    await expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[1]).toHaveAttribute('tabindex', '-1');

    await userEvent.click(radios[1]);
    await expect(args.onChange).toHaveBeenLastCalledWith('tugi');
    await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
  },
};

export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    radios[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith('tugi');
    await expect(radios[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith('korvuti');
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChange).toHaveBeenLastCalledWith('et');
  },
};

export const TwoPositions: Story = {
  args: { options: [{ value: 'uuri', label: 'Uuri' }, { value: 'koosta', label: 'Koosta' }], value: 'uuri', label: 'Režiim' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'tugi' },
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio');
    await userEvent.click(radios[2]);
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const Dark: Story = { args: { value: 'korvuti' }, globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Dial`
Expected: FAIL, cannot resolve `./Dial.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Dial/Dial.tsx`:
```tsx
import { clsx } from 'clsx';
import type { KeyboardEvent } from 'react';

export type DialOption<V extends string> = { value: V; label: string };

export type DialProps<V extends string> = {
  /** Two or three positions. */
  options: readonly DialOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group, e.g. "Tugi". */
  label: string;
  disabled?: boolean;
  className?: string;
};

const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** A segmented control that behaves as a radio group: arrow keys move and select, Home/End jump. */
export function Dial<V extends string>({ options, value, onChange, label, disabled = false, className }: DialProps<V>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let next: number | undefined;
    if (event.key in steps) next = (index + steps[event.key] + options.length) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    onChange(options[next].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={clsx(
        'inline-flex rounded-control border-[1.5px] border-ink p-2 font-chrome text-label font-semibold',
        disabled && 'opacity-(--lause-opacity-dim)',
        className,
      )}
    >
      {options.map((option, i) => {
        const selected = i === index;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={clsx(
              // 44px: WCAG 2.5.8 target size
              'min-h-[44px] rounded-control px-12',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              'disabled:cursor-not-allowed',
              selected ? 'bg-ink text-on-ink' : 'text-dim',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { Dial, type DialOption, type DialProps } from './Dial/Dial.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Dial`
Expected: 5 passed. If axe flags the unselected `text-dim` segments for contrast, that is the `dim` on `ground` pair (5.47:1) and passes; if it flags anything else, fix the markup, not the rule.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Dial packages/ui/src/index.ts
git commit -m "feat(ui): Dial, segmented radiogroup with arrow-key selection

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Tile and TileStack

**Files:**
- Create: `packages/ui/src/Tile/Tile.tsx`, `packages/ui/src/Tile/Tile.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `Keycap` (Task 2).
- Produces: `Tile(props: TileProps)` where `TileProps = ComponentProps<'button'> & { state?: 'idle' | 'selected' | 'filled' | 'dimmed'; keycap?: string }`, a `<button>` with `aria-pressed` = selected; `TileStack(props: ComponentProps<'div'>)`, a `role="group"` column, 640px wide at most.

- [ ] **Step 1: Write the stories**

`packages/ui/src/Tile/Tile.stories.tsx`:
```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Tile, TileStack } from './Tile.js';

const options = [
  'Riigikogu',
  'Vabariigi President',
  'Vabariigi Valitsus',
  'Riigikohus',
];

const meta = {
  title: 'Tile',
  component: Tile,
  args: { children: 'Vabariigi President', keycap: '2', onClick: fn() },
} satisfies Meta<typeof Tile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const tile = within(canvasElement).getByRole('button', { name: /Vabariigi President/ });
    await expect(tile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tile);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Selected: Story = {
  args: { state: 'selected' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Filled: Story = { args: { state: 'filled' } };

export const Dimmed: Story = { args: { state: 'dimmed' } };

export const Stack: Story = {
  render: (args) => (
    <TileStack aria-label="Vali õige vastus">
      {options.map((option, i) => (
        <Tile {...args} key={option} keycap={String(i + 1)} state={i === 1 ? 'selected' : 'idle'}>
          {option}
        </Tile>
      ))}
    </TileStack>
  ),
  play: async ({ canvasElement, args }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Vali õige vastus' });
    const tiles = within(group).getAllByRole('button');
    await expect(tiles).toHaveLength(4);
    await userEvent.click(tiles[3]);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const TrueFalse: Story = {
  render: (args) => (
    <div className="flex max-w-[640px] gap-12">
      <Tile {...args} keycap="1" className="justify-center text-center">õige</Tile>
      <Tile {...args} keycap="2" className="justify-center text-center">vale</Tile>
    </div>
  ),
};

export const Dark: Story = { args: { state: 'selected' }, globals: { theme: 'dark' } };
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run --project ui src/Tile`
Expected: FAIL, cannot resolve `./Tile.js`.

- [ ] **Step 3: Implement**

`packages/ui/src/Tile/Tile.tsx`:
```tsx
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import { Keycap } from '../Keycap/Keycap.js';

export type TileState = 'idle' | 'selected' | 'filled' | 'dimmed';

export type TileProps = ComponentProps<'button'> & {
  /** idle: available. selected: chosen, accent ring. filled: written in, ink. dimmed: no longer relevant. */
  state?: TileState;
  /** The number key that picks this tile. */
  keycap?: string;
};

const states: Record<TileState, string> = {
  idle: 'bg-surface text-ink shadow-tile',
  selected: 'bg-surface text-ink shadow-tile ring-2 ring-accent',
  filled: 'bg-ink text-on-ink',
  dimmed: 'bg-surface text-dim shadow-tile',
};

/** An option or word tile. Tiles stack vertically in a TileStack; they never sit in a row except the two of a true/false item. */
export function Tile({ state = 'idle', keycap, className, children, type = 'button', ...rest }: TileProps) {
  return (
    <button
      type={type}
      data-state={state}
      aria-pressed={state === 'selected'}
      className={clsx(
        // 44px: WCAG 2.5.8 target size
        'flex min-h-[44px] w-full items-center gap-16 rounded-control px-24 py-12 text-left font-content text-title font-normal',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)',
        states[state],
        className,
      )}
      {...rest}
    >
      {keycap ? <Keycap aria-hidden="true" className="shrink-0">{keycap}</Keycap> : null}
      <span className="flex-1">{children}</span>
    </button>
  );
}

/** The column that holds option tiles: 640px wide at most, one tile per row. */
export function TileStack({ className, ...rest }: ComponentProps<'div'>) {
  return <div role="group" className={clsx('flex w-full max-w-[640px] flex-col gap-12', className)} {...rest} />;
}
```

Add to `packages/ui/src/index.ts`:
```ts
export { Tile, TileStack, type TileProps, type TileState } from './Tile/Tile.js';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run --project ui src/Tile`
Expected: 7 passed.

Run: `npm test && npm run typecheck && npm run build:ui`
Expected: all green across both packages.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/Tile packages/ui/src/index.ts
git commit -m "feat(ui): Tile and TileStack, idle, selected, filled, dimmed

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Changesets, the release workflow, docs, and the pull request

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md` (written by `changeset init`), `.changeset/first-components.md`, `.github/workflows/release.yml`
- Modify: `package.json` (root), `packages/ui/package.json`, `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: `npx changeset` as the way every future pull request declares its version bump; merging to `main` opens a "Version Packages" pull request; merging that publishes `lause-ds` to npm once `NPM_TOKEN` exists.

- [ ] **Step 1: Install and initialise changesets**

```bash
npm install -D @changesets/cli@3.0.1
npx changeset init
```

Set `.changeset/config.json` to exactly:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "version": false, "tag": false },
  "ignore": []
}
```

Add to root `package.json` scripts:
```json
    "changeset": "changeset",
    "release": "npm run build:tokens && npm run build:ui && changeset publish"
```

- [ ] **Step 2: Make `lause-ds` publishable**

In `packages/ui/package.json`: change `"private": true` to `"private": false`, and add after `"description"`:
```json
  "repository": { "type": "git", "url": "git+https://github.com/rockgomes/lause-ds.git", "directory": "packages/ui" },
  "license": "MIT",
  "publishConfig": { "access": "public" },
```

`@lause-ds/tokens` stays private; changesets ignores it for publishing.

- [ ] **Step 3: The first changeset**

`.changeset/first-components.md`:
```md
---
"lause-ds": minor
---

First components: Keycap, Button, Progress, Bar, Dial, Tile and TileStack, on the token theme. Styles ship as `lause-ds/styles.css`.
```

Run: `npx changeset status`
Expected: `lause-ds` listed for a minor bump (0.0.0 → 0.1.0).

- [ ] **Step 4: The release workflow**

`.github/workflows/release.yml`:
```yaml
name: release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
  id-token: write
concurrency: release-${{ github.ref }}
jobs:
  release:
    runs-on: ubuntu-latest
    env:
      HAS_NPM_TOKEN: ${{ secrets.NPM_TOKEN != '' }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - name: version or publish
        if: env.HAS_NPM_TOKEN == 'true'
        uses: changesets/action@v1
        with:
          version: npx changeset version
          publish: npm run release
          commit: "chore: version packages"
          title: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - name: no npm token yet
        if: env.HAS_NPM_TOKEN != 'true'
        run: echo "NPM_TOKEN is not set; skipping version and publish. Add the secret in the repo settings to enable releases."
```

The workflow needs one thing only Rock can do: create an npm automation token for `lause-ds` and add it as the `NPM_TOKEN` repository secret. Until then the job runs and skips with the message above; CI stays green.

- [ ] **Step 5: README**

In `README.md`, replace the `## Status` line with:
```markdown
Foundation and the first six components done: Keycap, Button, Progress, Bar, Dial, Tile. Every story is a test with an axe check. Releases go through changesets. Reading components next (Plan 3).
```

Replace the `## Layout` block with:
```
tokens/           W3C design-token JSON: the single source
packages/tokens   the token build tool (private)
packages/ui       lause-ds: React + Tailwind components, one folder per component, stories beside them
packages/mcp      the MCP server; reads tokens/ and packages/ui (Plan 5)
figma/            variables export, Code Connect mappings (Plan 4)
docs/             specs, plans, component rules
```

Add after the "Consuming them" note in `## Using the tokens today`, and rename that section to `## Using the system`:
````markdown
Components:

```tsx
import { Button, Dial, Tile, TileStack } from 'lause-ds';
import 'lause-ds/styles.css';
```

Tailwind v4 consumers add `@source "../node_modules/lause-ds/dist";` to their CSS so the components' classes are generated, and load Young Serif and Instrument Sans themselves (Google Fonts, or self-hosted).

## The workshop

```bash
npm run storybook   # every component, every state, light and dark, with the a11y panel
npm test            # runs every story in Chromium: play functions, then axe; a violation fails
npx changeset       # every pull request that changes lause-ds declares its bump here
```
````

- [ ] **Step 6: Run everything, commit, open the pull request**

Run: `npm test && npm run typecheck && npm run build:ui && npx changeset status`
Expected: all green.

```bash
git add .changeset .github/workflows/release.yml package.json package-lock.json packages/ui/package.json README.md
git commit -m "chore(release): changesets and a release workflow; lause-ds is publishable

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push -u origin feat/components
gh pr create --base main --head feat/components --title "feat: components and the workshop: six components, Storybook, stories as axe-checked tests, changesets" --body "Plan 2 of the Lause design system.

- packages/ui is a real package: React 19 + Tailwind v4 on the token theme, built with tsc to dist/
- Storybook 10 workshop; every story runs in Chromium as a vitest test, replays its play function, and fails on any axe violation
- light and dark as a Storybook global; every component has a Dark story
- components: Keycap, Button, Progress, Bar, Dial, Tile + TileStack
- changesets + a release workflow that versions and publishes when NPM_TOKEN is set (skips cleanly until then)

Proof screens: the app does not exist yet, so the stories built from the Lause frames are each component's proof for now.

Spec: docs/specs/2026-09-03-lause-ds-design.md · Plan: docs/superpowers/plans/2026-09-03-components-workshop.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 7: Confirm CI**

Run: `gh pr checks --watch`
Expected: `test` passes (typecheck, token build, drift check, ui build, story tests in Chromium). If the story tests time out on CI, raise `test.testTimeout` in `packages/ui/vitest.config.ts` to `20000` and push.

---

## Self-review

**Spec coverage.** Decision 5 React + Tailwind (Task 1). Decision 7's workshop half: Storybook with every state (Tasks 1–7; the public deploy is Plan 6). Decision 8 changesets + semver + publish on merge (Task 8). Decision 10 axe per story failing the pull request (Task 1 harness, every story). Decision 6 dark mode proven per component (`Dark` stories). §4 rows Keycap, Button, Tile, Progress, Bar, Dial (Tasks 2–7); Sentence, Bubble, Cell, Nav deferred to Plan 3 by the scope note. §7 proof screens: stated deviation, the app does not exist.

**Placeholders.** None: every step carries file contents. Two conditional instructions on purpose (Storybook export names at the installed version; CI timeout).

**Type consistency.** `KeycapProps` (Task 2) is consumed as `<Keycap aria-hidden="true">` in Tasks 3 and 7. `ButtonProps`, `ProgressProps`, `BarProps`/`BarSegment`, `DialProps`/`DialOption`, `TileProps`/`TileState` are exported from `src/index.ts` with the same names in each task. The `theme` global name (`'light' | 'dark'`) from Task 1's preview is what every `Dark` story sets. `rounded-keycap` exists because Task 1 adds `radius.keycap`.
