import { useEffect } from 'react';
import * as THREE from 'three';
import { useStore } from '../sim/store';
import { world, type Entity } from '../sim/world';

// Dragging objects across the floor. A drag can start inside the canvas (on an object)
// or outside it (on a palette button), so the pointer maths lives here, not in the scene.

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

/** Where a screen position lands on the floor, or null if it misses (looking at the sky). */
export function floorPoint(clientX: number, clientY: number) {
  if (!world.camera) return null;
  ptr.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, world.camera);
  const p = ray.ray.intersectPlane(ground, new THREE.Vector3());
  if (p) { p.x = THREE.MathUtils.clamp(p.x, -11, 11); p.z = THREE.MathUtils.clamp(p.z, -8, 9); }
  return p;
}

export function startDrag(e: Entity, p: THREE.Vector3) {
  world.drag = { e, dx: e.x - p.x, dz: e.z - p.z };
  if (world.controls) world.controls.enabled = false;
  document.body.style.cursor = 'grabbing';
}

const overPalette = (ev: PointerEvent) => !!document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-palette]');

/** Follows the pointer while a drag is active. Dropping on the palette removes the object. */
export function useDrag() {
  useEffect(() => {
    const move = (ev: PointerEvent) => {
      const { drag } = world;
      if (!drag) return;
      const p = floorPoint(ev.clientX, ev.clientY);
      if (p) { drag.e.x = p.x + drag.dx; drag.e.z = p.z + drag.dz; }
      const hot = overPalette(ev);
      if (hot !== useStore.getState().dropHot) useStore.getState().set({ dropHot: hot });
    };
    const up = (ev: PointerEvent) => {
      const { drag } = world;
      if (!drag) return;
      if (overPalette(ev)) useStore.getState().remove(drag.e);
      world.drag = null;
      if (world.controls) world.controls.enabled = true;
      document.body.style.cursor = '';
      useStore.getState().set({ dropHot: false });
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
    };
  }, []);
}
