import { INTENTS, type IntentFilter, type IntentId, type Mudra } from '@/content/mudras';

/** Every mudra tagged with the intent (primary or secondary). "all" returns the input. */
export function filterByIntent(mudras: Mudra[], intent: IntentFilter): Mudra[] {
  if (intent === 'all') return mudras;
  return mudras.filter((m) => m.intents.includes(intent));
}

/** Groups mudras under their primary intent, in INTENTS order, skipping empty groups. */
export function groupByPrimaryIntent(mudras: Mudra[]): { intent: IntentId; heading: string; mudras: Mudra[] }[] {
  return INTENTS.map((i) => ({
    intent: i.id,
    heading: i.heading,
    mudras: mudras.filter((m) => m.intents[0] === i.id),
  })).filter((g) => g.mudras.length > 0);
}
