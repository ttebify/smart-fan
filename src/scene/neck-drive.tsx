import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { world } from '../sim/world';
import { CalloutAnchor } from './callouts';
import { PIN_Z, RATIO, R_GEAR, T_GEAR, T_PIN, gearGeo } from './gear';
import { RAD, brass, dark, mat, steel } from './materials';

/**
 * The mechanism you see when you click the fan: stepper -> pinion -> output gear on the
 * head shaft, with bearings, a home sensor and the controller board. Hidden until the
 * housing opens, then spread out as an exploded view.
 */
export function NeckDrive() {
  const mech = useRef<THREE.Group>(null!), gear = useRef<THREE.Group>(null!), pinion = useRef<THREE.Group>(null!);
  const pcb = useRef<THREE.Mesh>(null!), upperBearing = useRef<THREE.Mesh>(null!), shaft = useRef<THREE.Mesh>(null!);
  const homeLed = useRef<THREE.MeshStandardMaterial>(null!);

  const geo = useMemo(() => ({
    gear: gearGeo(T_GEAR, 0.025, 0.02, 5),
    pinion: gearGeo(T_PIN, 0.03, 0.006),
    shaft: new THREE.CylinderGeometry(0.02, 0.02, 1, 16).translate(0, 0.5, 0), // grows upward from its base
    bearing: new THREE.TorusGeometry(0.034, 0.012, 10, 28).rotateX(Math.PI / 2),
  }), []);
  const magnet = useMemo(() => mat(0xff5d6c), []);
  const board = useMemo(() => mat(0x1f7a4d), []);

  useFrame(() => {
    const { ex, brain } = world;
    mech.current.visible = ex > 0.02;
    pcb.current.position.z = 0.12 + 0.3 * ex;
    upperBearing.current.position.y = 1.4 + 0.14 * ex;
    shaft.current.scale.y = 0.3 + 0.58 * ex;
    gear.current.rotation.y = brain.head * RAD;
    pinion.current.rotation.y = -brain.head * RAD * RATIO + Math.PI / T_PIN; // half a tooth out of phase, so the teeth mesh
    homeLed.current.emissiveIntensity = Math.abs(brain.head) < 1.5 ? 4 : 0;
  });

  return (
    <group ref={mech} visible={false}>
      <mesh castShadow material={dark} position-y={1.21}>{/* base plate */}
        <cylinderGeometry args={[0.235, 0.235, 0.02, 32]} />
      </mesh>

      <group ref={gear} position-y={1.36}>
        <mesh castShadow geometry={geo.gear} material={brass} />
        <mesh ref={shaft} castShadow geometry={geo.shaft} material={steel} position-y={-0.12} />
        <mesh castShadow material={magnet} position={[R_GEAR * 0.9, -0.018, 0]}>{/* home magnet */}
          <cylinderGeometry args={[0.012, 0.012, 0.012, 12]} />
        </mesh>
        <CalloutAnchor i={4} position={[0, 0.3, 0]} />
      </group>

      <group ref={pinion} position={[0, 1.36, PIN_Z]}>
        <mesh castShadow geometry={geo.pinion} material={steel} />
        <mesh castShadow material={steel} position-y={-0.02}>
          <cylinderGeometry args={[0.006, 0.006, 0.07, 10]} />
        </mesh>
      </group>

      <mesh castShadow material={dark} position={[0, 1.275, PIN_Z]}>{/* stepper body */}
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      <mesh castShadow material={steel} position={[0, 1.326, PIN_Z]}>
        <boxGeometry args={[0.104, 0.012, 0.104]} />
      </mesh>

      <mesh castShadow geometry={geo.bearing} material={steel} position-y={1.31} />
      <mesh ref={upperBearing} castShadow geometry={geo.bearing} material={steel} position-y={1.4}>
        <CalloutAnchor i={3} position={[0.04, 0, 0]} />
      </mesh>

      <mesh castShadow material={dark} position={[R_GEAR * 0.9, 1.23, 0]}>{/* hall sensor under the magnet */}
        <boxGeometry args={[0.03, 0.02, 0.03]} />
      </mesh>
      <mesh castShadow position={[R_GEAR * 0.9 + 0.025, 1.245, 0]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial ref={homeLed} color={0x111111} emissive={0x5be38a} emissiveIntensity={0} />
      </mesh>

      <mesh ref={pcb} castShadow material={board} position={[0, 1.235, 0.12]}>
        <boxGeometry args={[0.16, 0.008, 0.08]} />
        <mesh castShadow material={dark} position={[-0.04, 0.009, 0]}>
          <boxGeometry args={[0.03, 0.01, 0.03]} />
        </mesh>
        <mesh castShadow material={dark} position={[0.04, 0.011, 0]}>
          <boxGeometry args={[0.02, 0.014, 0.04]} />
        </mesh>
        <CalloutAnchor i={6} position={[0, 0.01, 0]} />
      </mesh>

      <CalloutAnchor i={0} position={[0.09, 1.375, 0.09]} />
      <CalloutAnchor i={1} position={[0, 1.38, PIN_Z]} />
      <CalloutAnchor i={2} position={[0, 1.26, PIN_Z - 0.05]} />
      <CalloutAnchor i={5} position={[R_GEAR * 0.9, 1.24, 0]} />
    </group>
  );
}
