import type { ThreeElements } from '@react-three/fiber';
import { useMemo, type ComponentType } from 'react';
import * as THREE from 'three';
import type { KindId } from '@/sim/kinds';
import { cage, dark, mat, wood, woodDark } from '@/scene/materials';

// The 3D model for each kind of object. Data about them (label, detector score) is in sim/kinds.ts.

const SHIRTS = [0xff7a59, 0x5b8cff, 0xffc94f, 0x7be0a4, 0xd68cff, 0xff8fb3];

/** A mesh that both casts and receives shadows. */
const Part = (props: ThreeElements['mesh']) => <mesh castShadow receiveShadow {...props} />;

function Figure({ body, skin }: { body: THREE.Material; skin: THREE.Material }) {
  return (
    <>
      <Part material={body} position-y={1.12}><capsuleGeometry args={[0.2, 0.55, 6, 16]} /></Part>
      <Part material={body} position={[-0.1, 0.42, 0]}><capsuleGeometry args={[0.09, 0.6, 4, 10]} /></Part>
      <Part material={body} position={[0.1, 0.42, 0]}><capsuleGeometry args={[0.09, 0.6, 4, 10]} /></Part>
      <Part material={skin} position-y={1.68}><sphereGeometry args={[0.15, 20, 16]} /></Part>
    </>
  );
}

function Person({ shirt }: ModelProps) {
  const body = useMemo(() => mat(SHIRTS[shirt % SHIRTS.length]), [shirt]);
  const skin = useMemo(() => mat(0xe2b08a), []);
  return <Figure body={body} skin={skin} />;
}

function Mannequin() {
  const plastic = useMemo(() => mat(0xd9dde4, { roughness: 0.3 }), []);
  return (
    <>
      <Figure body={plastic} skin={plastic} />
      <Part material={dark} position-y={0.02}><cylinderGeometry args={[0.3, 0.3, 0.04, 24]} /></Part>
    </>
  );
}

function CoatRack() {
  return (
    <>
      <Part material={woodDark} position-y={0.88}><cylinderGeometry args={[0.03, 0.03, 1.75, 10]} /></Part>
      <Part material={woodDark} position-y={0.02}><cylinderGeometry args={[0.26, 0.28, 0.04, 20]} /></Part>
      <Part position-y={1.12}><coneGeometry args={[0.3, 0.95, 16]} /><meshStandardMaterial color={0x4a5a78} roughness={0.75} /></Part>
      <Part position-y={1.76} scale-y={0.7}><sphereGeometry args={[0.15, 16, 12]} /><meshStandardMaterial color={0x30384a} roughness={0.75} /></Part>
    </>
  );
}

const CHAIR_LEGS: [number, number][] = [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]];
function Chair() {
  return (
    <>
      <Part material={wood} position-y={0.47}><boxGeometry args={[0.5, 0.06, 0.5]} /></Part>
      <Part material={wood} position={[0, 0.75, -0.22]}><boxGeometry args={[0.5, 0.5, 0.06]} /></Part>
      {CHAIR_LEGS.map(([x, z], i) => (
        <Part key={i} material={woodDark} position={[x, 0.225, z]}><boxGeometry args={[0.05, 0.45, 0.05]} /></Part>
      ))}
    </>
  );
}

function Lamp() {
  return (
    <>
      <Part material={dark} position-y={0.02}><cylinderGeometry args={[0.2, 0.22, 0.04, 20]} /></Part>
      <Part material={dark} position-y={0.77}><cylinderGeometry args={[0.02, 0.02, 1.5, 8]} /></Part>
      <Part position-y={1.6}>
        <cylinderGeometry args={[0.14, 0.26, 0.32, 20, 1, true]} />
        <meshStandardMaterial color={0xffe2a8} emissive={0xffc46b} emissiveIntensity={1.4} side={THREE.DoubleSide} />
      </Part>
    </>
  );
}

const LEAVES: [x: number, y: number, z: number, r: number][] = [[0, 0.75, 0, 0.3], [0.16, 0.95, 0.05, 0.22], [-0.14, 0.98, -0.06, 0.2], [0, 1.15, 0, 0.17]];
function Plant() {
  const leaf = useMemo(() => mat(0x3f9b5c), []);
  return (
    <>
      <Part position-y={0.18}><cylinderGeometry args={[0.22, 0.16, 0.36, 18]} /><meshStandardMaterial color={0xb5694a} roughness={0.75} /></Part>
      {LEAVES.map(([x, y, z, r], i) => (
        <Part key={i} material={leaf} position={[x, y, z]}><sphereGeometry args={[r, 12, 10]} /></Part>
      ))}
    </>
  );
}

function Wardrobe() {
  return (
    <>
      <Part material={wood} position-y={1.05}><boxGeometry args={[1.6, 2.1, 0.64]} /></Part>
      <Part material={woodDark} position={[0, 1.05, 0.325]}><boxGeometry args={[0.02, 1.9, 0.02]} /></Part>
      {[-0.08, 0.08].map(x => (
        <Part key={x} material={cage} position={[x, 1.05, 0.34]}><sphereGeometry args={[0.03, 8, 8]} /></Part>
      ))}
    </>
  );
}

interface ModelProps { shirt: number }

export const MODELS: Record<KindId, ComponentType<ModelProps>> = {
  person: Person,
  mannequin: Mannequin,
  coatrack: CoatRack,
  chair: Chair,
  lamp: Lamp,
  plant: Plant,
  wardrobe: Wardrobe,
};
