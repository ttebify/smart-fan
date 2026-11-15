import { useMemo } from 'react';
import { ROOM } from '@/brain';
import { mat } from '@/scene/materials';

const WALLS: [w: number, d: number, x: number, z: number][] = [
  [ROOM.hw * 2 + 0.2, 0.1, 0, -ROOM.hd],
  [ROOM.hw * 2 + 0.2, 0.1, 0, ROOM.hd],
  [0.1, ROOM.hd * 2, -ROOM.hw, 0],
  [0.1, ROOM.hd * 2, ROOM.hw, 0],
];

export function Room() {
  // Low walls so the room boundary is obvious without hiding anything.
  const wallMat = useMemo(() => mat(0x3a4763, { transparent: true, opacity: 0.55 }), []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={0x0d121c} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM.hw * 2, ROOM.hd * 2]} />
        <meshStandardMaterial color={0x232b3a} roughness={0.9} />
      </mesh>
      <gridHelper args={[12, 12, 0x33405a, 0x2a3346]} scale-z={ROOM.hd / ROOM.hw} position-y={0.002} />
      {WALLS.map(([w, d, x, z], i) => (
        <mesh key={i} position={[x, 0.175, z]} material={wallMat}>
          <boxGeometry args={[w, 0.35, d]} />
        </mesh>
      ))}
    </>
  );
}
