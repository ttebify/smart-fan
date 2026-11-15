import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BEAM, FAN, FOV, RANGE } from '../brain';
import { world } from '../sim/world';
import { RAD } from './materials';

const SEGMENTS = 50;

function sectorGeo() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEGMENTS * 9), 3));
  return geo;
}

/** Rewrite a fan-shaped wedge between two bearings, in place. */
function setSector(geo: THREE.BufferGeometry, a0: number, a1: number, r: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < SEGMENTS; i++) {
    const a = (a0 + ((a1 - a0) * i) / SEGMENTS) * RAD, b = (a0 + ((a1 - a0) * (i + 1)) / SEGMENTS) * RAD;
    pos.setXYZ(i * 3, 0, 0, 0);
    pos.setXYZ(i * 3 + 1, Math.sin(a) * r, 0, Math.cos(a) * r);
    pos.setXYZ(i * 3 + 2, Math.sin(b) * r, 0, Math.cos(b) * r);
  }
  pos.needsUpdate = true;
}

function Wedge({ geo, color, opacity, y, ref }: { geo: THREE.BufferGeometry; color: number; opacity: number; y: number; ref?: React.Ref<THREE.Mesh> }) {
  return (
    <mesh ref={ref} geometry={geo} position={[FAN.x, y, FAN.z]} frustumCulled={false}>
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** Floor overlays: what the sensor can see, where the fan will sweep, and where the air is now. */
export function Sectors() {
  const fov = useMemo(() => { const g = sectorGeo(); setSector(g, -FOV, FOV, RANGE); return g; }, []);
  const sweep = useMemo(sectorGeo, []);
  const beam = useMemo(sectorGeo, []);
  const sweepMesh = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const { brain, power } = world;
    if (sweepMesh.current) sweepMesh.current.visible = brain.active;
    if (brain.active) setSector(sweep, brain.limMin, brain.limMax, RANGE);
    setSector(beam, brain.head - BEAM, brain.head + BEAM, RANGE * 0.8 * power);
  });

  return (
    <>
      <Wedge geo={fov} color={0x5b8cff} opacity={0.07} y={0.006} />
      <Wedge ref={sweepMesh} geo={sweep} color={0x4fd8ff} opacity={0.16} y={0.012} />
      <Wedge geo={beam} color={0xbff3ff} opacity={0.3} y={0.018} />
    </>
  );
}
