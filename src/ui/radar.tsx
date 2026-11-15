import { useEffect, useRef } from 'react';
import { BEAM, FOV, MECH, RANGE, bearingOf, distOf } from '@/brain';
import { useStore } from '@/sim/store';
import { world } from '@/sim/world';

const RAD = Math.PI / 180;
const W = 280, H = 160, CX = W / 2, CY = 14, S = 16; // S = pixels per metre

function draw(g: CanvasRenderingContext2D) {
  const { brain } = world;
  const { entities, params } = useStore.getState();
  g.setTransform(2, 0, 0, 2, 0, 0);
  g.clearRect(0, 0, W, H);
  const pt = (deg: number, r: number): [number, number] => [CX + Math.sin(deg * RAD) * r * S, CY + Math.cos(deg * RAD) * r * S];
  const wedge = (a0: number, a1: number, r: number, fill: string) => {
    g.beginPath(); g.moveTo(CX, CY);
    g.arc(CX, CY, r * S, Math.PI / 2 - a1 * RAD, Math.PI / 2 - a0 * RAD);
    g.closePath(); g.fillStyle = fill; g.fill();
  };
  wedge(-FOV, FOV, RANGE, 'rgba(91,140,255,0.10)');
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
  for (const r of [2, 4, 6, 8]) { g.beginPath(); g.arc(CX, CY, r * S, Math.PI / 2 - FOV * RAD, Math.PI / 2 + FOV * RAD); g.stroke(); }
  g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,0.3)';
  for (const a of [-MECH, MECH]) { g.beginPath(); g.moveTo(CX, CY); g.lineTo(...pt(a, RANGE)); g.stroke(); }
  g.setLineDash([]);
  if (brain.active) wedge(brain.limMin, brain.limMax, RANGE, 'rgba(79,216,255,0.22)');
  wedge(brain.head - BEAM, brain.head + BEAM, RANGE * 0.8, 'rgba(191,243,255,0.35)');
  for (const t of brain.tracks) {
    const [x, y] = pt(t.bearing, t.dist);
    g.beginPath(); g.arc(x, y, 7, 0, 6.3);
    g.strokeStyle = t.confirmed ? '#4fd8ff' : 'rgba(79,216,255,0.35)'; g.lineWidth = 1.5; g.stroke();
  }
  for (const e of entities) {
    const r = brain.readings.get(e.id);
    if (!r || r.status !== 'seen') continue;
    const [x, y] = pt(bearingOf(e.x, e.z), distOf(e.x, e.z));
    g.fillStyle = r.conf < params.threshold ? '#ffb648' : e.kind === 'person' ? '#5be38a' : '#ff5d6c';
    g.fillRect(x - 3, y - 3, 6, 6);
  }
  g.fillStyle = '#e6ecf5'; g.beginPath(); g.arc(CX, CY, 4, 0, 6.3); g.fill();
}

/** The sensor's view from above. Draws on its own animation frame, reading `world` directly. */
export function Radar() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = canvas.current?.getContext('2d');
    if (!g) return;
    let id = requestAnimationFrame(function loop() {
      draw(g);
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      <canvas ref={canvas} className="radar" width={W * 2} height={H * 2} role="img" aria-label="Top-down view of what the sensor detects" />
      <div className="legend">
        <span><i className="dot ok" />person</span>
        <span><i className="dot no" />ignored</span>
        <span><i className="dot bad" />fooled</span>
        <span><i className="dot trk" />track</span>
      </div>
    </>
  );
}
