# Generative Ecosystem

A living 3D environment where hand gestures influence plant growth and environmental conditions. Plants are generated procedurally and respond to a simulated environment, with the webcam as the controller.

The procedural plant generator and growth simulation are the technical centrepiece. Hand tracking is how you interact with them.

**Status:** phase 1 of the [roadmap](#roadmap). The scene renders a placeholder plant whose leaves respond to the wind setting in the development panel.

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
├── core/       Scene, Camera, Renderer, AnimationLoop
├── tracking/   HandTracker
│               GestureRecognizer, GestureMapper (phase 5)
├── ecosystem/  Environment
│               Simulation (phase 6), Ecosystem, PlantManager (phase 7)
├── plants/     Plant (placeholder)
│               PlantGenerator, Stem, Branch, Leaf (phase 2), GrowthSystem (phase 3)
├── shaders/    leaf.vert, leaf.frag
│               growth.vert (phase 3), wind.vert (phase 8)
├── ui/         EnvironmentPanel
│               HUD (phase 5)
├── store/      ecosystemStore
├── types/      Declarations for untyped packages
└── main.ts
```

Shaders are imported as strings with Vite's `?raw` suffix, for example `import leafVertex from '../shaders/leaf.vert?raw'`.

## Roadmap

| Phase | Deliverable                                   | Status      |
| ----- | --------------------------------------------- | ----------- |
| 1     | Three.js environment with one static 3D plant | In progress |
| 2     | Procedural plant generation                   | Planned     |
| 3     | Animated plant growth                         | Planned     |
| 4     | ml5.js hand tracking                          | Started     |
| 5     | Gesture recognition and interaction           | Planned     |
| 6     | Environmental simulation                      | Planned     |
| 7     | Multiple plants and ecosystem behaviour       | Planned     |
| 8     | Custom shaders, lighting and visual polish    | Planned     |

## Contributing

This project uses GitHub Flow. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
