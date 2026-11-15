import { Button } from '@ui-sdk/react/button';
import * as THREE from 'three';
import { floorPoint, startDrag } from '@/scene/use-drag';
import { KINDS, KIND_IDS } from '@/sim/kinds';
import { useStore } from '@/sim/store';

/** Things to drag into the room. Dropping an object back here removes it. */
export function Palette() {
  const dropHot = useStore(s => s.dropHot);
  const set = useStore(s => s.set);
  const spawn = useStore(s => s.spawn);
  return (
    <aside className={'panel palette' + (dropHot ? ' drop' : '')} data-palette>
      <div className="head">
        <h2>Objects</h2>
        <Button className="icon" aria-label="Hide objects" onClick={() => set({ hideLeft: true })}>×</Button>
      </div>
      <div className="tray">
        {KIND_IDS.map(kind => (
          <button
            key={kind}
            type="button"
            // The new object appears under the pointer and is already being dragged.
            onPointerDown={ev => {
              ev.preventDefault();
              const p = floorPoint(ev.clientX, ev.clientY) ?? new THREE.Vector3();
              startDrag(spawn(kind, p.x, p.z), p);
            }}
          >
            <span>{KINDS[kind].icon}</span>{KINDS[kind].label}
          </button>
        ))}
      </div>
      <p className="hint">Drag anything around the floor. Drop it back on this panel to remove it. Drag empty floor to orbit, scroll to zoom.</p>
    </aside>
  );
}
