import { create } from 'zustand';
import type { Params } from '../brain';
import { kindSpec, type KindId } from './kinds';
import type { Entity } from './world';

export type TuneKey = 'threshold' | 'margin' | 'hold' | 'noise';

/** A snapshot of the simulation for the panels, published five times a second. */
export interface Telemetry {
  sweep: number | null;
  people: number;
  state: 'full sweep' | 'cooling' | 'idle';
  /** Percent of time the air landed on someone; null until there is enough data. */
  smart: number | null;
  dumb: number | null;
  angle: number;
  speed: number;
  tNeck: number;
}

interface State {
  params: Params;
  showAir: boolean;
  inspect: boolean;
  hideLeft: boolean;
  hideRight: boolean;
  clean: boolean;
  showLabels: boolean;
  dropHot: boolean;
  entities: Entity[];
  telemetry: Telemetry;
  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void;
  set: (patch: Partial<Pick<State, 'showAir' | 'inspect' | 'hideLeft' | 'hideRight' | 'clean' | 'showLabels' | 'dropHot' | 'telemetry'>>) => void;
  spawn: (kind: KindId, x: number, z: number) => Entity;
  remove: (e: Entity) => void;
}

// Ids and shirt colours are handed out here, never during a render, so StrictMode's
// double render cannot skip numbers.
let nextId = 1, nextShirt = 0;
function make(kind: KindId, x: number, z: number): Entity {
  const k = kindSpec(kind);
  return { id: nextId++, kind, x, z, base: k.base, blocker: k.blocker, cool: 0, shirt: kind === 'person' ? nextShirt++ : 0 };
}

export const useStore = create<State>((set, get) => ({
  params: { threshold: 0.7, margin: 8, hold: 3, noise: 1, smart: true, gapSkip: true },
  showAir: true,
  inspect: false,
  hideLeft: false,
  hideRight: false,
  clean: false,
  showLabels: true,
  dropHot: false,
  entities: [
    make('person', -2.6, 0.4),
    make('person', 1.9, 1.6),
    make('coatrack', 4.2, -1.2),
    make('wardrobe', -4.6, -2.2),
    make('chair', 0.4, 3.2),
    make('plant', 5.2, 3.6),
  ],
  telemetry: { sweep: null, people: 0, state: 'idle', smart: null, dumb: null, angle: 0, speed: 0, tNeck: 0 },
  setParam: (key, value) => set(s => ({ params: { ...s.params, [key]: value } })),
  set: patch => set(patch),
  spawn: (kind, x, z) => {
    const e = make(kind, x, z);
    set({ entities: [...get().entities, e] });
    return e;
  },
  remove: e => set({ entities: get().entities.filter(o => o !== e) }),
}));
