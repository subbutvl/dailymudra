import { MUDRAS } from '@/content/mudras';
import { filterByIntent, groupByPrimaryIntent } from '../filterByIntent';

describe('library', () => {
  it('has exactly the five bundled mudras', () => {
    expect(MUDRAS.map((m) => m.id)).toEqual(['gyan', 'prana', 'apana', 'vayu', 'shunya']);
  });

  it('"all" returns every mudra', () => {
    expect(filterByIntent(MUDRAS, 'all')).toHaveLength(5);
  });

  it('matches primary and secondary intents', () => {
    expect(filterByIntent(MUDRAS, 'calm-focus').map((m) => m.id)).toEqual(['gyan', 'prana']);
    expect(filterByIntent(MUDRAS, 'balance').map((m) => m.id)).toEqual(['vayu', 'shunya']);
  });

  it('groups by primary intent only', () => {
    const groups = groupByPrimaryIntent(MUDRAS);
    expect(groups.map((g) => [g.intent, g.mudras.map((m) => m.id)])).toEqual([
      ['calm-focus', ['gyan']],
      ['energy', ['prana']],
      ['digestion', ['apana']],
      ['balance', ['vayu']],
      ['ear-head', ['shunya']],
    ]);
  });
});
