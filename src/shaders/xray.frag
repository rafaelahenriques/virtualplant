uniform vec3 uColor;
uniform float uIntensity;
// Number of veins across the blade, or 0 for none.
uniform float uVeins;
// Below 1, dissolves the plant into scattered dots.
uniform float uReveal;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

const float PI = 3.141592653589793;
const float VEIN_AVERAGE = 0.23;

float stipple() {
  return fract(sin(dot(floor(gl_FragCoord.xy / 2.0), vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  if (stipple() > uReveal) discard;

  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vViewPosition);

  // Tissue seen edge-on is denser, which gives the glowing x-ray outline.
  // Rounding can put the dot product just above 1, and a power of a negative number is NaN.
  float density = pow(max(0.0, 1.0 - abs(dot(normal, view))), 2.0);
  // Edges converge at the tip, so fade the rim there or it piles up into a bright point.
  float rim = smoothstep(0.38, 0.5, abs(vUv.x - 0.5)) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float veins = 0.0;
  if (uVeins > 0.0) {
    // Veins too fine for the screen would shimmer as the plant sways, so they settle to their
    // average brightness before they get that fine.
    float pixelsPerVein = 1.0 / max(fwidth(vUv.x) * uVeins, 0.0001);
    float sharpness = smoothstep(4.0, 9.0, pixelsPerVein);
    veins = mix(VEIN_AVERAGE, pow(abs(cos(vUv.x * uVeins * PI)), 12.0), sharpness);
  }
  veins *= 1.0 - 0.6 * vUv.y;

  float intensity = 0.05 + 0.5 * density + 0.1 * rim + 0.3 * veins;
  // This pass renders in linear light, so faint tissue needs lowering to stay translucent.
  gl_FragColor = vec4(uColor * pow(intensity * uIntensity, 1.7), 1.0);
  #include <colorspace_fragment>
}
