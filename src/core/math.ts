export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
