// What the x-ray and colour looks share. Plant.ts puts this in front of each of them.

// Number of veins across the blade, or 0 for none.
uniform float uVeins;
// Below 1, dissolves the plant into scattered dots.
uniform float uReveal;

varying vec2 vUv;

const float PI = 3.141592653589793;
const float VEIN_AVERAGE = 0.23;

float stipple() {
  return fract(sin(dot(floor(gl_FragCoord.xy / 2.0), vec2(12.9898, 78.233))) * 43758.5453);
}

// Veins too fine for the screen would shimmer as the plant sways, so they settle to their average
// brightness before they get that fine.
float veinPattern() {
  if (uVeins <= 0.0) return 0.0;
  float pixelsPerVein = 1.0 / max(fwidth(vUv.x) * uVeins, 0.0001);
  float sharpness = smoothstep(4.0, 9.0, pixelsPerVein);
  return mix(VEIN_AVERAGE, pow(abs(cos(vUv.x * uVeins * PI)), 12.0), sharpness);
}
