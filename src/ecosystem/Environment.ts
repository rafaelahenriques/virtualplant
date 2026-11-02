export interface EnvironmentState {
  /** Mean air temperature during the growing season, in °C. */
  temperature: number;
  /** Mean relative humidity, in %. */
  humidity: number;
  /** Total rainfall per year, in mm. */
  rainfall: number;
  /** Hours of direct sun per day during the growing season. */
  sunlight: number;
}

export type ClimateFactor = keyof EnvironmentState;

interface FactorInfo {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export const CLIMATE_FACTORS: Record<ClimateFactor, FactorInfo> = {
  temperature: { label: 'Temperature', unit: '°C', min: -10, max: 45, step: 0.5 },
  humidity: { label: 'Humidity', unit: '%', min: 0, max: 100, step: 1 },
  rainfall: { label: 'Rainfall', unit: 'mm/yr', min: 0, max: 5000, step: 10 },
  sunlight: { label: 'Sunlight', unit: 'h/day', min: 0, max: 14, step: 0.25 },
};

export const FACTOR_KEYS = Object.keys(CLIMATE_FACTORS) as ClimateFactor[];

export const DEFAULT_ENVIRONMENT: EnvironmentState = {
  temperature: 18,
  humidity: 62,
  rainfall: 800,
  sunlight: 7,
};

const clamp = (value: number, { min, max }: FactorInfo): number =>
  Math.min(max, Math.max(min, value));

export function clampEnvironment(state: EnvironmentState): EnvironmentState {
  return {
    temperature: clamp(state.temperature, CLIMATE_FACTORS.temperature),
    humidity: clamp(state.humidity, CLIMATE_FACTORS.humidity),
    rainfall: clamp(state.rainfall, CLIMATE_FACTORS.rainfall),
    sunlight: clamp(state.sunlight, CLIMATE_FACTORS.sunlight),
  };
}
