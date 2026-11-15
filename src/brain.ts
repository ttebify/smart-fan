// The fan's "brain": a mock sensor, a tracker and a sweep controller.
// Pure logic with no rendering, so the sensor can be swapped for a real one later.
// All bearings are in degrees: 0 is straight ahead of the fan, positive is towards +x.

export const FAN = { x: 0, z: -3.9 };
export const ROOM = { hw: 6, hd: 4.5 }; // half width (x) and half depth (z)
export const MECH = 70; // software travel limit, degrees each side
export const HARD_STOP = 75; // physical end stops; the head should never reach them
export const MAX_SPEED = 95; // fastest the head turns, degrees per second
export const MAX_ACCEL = 260; // degrees per second squared
export const FOV = 75; // sensor field of view, degrees each side
export const RANGE = 8.5; // sensor range, metres
export const BEAM = 10; // half-width of the useful air cone, degrees

export interface Body {
  id: number;
  kind: string;
  x: number;
  z: number;
  /** How person-like the detector finds this thing, 0..1. */
  base: number;
  /** Tall furniture that blocks the sensor's line of sight (half extents). */
  blocker?: { hw: number; hd: number };
}

export type Status = 'outside' | 'range' | 'fov' | 'occluded' | 'missed' | 'seen';
export interface Reading { status: Status; conf: number }
export interface Detection { bearing: number; dist: number; conf: number }
export interface Track { id: number; bearing: number; dist: number; hits: number; lastSeen: number; confirmed: boolean }

export interface Params {
  threshold: number;
  margin: number;
  hold: number;
  noise: number;
  smart: boolean;
  gapSkip: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const gauss = () => {
  const u = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
};

export const bearingOf = (x: number, z: number) => (Math.atan2(x - FAN.x, z - FAN.z) * 180) / Math.PI;
export const distOf = (x: number, z: number) => Math.hypot(x - FAN.x, z - FAN.z);
export const inRoom = (x: number, z: number) => Math.abs(x) <= ROOM.hw && Math.abs(z) <= ROOM.hd;

/** Does the segment (x0,z0)-(x1,z1) pass through an axis-aligned box? */
function segHitsBox(x0: number, z0: number, x1: number, z1: number, cx: number, cz: number, hw: number, hd: number) {
  let t0 = 0, t1 = 1;
  const d = [x1 - x0, z1 - z0], o = [x0, z0], lo = [cx - hw, cz - hd], hi = [cx + hw, cz + hd];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
    } else {
      let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
  }
  return true;
}

export function occluded(b: Body, bodies: Body[]) {
  return bodies.some(o => o.blocker && o.id !== b.id && inRoom(o.x, o.z) &&
    segHitsBox(FAN.x, FAN.z, b.x, b.z, o.x, o.z, o.blocker.hw, o.blocker.hd));
}

/**
 * Mock detector. Behaves like a real one: limited range and field of view, blocked by
 * furniture, noisy bearings, noisy confidence, and the odd missed frame.
 * `readings` is debug output only (per-body ground truth for the labels).
 */
export function sense(bodies: Body[], p: Params, readings: Map<number, Reading>): Detection[] {
  const out: Detection[] = [];
  for (const b of bodies) {
    const set = (status: Status, conf = 0) => readings.set(b.id, { status, conf });
    if (!inRoom(b.x, b.z)) { set('outside'); continue; }
    const dist = distOf(b.x, b.z), bearing = bearingOf(b.x, b.z);
    if (dist > RANGE) { set('range'); continue; }
    if (Math.abs(bearing) > FOV) { set('fov'); continue; }
    if (occluded(b, bodies)) { set('occluded'); continue; }
    if (Math.random() < 0.04 * p.noise) { set('missed'); continue; }
    // Ambiguous objects occasionally spike, the way a coat on a rack fools a real detector.
    const ambiguous = b.base > 0.3 && b.base < 0.8;
    const spike = ambiguous && Math.random() < 0.05 * p.noise ? 0.2 : 0;
    const conf = clamp(b.base + gauss() * 0.05 * p.noise + spike - (dist / RANGE) * 0.06, 0.01, 0.99);
    set('seen', conf);
    out.push({ bearing: bearing + gauss() * 1.2 * p.noise, dist, conf });
  }
  return out;
}

export class Brain {
  tracks: Track[] = [];
  limMin = 0;
  limMax = 0;
  head = 0; // current head angle
  vel = 0; // degrees per second
  dir = 1;
  active = false;
  readings = new Map<number, Reading>();
  detections: Detection[] = [];
  private acc = 0;
  private nextId = 1;

  get confirmed() { return this.tracks.filter(t => t.confirmed); }

  update(dt: number, now: number, bodies: Body[], p: Params) {
    this.acc += dt;
    if (this.acc >= 0.1) { // the sensor runs at 10 Hz
      this.acc = 0;
      this.readings.clear();
      this.detections = sense(bodies, p, this.readings);
      this.track(now, p);
    }
    this.control(dt, p);
  }

  /** Associate detections with tracks so one noisy frame can't move the fan. */
  private track(now: number, p: Params) {
    const used = new Set<Track>();
    for (const d of this.detections) {
      if (d.conf < p.threshold) continue;
      let best: Track | undefined, bestGap = 15;
      for (const t of this.tracks) {
        const gap = Math.abs(t.bearing - d.bearing);
        if (!used.has(t) && gap < bestGap) { best = t; bestGap = gap; }
      }
      if (best) {
        best.bearing += (d.bearing - best.bearing) * 0.35;
        best.dist = d.dist; best.hits++; best.lastSeen = now;
        if (best.hits >= 4) best.confirmed = true;
        used.add(best);
      } else {
        const t = { id: this.nextId++, bearing: d.bearing, dist: d.dist, hits: 1, lastSeen: now, confirmed: false };
        this.tracks.push(t); used.add(t);
      }
    }
    // Unconfirmed blips die fast; confirmed people are held for a while after they vanish.
    this.tracks = this.tracks.filter(t => now - t.lastSeen <= (t.confirmed ? p.hold : 0.5));
  }

  private control(dt: number, p: Params) {
    const people = this.confirmed.map(t => t.bearing);
    let tMin: number, tMax: number;
    if (!p.smart) {
      tMin = -MECH; tMax = MECH; this.active = true;
    } else if (people.length) {
      tMin = clamp(Math.min(...people) - p.margin, -MECH, MECH);
      tMax = clamp(Math.max(...people) + p.margin, -MECH, MECH);
      if (tMax - tMin < 6) { const c = clamp((tMin + tMax) / 2, -MECH + 3, MECH - 3); tMin = c - 3; tMax = c + 3; }
      this.active = true;
    } else {
      tMin = tMax = 0; this.active = false;
    }
    const k = 1 - Math.exp(-dt / 0.5);
    this.limMin += (tMin - this.limMin) * k;
    this.limMax += (tMax - this.limMax) * k;

    let target: number;
    if (!this.active) {
      target = clamp(-this.head * 2, -40, 40); // drift back to centre and rest
    } else {
      if (this.head >= this.limMax) this.dir = -1;
      else if (this.head <= this.limMin) this.dir = 1;
      let speed = 40;
      if (p.smart && p.gapSkip && people.length) {
        // Linger on people, hurry across the empty space between them.
        const near = Math.min(...people.map(b => Math.abs(b - this.head)));
        const t = clamp((near - 8) / 14, 0, 1);
        speed = 22 + (MAX_SPEED - 22) * t * t * (3 - 2 * t);
      }
      const room = this.dir > 0 ? this.limMax - this.head : this.head - this.limMin;
      // Never approach a limit faster than the drive can stop (v² = 2·a·d, with 30% in hand),
      // so the head arrives at a crawl instead of running into its end stop.
      const stoppable = Math.sqrt(2 * 0.7 * MAX_ACCEL * Math.max(room, 0));
      target = this.dir * Math.max(Math.min(speed, stoppable), 3);
    }
    this.vel += clamp(target - this.vel, -MAX_ACCEL * dt, MAX_ACCEL * dt);
    this.head = clamp(this.head + this.vel * dt, -MECH, MECH);
  }
}
