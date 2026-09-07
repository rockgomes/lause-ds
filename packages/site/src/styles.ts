// Copied from `packages/ui/src/styles.ts`: `focusRing`, `hitTarget` and `hoverFade` are not
// exported from `lause-ds` (Plan 3 parked that), so the site keeps its own small copy for the
// link row and other chrome it renders itself (see the Components gallery's Storybook/Figma/
// Source links, and `Hero.tsx`'s Storybook link, which copies the same strings by hand).
/** Focus ring and disabled treatment shared by every interactive component. */
export const focusRing = 'focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent';
/** WCAG 2.5.8 minimum target size, a rule, not a token. */
export const hitTarget = 'min-h-[44px]';
/** 120 ms colour fade on hover and press; none under reduced motion. */
export const hoverFade = 'transition-colors duration-120 motion-reduce:transition-none';
