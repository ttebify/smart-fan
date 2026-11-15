import * as THREE from 'three';
import { MAX_ACCEL, MAX_SPEED } from '@/brain';

// Neck drive: a normal fan's worm-and-crank linkage gives one fixed sweep, so the neck is
// driven separately: stepper -> pinion -> output gear on the head shaft, with a home sensor.
//
// Every dimension here is the real part, in metres, so it can be checked against a
// catalogue. The scene draws the fan at DRAW times life size so it reads from across the room.
export const DRAW = 2;

// Spur gears: Metric module 1, 20° pressure angle, full-depth involute teeth.
export const MODULE = 0.001, PRESSURE_ANGLE = (20 * Math.PI) / 180;
export const T_GEAR = 90, T_PIN = 18; // 18 teeth avoids undercut for an unshifted 20° full-depth profile
export const RATIO = T_GEAR / T_PIN;
export const R_GEAR = (MODULE * T_GEAR) / 2, R_PIN = (MODULE * T_PIN) / 2;
export const CENTRES = R_GEAR + R_PIN; // 54 mm between the two shafts
export const FACE_GEAR = 0.008, FACE_PIN = 0.01;
/** Pinion angle at head = 0 that puts a pinion tooth in a gear gap. The pinion sits at -z. */
export const PIN_PHASE = ((2 * Math.PI) / T_PIN) * (0.75 * T_PIN - 0.25 * T_GEAR - 0.5);
export const BACKLASH = 0.0001; // at the pitch line, design allowance, not a measured or guaranteed value

// Stepper: NEMA 17 frame (42.3 mm square), 200 steps per turn, driven at 1/16 microstep.
export const NEMA17 = { size: 0.0423, length: 0.04, shaft: 0.005, shaftLength: 0.024, holdingTorque: 0.4 };
export const MICROSTEPS = 200 * 16;

// Head shaft and its bearings: 6804-2RS deep-groove, 20 x 32 x 7 mm.
export const SHAFT = { od: 0.02, bore: 0.012, length: 0.105 };
export const BEARING = { bore: 0.02, od: 0.032, width: 0.007 };

export const HEAD_INERTIA = 0.02; // kg m^2, assumes a 1.5 kg head
export const FRICTION = 0.05; // N m, bearings plus cable drag (assumed)
export const GEAR_EFFICIENCY = 0.9; // conservative for one spur mesh

const RAD = Math.PI / 180;
export const neckTorque = (accel: number, moving: boolean) => HEAD_INERTIA * Math.abs(accel) * RAD + (moving ? FRICTION : 0);
export const motorTorque = (neck: number) => neck / RATIO / GEAR_EFFICIENCY;
export const PEAK_NECK_TORQUE = neckTorque(MAX_ACCEL, true);
export const PEAK_MOTOR_TORQUE = motorTorque(PEAK_NECK_TORQUE);
export const TOP_MOTOR_RPM = (MAX_SPEED * RATIO) / 6;
export const STEP_ANGLE = 360 / MICROSTEPS / RATIO; // degrees of head per microstep
export const BACKLASH_ANGLE = BACKLASH / R_GEAR / RAD; // degrees of head

const inv = (a: number) => Math.tan(a) - a;

/** Half the angle a tooth spans at each radius, root to tip, along a sampled involute flank. */
function flank(teeth: number): [radius: number, half: number][] {
  const r = (MODULE * teeth) / 2, base = r * Math.cos(PRESSURE_ANGLE), tip = r + MODULE, root = r - 1.25 * MODULE;
  const halfAt = (rad: number) => Math.PI / (2 * teeth) - BACKLASH / (4 * r) + inv(PRESSURE_ANGLE) - inv(Math.acos(Math.min(1, base / rad)));
  const from = Math.max(base, root), pts: [number, number][] = [];
  if (root < base) pts.push([root, halfAt(base)]); // below the base circle the flank is radial
  for (let i = 0; i <= 5; i++) { const rad = from + ((tip - from) * i) / 5; pts.push([rad, halfAt(rad)]); }
  return pts;
}

/** A spur gear lying flat, centred on the origin, so rotation.y spins it. Tooth 0 points along +x. */
export function gearGeo(teeth: number, thick: number, bore: number, holes = 0) {
  const r = (MODULE * teeth) / 2, p = (Math.PI * 2) / teeth, side = flank(teeth);
  const outline: THREE.Vector2[] = [];
  for (let i = 0; i < teeth; i++) {
    const rising = side.map(([rad, half]) => [rad, i * p - half]);
    const falling = side.map(([rad, half]) => [rad, i * p + half]).reverse();
    for (const [rad, a] of [...rising, ...falling]) outline.push(new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad));
  }
  const s = new THREE.Shape(outline);
  const hole = (x: number, y: number, rad: number) => { const h = new THREE.Path(); h.absarc(x, y, rad, 0, Math.PI * 2, true); s.holes.push(h); };
  hole(0, 0, bore);
  for (let i = 0; i < holes; i++) { const a = ((i + 0.5) / holes) * Math.PI * 2; hole(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.2); }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -thick / 2);
  g.rotateX(-Math.PI / 2);
  return g;
}

/** A tube standing on y = 0: shafts, bearing races, spacers. */
export function tubeGeo(outer: number, inner: number, height: number) {
  const s = new THREE.Shape().absarc(0, 0, outer, 0, Math.PI * 2, false);
  s.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true));
  return new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: false, curveSegments: 24 }).rotateX(-Math.PI / 2);
}
