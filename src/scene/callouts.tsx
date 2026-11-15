import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOV } from '@/brain';
import { useStore } from '@/sim/store';
import { RATIO, T_GEAR, T_PIN } from '@/scene/gear';

// Labels for the mechanism view. Each one has three pieces that live in different trees:
// an anchor inside the 3D model, a DOM label outside the canvas, and a layout pass that
// joins them every frame. They meet through these two module-level arrays.
export const CALLOUTS = [
  { title: 'Output gear', spec: `${T_GEAR} teeth · module 1 · fixed to head shaft` },
  { title: 'Pinion', spec: `${T_PIN} teeth · ${RATIO}:1 reduction` },
  { title: 'Stepper motor', spec: 'NEMA 17 · 1.8°/step · 1/16 microstep' },
  { title: 'Bearings ×2', spec: 'deep-groove · carry the head weight' },
  { title: 'Hollow head shaft', spec: 'fan power cable runs through it' },
  { title: 'Home sensor', spec: 'hall sensor + magnet · finds 0° at power-on' },
  { title: 'Controller', spec: 'MCU + stepper driver · tracker and sweep logic' },
  { title: 'Camera', spec: `wide-angle, on the fixed pole · ±${FOV}° view` },
];

const anchors: (THREE.Object3D | null)[] = [];
const labels: (HTMLDivElement | null)[] = [];
const lines: (SVGLineElement | null)[] = [];

/** Marks the point in the model that callout `i` points at. Goes inside the fan. */
export function CalloutAnchor({ i, position }: { i: number; position: [number, number, number] }) {
  return <object3D ref={o => { anchors[i] = o; }} position={position} />;
}

/** The labels and leader lines. Plain DOM, rendered outside the canvas. */
export function CalloutLayer() {
  return (
    <div className="callouts">
      <svg>
        {CALLOUTS.map((_, i) => <line key={i} ref={el => { lines[i] = el; }} />)}
      </svg>
      {CALLOUTS.map((c, i) => (
        <div key={i} className="callout" ref={el => { labels[i] = el; }}>
          <b>{c.title}</b>
          <em>{c.spec}</em>
        </div>
      ))}
    </div>
  );
}

const v3 = new THREE.Vector3();

/** Lays the labels out in two tidy columns either side of the fan, whatever the camera angle. */
export function CalloutLayout() {
  useFrame(({ camera, size }) => {
    if (!useStore.getState().inspect) return;
    const W = size.width, H = size.height;
    const pts = CALLOUTS.flatMap((_, i) => {
      const at = anchors[i];
      if (!at) return [];
      at.getWorldPosition(v3).project(camera);
      return [{ i, x: ((v3.x + 1) / 2) * W, y: ((1 - v3.y) / 2) * H }];
    });
    if (!pts.length) return;
    const narrow = W < 720, off = narrow ? 50 : 190, edge = narrow ? 128 : 190;
    const cx = pts.reduce((sum, q) => sum + q.x, 0) / pts.length;
    const byX = [...pts].sort((p, q) => p.x - q.x), half = Math.ceil(pts.length / 2);
    for (const [side, group] of [[-1, byX.slice(0, half)], [1, byX.slice(half)]] as const) {
      group.sort((p, q) => p.y - q.y).forEach((q, n) => {
        const lx = THREE.MathUtils.clamp(cx + side * off, edge, W - edge);
        const ly = H * (0.2 + ((narrow ? 0.4 : 0.62) * n) / Math.max(1, group.length - 1));
        const el = labels[q.i], line = lines[q.i];
        if (!el || !line) return;
        el.style.left = lx + 'px'; el.style.top = ly + 'px';
        el.style.transform = `translate(${side < 0 ? '-100%' : '0'}, -50%)`;
        line.setAttribute('x1', String(q.x)); line.setAttribute('y1', String(q.y));
        line.setAttribute('x2', String(lx)); line.setAttribute('y2', String(ly));
      });
    }
  });
  return null;
}
