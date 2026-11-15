# Notes for coding agents

## ui-sdk

The panels use `@ui-sdk/react`, pinned to an exact beta version in `package.json`.

Before using ui-sdk:

- Follow the `ui-sdk` skill if it is installed (`.agents/skills/ui-sdk`).
- Read `node_modules/@ui-sdk/react/docs/llms.txt`, then only the component pages you need under `docs/components/`.
- To build a new component, also search `node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.

Do not bump the ui-sdk version as a side effect of other work. It is a beta and its API can change between releases.

## Conventions in this repo

- File names are kebab-case (`control-panel.tsx`, `use-drag.ts`). Component identifiers are PascalCase.
- Anything that changes every frame stays out of React state. It lives in `src/sim/world.ts` and is read in `useFrame`. React state (`src/sim/store.ts`) holds only what changes on a user action, plus a telemetry snapshot published at 5 Hz.
- `src/brain.ts` is pure logic with no rendering and no React. Keep it that way.
