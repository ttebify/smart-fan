import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type ComponentRef } from 'react';
import * as THREE from 'three';
import { FAN } from '@/brain';
import { useStore } from '@/sim/store';
import { world } from '@/sim/world';

interface Flight { p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; k: number }

/** Orbit controls, plus the camera flight into and out of the mechanism view. */
export function CameraRig() {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree(s => s.size.width / s.size.height);
  const inspect = useStore(s => s.inspect);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const fly = useRef<Flight | null>(null);
  const saved = useRef<{ p: THREE.Vector3; t: THREE.Vector3 } | null>(null);
  const wasInspecting = useRef(false), framed = useRef(false);

  // Let code outside the canvas (palette drags) raycast and pause orbiting.
  useEffect(() => {
    world.camera = camera;
    world.controls = controls.current;
    return () => { world.camera = null; world.controls = null; };
  }, [camera]);

  // A wider lens on tall screens, so the whole room still fits on a phone.
  useEffect(() => {
    camera.fov = aspect < 1.2 ? 58 : 42;
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  // On a portrait screen, also start further back: the room is wider than it is deep.
  useEffect(() => {
    // Only for the screen the page opened on. Later resizes leave the user's view alone.
    const c = controls.current;
    if (!c || framed.current) return;
    framed.current = true;
    const back = THREE.MathUtils.clamp(0.9 / aspect, 1, 1.6);
    camera.position.sub(c.target).multiplyScalar(back).add(c.target);
  }, [camera, aspect]);

  useEffect(() => {
    const c = controls.current;
    if (!c || inspect === wasInspecting.current) return;
    wasInspecting.current = inspect;
    const p0 = camera.position.clone(), t0 = c.target.clone();
    if (inspect) {
      saved.current = { p: p0.clone(), t: t0.clone() };
      c.minDistance = 0.6;
      fly.current = { p0, t0, p1: new THREE.Vector3(FAN.x + 1.9, 2.55, FAN.z - 1.5), t1: new THREE.Vector3(FAN.x, 1.5, FAN.z), k: 0 };
    } else if (saved.current) {
      fly.current = { p0, t0, p1: saved.current.p, t1: saved.current.t, k: 0 };
    }
  }, [inspect, camera]);

  useFrame((_, delta) => {
    const f = fly.current, c = controls.current;
    if (!f || !c) return;
    f.k = Math.min(1, f.k + Math.min(0.05, delta) / 0.9);
    const e = f.k * f.k * (3 - 2 * f.k);
    camera.position.lerpVectors(f.p0, f.p1, e);
    c.target.lerpVectors(f.t0, f.t1, e);
    camera.lookAt(c.target);
    if (f.k === 1) {
      if (!useStore.getState().inspect) c.minDistance = 5;
      fly.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 0.6, -0.4]}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={5}
      maxDistance={28}
      enableDamping
    />
  );
}
