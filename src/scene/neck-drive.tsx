import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { world } from '@/sim/world';
import { CalloutAnchor } from '@/scene/callouts';
import { BEARING, CENTRES, DRAW, FACE_GEAR, FACE_PIN, NEMA17, PIN_PHASE, RATIO, R_GEAR, SHAFT, T_GEAR, T_PIN, gearGeo, tubeGeo } from '@/scene/gear';
import { RAD, brass, dark, mat, steel } from '@/scene/materials';

// Heights above the housing floor, in real metres. The motor hangs from the motor plate by
// its face, which is how a NEMA 17 mounts; the plate also seats the upper bearing, so the
// plate alone sets the distance between the two gear shafts.
const PLATE_Y = 0.041, PLATE_T = 0.004;
const GEAR_Y = 0.057; // mid-face of both gears
const MAGNET_X = R_GEAR * 0.82;
const STANDOFFS: [x: number, z: number][] = [[-0.021, 0.022], [0.021, 0.022], [-0.015, -0.081], [0.015, -0.081]];
/** Head lift in the exploded view, in real metres (fan.tsx lifts the head by the same amount). */
export const HEAD_LIFT = 0.58 / DRAW;

function Bearing({ y, geo, children }: { y: number; geo: { race: THREE.BufferGeometry; seal: THREE.BufferGeometry }; children?: React.ReactNode }) {
  return (
    <group position-y={y}>
      <mesh castShadow geometry={geo.race} material={steel} />
      <mesh geometry={geo.seal} material={dark} position-y={0.0005} />
      {children}
    </group>
  );
}

/**
 * The mechanism you see when you click the fan: stepper -> pinion -> output gear on the
 * head shaft, with bearings, a home sensor and the controller board. Hidden until the
 * housing opens. Modelled in real metres and drawn at the fan's scale.
 */
export function NeckDrive() {
  const mech = useRef<THREE.Group>(null!), gear = useRef<THREE.Group>(null!), pinion = useRef<THREE.Group>(null!);
  const pcb = useRef<THREE.Mesh>(null!), cable = useRef<THREE.Mesh>(null!);
  const homeLed = useRef<THREE.MeshStandardMaterial>(null!);

  const geo = useMemo(() => {
    const mid = (BEARING.od + BEARING.bore) / 4, gap = 0.0012;
    const plateShape = new THREE.Shape().moveTo(-0.025, -0.026).lineTo(0.025, -0.026).lineTo(0.025, 0.084).lineTo(-0.025, 0.084).closePath();
    const cut = (x: number, z: number, r: number) => plateShape.holes.push(new THREE.Path().absarc(x, -z, r, 0, Math.PI * 2, true));
    cut(0, 0, BEARING.od / 2);
    cut(0, -CENTRES, 0.0115);
    for (const x of [-0.0155, 0.0155]) for (const z of [-CENTRES - 0.0155, -CENTRES + 0.0155]) cut(x, z, 0.0017);
    return {
      plate: new THREE.ExtrudeGeometry(plateShape, { depth: PLATE_T, bevelEnabled: false, curveSegments: 24 }).rotateX(-Math.PI / 2),
      floor: tubeGeo(0.087, SHAFT.bore / 2, 0.004),
      bearingSeat: tubeGeo(0.02, BEARING.od / 2, BEARING.width),
      coupling: tubeGeo(0.014, SHAFT.bore / 2, 0.012),
      gear: gearGeo(T_GEAR, FACE_GEAR, SHAFT.od / 2, 5),
      pinion: gearGeo(T_PIN, FACE_PIN, NEMA17.shaft / 2),
      shaft: tubeGeo(SHAFT.od / 2, SHAFT.bore / 2, SHAFT.length),
      spacer: tubeGeo(0.013, SHAFT.od / 2, GEAR_Y - FACE_GEAR / 2 - (PLATE_Y - 0.001 + BEARING.width)),
      bearing: {
        // Outer and inner race as one mesh, with the rubber seal (2RS) between them.
        race: (() => {
          const outer = tubeGeo(BEARING.od / 2, mid + gap, BEARING.width), inner = tubeGeo(mid - gap, BEARING.bore / 2, BEARING.width);
          const g = new THREE.BufferGeometry();
          for (const name of ['position', 'normal'] as const) {
            const a = outer.getAttribute(name).array, b = inner.getAttribute(name).array;
            const both = new Float32Array(a.length + b.length);
            both.set(a); both.set(b, a.length);
            g.setAttribute(name, new THREE.BufferAttribute(both, 3));
          }
          return g;
        })(),
        seal: tubeGeo(mid + gap, mid - gap, BEARING.width - 0.001),
      },
      cable: new THREE.CylinderGeometry(0.0035, 0.0035, 1, 12).translate(0, 0.5, 0), // grows upward from its base
    };
  }, []);
  const magnet = useMemo(() => mat(0xff5d6c), []);
  const board = useMemo(() => mat(0x1f7a4d), []);
  const rubber = useMemo(() => mat(0x14171d, { roughness: 0.9 }), []);

  useFrame(() => {
    const { ex, brain } = world;
    mech.current.visible = ex > 0.02;
    pcb.current.position.z = 0.055 + 0.15 * ex;
    // The fan's power cable is the one thing that still joins the head to the neck when it lifts off.
    cable.current.scale.y = SHAFT.length + 0.012 + HEAD_LIFT * ex;
    gear.current.rotation.y = brain.head * RAD;
    pinion.current.rotation.y = -brain.head * RAD * RATIO + PIN_PHASE;
    // A hall switch stays on for about the width of the magnet: roughly 4° either side of home.
    homeLed.current.emissiveIntensity = Math.abs(brain.head) < 4 ? 4 : 0;
  });

  return (
    <group ref={mech} visible={false} position-y={1.22} scale={DRAW}>
      <mesh castShadow material={dark} geometry={geo.floor} position-y={-0.004} />
      <mesh castShadow material={steel} geometry={geo.bearingSeat} />
      <mesh castShadow material={steel} geometry={geo.bearingSeat} position-y={PLATE_Y - 0.001} />

      {/* Motor plate: carries the motor by its face and seats the upper bearing. */}
      <mesh castShadow material={steel} geometry={geo.plate} position-y={PLATE_Y} />
      {[-0.0155, 0.0155].flatMap(x => [-CENTRES - 0.0155, -CENTRES + 0.0155].map(z => (
        <mesh key={`${x}:${z}`} material={steel} position={[x, PLATE_Y + PLATE_T + 0.0015, z]}>
          <cylinderGeometry args={[0.0027, 0.0027, 0.003, 12]} />
        </mesh>
      )))}
      {STANDOFFS.map(([x, z], i) => (
        <mesh key={i} castShadow material={brass} position={[x, PLATE_Y / 2, z]}>
          <cylinderGeometry args={[0.003, 0.003, PLATE_Y, 6]} />
        </mesh>
      ))}
      <CalloutAnchor i={8} position={[0.025, PLATE_Y + PLATE_T, -0.02]} />

      {/* Two bearings 40 mm apart, so they can resist the head tipping forward as well as its weight. */}
      <Bearing y={0} geo={geo.bearing}>
        <CalloutAnchor i={3} position={[BEARING.od / 2, BEARING.width / 2, 0]} />
      </Bearing>
      <Bearing y={PLATE_Y - 0.001} geo={geo.bearing} />

      <group ref={gear} position-y={GEAR_Y}>
        <mesh castShadow geometry={geo.gear} material={brass} />
        <mesh castShadow geometry={geo.shaft} material={steel} position-y={-GEAR_Y} />
        <mesh castShadow geometry={geo.coupling} material={steel} position-y={SHAFT.length - GEAR_Y - 0.002} />
        <mesh castShadow geometry={geo.spacer} material={steel} position-y={PLATE_Y - 0.001 + BEARING.width - GEAR_Y} />
        <mesh castShadow material={magnet} position-x={MAGNET_X}>{/* home magnet, pressed through the gear */}
          <cylinderGeometry args={[0.003, 0.003, FACE_GEAR + 0.001, 12]} />
        </mesh>
      </group>
      <mesh ref={cable} geometry={geo.cable} material={rubber} position-y={-0.004} />
      <CalloutAnchor i={0} position={[-R_GEAR * 0.75, GEAR_Y + FACE_GEAR / 2, 0.02]} />
      <CalloutAnchor i={4} position={[0, SHAFT.length - 0.012, 0]} />

      <group ref={pinion} position={[0, GEAR_Y, -CENTRES]}>
        <mesh castShadow geometry={geo.pinion} material={steel} />
        <mesh castShadow material={steel} position-y={PLATE_Y + NEMA17.shaftLength / 2 - GEAR_Y}>
          <cylinderGeometry args={[NEMA17.shaft / 2, NEMA17.shaft / 2, NEMA17.shaftLength, 12]} />
        </mesh>
      </group>
      <CalloutAnchor i={1} position={[0, GEAR_Y + FACE_PIN / 2, -CENTRES]} />

      <mesh castShadow material={dark} position={[0, PLATE_Y - NEMA17.length / 2, -CENTRES]}>{/* stepper body */}
        <boxGeometry args={[NEMA17.size, NEMA17.length, NEMA17.size]} />
      </mesh>
      <CalloutAnchor i={2} position={[NEMA17.size / 2, PLATE_Y - NEMA17.length / 2, -CENTRES - NEMA17.size / 2]} />

      {/* Home sensor: a hall switch on a post, 2 mm under the magnet's path. */}
      <mesh castShadow material={brass} position={[MAGNET_X, 0.0235, 0]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.047, 6]} />
      </mesh>
      <mesh castShadow material={board} position={[MAGNET_X + 0.006, 0.0478, 0]}>
        <boxGeometry args={[0.02, 0.0016, 0.008]} />
      </mesh>
      <mesh material={dark} position={[MAGNET_X, 0.04935, 0]}>
        <boxGeometry args={[0.004, 0.0015, 0.004]} />
      </mesh>
      <mesh position={[MAGNET_X + 0.013, 0.0495, 0]}>
        <sphereGeometry args={[0.0018, 8, 8]} />
        <meshStandardMaterial ref={homeLed} color={0x111111} emissive={0x5be38a} emissiveIntensity={0} />
      </mesh>
      <CalloutAnchor i={5} position={[MAGNET_X + 0.013, 0.0495, 0]} />

      <mesh ref={pcb} castShadow material={board} position={[0, 0.006, 0.055]}>
        <boxGeometry args={[0.08, 0.0016, 0.04]} />
        <mesh castShadow material={dark} position={[-0.02, 0.0018, 0]}>{/* vision SoC */}
          <boxGeometry args={[0.014, 0.002, 0.014]} />
        </mesh>
        <mesh castShadow material={dark} position={[0.02, 0.0033, 0]}>{/* stepper driver under its heatsink */}
          <boxGeometry args={[0.01, 0.005, 0.015]} />
        </mesh>
        <CalloutAnchor i={6} position={[0, 0.002, 0]} />
      </mesh>
    </group>
  );
}
