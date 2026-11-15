import { describe, expect, it } from 'vitest';
import { BACKLASH_ANGLE, BEARING, CENTRES, FACE_GEAR, FACE_PIN, MICROSTEPS, MODULE, NEMA17, PEAK_MOTOR_TORQUE, PEAK_NECK_TORQUE, RATIO, R_GEAR, R_PIN, SHAFT, STEP_ANGLE, TOP_MOTOR_RPM, T_GEAR, T_PIN, gearGeo, tubeGeo } from '@/scene/gear';

describe('neck drive engineering checks', () => {
  it('uses matching module, a 5:1 ratio and 54 mm shaft centres', () => {
    expect(2 * R_GEAR / T_GEAR).toBeCloseTo(MODULE);
    expect(2 * R_PIN / T_PIN).toBeCloseTo(MODULE);
    expect(RATIO).toBe(5);
    expect(CENTRES).toBeCloseTo(0.054);
    expect(SHAFT.od).toBe(BEARING.bore);
  });

  it('distinguishes microstep increment from assumed mechanical backlash', () => {
    expect(MICROSTEPS).toBe(3200);
    expect(STEP_ANGLE).toBeCloseTo(0.0225);
    expect(BACKLASH_ANGLE).toBeCloseTo(0.127324, 5);
    expect(BACKLASH_ANGLE).toBeGreaterThan(STEP_ANGLE);
    expect(TOP_MOTOR_RPM).toBeCloseTo(79.166667, 5);
    expect(PEAK_NECK_TORQUE).toBeCloseTo(0.140757, 5);
    expect(PEAK_MOTOR_TORQUE).toBeCloseTo(0.031279, 5);
  });

  it.each([[T_GEAR, FACE_GEAR, SHAFT.od / 2], [T_PIN, FACE_PIN, NEMA17.shaft / 2]])('builds finite gear geometry with the specified face and bore (%i teeth)', (teeth, face, bore) => {
    const g = gearGeo(teeth, face, bore);
    const points = g.getAttribute('position');
    let maxRadius = 0, minRadius = Infinity;
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      expect(Number.isFinite(x + y + z)).toBe(true);
      const r = Math.hypot(x, z);
      maxRadius = Math.max(maxRadius, r);
      minRadius = Math.min(minRadius, r);
    }
    g.computeBoundingBox();
    expect(g.boundingBox!.max.y - g.boundingBox!.min.y).toBeCloseTo(face, 7);
    expect(maxRadius).toBeCloseTo(MODULE * (teeth / 2 + 1), 7);
    expect(minRadius).toBeCloseTo(bore, 7);
    g.dispose();
  });

  it('keeps the shaft hollow and seats it from y=0', () => {
    const g = tubeGeo(SHAFT.od / 2, SHAFT.bore / 2, SHAFT.length);
    g.computeBoundingBox();
    expect(g.boundingBox!.min.y).toBeCloseTo(0);
    expect(g.boundingBox!.max.y).toBeCloseTo(SHAFT.length);
    g.dispose();
  });
});
