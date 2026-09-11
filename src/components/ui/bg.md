---
name: add-constellation-field
description: "Build Constellation Field from its verified authored source using Canvas 2D + Raw WebGL, including the complete renderer, interactions, and required assets. Use when Codex needs to implement, port, or adapt this effect without requiring the ThreeUI package or reconstructing the visual from an approximation."
---

# Build Constellation Field

## Description

A family of particle networks, gateways, interface lines, defense traces, and topographic fields gathered into one configurable collection.

Recreate the authored behavior from the verified source, not from screenshots or the abbreviated orchestration sample in this skill. The implementation may live directly in the target project and does not require `@designcodeio/threeui`.

## Technologies

- React variant host
- Seven Canvas 2D sources
- One raw WebGL source
- Dark/light mode surfaces
- Lazy-loaded isolated source sandboxes

## Verified source material

- `src/shaders/constellation-field/ConstellationField.tsx`
- `src/shaders/neuform-isolated/NeuformBatchEffects.tsx`
- `src/shaders/neuform-isolated/sources/constellation-field.html`
- `src/shaders/neuform-isolated/sources/particle-drift.html`
- `src/shaders/neuform-isolated/sources/particle-network.html`
- `src/shaders/neuform-isolated/sources/gateway-flow.html`
- `src/shaders/neuform-isolated/sources/connectivity-graph.html`
- `src/shaders/neuform-isolated/sources/interface-lines.html`
- `src/shaders/neuform-isolated/sources/defense-lines.html`
- `src/shaders/neuform-isolated/sources/topo-field.html`

Source revision: `SHA-256 1920ad4fe34f`

## Implementation steps

1. Open every verified source file listed above and identify the renderer, host lifecycle, styles, and assets before editing.
2. Keep Constellation Field as the public entry point and select constellation-field, particle-drift, particle-network, gateway-flow, connectivity-graph, interface-lines, defense-lines, or topo-field with the variant prop.
3. Retain each complete authored source and its own isolated renderer instead of blending the scenes into a shared canvas.
4. Expose the shared mode, motion, geometry, opacity, and palette controls at the collection boundary.
5. Mount only the selected source so inactive variants do not allocate a canvas, WebGL context, or animation loop.
6. Preserve each renderer's source isolation, resizing, animation controls, and iframe lifecycle.
7. Give the local component a sized, overflow-controlled parent and verify desktop, mobile, reduced-motion, and context-loss behavior.

Asset handling: This effect has no required external assets.

## Local component example

Import the copied local component rather than a package entrypoint:

```tsx
import { ConstellationField } from "./effects/constellation-field/ConstellationField";
import "./effects/constellation-field/styles.css";

export function Scene() {
  return <div className="effect-frame"><ConstellationField /></div>;
}
```

## Core renderer pattern

This excerpt documents orchestration only. Copy the exact shader, geometry, pass, and interaction code from the verified source files.

```tsx
<ConstellationField variant="topo-field" speed={1.2} density={1.1} />
```

## Behavior contract

- Runtime: Canvas 2D + Raw WebGL
- Passes: 1 active isolated source pass
- Interaction: Variant selection plus customizable mode, speed, size, stroke width, length, density, opacity, and palette
- Assets: No owned binary assets
- **source** (fixed): Exact Neuform HTML
- **variants** (fixed): Constellation + Drift + Network + Gateway + Connectivity + Interface + Defense + Topo
- **focus** (host): Effect-only sandbox
- **mode** (optional): dark | light
- **speed** (number): 1
- **size** (number): 1
- **strokeWidth** (number): 1
- **length** (number): 1
- **density** (number): 1
- **opacity** (number): 1
- **palette** (optional): Final-frame grade
- **assets** (fixed): No owned binary assets

## Verification

1. Compare the rendered composition, animation timing, pointer behavior, and state transitions with the source implementation.
2. Exercise resize, high-DPI, mobile/coarse-pointer, reduced-motion, tab visibility, and WebGL context-loss paths where applicable.
3. Confirm every animation frame, observer, listener, geometry, buffer, texture, framebuffer, material, and renderer is released on teardown.
4. Check the browser console and confirm the effect renders at native-or-better backing resolution.

## Guardrails

- Do not substitute a visually similar package, demo, shader, or runtime.
- Do not approximate, reconstruct, or simplify the authored GLSL, render passes, geometry, interaction state, or assets.
- Keep exact source and asset hashes under regression tests when the source project provides them.
- Adapt only the surrounding host boundary needed by the target project; keep renderer behavior intact.
