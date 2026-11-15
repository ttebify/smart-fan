import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BEAM, FAN } from '@/brain';
import { useStore } from '@/sim/store';
import { world } from '@/sim/world';
import { RAD } from '@/scene/materials';

const N = 900, LIFE = 1.7;

/** Air leaving the fan, as a fixed pool of particles recycled in typed arrays. */
export function Airflow() {
  const points = useRef<THREE.Points>(null!);
  const p = useMemo(() => {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { pos, col, vel: new Float32Array(N * 3), life: new Float32Array(N), geo };
  }, []);

  useFrame((_, delta) => {
    const { showAir, entities } = useStore.getState();
    points.current.visible = showAir && world.ex < 0.5; // particles get in the way close up
    if (!showAir) return;
    const dt = Math.min(0.05, delta), headDeg = world.brain.head, headY = 1.5 + 0.58 * world.ex;
    const { pos, col, vel, life } = p;
    let budget = Math.round((N / LIFE) * dt * world.power * 1.1);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      if (life[i] <= 0) {
        if (budget-- <= 0) { col[j] = col[j + 1] = col[j + 2] = 0; continue; }
        const a = (headDeg + (Math.random() - 0.5) * 2 * BEAM * 0.9) * RAD, r = Math.random() * 0.35, t = Math.random() * 6.28;
        const sp = 4.2 + Math.random() * 1.6;
        pos[j] = FAN.x + Math.cos(t) * r * Math.cos(a) + Math.sin(a) * 0.35;
        pos[j + 1] = headY + Math.sin(t) * r;
        pos[j + 2] = FAN.z - Math.cos(t) * r * Math.sin(a) + Math.cos(a) * 0.35;
        vel[j] = Math.sin(a) * sp; vel[j + 1] = (Math.random() - 0.5) * 0.5; vel[j + 2] = Math.cos(a) * sp;
        life[i] = LIFE * (0.7 + Math.random() * 0.3);
      }
      pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
      life[i] -= dt;
      // Air stops at tall furniture.
      for (const e of entities) if (e.blocker && Math.abs(pos[j] - e.x) < e.blocker.hw && Math.abs(pos[j + 2] - e.z) < e.blocker.hd && pos[j + 1] < 2.1) life[i] = 0;
      const f = Math.max(0, life[i] / LIFE) * 0.55;
      col[j] = 0.45 * f; col[j + 1] = 0.85 * f; col[j + 2] = f;
    }
    p.geo.attributes.position.needsUpdate = true;
    p.geo.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={p.geo} frustumCulled={false}>
      <pointsMaterial size={0.075} vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}
