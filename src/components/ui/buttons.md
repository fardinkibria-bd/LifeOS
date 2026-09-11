---
name: add-liquid-metal-button
description: "Build Liquid Metal Button from its verified authored source using Raw WebGL 2 + DOM/CSS, including the complete renderer, interactions, and required assets. Use when Codex needs to implement, port, or adapt this effect without requiring the ThreeUI package or reconstructing the visual from an approximation."
---

# Build Liquid Metal Button

## Description

A prismatic liquid-metal control in Sign up pill, Liquid Orb, and configurable Play Circle variants, with pointer-following bloom and press ripples.

Recreate the authored behavior from the verified source, not from screenshots or the abbreviated orchestration sample in this skill. The implementation may live directly in the target project and does not require `@designcodeio/threeui`.

## Technologies

- React and TypeScript visibility-aware sandbox host
- Exact self-contained raw WebGL2, DOM, and CSS document imported as source text
- Semantic native button with authored hover, focus, pressed, and keyboard states
- Multipass spectral metal, crisp rim, adaptive softening, multi-radius bloom, and composite pipeline
- Configurable circular play variant with live finish, diameter, stroke, and accessible-label controls
- Pointer-dragged liquid field, faceted press ripples, capped DPR, and reduced-motion freezing

## Verified source material

- `src/shaders/liquid-metal-button/liquid-metal-button.html`
- `src/shaders/liquid-metal-button/LiquidMetalButton.tsx`

Source revision: `SHA-256 76624e881a3a`

## Implementation steps

1. Open every verified source file listed above and identify the renderer, host lifecycle, styles, and assets before editing.
2. Keep the complete authored HTML byte-for-byte; do not rewrite its shaders, framebuffer graph, CSS plate, button semantics, interaction state, or tuning hooks.
3. Import the canonical document as a raw string and mount it through an `allow-scripts`-only srcDoc iframe so its WebGL2 and DOM event scopes remain isolated.
4. Select the authored Sign up pill with `variant="pill"`, the compact Liquid Orb with `variant="circle"`, or the configurable play control with `variant="play"`.
5. Let the source-owned CSS size the pill responsively, keep the orb at 56–72px, and let the renderer cap backing resolution at 2× device pixel ratio.
6. Select the play variant to map equal width and height into the same pill SDF, then update diameter, rim width, colored or monotone finish, and the icon-only control's accessible name through the iframe message adapter without remounting it.
7. Retain pointer hover and drag, pointer and keyboard ripple launches, focus-visible styling, and the source-owned reduced-motion clock freeze.
8. Unmount the iframe when the host is offscreen or the document is hidden so its WebGL context, buffers, framebuffers, listeners, and animation loop are released together.
9. Give the local component a sized, overflow-controlled parent and verify desktop, mobile, reduced-motion, and context-loss behavior.

Asset handling: This effect has no required external assets.

## Local component example

Import the copied local component rather than a package entrypoint:

```tsx
import { LiquidMetalButton } from "./effects/liquid-metal-button/LiquidMetalButton";
import "./effects/liquid-metal-button/styles.css";

export function Scene() {
  return (
    <div className="effect-frame">
      <LiquidMetalButton />
    </div>
  );
}
```

## Core renderer pattern

This excerpt documents orchestration only. Copy the exact shader, geometry, pass, and interaction code from the verified source files.

```tsx
<LiquidMetalButton
  variant="play"
  rendering="colored"
  diameter={88}
  strokeWidth={3}
  text="Play"
/>
```

## Behavior contract

- Runtime: Raw WebGL 2 + DOM/CSS
- Passes: Up to 20 — metal, crisp rim, adaptive softening, multi-radius bloom, and composite
- Interaction: Hover, focus, pointer-dragged metal, faceted press ripples, and Enter/Space activation
- Assets: 1 exact authored HTML scene with remote Inter stylesheet and system-font fallback
- **renderer** (sandbox): Raw WebGL 2 + DOM/CSS
- **control** (semantic): Native button
- **variants** (fixed): Sign up Pill + Liquid Orb + configurable Play Circle
- **geometry** (optional): 72–160 px circle + 1–8 px stroke
- **appearance** (optional): Colored | monotone
- **content** (optional): Custom accessible name
- **metal** (fixed): Spectral dispersion field
- **post** (adaptive): Softening + bloom
- **interaction** (pointer): Hover + drag + ripple
- **pixelRatio** (adaptive): ≤ 2
- **motion** (adaptive): Reduced-motion freeze
- **assets** (external): Inter stylesheet + fallback

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
