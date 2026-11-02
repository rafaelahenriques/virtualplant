# Generative Ecosystem

A living 3D environment where hand gestures influence plant growth and environmental conditions. Plants are generated procedurally and respond to a simulated environment, with the webcam as the controller.

The procedural plant generator and growth simulation are the technical centrepiece. Hand tracking is how you interact with them.

**Live:** [rafaelahenriques.github.io/virtualplant](https://rafaelahenriques.github.io/virtualplant/). Each push to `main` deploys there through GitHub Pages.

**Status:** early, see the [roadmap](#roadmap). The climate decides which of eight real species grows, you pinch to move it through its growth stages, and you move your palm to scan it in colour.

## Climate decides the plant

Four real-world measurements decide which species grows: temperature during the growing season (°C), relative humidity (%), rainfall (mm per year) and direct sun during the growing season (hours per day).

Each species has a minimum, an optimal range and a maximum for every factor. A factor scores 1 inside the optimal range, 0 outside the limits, and falls in a straight line between. The plant's score is its **worst** factor, because a plant does only as well as its limiting condition allows. This is the limiting-factor approach used by [FAO's EcoCrop model](https://gaez.fao.org/pages/ecocrop). The highest score wins. If every species scores 0, the one closest to its best conditions stays on show and the interface says it would not survive there, so you never have to get every value right to see a plant. While a slider moves, the plant on show also stays until another fits at least 10 points better, so it doesn't keep swapping between plants that fit about equally well. Choosing a place always shows that place's plant.

| Climate             | Species                                                 | Temperature | Humidity | Rainfall     | Sun        |
| ------------------- | ------------------------------------------------------- | ----------- | -------- | ------------ | ---------- |
| Hot desert          | Engelmann's hedgehog cactus, _Echinocereus engelmannii_ | 20 to 34    | 15 to 45 | 150 to 350   | 9 to 13    |
| Mediterranean       | True lavender, _Lavandula angustifolia_                 | 15 to 24    | 35 to 60 | 500 to 1000  | 6 to 12    |
| Grassland           | Common sunflower, _Helianthus annuus_                   | 17 to 34    | 35 to 70 | 600 to 1000  | 7 to 14    |
| Temperate           | Chinese peony, _Paeonia lactiflora_                     | 12 to 22    | 45 to 75 | 600 to 1200  | 5 to 10    |
| Forest floor        | White trillium, _Trillium grandiflorum_                 | 10 to 20    | 60 to 90 | 900 to 1800  | 0.5 to 3   |
| Tropical understory | Moth orchid, _Phalaenopsis amabilis_                    | 22 to 29    | 60 to 80 | 2000 to 4500 | 0.5 to 2.5 |
| Warm wetland        | Sacred lotus, _Nelumbo nucifera_                        | 25 to 30    | 55 to 90 | 2000 to 2800 | 6 to 13    |
| Arctic tundra       | Arctic poppy, _Papaver radicatum_                       | 2 to 11     | 65 to 90 | 150 to 400   | 4 to 12    |

The table shows optimal ranges only. Each species file in `src/plants/species/` holds the full ranges and its sources, such as FAO EcoCrop, Flora of North America, the American Orchid Society and NASA, and marks each factor as published or derived. Derived means the sources describe the habitat rather than give a number, so the range is worked out from that habitat's climate. Treat those as informed estimates.

Each plant is also built to its published description, in real centimetres: a trillium has three bracts, three sepals and three petals, an arctic poppy has four petals and drops its two sepals as it opens, and a sunflower's disc florets sit on the golden angle and open from the rim inwards. The tests in `src/plants/species/species.test.ts` check these counts and sizes, and `src/ecosystem/Suitability.test.ts` checks that each species has one real place, from Tucson to Svalbard, and that the place gets the species it is known for.

Plants of the same species all look the same for now. Variation between individuals comes with the procedural generator in phase 2.

## Pinch to grow

Growth changes the plant's form, not its size. Spreading your thumb and index finger moves it forward through its stages, and closing them plays the stages back in reverse.

| Growth     | Stage                                                  |
| ---------- | ------------------------------------------------------ |
| 0          | Seedling or shoot                                      |
| 0 to 0.4   | The stem extends and new leaves unfurl                 |
| 0.4 to 0.6 | Sepals and the first petals form a closed bud          |
| 0.6 to 1   | Rings of petals form and open, then the stamens appear |

Each species follows this in its own way: a poppy bud nods then lifts as it opens, and an orchid opens its lowest flower first.

The camera follows the growth, starting close on the seedling and settling on the flower, so the plant's real proportions stay intact. A scale bar shows how large it really is.

No model training is involved. ml5 HandPose is already trained and returns 21 landmarks per hand, and a pinch is the distance between two of them, divided by palm length so it reads the same near or far from the camera. With no hand in view, the plant holds its current stage.

The overlay shows the live reading. If `grow` can't reach 0 or 1 on your hand, adjust `PINCHED_RATIO` and `SPREAD_RATIO` in `src/tracking/GestureRecognizer.ts`.

## Scan window

Outside the scan window the plant is an x-ray. Inside it, the same plant at the same growth stage renders as a solid flower in colour. The window follows the centre of your palm, which stays still while your fingers pinch, so one hand controls growth and position at once. With no hand in view, it stays where it is.

The scene is drawn twice each frame: the x-ray across the whole screen, then the colour look clipped to the window with a scissor test. The x-ray is drawn at a lower resolution, and each frame is blended into the ones before it, so thin tissue doesn't flicker as it sways from one pixel to the next.

## Loading

The loading screen reports real work as it happens: your graphics hardware, the triangles built for each species, the shaders compiled, whether a camera is present, and the hand model downloading. The numbers on it are measured, and each line stays up long enough to read. The camera stays off throughout.

A stippled flower sharpens from coarse blocks to fine dots as loading progresses, then a scan line sweeps down to uncover the live page and the plant grows in from a seedling. With reduced motion turned on, the sweep is skipped. If the hand model takes more than seven seconds, the page opens anyway and it finishes in the background.

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

| Technology                          | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| TypeScript, Vite                    | Application logic, development and bundling |
| Three.js                            | 3D scene and plant rendering on WebGL 2     |
| GLSL                                | Plant animation and environmental effects   |
| ml5.js HandPose                     | Hand tracking, 21 landmarks per hand        |
| Zustand                             | Ecosystem state                             |
| GSAP                                | Smooth transitions                          |
| Schibsted Grotesk, Instrument Serif | Self-hosted interface type                  |
| Vitest                              | Unit tests                                  |

## Architecture

Gestures never touch rendering directly. Tracking only reports what the hands are doing, the interaction layer turns that into environment changes, and the simulation and renderer read from the store.

```text
webcam → HandTracker → GestureRecognizer → GestureMapper → ecosystemStore → Simulation, Plant, shaders
```

Each file arrives with the phase that needs it, so nothing in `src/` is an empty stub:

```text
src/
├── core/       Scene, Camera, Renderer, PersistentRenderPass, AnimationLoop, ScanWindow, math
├── tracking/   HandTracker, GestureRecognizer, GestureMapper, videoSpace
├── ecosystem/  Environment, Suitability, presets, PlantManager
│               Simulation (phase 6), Ecosystem (phase 7)
├── plants/     Plant, GrowthSystem, form, geometry
│   └── species/  One file per species: climate ranges, sources and form
├── shaders/    stem.vert, leaf.vert, petal.vert, xray.frag, specimen.frag,
│               fullscreen.vert, persistence.frag
├── ui/         BootScreen, BootFlower, EnvironmentPanel, SpeciesPanel, GrowthScale, Toolbar, HUD, copy
├── store/      ecosystemStore
├── types/      Declarations for untyped packages
└── main.ts
```

Shaders are imported as strings with Vite's `?raw` suffix, for example `import leafVertex from '../shaders/leaf.vert?raw'`.

The visual direction is plants as x-ray specimens under machine observation: translucent, veined tissue glowing on grainy near-black, thin tracking overlays and monospace readouts. The interface stays monochrome, so colour only ever appears inside the scan window. Each climate slider draws the current plant's limits and best range on its track. **Hide interface** clears the text and controls, leaving the plant and its scan window.

The camera is only used on your device. Video frames go to the hand model in your browser and are never sent anywhere.

## Roadmap

| Phase | Deliverable                                   | Status  |
| ----- | --------------------------------------------- | ------- |
| 1     | Three.js environment with one static 3D plant | Done    |
| 2     | Procedural plant generation                   | Started |
| 3     | Animated plant growth                         | Done    |
| 4     | ml5.js hand tracking                          | Done    |
| 5     | Gesture recognition and interaction           | Started |
| 6     | Environmental simulation                      | Started |
| 7     | Multiple plants and ecosystem behaviour       | Planned |
| 8     | Custom shaders, lighting and visual polish    | Planned |

## Contributing

This project uses GitHub Flow. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
