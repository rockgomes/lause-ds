import { useState, type ReactNode } from 'react';
import {
  Bar,
  Bubble,
  Button,
  Cell,
  CellGrid,
  Dial,
  Keycap,
  Nav,
  Progress,
  Sentence,
  Tile,
  TileStack,
  usePeek,
  type BarSegment,
  type CellState,
  type NavItem,
  type Segment,
  type TileState,
} from 'lause-ds';

// Every sample below is copied from the matching component's story
// (`packages/ui/src/<Name>/<Name>.stories.tsx`), not invented here — so the gallery shows the
// same fixtures the component's own tests already prove correct.

function KeycapExample() {
  return (
    <p className="flex items-center gap-8 text-body">
      <Keycap>↵</Keycap>
      <Keycap held>⌥</Keycap>
    </p>
  );
}

function ButtonExample() {
  return (
    <Button keycap="↵" onClick={() => {}}>
      Edasi
    </Button>
  );
}

function ProgressExample() {
  return <Progress total={8} current={4} label="Lause 5 / 8" />;
}

// packages/ui/src/Bar/Bar.stories.tsx — the Domain story's segments.
const riigikord: BarSegment[] = ['retained', 'retained', 'retained', 'retained', 'covered', 'covered', 'unread', 'unread', 'unread', 'unread'];

function BarExample() {
  return <Bar segments={riigikord} label="Riigikord: 4 kinnistunud, 2 loetud, 4 lugemata, kokku 10" />;
}

// packages/ui/src/Dial/Dial.stories.tsx — the Support story's options.
type Support = 'et' | 'tugi' | 'korvuti';
const supportOptions = [
  { value: 'et', label: 'Eesti keeles' },
  { value: 'tugi', label: 'Tugi' },
  { value: 'korvuti', label: 'Kõrvuti' },
] as const satisfies readonly { value: Support; label: string }[];

function DialExample() {
  const [value, setValue] = useState<Support>('et');
  return <Dial options={supportOptions} value={value} onChange={setValue} label="Tugi" />;
}

function TileExample() {
  const [state, setState] = useState<TileState>('selected');
  return (
    <Tile keycap="2" state={state} onClick={() => setState((s) => (s === 'selected' ? 'idle' : 'selected'))}>
      Vabariigi President
    </Tile>
  );
}

// packages/ui/src/Tile/Tile.stories.tsx — the Stack story's options, minus Riigikohus.
const stackOptions = ['Riigikogu', 'Vabariigi President', 'Vabariigi Valitsus'];

function TileStackExample() {
  const [selected, setSelected] = useState(1);
  return (
    <TileStack label="Valikud">
      {stackOptions.map((option, i) => (
        <Tile key={option} keycap={String(i + 1)} state={i === selected ? 'selected' : 'idle'} onClick={() => setSelected(i)}>
          {option}
        </Tile>
      ))}
    </TileStack>
  );
}

function BubbleExample() {
  // The story's own `Word` wrapper (Bubble.stories.tsx): `text-reading font-content` on the <p>,
  // a bare `relative` span as the anchor. At `text-reading` size "kandideerida" is wider than a
  // phone-width card and doesn't have a natural break point, so — like Nav and CellGrid — this
  // card's example scrolls horizontally instead of overflowing the page (Components.tsx's
  // `SCROLLS` set) rather than being forced to hyphenate or shrink away from the story's sample.
  return (
    <p className="mt-64 font-content text-reading">
      <span className="relative">
        kandideerida
        <Bubble count={1}>to stand as a candidate</Bubble>
      </span>
    </p>
  );
}

// packages/ui/src/Sentence/Sentence.stories.tsx — the default args' segments and neighbours.
const sentenceSegments: Segment[] = [
  'Riigikogusse võib ',
  { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate' },
  ' iga vähemalt kahekümne ühe aastane ',
  { id: 'haaleoiguslik', text: 'hääleõiguslik', gloss: 'with the right to vote' },
  ' Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  '.',
];

function SentenceExample() {
  const [pinned, setPinned] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  return (
    <Sentence
      segments={sentenceSegments}
      previous="Riigikogu liikmed valitakse vabadel valimistel proportsionaalsuse põhimõtte alusel."
      next="Riigikogu liikmete valimise korra sätestab Riigikogu valimise seadus."
      support="tugi"
      pinned={pinned}
      counts={counts}
      onToggle={(id) => {
        if (pinned.includes(id)) setPinned(pinned.filter((p) => p !== id));
        else {
          setPinned([...pinned, id]);
          setCounts({ ...counts, [id]: (counts[id] ?? 0) + 1 });
        }
      }}
      english={{
        text: 'Any citizen of Estonia with the right to vote who is at least twenty-one years old may stand as a candidate for the Riigikogu.',
        note: 'Constitution §60',
      }}
      label="Lause 5 / 8"
    />
  );
}

function UsePeekExample() {
  const { held } = usePeek({ enabled: true });
  return (
    <p className="flex items-center gap-8 text-body">
      <Keycap held={held}>⌥</Keycap>
      <span>Hold ⌥ anywhere on this page.</span>
    </p>
  );
}

// packages/ui/src/Nav/Nav.stories.tsx — the Reader story's args.
const navItems: NavItem[] = [
  { id: 'lugeja', label: 'Lugeja', labelEn: 'Reader', href: '#lugeja' },
  { id: 'skeemid', label: 'Skeemid', labelEn: 'Diagrams', href: '#skeemid' },
  { id: 'kordamine', label: 'Kordamine', labelEn: 'Review', href: '#kordamine', count: 14 },
  { id: 'eksam', label: 'Eksam', labelEn: 'Exam', href: '#eksam' },
];

function NavExample() {
  const [current, setCurrent] = useState('lugeja');
  const [support, setSupport] = useState<Support>('tugi');
  return (
    <Nav
      context="§ 60 · lause 5 / 8"
      items={navItems}
      current={current}
      onNavigate={setCurrent}
      label="Peamenüü"
      controls={
        <>
          <Dial label="Tugi" value={support} onChange={setSupport} options={supportOptions} />
          <span className="flex items-center gap-8 text-label text-dim">
            <Keycap>⌥</Keycap> piilu
          </span>
        </>
      }
    />
  );
}

function CellExample() {
  const [state, setState] = useState<CellState>('idle');
  return (
    <Cell
      subject="Igaüks"
      verdict="tohib piirata"
      keycap="1"
      state={state}
      onClick={() => setState((s) => (s === 'selected' ? 'idle' : 'selected'))}
    />
  );
}

function CellGridExample() {
  const [selected, setSelected] = useState(1);
  return (
    <CellGrid rows={['Igaüks', 'Eesti kodanik']} columns={['Tohib piirata', 'Ei tohi piirata · § 130']} label="Õigused">
      <Cell subject="Igaüks" verdict="tohib piirata" keycap="1" state={selected === 0 ? 'selected' : 'idle'} onClick={() => setSelected(0)} />
      <Cell subject="Igaüks" verdict="ei tohi piirata" keycap="2" state={selected === 1 ? 'selected' : 'idle'} onClick={() => setSelected(1)} />
      <Cell subject="Eesti kodanik" verdict="tohib piirata" keycap="3" state={selected === 2 ? 'selected' : 'idle'} onClick={() => setSelected(2)} />
      <Cell subject="Eesti kodanik" verdict="ei tohi piirata" keycap="4" state={selected === 3 ? 'selected' : 'idle'} onClick={() => setSelected(3)} />
    </CellGrid>
  );
}

/** One live example per manifest component, keyed by name, in the same order `componentDocs()` returns. */
export const EXAMPLES: Record<string, () => ReactNode> = {
  Keycap: KeycapExample,
  Button: ButtonExample,
  Progress: ProgressExample,
  Bar: BarExample,
  Dial: DialExample,
  Tile: TileExample,
  TileStack: TileStackExample,
  Bubble: BubbleExample,
  Sentence: SentenceExample,
  usePeek: UsePeekExample,
  Nav: NavExample,
  Cell: CellExample,
  CellGrid: CellGridExample,
};
