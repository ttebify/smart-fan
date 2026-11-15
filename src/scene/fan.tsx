import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FAN } from '../brain';
import { useStore } from '../sim/store';
import { world } from '../sim/world';
import { CalloutAnchor } from './callouts';
import { RAD, cage, dark, mat, shell, white } from './materials';
import { NeckDrive } from './neck-drive';

const RINGS: [r: number, z: number][] = [[0.46, 0.1], [0.46, 0.2], [0.3, 0.26], [0.3, 0.04]];
const SPOKES = 16, BLADES = 4;

export function Fan() {
  const head = useRef<THREE.Group>(null!), blades = useRef<THREE.Group>(null!);
  const shellA = useRef<THREE.Mesh>(null!), shellB = useRef<THREE.Mesh>(null!);
  const eye = useRef<THREE.MeshStandardMaterial>(null!);
  const bladeMat = useMemo(() => mat(0x4fd8ff, { transparent: true, opacity: 0.85, roughness: 0.3 }), []);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    const { brain, power, ex } = world;
    head.current.rotation.y = brain.head * RAD;
    head.current.position.y = 1.5 + 0.58 * ex; // the head lifts off as the housing opens
    blades.current.rotation.z -= dt * 38 * power;
    shellA.current.position.x = 0.42 * ex;
    shellB.current.position.x = -0.42 * ex;
    shell.opacity = 1 - 0.8 * ex;
    eye.current.emissive.set(brain.confirmed.length ? 0x5be38a : 0x4fd8ff);
    eye.current.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 6) * 0.6;
  });

  return (
    <group
      position={[FAN.x, 0, FAN.z]}
      // A click (not a drag) on the fan opens or closes the mechanism view.
      onClick={ev => {
        if (ev.delta > 5) return;
        ev.stopPropagation();
        const { inspect, set } = useStore.getState();
        set({ inspect: !inspect });
      }}
    >
      <mesh castShadow material={white} position-y={0.035}>
        <cylinderGeometry args={[0.38, 0.42, 0.07, 40]} />
      </mesh>
      <mesh castShadow material={white} position-y={0.635}>
        <cylinderGeometry args={[0.045, 0.055, 1.17, 16]} />
      </mesh>
      {/* The sensor sits on the fixed pole, so its view does not swing with the head. */}
      <mesh castShadow position={[0, 0.95, 0.06]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial ref={eye} color={0x111111} emissive={0x4fd8ff} emissiveIntensity={2} />
      </mesh>
      <mesh castShadow material={dark} position-y={0.95}>
        <boxGeometry args={[0.16, 0.12, 0.1]} />
      </mesh>
      <CalloutAnchor i={7} position={[0, 0.95, 0.07]} />

      <group ref={head} position-y={1.5}>
        <mesh castShadow material={white} position-z={-0.08} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.13, 0.16, 0.3, 24]} />
        </mesh>
        {RINGS.map(([r, z], i) => (
          <mesh key={i} castShadow material={cage} position-z={z}>
            <torusGeometry args={[r, 0.012, 8, 48]} />
          </mesh>
        ))}
        {Array.from({ length: SPOKES }, (_, i) => (
          <group key={i} rotation-z={(i / SPOKES) * Math.PI}>
            {/* A semicircle bulging forward, flattened into a cage front. */}
            <mesh castShadow material={cage} position-z={0.2} scale-y={0.2} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.46, 0.006, 6, 16, Math.PI]} />
            </mesh>
          </group>
        ))}
        <group ref={blades} position-z={0.15}>
          {Array.from({ length: BLADES }, (_, i) => (
            <group key={i} rotation-z={(i / BLADES) * Math.PI * 2}>
              <mesh castShadow material={bladeMat} position-x={0.22} scale={[1, 0.5, 0.06]} rotation-x={0.4}>
                <sphereGeometry args={[0.2, 16, 10]} />
              </mesh>
            </group>
          ))}
          <mesh castShadow material={white}>
            <sphereGeometry args={[0.07, 16, 12]} />
          </mesh>
        </group>
        <mesh castShadow material={white} position-y={-0.06}>{/* housing lid lifts with the head */}
          <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
        </mesh>
      </group>

      {/* Neck housing: two half shells that slide apart. */}
      <mesh ref={shellA} castShadow material={shell} position-y={1.32}>
        <cylinderGeometry args={[0.24, 0.24, 0.24, 32, 1, true, 0, Math.PI]} />
      </mesh>
      <mesh ref={shellB} castShadow material={shell} position-y={1.32}>
        <cylinderGeometry args={[0.24, 0.24, 0.24, 32, 1, true, Math.PI, Math.PI]} />
      </mesh>

      <NeckDrive />
    </group>
  );
}
