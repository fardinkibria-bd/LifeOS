---
name: add-star-portal
description: "Build Shader Buttons from its verified authored source using Raw WebGL + Canvas 2D + CSS, including the complete renderer, interactions, and required assets. Use when Codex needs to implement, port, or adapt this effect without requiring the ThreeUI package or reconstructing the visual from an approximation."
---

# Build Shader Buttons

## Description

Seven authored shader and canvas button treatments collected into one interactive family.

Recreate the authored behavior from the verified source, not from screenshots or the abbreviated orchestration sample in this skill. The implementation may live directly in the target project and does not require `@designcodeio/threeui`.

## Technologies

- React variant host
- Five raw WebGL button sources
- Four Canvas 2D button sources
- Authored CSS controls
- Lazy-loaded isolated renderers

## Verified source material

- `src/shaders/shader-buttons/ShaderButtons.tsx`
- `src/shaders/shader-buttons/RakingLightPillButton.tsx`
- `src/shaders/neuform-isolated/NeuformIsolatedEffects.tsx`
- `src/shaders/neuform-isolated/sources/imaginie-starfield.html`
- `src/shaders/neuform-isolated/sources/ignition-terminal.html`
- `src/shaders/neuform-isolated/sources/valence-core.html`
- `src/shaders/neuform-isolated/sources/aetheris-labs.html`
- `src/shaders/neuform-isolated/sources/nexus-tactile.html`
- `src/shaders/neuform-isolated/sources/thinking-button.html`

Source revision: `SHA-256 6f56c4f91814`

## Implementation steps

1. Open every verified source file listed above and identify the renderer, host lifecycle, styles, and assets before editing.
2. Keep ShaderButtons as the public entry point and select star-portal, ignition-button, induction-button, plasma-button, tactile-button, thinking-button, or raking-light-pill with the variant prop.
3. Retain all six complete authored source documents plus the self-contained Raking Light Pill fragment shader, with independent shader, canvas, CSS, resize, and interaction systems.
4. Expose mode and palette controls at the family boundary while leaving each button's authored behavior intact.
5. Lazy-load and mount only the selected button renderer so inactive variants do not allocate canvases, WebGL contexts, or animation loops.
6. Give the local component a sized, overflow-controlled parent and verify desktop, mobile, reduced-motion, and context-loss behavior.

Asset handling: This effect has no required external assets.

## Local component example

Import the copied local component rather than a package entrypoint:

```tsx
import { ShaderButtons } from "./effects/star-portal/ShaderButtons";
import "./effects/star-portal/styles.css";

export function Scene() {
  return (
    <div className="effect-frame">
      <ShaderButtons />
    </div>
  );
}
```

## Core renderer pattern

This excerpt documents orchestration only. Copy the exact shader, geometry, pass, and interaction code from the verified source files.

```tsx
<ShaderButtons variant="raking-light-pill" mode="dark" />
```

## Behavior contract

- Runtime: Raw WebGL + Canvas 2D + CSS
- Passes: 1 selected shader, canvas, and CSS button composition
- Interaction: Variant selection with authored pointer, hover, motion, and palette behavior
- Assets: No owned binary assets
- **source** (fixed): Exact Neuform HTML
- **focus** (host): Effect-only sandbox
- **mode** (optional): dark | light
- **palette** (optional): Final-frame grade
- **assets** (fixed): No owned binary assets
- **variants** (fixed): Star Portal + Ignition + Induction + Plasma + Tactile + Thinking + Raking Light Pill

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
