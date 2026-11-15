import * as THREE from 'three';

// Materials shared by many meshes. Creating them once keeps draw state small.
export const mat = (color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });

export const white = mat(0xe9edf3, { roughness: 0.35 });
export const dark = mat(0x2b3140, { roughness: 0.4, metalness: 0.5 });
export const cage = mat(0xcfd6e2, { metalness: 0.7, roughness: 0.3 });
export const brass = mat(0xd9a441, { metalness: 0.45, roughness: 0.35 });
export const steel = mat(0xb9c2cf, { metalness: 0.5, roughness: 0.3 });
export const wood = mat(0x8a5a3a);
export const woodDark = mat(0x5e3d28);
/** The neck housing; its opacity fades as the mechanism view opens. */
export const shell = mat(0xe9edf3, { roughness: 0.35, side: THREE.DoubleSide, transparent: true });

export const RAD = Math.PI / 180;
