/**
 * The five bundled mudras (docs/SPEC.md §1.1). Read-only, compiled into the app.
 * Benefits are phrased as traditional associations, never medical claims.
 */

export type ElementId = 'fire' | 'air' | 'space' | 'earth' | 'water';
export type Finger = 'thumb' | 'index' | 'middle' | 'ring' | 'little';
export type IntentId = 'calm-focus' | 'energy' | 'digestion' | 'balance' | 'ear-head';
export type IntentFilter = 'all' | IntentId;
export type MudraId = 'gyan' | 'prana' | 'apana' | 'vayu' | 'shunya';

export interface Mudra {
  id: MudraId;
  name: string;
  sanskrit: string;
  meaning: string;
  /** First entry is the primary intent (used for grouping on Home). */
  intents: IntentId[];
  elements: { finger: Finger; element: ElementId; action: 'touch' | 'fold' }[];
  /** Initial letter used by the placeholder image until real line art lands. */
  initial: string;
  imageAlt: string;
  steps: string[];
  benefits: string[];
  cautions?: string;
  suggestedMinutes: number;
}

export const INTENTS: { id: IntentId; label: string; heading: string }[] = [
  { id: 'calm-focus', label: 'Calm & Focus', heading: 'Calm & Focus' },
  { id: 'energy', label: 'Energy', heading: 'Energy & Vitality' },
  { id: 'digestion', label: 'Digestion', heading: 'Digestion & Detox' },
  { id: 'balance', label: 'Balance', heading: 'Balance & Relief' },
  { id: 'ear-head', label: 'Ear & Head', heading: 'Ear & Head' },
];

export const ELEMENT_LABEL: Record<ElementId, string> = {
  fire: 'Fire',
  air: 'Air',
  space: 'Space',
  earth: 'Earth',
  water: 'Water',
};

export const FINGER_LABEL: Record<Finger, string> = {
  thumb: 'Thumb',
  index: 'Index',
  middle: 'Middle',
  ring: 'Ring',
  little: 'Little',
};

export const MUDRAS: Mudra[] = [
  {
    id: 'gyan',
    name: 'Gyan Mudra',
    sanskrit: 'ज्ञान मुद्रा',
    meaning: 'Gesture of knowledge',
    intents: ['calm-focus'],
    elements: [
      { finger: 'index', element: 'air', action: 'touch' },
      { finger: 'thumb', element: 'fire', action: 'touch' },
    ],
    initial: 'G',
    imageAlt:
      'Right hand resting palm up. The tip of the index finger touches the tip of the thumb, forming a small circle. The other three fingers are relaxed and extended.',
    steps: [
      'Sit comfortably with your back tall and hands resting on your knees, palms up.',
      'Gently touch the tip of your index finger to the tip of your thumb.',
      'Keep the other three fingers relaxed and softly extended.',
      'Rest your attention on the breath.',
    ],
    benefits: [
      'Calmer, steadier attention',
      'Support for memory and study',
      'Easing restlessness',
    ],
    suggestedMinutes: 10,
  },
  {
    id: 'prana',
    name: 'Prana Mudra',
    sanskrit: 'प्राण मुद्रा',
    meaning: 'Gesture of life force',
    intents: ['energy', 'calm-focus'],
    elements: [
      { finger: 'ring', element: 'earth', action: 'touch' },
      { finger: 'little', element: 'water', action: 'touch' },
      { finger: 'thumb', element: 'fire', action: 'touch' },
    ],
    initial: 'P',
    imageAlt:
      'Right hand palm up. The tips of the ring finger and little finger both touch the tip of the thumb. The index and middle fingers stay straight.',
    steps: [
      'Sit comfortably, hands resting palms up.',
      'Bend your ring and little fingers so their tips meet the tip of your thumb.',
      'Keep the index and middle fingers straight but relaxed.',
      'Breathe slowly and evenly.',
    ],
    benefits: [
      'A sense of renewed energy',
      'Steadiness when tired',
      'Grounded, settled attention',
    ],
    suggestedMinutes: 10,
  },
  {
    id: 'apana',
    name: 'Apana Mudra',
    sanskrit: 'अपान मुद्रा',
    meaning: 'Gesture of downward flow',
    intents: ['digestion'],
    elements: [
      { finger: 'middle', element: 'space', action: 'touch' },
      { finger: 'ring', element: 'earth', action: 'touch' },
      { finger: 'thumb', element: 'fire', action: 'touch' },
    ],
    initial: 'A',
    imageAlt:
      'Right hand palm up. The tips of the middle and ring fingers touch the tip of the thumb. The index and little fingers are extended.',
    steps: [
      'Sit comfortably, hands resting palms up.',
      'Bring the tips of your middle and ring fingers to the tip of your thumb.',
      'Let the index and little fingers stay extended.',
      'Breathe naturally.',
    ],
    benefits: [
      'Traditionally linked with digestion',
      'A feeling of release and lightness',
      'Settling after meals',
    ],
    suggestedMinutes: 10,
  },
  {
    id: 'vayu',
    name: 'Vayu Mudra',
    sanskrit: 'वायु मुद्रा',
    meaning: 'Gesture of air',
    intents: ['balance'],
    elements: [
      { finger: 'index', element: 'air', action: 'fold' },
      { finger: 'thumb', element: 'fire', action: 'touch' },
    ],
    initial: 'V',
    imageAlt:
      'Right hand palm up. The index finger is folded so its tip rests at the base of the thumb, and the thumb presses lightly over it. The other fingers are extended.',
    steps: [
      'Sit comfortably, hands resting palms up.',
      'Fold your index finger so its tip rests at the base of your thumb.',
      'Press the thumb gently over the folded index finger.',
      'Keep the remaining fingers relaxed and extended.',
    ],
    benefits: [
      'Traditionally used to ease restlessness',
      'A sense of balance and ease',
      'Calming an overactive mind',
    ],
    cautions: 'Practice Vayu only until you feel at ease. Not medical advice.',
    suggestedMinutes: 5,
  },
  {
    id: 'shunya',
    name: 'Shunya Mudra',
    sanskrit: 'शून्य मुद्रा',
    meaning: 'Gesture of emptiness',
    intents: ['ear-head', 'balance'],
    elements: [
      { finger: 'middle', element: 'space', action: 'fold' },
      { finger: 'thumb', element: 'fire', action: 'touch' },
    ],
    initial: 'S',
    imageAlt:
      'Right hand palm up. The middle finger is folded so its tip rests at the base of the thumb, and the thumb presses lightly over it. The other fingers are extended.',
    steps: [
      'Sit comfortably, hands resting palms up.',
      'Fold your middle finger so its tip rests at the base of your thumb.',
      'Press the thumb gently over the folded middle finger.',
      'Keep the other fingers extended and soft.',
    ],
    benefits: [
      'Traditionally associated with ear and head comfort',
      'A quieter, more spacious feeling',
      'Easing a sense of heaviness',
    ],
    cautions: 'Practice gently and stop if uncomfortable. Not medical advice.',
    suggestedMinutes: 5,
  },
];

/** Preset chips; any other length (1–60) comes from the custom stepper. */
export const DURATION_PRESETS = [3, 5, 10, 15] as const;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 60;

export function getMudra(id: string | undefined): Mudra | undefined {
  return MUDRAS.find((m) => m.id === id);
}
