// Tests import components directly (not `src/main.tsx`), so the app's stylesheet — Tailwind, the
// closed theme, and the small `@layer components` rules in `app.css` — never loads on its own.
// Several tests (Nav side padding, term-mark underline, no-overflow at 320px) assert on actual
// computed layout and style, so the sheet needs to be present.
import '../src/app.css';
