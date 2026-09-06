export const SECTIONS = [
  { id: 'story', label: 'Story' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'components', label: 'Components' },
  { id: 'reader', label: 'Reader' },
  { id: 'ask', label: 'Ask' },
  { id: 'install', label: 'Install' },
] as const;

export function App() {
  return (
    <div className="min-h-screen bg-ground font-chrome text-body text-ink">
      <main>
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mx-auto max-w-[1020px] px-16 py-64">
            <h2 id={`${s.id}-title`} className="font-content text-headline">{s.label}</h2>
          </section>
        ))}
      </main>
    </div>
  );
}
