---
name: add-article-headings
description: "Build Article Headings from its verified authored source using DOM/CSS + Canvas 2D, including the complete renderer, interactions, and required assets. Use when Codex needs to implement, port, or adapt this effect without requiring the ThreeUI package or reconstructing the visual from an approximation."
---

# Build Article Headings

## Description

Three expressive text treatments collected in one family: a chromatic intro, a particle wordmark, and an audio-reactive identity lockup.

Recreate the authored behavior from the verified source, not from screenshots or the abbreviated orchestration sample in this skill. The implementation may live directly in the target project and does not require `@designcodeio/threeui`.

## Technologies

- A lazy React and TypeScript host for five text-animation variants
- Semantic DOM headings with requestAnimationFrame decoding
- Canvas 2D neon, particle-mask, and audio-bar renderers
- A chromatic DOM/CSS intro isolated from its authored source document
- Synchronized dark/light surfaces, palette controls, and reduced-motion handling

## Verified source material

- `ascii-page-transition-v1.html — article headings and decode lifecycle`
- `src/shaders/article-headings/TextAnimationCollection.tsx`
- `src/shaders/article-headings/articleHeadingDecode.ts`
- `src/shaders/article-headings/ArticleHeadings.tsx`
- `src/shaders/neuform-isolated/sources/glassblown-neon.html`
- `src/shaders/neuform-isolated/sources/creator-studio-intro.html`
- `src/shaders/neuform-isolated/sources/epilude-footer.html`
- `src/shaders/neuform-isolated/sources/audio-wordmark.html`
- `src/shaders/neuform-isolated/NeuformCraftEffects.tsx`
- `src/shaders/neuform-isolated/NeuformIsolatedEffects.tsx`
- `src/shaders/fonts/fragment-mono.woff2`

Source revision: `5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e / SHA-256 e14795f24ea8 / 8d2cfccf1140 / 26f0d8d04494 / 1545c354af8d`

## Implementation steps

1. Open every verified source file listed above and identify the renderer, host lifecycle, styles, and assets before editing.
2. Expose article-headings, neon-sign, threeui-intro, particle-wordmark, and audio-wordmark through one discriminated variant prop.
3. Preserve the article decoder as semantic headings, including its eased reveal budget, scramble window, cleanup, and reduced-motion behavior.
4. Keep the Neon Typography source and its Canvas 2D tubing, electrode, flicker, and bloom renderer intact.
5. Keep the intro, particle, and audio documents as sandboxed authored sources, adapting only presentation, theme, and ThreeUI copy.
6. Lazy-load each renderer, forward only its compatible props, and preserve the family’s per-variant control sets and preview media.
7. Give the local component a sized, overflow-controlled parent and verify desktop, mobile, reduced-motion, and context-loss behavior.

Asset handling: Copy the exact extracted Fragment Mono file for the article metadata and keep the four bundled owned HTML source documents available to the collection adapters.

## Local component example

Import the copied local component rather than a package entrypoint:

```tsx
import { TextAnimationCollection } from "./effects/article-headings/TextAnimationCollection";
import "./effects/article-headings/styles.css";

export function Scene() {
  return (
    <div className="effect-frame">
      <TextAnimationCollection
        variant="article-headings"
        mode="dark"
        duration={560}
        stagger={140}
      />
    </div>
  );
}
```

## Core renderer pattern

This excerpt documents orchestration only. Copy the exact shader, geometry, pass, and interaction code from the verified source files.

```tsx
<TextAnimationCollection variant="audio-wordmark" mode="dark" brightness={1} />
```

## Behavior contract

- Runtime: DOM/CSS + Canvas 2D
- Passes: Variant-dependent DOM/CSS or one to two Canvas 2D passes
- Interaction: Authored text motion with responsive presentation, reduced-motion handling, and synchronized light/dark mode
- Assets: Exact embedded Fragment Mono font; all other sources and marks are bundled inline
- **renderer** (variant): DOM/CSS or Canvas 2D
- **variants** (fixed): Intro | Particle | Audio
- **mode** (optional): dark | light
- **motion** (adaptive): Reduced-motion aware
- **assets** (bundled): Fragment Mono + inline source documents

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
