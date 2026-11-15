import { Button } from '@ui-sdk/react/button';
import { MICROSTEPS, RATIO } from '../scene/gear';
import { useStore } from '../sim/store';

function Live() {
  const angle = useStore(s => s.telemetry.angle);
  const speed = useStore(s => s.telemetry.speed);
  const tNeck = useStore(s => s.telemetry.tNeck);
  return (
    <div className="stats two">
      <div><b>{angle.toFixed(1)}°</b><small>head angle</small></div>
      <div><b>{speed.toFixed(0)}°/s</b><small>head speed</small></div>
      <div><b>{((speed * RATIO) / 6).toFixed(0)}</b><small>motor rpm</small></div>
      <div><b>{(((speed * RATIO) / 360) * MICROSTEPS).toFixed(0)}</b><small>microsteps / s</small></div>
      <div><b>{tNeck.toFixed(2)}</b><small>torque at neck, N·m</small></div>
      <div><b>{(tNeck / RATIO / 0.9).toFixed(3)}</b><small>torque at motor, N·m</small></div>
    </div>
  );
}

const SPEC: [string, string][] = [
  ['Reduction', '80 : 16 = 5 : 1'],
  ['Resolution', '0.0225° / microstep'],
  ['Travel', '±70°, hard stops'],
  ['Top speed', '95°/s → 79 rpm'],
  ['Peak accel', '260°/s²'],
  ['Peak torque', '≈0.14 N·m neck, ≈0.03 motor'],
  ['Motor margin', '≈10× (0.4 N·m NEMA 17)'],
];

/** The panel's contents, shared by the desktop panel and the phone drawer. */
export function MechDetails() {
  return (
    <>
      <p className="hint first">A normal fan's worm-and-crank linkage gives one fixed sweep. To change the sweep on the fly, the neck gets its own motor.</p>
      <h3>Live</h3>
      <Live />
      <h3>Design figures</h3>
      <ul className="spec">
        {SPEC.map(([name, value]) => <li key={name}><span>{name}</span><b>{value}</b></li>)}
      </ul>
      <p className="hint">Torque figures are estimates: 1.5 kg head (0.02 kg·m²), 0.05 N·m friction, 90% gear efficiency. Travel is under one turn, so the cable needs no slip ring. Concept reference, not a manufacturing drawing.</p>
    </>
  );
}

export function MechPanel() {
  const set = useStore(s => s.set);
  return (
    <aside className="panel mech">
      <div className="head">
        <h1>Neck drive</h1>
        <Button className="icon" aria-label="Back to the room" onClick={() => set({ inspect: false })}>×</Button>
      </div>
      <MechDetails />
      <p className="hint">Click the fan again or press Esc to go back.</p>
    </aside>
  );
}
