import type { EnvironmentState } from './Environment';

interface ClimatePreset {
  name: string;
  environment: EnvironmentState;
  /** The species this place is known for, which the tests hold the model to. */
  expected: string;
}

// Rounded from published climate normals and, where a plant grows under a canopy, the light
// that reaches the forest floor. Temperature and sun cover the growing season only.
export const CLIMATE_PRESETS: ClimatePreset[] = [
  {
    name: 'Tucson, Arizona',
    environment: { temperature: 27, humidity: 35, rainfall: 290, sunlight: 11 },
    expected: 'hedgehog',
  },
  {
    name: 'Valensole, Provence',
    environment: { temperature: 19.5, humidity: 55, rainfall: 650, sunlight: 9.5 },
    expected: 'lavender',
  },
  {
    name: 'Wichita, Kansas',
    environment: { temperature: 22, humidity: 64, rainfall: 830, sunlight: 9 },
    expected: 'sunflower',
  },
  {
    name: 'Luoyang, China',
    environment: { temperature: 20, humidity: 62, rainfall: 650, sunlight: 6.5 },
    expected: 'peony',
  },
  {
    name: 'Smoky Mountains forest floor',
    environment: { temperature: 15, humidity: 80, rainfall: 1400, sunlight: 2 },
    expected: 'trillium',
  },
  {
    name: 'Borneo rainforest understory',
    environment: { temperature: 27, humidity: 80, rainfall: 3800, sunlight: 2 },
    expected: 'orchid',
  },
  {
    name: 'Mekong Delta wetland',
    environment: { temperature: 27.5, humidity: 80, rainfall: 1800, sunlight: 7 },
    expected: 'lotus',
  },
  {
    name: 'Svalbard, Arctic tundra',
    environment: { temperature: 5, humidity: 78, rainfall: 220, sunlight: 6 },
    expected: 'poppy',
  },
];
