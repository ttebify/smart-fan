import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BEAM, Brain, FAN, FOV, MECH, RANGE, bearingOf, distOf, inRoom, occluded, sense,
  type Body, type Params, type Reading,
} from '@/brain';

// noise: 0 removes the random misses, spikes and jitter, so the sensor is deterministic.
const params = (over: Partial<Params> = {}): Params =>
  ({ threshold: 0.7, margin: 8, hold: 3, noise: 0, smart: true, gapSkip: true, ...over });

const person = (id: number, x: number, z: number): Body => ({ id, kind: 'person', x, z, base: 0.93 });
const wardrobe = (id: number, x: number, z: number): Body =>
  ({ id, kind: 'wardrobe', x, z, base: 0.03, blocker: { hw: 0.8, hd: 0.32 } });

/** Runs the brain at 10 Hz, one sensor frame per step. */
function run(brain: Brain, bodies: Body[], p: Params, seconds: number, start = 0) {
  const steps = Math.round(seconds * 10);
  for (let i = 1; i <= steps; i++) brain.update(0.1, start + i * 0.1, bodies, p);
  return start + steps * 0.1;
}

afterEach(() => vi.restoreAllMocks());

describe('constants', () => {
  it('lets the sensor see further than the fan can turn', () => {
    expect(FOV).toBeGreaterThan(MECH);
    expect(BEAM).toBeGreaterThan(0);
  });
});

describe('geometry', () => {
  it('measures bearing as 0 straight ahead and positive towards +x', () => {
    expect(bearingOf(FAN.x, 0)).toBeCloseTo(0);
    expect(bearingOf(FAN.x + 1, FAN.z + 1)).toBeCloseTo(45);
    expect(bearingOf(FAN.x - 1, FAN.z + 1)).toBeCloseTo(-45);
  });

  it('measures distance from the fan', () => {
    expect(distOf(FAN.x + 3, FAN.z + 4)).toBeCloseTo(5);
  });

  it('knows what is inside the room', () => {
    expect(inRoom(0, 0)).toBe(true);
    expect(inRoom(6, 4.5)).toBe(true);
    expect(inRoom(6.1, 0)).toBe(false);
    expect(inRoom(0, -4.6)).toBe(false);
  });
});

describe('occluded', () => {
  it('is blocked by furniture between the fan and the body', () => {
    const p = person(1, 0, 0);
    expect(occluded(p, [p, wardrobe(2, 0, -2)])).toBe(true);
  });

  it('is not blocked by furniture off to the side', () => {
    const p = person(1, 0, 0);
    expect(occluded(p, [p, wardrobe(2, 4, -2)])).toBe(false);
  });

  it('ignores furniture that is outside the room', () => {
    const p = person(1, 0, 0);
    const w = { ...wardrobe(2, 0, -2), x: 20 };
    expect(occluded(p, [p, w])).toBe(false);
  });

  it('never lets a blocker hide itself', () => {
    const w = wardrobe(2, 0, -2);
    expect(occluded(w, [w])).toBe(false);
  });
});

describe('sense', () => {
  const statusOf = (bodies: Body[], id: number) => {
    const readings = new Map<number, Reading>();
    sense(bodies, params(), readings);
    return readings.get(id);
  };

  it('detects a person in plain view with their true bearing', () => {
    const readings = new Map<number, Reading>();
    const out = sense([person(1, 2, 0)], params(), readings);
    expect(out).toHaveLength(1);
    expect(out[0].bearing).toBeCloseTo(bearingOf(2, 0));
    expect(out[0].dist).toBeCloseTo(distOf(2, 0));
    expect(out[0].conf).toBeGreaterThan(0.7);
    expect(readings.get(1)?.status).toBe('seen');
  });

  it('reports why a body was not seen', () => {
    expect(statusOf([person(1, 10, 0)], 1)?.status).toBe('outside');
    expect(statusOf([person(1, 5.5, 4.4)], 1)?.status).toBe('range');
    expect(RANGE).toBeLessThan(distOf(5.5, 4.4));
    expect(statusOf([person(1, 6, -3.8)], 1)?.status).toBe('fov');
    expect(statusOf([person(1, 0, 0), wardrobe(2, 0, -2)], 1)?.status).toBe('occluded');
  });

  it('drops a frame when the random miss fires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const readings = new Map<number, Reading>();
    const out = sense([person(1, 0, 0)], params({ noise: 1 }), readings);
    expect(out).toHaveLength(0);
    expect(readings.get(1)?.status).toBe('missed');
  });

  it('keeps confidence within 0.01..0.99', () => {
    const readings = new Map<number, Reading>();
    const chair = { ...person(1, 0, 0), base: 0 };
    const out = sense([chair, { ...person(2, 1, 0), base: 1 }], params(), readings);
    for (const d of out) {
      expect(d.conf).toBeGreaterThanOrEqual(0.01);
      expect(d.conf).toBeLessThanOrEqual(0.99);
    }
  });
});

describe('Brain', () => {
  it('confirms a person only after four sensor frames', () => {
    const brain = new Brain();
    const bodies = [person(1, 0, 0)];
    run(brain, bodies, params(), 0.3);
    expect(brain.tracks).toHaveLength(1);
    expect(brain.confirmed).toHaveLength(0);
    run(brain, bodies, params(), 0.1, 0.3);
    expect(brain.confirmed).toHaveLength(1);
  });

  it('ignores detections below the confidence threshold', () => {
    const brain = new Brain();
    run(brain, [{ ...person(1, 0, 0), kind: 'chair', base: 0.06 }], params(), 2);
    expect(brain.tracks).toHaveLength(0);
    expect(brain.active).toBe(false);
  });

  it('narrows the sweep to the people plus the margin', () => {
    const brain = new Brain();
    const a = person(1, -2, 0), b = person(2, 2, 0);
    run(brain, [a, b], params(), 6);
    expect(brain.active).toBe(true);
    expect(brain.limMin).toBeCloseTo(bearingOf(-2, 0) - 8, 0);
    expect(brain.limMax).toBeCloseTo(bearingOf(2, 0) + 8, 0);
  });

  it('keeps a minimum 6 degree sweep for a single person', () => {
    const brain = new Brain();
    run(brain, [person(1, 0, 0)], params({ margin: 0 }), 6);
    expect(brain.limMax - brain.limMin).toBeCloseTo(6, 0);
  });

  it('sweeps the full mechanical range when smart mode is off', () => {
    const brain = new Brain();
    run(brain, [], params({ smart: false }), 6);
    expect(brain.active).toBe(true);
    expect(brain.limMin).toBeCloseTo(-MECH, 0);
    expect(brain.limMax).toBeCloseTo(MECH, 0);
  });

  it('rests at the centre when nobody is there', () => {
    const brain = new Brain();
    brain.head = 30;
    run(brain, [], params(), 10);
    expect(brain.active).toBe(false);
    expect(Math.abs(brain.head)).toBeLessThan(1);
  });

  it('holds a confirmed person for `hold` seconds after they vanish', () => {
    const brain = new Brain();
    const p = params({ hold: 2 });
    let t = run(brain, [person(1, 0, 0)], p, 1);
    expect(brain.confirmed).toHaveLength(1);
    t = run(brain, [], p, 1.5, t);
    expect(brain.confirmed).toHaveLength(1);
    run(brain, [], p, 1, t);
    expect(brain.tracks).toHaveLength(0);
  });

  it('never turns the head past the mechanical limit', () => {
    const brain = new Brain();
    const p = params({ smart: false });
    for (let i = 1; i <= 600; i++) {
      brain.update(0.05, i * 0.05, [], p);
      expect(Math.abs(brain.head)).toBeLessThanOrEqual(MECH);
    }
  });
});
