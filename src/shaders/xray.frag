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

float stipple() {
  return fract(sin(dot(floor(gl_FragCoord.xy / 2.0), vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  if (stipple() > uReveal) discard;

  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vViewPosition);

  // Tissue seen edge-on is denser, which gives the glowing x-ray outline.
  float density = pow(1.0 - abs(dot(normal, view)), 2.0);
  // Edges converge at the tip, so fade the rim there or it piles up into a bright point.
  float rim = smoothstep(0.38, 0.5, abs(vUv.x - 0.5)) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float veins = uVeins > 0.0 ? pow(abs(cos(vUv.x * uVeins * PI)), 12.0) : 0.0;
  veins *= 1.0 - 0.6 * vUv.y;

  float intensity = 0.05 + 0.5 * density + 0.1 * rim + 0.3 * veins;
  gl_FragColor = vec4(uColor * intensity * uIntensity, 1.0);
  #include <colorspace_fragment>
}
