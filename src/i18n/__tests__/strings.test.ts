import { INTENTS, MUDRAS } from '@/content/mudras';
import { MUDRAS_TA, INTENTS_TA } from '../mudras.ta';
import { format, STRINGS, translate } from '../strings';

describe('i18n', () => {
  it('Tamil has a non-empty value for every English key, with the same placeholders', () => {
    for (const key of Object.keys(STRINGS.en) as (keyof typeof STRINGS.en)[]) {
      const en = STRINGS.en[key];
      const ta = STRINGS.ta[key];
      expect(ta.trim().length).toBeGreaterThan(0);
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect({ key, vars: vars(ta) }).toEqual({ key, vars: vars(en) });
    }
  });

  it('every mudra and intent has Tamil content of the same shape', () => {
    for (const m of MUDRAS) {
      const ta = MUDRAS_TA[m.id];
      expect(ta.steps).toHaveLength(m.steps.length);
      expect(ta.benefits).toHaveLength(m.benefits.length);
      expect(Boolean(ta.cautions)).toBe(Boolean(m.cautions));
    }
    for (const i of INTENTS) expect(INTENTS_TA[i.id].label.length).toBeGreaterThan(0);
  });

  it('formats placeholders', () => {
    expect(format('{n} of {name}', { n: 5, name: 'Gyan' })).toBe('5 of Gyan');
    expect(format('{missing}')).toBe('{missing}');
    expect(translate('en', 'timeLeft', { time: '08:42' })).toBe('08:42 left');
  });
});
