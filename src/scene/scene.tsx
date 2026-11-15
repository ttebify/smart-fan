import { Canvas } from '@react-three/fiber';
import { Airflow } from '@/scene/airflow';
import { CalloutLayout } from '@/scene/callouts';
import { CameraRig } from '@/scene/camera-rig';
import { Entities } from '@/scene/entities';
import { Fan } from '@/scene/fan';
import { Room } from '@/scene/room';
import { Sectors } from '@/scene/sectors';
import { Simulation } from '@/scene/simulation';

const BG = 0x0b0f17;

export function Scene() {
  return (
    <Canvas
      className="scene"
      style={{ position: 'fixed', inset: 0 }}
      shadows="soft"
      dpr={[1, 2]}
      camera={{ position: [0, 10.5, 11.5], fov: 42, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        sessionStorage.removeItem('gl-retries');
        // If the GPU drops the context mid-session, recover by reloading once it is back.
        gl.domElement.addEventListener('webglcontextlost', ev => ev.preventDefault());
        gl.domElement.addEventListener('webglcontextrestored', () => location.reload());
      }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 22, 42]} />
      <hemisphereLight args={[0xbfd6ff, 0x1a1410, 0.75]} />
      <directionalLight color={0xfff1dd} intensity={2.1} position={[5, 12, 6]} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-11, 11, 11, -11, 0.5, 40]} />
      </directionalLight>

      <Simulation />
      <CameraRig />
      <Room />
      <Sectors />
      <Fan />
      <Entities />
      <Airflow />
      <CalloutLayout />
    </Canvas>
  );
}
