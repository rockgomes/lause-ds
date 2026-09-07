/** idle: available. selected: chosen, accent ring. filled: written in, ink. dimmed: no longer relevant. Shared by Tile and Cell. */
export type SurfaceState = 'idle' | 'selected' | 'filled' | 'dimmed';
/** Focus ring and disabled treatment shared by every interactive component. */
export const focusRing = 'focus-visible:outline-(length:--lause-stroke-focus) focus-visible:outline-offset-2 focus-visible:outline-accent';
export const disabledControl = 'disabled:cursor-not-allowed disabled:opacity-(--lause-opacity-dim)';
/** WCAG 2.5.8 minimum target size, a rule, not a token. */
export const hitTarget = 'min-h-[44px]';
/** 120 ms colour fade on hover and press; none under reduced motion. */
export const hoverFade = 'transition-colors duration-120 motion-reduce:transition-none';
