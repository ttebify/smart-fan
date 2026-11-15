import { Button } from '@ui-sdk/react/button';
import { MAX_SPEED, MECH } from '@/brain';
import { CENTRES, RATIO, T_GEAR, T_PIN } from '@/scene/gear';
import { useStore } from '@/sim/store';

function Live() {
  const angle = useStore(s => s.telemetry.angle);
  const speed = useStore(s => s.telemetry.speed);
  return (
    <div className="stats two">
      <div><b>{angle.toFixed(1)}°</b><small>fan direction</small></div>
      <div><b>{speed.toFixed(0)}°/s</b><small>turning speed</small></div>
      <div><b>{((speed * RATIO) / 6).toFixed(0)}</b><small>motor turns / min</small></div>
      <div><b>{RATIO} : 1</b><small>gear ratio</small></div>
    </div>
  );
}

const DETAILS: [string, string][] = [
  ['Large gear', `${T_GEAR} teeth`],
  ['Small gear', `${T_PIN} teeth`],
  ['Gear spacing', `${CENTRES * 1000} mm between centres`],
  ['Turning range', `${MECH}° left and right`],
  ['Fastest turn', `${MAX_SPEED}° per second`],
];

/** The panel's contents, shared by the desktop panel and the phone drawer. */
export function MechDetails() {
  return (
    <>
      <p className="hint first">A small motor turns the gears to swing the fan toward people.</p>
      <h3>Moving now</h3>
      <Live />
      <h3>Inside the fan</h3>
      <ul className="spec">
        {DETAILS.map(([label, value]) => <li key={label}><span>{label}</span><b>{value}</b></li>)}
      </ul>
      <p className="hint">All parts and readings are simulated for demo purposes only.</p>
    </>
  );
}

export function MechPanel() {
  const set = useStore(s => s.set);
  return (
    <aside className="panel mech">
      <div className="head">
        <h1>How the fan turns</h1>
        <Button className="icon" aria-label="Back to the room" onClick={() => set({ inspect: false })}>×</Button>
      </div>
      <MechDetails />
      <p className="hint">Select the fan again or press Esc to return to the room.</p>
    </aside>
  );
}
