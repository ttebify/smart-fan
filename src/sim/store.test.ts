import { beforeEach, describe, expect, it } from 'vitest';
import { KINDS, KIND_IDS, kindSpec } from '@/sim/kinds';
import { useStore } from '@/sim/store';

const initial = useStore.getState();
beforeEach(() => useStore.setState(initial, true));

describe('kinds', () => {
  it('lists every kind with a detector score in 0..1', () => {
    expect(KIND_IDS).toEqual(Object.keys(KINDS));
    for (const id of KIND_IDS) {
      const k = kindSpec(id);
      expect(k.base).toBeGreaterThanOrEqual(0);
      expect(k.base).toBeLessThanOrEqual(1);
    }
  });

  it('scores a person above anything else', () => {
    const others = KIND_IDS.filter(id => id !== 'person').map(id => kindSpec(id).base);
    expect(kindSpec('person').base).toBeGreaterThan(Math.max(...others));
  });
});

describe('store', () => {
  it('spawns entities with unique ids and the kind spec applied', () => {
    const { spawn } = useStore.getState();
    const a = spawn('wardrobe', 1, 2);
    const b = spawn('person', 0, 0);
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ kind: 'wardrobe', x: 1, z: 2, base: KINDS.wardrobe.base, blocker: KINDS.wardrobe.blocker });
    expect(useStore.getState().entities).toContain(b);
  });

  it('gives each new person the next shirt colour', () => {
    const { spawn } = useStore.getState();
    const a = spawn('person', 0, 0), b = spawn('person', 1, 0);
    expect(b.shirt).toBe(a.shirt + 1);
    expect(spawn('chair', 0, 0).shirt).toBe(0);
  });

  it('removes an entity', () => {
    const e = useStore.getState().spawn('lamp', 0, 0);
    useStore.getState().remove(e);
    expect(useStore.getState().entities).not.toContain(e);
  });

  it('updates one param without touching the others', () => {
    const before = useStore.getState().params;
    useStore.getState().setParam('margin', 12);
    expect(useStore.getState().params).toEqual({ ...before, margin: 12 });
  });
});
