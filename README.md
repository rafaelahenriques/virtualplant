# Generative Ecosystem

A living 3D environment where hand gestures influence plant growth and environmental conditions. Plants are generated procedurally and respond to a simulated environment, with the webcam as the controller.

The procedural plant generator and growth simulation are the technical centrepiece. Hand tracking is how you interact with them.

**Status:** early, see the [roadmap](#roadmap). You can pinch to move a placeholder plant through its growth stages, and its leaves respond to the wind setting in the development panel.

## Pinch to grow

Growth changes the plant's form, not its size. Spreading your thumb and index finger moves it forward through its stages, and closing them plays the stages back in reverse.

| Growth     | Stage                                                  |
| ---------- | ------------------------------------------------------ |
| 0          | Seedling with two seed leaves                          |
| 0 to 0.4   | The stem extends and new leaves unfurl                 |
| 0.4 to 0.6 | Sepals and the first petals form a closed bud          |
| 0.6 to 1   | Rings of petals form and open, then the stamens appear |

No model training is involved. ml5 HandPose is already trained and returns 21 landmarks per hand, and a pinch is the distance between two of them, divided by palm length so it reads the same near or far from the camera. With no hand in view, the plant holds its current stage.

The overlay shows the live reading. If `grow` can't reach 0 or 1 on your hand, adjust `PINCHED_RATIO` and `SPREAD_RATIO` in `src/tracking/GestureRecognizer.ts`.

## Getting started

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

The camera is only requested when you press **Start** under **Hand tracking**. Browsers allow camera access on `localhost` and HTTPS only.

| Command                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the development server         |
| `npm run build`        | Type-check and build for production  |
| `npm run preview`      | Serve the production build locally   |
| `npm test`             | Run the unit tests                   |
| `npm run lint`         | Lint with ESLint                     |
| `npm run format`       | Format with Prettier                 |
| `npm run format:check` | Check formatting without changing it |

## Stack

| Technology       | Purpose                                     |
| ---------------- | ------------------------------------------- |
| TypeScript, Vite | Application logic, development and bundling |
| Three.js         | 3D scene and plant rendering on WebGL 2     |
| GLSL             | Plant animation and environmental effects   |
| ml5.js HandPose  | Hand tracking, 21 landmarks per hand        |
| Zustand          | Ecosystem state                             |
| GSAP             | Smooth transitions                          |
| lil-gui          | Development controls                        |
| Vitest           | Unit tests                                  |

## Architecture

Gestures never touch rendering directly. Tracking only reports what the hands are doing, the interaction layer turns that into environment changes, and the simulation and renderer read from the store.

```text
webcam → HandTracker → GestureRecognizer → GestureMapper → ecosystemStore → Simulation, Plant, shaders
```

Each file arrives with the phase that needs it, so nothing in `src/` is an empty stub:

```text
src/
├── core/       Scene, Camera, Renderer, AnimationLoop, math
├── tracking/   HandTracker, GestureRecognizer, GestureMapper
├── ecosystem/  Environment
│               Simulation (phase 6), Ecosystem, PlantManager (phase 7)
├── plants/     Plant (placeholder), Flower, GrowthSystem
│               PlantGenerator, Stem, Branch, Leaf (phase 2)
├── shaders/    stem.vert, leaf.vert, petal.vert, xray.frag
│               wind.vert (phase 8)
├── ui/         EnvironmentPanel, HUD
├── store/      ecosystemStore
├── types/      Declarations for untyped packages
└── main.ts
```

Shaders are imported as strings with Vite's `?raw` suffix, for example `import leafVertex from '../shaders/leaf.vert?raw'`.

The visual direction is plants as x-ray specimens under machine observation: translucent, veined tissue on near-black, with thin tracking overlays and monospace readouts.

## Roadmap

| Phase | Deliverable                                   | Status  |
| ----- | --------------------------------------------- | ------- |
| 1     | Three.js environment with one static 3D plant | Done    |
| 2     | Procedural plant generation                   | Planned |
| 3     | Animated plant growth                         | Started |
| 4     | ml5.js hand tracking                          | Done    |
| 5     | Gesture recognition and interaction           | Started |
| 6     | Environmental simulation                      | Planned |
| 7     | Multiple plants and ecosystem behaviour       | Planned |
| 8     | Custom shaders, lighting and visual polish    | Planned |

## Contributing

This project uses GitHub Flow. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
