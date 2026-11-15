// Everything that changes every frame lives here, as plain mutable data.
// The render loop reads and writes it directly, so 60 fps never goes through React state.
// React state (store.ts) only holds what changes on a user action or at 5 Hz.

import type { Camera } from 'three';
import { Brain, type Body } from '../brain';
import type { KindId } from './kinds';

export interface Entity extends Body {
  kind: KindId;
  /** 0..1, how cooled this person currently is. */
  cool: number;
  /** Index into the shirt colours, fixed when the entity is created. */
  shirt: number;
}

export const world = {
  brain: new Brain(),
  /** Fan motor power, eased 0..1. */
  power: 0,
  /** Smoothed head acceleration, degrees per second squared. */
  accel: 0,
  /** 0..1 as the neck housing opens for the mechanism view. */
  ex: 0,
  /** Share of time the air landed on someone, per mode, with a slow decay. */
  eff: { smart: { on: 0, t: 0 }, dumb: { on: 0, t: 0 } },
  drag: null as { e: Entity; dx: number; dz: number } | null,
  /** Set by the scene so code outside the canvas can raycast. */
  camera: null as Camera | null,
  controls: null as { enabled: boolean } | null,
};
