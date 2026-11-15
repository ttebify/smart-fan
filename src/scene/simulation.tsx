import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BEAM, MECH, RANGE, bearingOf, distOf, inRoom, occluded } from '@/brain';
import { useStore } from '@/sim/store';
import { world } from '@/sim/world';
import { neckTorque } from '@/scene/gear';

/**
 * Advances the simulation once per frame, before anything draws (priority -1).
 * It renders nothing. The other scene components read `world` in their own useFrame.
 */
export function Simulation() {
  const prevVel = useRef(0), uiAcc = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    const { params, entities, inspect, set } = useStore.getState();
    const { brain, eff } = world;

    brain.update(dt, state.clock.elapsedTime, entities, params);
    world.power += ((brain.active ? 1 : 0.12) - world.power) * (1 - Math.exp(-dt / 0.8));
    world.ex += ((inspect ? 1 : 0) - world.ex) * (1 - Math.exp(-dt / 0.35));
    world.accel += ((brain.vel - prevVel.current) / Math.max(dt, 1e-3) - world.accel) * 0.15;
    prevVel.current = brain.vel;

    // Ground-truth scoring: is the air actually reaching anyone right now?
    let anyone = false, onSomeone = false;
    for (const e of entities) {
      if (e.kind !== 'person') continue;
      const bearing = bearingOf(e.x, e.z);
      const reachable = inRoom(e.x, e.z) && distOf(e.x, e.z) < RANGE * 0.85 && Math.abs(bearing) <= MECH + BEAM && !occluded(e, entities);
      const hit = reachable && world.power > 0.5 && Math.abs(bearing - brain.head) < BEAM;
      e.cool += ((hit ? 1 : 0) - e.cool) * (1 - Math.exp(-dt / (hit ? 0.6 : 5)));
      anyone ||= reachable; onSomeone ||= hit;
    }
    const decay = Math.exp(-dt / 40);
    for (const m of [eff.smart, eff.dumb]) { m.on *= decay; m.t *= decay; }
    if (anyone) { const m = params.smart ? eff.smart : eff.dumb; m.t += dt; if (onSomeone) m.on += dt; }

    // Publish a snapshot for the panels at 5 Hz. This is the only per-frame path into React state.
    uiAcc.current += dt;
    if (uiAcc.current > 0.2) {
      uiAcc.current = 0;
      const speed = Math.abs(brain.vel);
      const pct = (m: { on: number; t: number }) => (m.t > 3 ? Math.round((m.on / m.t) * 100) : null);
      set({
        telemetry: {
          sweep: brain.active ? Math.round(brain.limMax - brain.limMin) : null,
          people: brain.confirmed.length,
          state: !params.smart ? 'full sweep' : brain.active ? 'cooling' : 'idle',
          smart: pct(eff.smart),
          dumb: pct(eff.dumb),
          angle: brain.head,
          speed,
          tNeck: neckTorque(world.accel, speed > 0.5),
        },
      });
    }
  }, -1);

  return null;
}
