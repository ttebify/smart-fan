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
          <Button
            key={kind}
            type="button"
            // The new object appears under the pointer and is already being dragged.
            onPointerDown={ev => {
              if (ev.button !== 0) return;
              ev.preventDefault();
              const p = floorPoint(ev.clientX, ev.clientY) ?? new THREE.Vector3();
              startDrag(spawn(kind, p.x, p.z), p);
            }}
            onClick={ev => {
              if (ev.detail === 0) spawn(kind, 0, 0);
            }}
          >
            <span aria-hidden="true">{KINDS[kind].icon}</span>{KINDS[kind].label}
          </Button>
        ))}
      </div>
      <p className="hint">Drag an item into the room, or focus its button and press Enter or Space to add it. Drop it back here to remove it. Drag empty floor to look around; scroll to zoom. Select the fan to look inside.</p>
    </aside>
  );
}
