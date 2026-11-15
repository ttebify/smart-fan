import * as THREE from 'three';

// Neck drive: a normal fan's worm-and-crank linkage gives one fixed sweep, so the neck is
// driven separately: stepper -> pinion -> output gear on the head shaft, with a home sensor.
export const RATIO = 5, T_GEAR = 80, T_PIN = 16, MOD = 0.0035, MICROSTEPS = 3200;
export const HEAD_INERTIA = 0.02; // kg m^2, assumes a 1.5 kg head
export const FRICTION = 0.05; // N m, bearings plus cable drag (assumed)
export const R_GEAR = (MOD * T_GEAR) / 2, R_PIN = (MOD * T_PIN) / 2, PIN_Z = -(R_GEAR + R_PIN);

export function gearGeo(teeth: number, thick: number, bore: number, holes = 0) {
  const r = (MOD * teeth) / 2, ro = r + MOD, rr = r - 1.25 * MOD, p = (Math.PI * 2) / teeth;
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    for (const [f, rad] of [[-0.5, rr], [-0.28, rr], [-0.14, ro], [0.14, ro], [0.28, rr]]) {
      const x = Math.cos((i + f) * p) * rad, y = Math.sin((i + f) * p) * rad;
      if (i === 0 && f === -0.5) s.moveTo(x, y); else s.lineTo(x, y);
    }
  }
  s.closePath();
  const hole = (x: number, y: number, rad: number) => { const h = new THREE.Path(); h.absarc(x, y, rad, 0, Math.PI * 2, true); s.holes.push(h); };
  hole(0, 0, bore);
  for (let i = 0; i < holes; i++) { const a = ((i + 0.5) / holes) * Math.PI * 2; hole(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.2); }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -thick / 2);
  g.rotateX(-Math.PI / 2); // lay flat, so rotation.y spins the gear
  return g;
}
