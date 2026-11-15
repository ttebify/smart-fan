# Smart Fan Simulator

An oscillating fan that only sweeps as far as the people in the room need. Drag people and furniture around the room, watch the fan narrow its sweep to the people it can see, then try to fool it with a coat rack.

It runs entirely in the browser. There is no hardware and no ML model: the sensor is a mock that behaves like a real detector, with limited range, a field of view, occlusion, noise and missed frames.

Built with React 19, react-three-fiber, three.js, zustand and [ui-sdk](https://github.com/vercel-labs/ui).

## Run

```sh
npm install
npm run dev
```

`npm run build` type-checks and writes a static site to `dist/`, which any static host can serve.

## Things to try

- Drag a person out of the room, behind the wardrobe, or into a far corner.
- Add a mannequin or coat rack, then lower the confidence threshold until the fan is fooled.
- Switch to "Ordinary fan" for a while and compare the "air landing on people" scores.
- Click the fan to open the neck drive and see the gears turn.

## How it is built

The rule that shapes the code: **anything that changes every frame stays out of React state.**

| Layer | Where | Holds |
|---|---|---|
| Logic | `src/brain.ts` | Sensor, tracker and sweep controller. Pure TypeScript, no rendering, no React. |
| Per-frame world | `src/sim/world.ts` | One `Brain`, object positions, fan power, score accumulators. Plain mutable data. |
| UI state | `src/sim/store.ts` | Tuning parameters, which panels are open, the list of objects, and a telemetry snapshot published five times a second. |
| Scene | `src/scene/` | react-three-fiber components. Each reads `world` in `useFrame` and writes straight to its three.js objects. |
| Panels | `src/ui/` | ui-sdk controls. Each subscribes to the one slice of the store it shows. |

So the simulation runs at 60 fps without a single React render, and the panels re-render at 5 Hz. Dragging an object mutates its position in place; only adding or removing one touches React state.

### The fan's brain

- **Sensor** (`sense`): reports a bearing, a distance and an "is this a person?" confidence for everything it can see.
- **Tracker**: a detection only counts once it has scored above the confidence threshold several times in a row, so one noisy frame cannot move the fan. People who vanish are held for a few seconds.
- **Controller**: sweeps between the leftmost and rightmost tracked person plus a margin, lingers on people, hurries across empty gaps, and rests when nobody is there.

To use a real detector later (for example a webcam model), replace `sense` with anything that returns the same `Detection[]`.

### A few details

- Labels above objects and the mechanism callouts are plain DOM outside the canvas. The scene positions them every frame through refs, so they stay sharp and cost no React renders.
- A drag can start on an object in the canvas or on a palette button outside it, so the pointer maths lives in one module (`src/scene/use-drag.ts`).
- On a phone the side panels move into a bottom sheet that is not modal, so the room stays usable while you tune.
