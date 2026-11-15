// What can be placed in the room. Data only: the 3D models live in scene/kinds.tsx.

export interface KindSpec {
  label: string;
  icon: string;
  /** How person-like the detector finds it, 0..1. */
  base: number;
  /** Height in metres, used to place the label above it. */
  height: number;
  /** Tall furniture that blocks the sensor and the air (half extents). */
  blocker?: { hw: number; hd: number };
}

export const KINDS = {
  person: { label: 'Person', icon: '🧍', base: 0.93, height: 1.9 },
  mannequin: { label: 'Mannequin', icon: '🗿', base: 0.58, height: 1.9 },
  coatrack: { label: 'Coat rack', icon: '🧥', base: 0.5, height: 1.95 },
  chair: { label: 'Chair', icon: '🪑', base: 0.06, height: 1.1 },
  lamp: { label: 'Floor lamp', icon: '💡', base: 0.1, height: 1.85 },
  plant: { label: 'Plant', icon: '🪴', base: 0.12, height: 1.35 },
  wardrobe: { label: 'Wardrobe', icon: '🚪', base: 0.03, height: 2.3, blocker: { hw: 0.8, hd: 0.32 } },
} satisfies Record<string, KindSpec>;

export type KindId = keyof typeof KINDS;
export const KIND_IDS = Object.keys(KINDS) as KindId[];
export const kindSpec = (id: KindId): KindSpec => KINDS[id];
