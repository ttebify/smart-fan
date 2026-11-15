import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { kindSpec } from '@/sim/kinds';
import { useStore } from '@/sim/store';
import { world, type Entity } from '@/sim/world';
import { MODELS } from '@/scene/kinds';
import { floorPoint, startDrag } from '@/scene/use-drag';

const STATUS_TEXT: Record<string, string> = {
  outside: 'outside the room',
  range: 'out of range',
  fov: 'outside camera view',
  occluded: 'hidden behind an object',
  missed: 'not spotted this time',
};
const RING_COLOR: Record<string, number> = { ok: 0x5be38a, bad: 0xff5d6c, no: 0xffb648, '': 0x6b7689 };

/** What the sensor currently makes of this object, as a label class and a line of text. */
function verdict(e: Entity, threshold: number): [cls: string, text: string] {
  const r = world.brain.readings.get(e.id);
  if (!r) return ['', '…'];
  if (r.status !== 'seen') return ['', STATUS_TEXT[r.status]];
  const c = `${Math.round(r.conf * 100)}% sure`;
  if (r.conf < threshold) return ['no', e.kind === 'person' ? `person? ${c} · too unsure` : `person? ${c} · ignored`];
  return e.kind === 'person' ? ['ok', `person ${c}`] : ['bad', `person ${c} · mistaken!`];
}

// The label for each object is plain DOM outside the canvas (see TagLayer). The mesh
// finds its label here by entity id and moves it every frame.
const tags = new Map<number, HTMLDivElement>();
const v3 = new THREE.Vector3();

function EntityMesh({ e }: { e: Entity }) {
  const spec = kindSpec(e.kind), Model = MODELS[e.kind];
  const group = useRef<THREE.Group>(null!), ring = useRef<THREE.MeshBasicMaterial>(null!);
  const shown = useRef(''), halfWidth = useRef(70);

  // Position, ring colour and label text change far too often for React state,
  // so they are written straight to the objects and DOM nodes.
  useFrame(({ camera, size }) => {
    group.current.position.set(e.x, world.drag?.e === e ? 0.18 : 0, e.z);
    const [cls, text] = verdict(e, useStore.getState().params.threshold);
    ring.current.color.set(RING_COLOR[cls]);

    const tag = tags.get(e.id);
    if (!tag) return;
    v3.set(e.x, spec.height + 0.15, e.z).project(camera);
    if (v3.z > 1) { tag.style.display = 'none'; return; } // behind the camera
    tag.style.display = '';
    const key = cls + text;
    if (key !== shown.current) {
      shown.current = key;
      tag.className = 'tag ' + cls;
      tag.querySelector('em')!.textContent = text;
      halfWidth.current = tag.offsetWidth / 2 + 4; // measured only when the text changes
    }
    // Keep the whole label on screen, even when its object is at the edge.
    const edge = Math.min(halfWidth.current, size.width / 2);
    tag.style.left = THREE.MathUtils.clamp(((v3.x + 1) / 2) * size.width, edge, size.width - edge) + 'px';
    tag.style.top = ((1 - v3.y) / 2) * size.height + 'px';
    const bar = tag.querySelector<HTMLElement>('.cool i');
    if (bar) bar.style.width = Math.round(e.cool * 100) + '%';
  });

  return (
    <group
      ref={group}
      position={[e.x, 0, e.z]}
      onPointerDown={ev => {
        ev.stopPropagation(); // do not also grab whatever stands behind
        const p = floorPoint(ev.nativeEvent.clientX, ev.nativeEvent.clientY);
        if (p) startDrag(e, p);
      }}
      onClick={ev => ev.stopPropagation()}
    >
      <Model shirt={e.shirt} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.025} scale={spec.blocker ? 2 : 1}>
        <ringGeometry args={[0.42, 0.5, 40]} />
        <meshBasicMaterial ref={ring} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** One label per object. Plain DOM, rendered outside the canvas. */
export function TagLayer() {
  const entities = useStore(s => s.entities);
  return (
    <div className="tags">
      {entities.map(e => (
        <div key={e.id} className="tag" ref={el => { if (el) tags.set(e.id, el); else tags.delete(e.id); }}>
          <b>{kindSpec(e.kind).label}</b>
          <em>…</em>
          {e.kind === 'person' && <div className="cool"><i /></div>}
        </div>
      ))}
    </div>
  );
}

export function Entities() {
  const entities = useStore(s => s.entities);
  return entities.map(e => <EntityMesh key={e.id} e={e} />);
}
