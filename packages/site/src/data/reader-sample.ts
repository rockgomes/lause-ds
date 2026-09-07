import type { Segment, Support } from 'lause-ds';

// The Sentence story's default args (packages/ui/src/Sentence/Sentence.stories.tsx) and the Dial
// story's Support options (packages/ui/src/Dial/Dial.stories.tsx). Both the Components gallery
// (`sections/examples.tsx`) and the Reader section (`sections/Reader.tsx`) import these, never
// duplicate them.

export const sentenceSegments: Segment[] = [
  'Riigikogusse võib ',
  { id: 'kandideerida', text: 'kandideerida', gloss: 'to stand as a candidate' },
  ' iga vähemalt kahekümne ühe aastane ',
  { id: 'haaleoiguslik', text: 'hääleõiguslik', gloss: 'with the right to vote' },
  ' Eesti ',
  { id: 'kodanik', text: 'kodanik', gloss: 'citizen' },
  '.',
];

export const sentencePrevious = 'Riigikogu liikmed valitakse vabadel valimistel proportsionaalsuse põhimõtte alusel.';
export const sentenceNext = 'Riigikogu liikmete valimise korra sätestab Riigikogu valimise seadus.';

export const sentenceEnglish = {
  text: 'Any citizen of Estonia with the right to vote who is at least twenty-one years old may stand as a candidate for the Riigikogu.',
  note: 'Constitution §60',
};

// Labels per the Reader ruling (Rock 2026-09-06): short chrome labels, not the story's
// "Eesti keeles", the gallery's Dial example takes the same three now, so both read alike.
export const supportOptions = [
  { value: 'et', label: 'Eesti' },
  { value: 'tugi', label: 'Tugi' },
  { value: 'korvuti', label: 'Kõrvuti' },
] as const satisfies readonly { value: Support; label: string }[];
