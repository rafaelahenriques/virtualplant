// Number of veins across the blade, or 0 for none.
uniform float uVeins;
// Below 1, dissolves the plant into scattered dots.
uniform float uReveal;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 vBaseColor;
varying vec3 vTipColor;

const float PI = 3.141592653589793;
// In view space, from the upper left and in front of the plant.
const vec3 LIGHT = vec3(-0.35, 0.75, 0.55);
const float VEIN_AVERAGE = 0.23;

float stipple() {
  return fract(sin(dot(floor(gl_FragCoord.xy / 2.0), vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  if (stipple() > uReveal) discard;

  vec3 view = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  // Blades are double sided and bent in the shader, so face the normal towards the viewer
  // directly rather than trusting the triangle's winding.
  if (dot(normal, view) < 0.0) normal = -normal;

  float light = 0.72 + 0.38 * dot(normal, normalize(LIGHT));

  vec3 color = mix(vBaseColor, vTipColor, smoothstep(0.05, 0.85, vUv.y));

  float veins = 0.0;
  if (uVeins > 0.0) {
    // Veins too fine for the screen would shimmer as the plant sways, so they settle to their
    // average brightness before they get that fine.
    float pixelsPerVein = 1.0 / max(fwidth(vUv.x) * uVeins, 0.0001);
    float sharpness = smoothstep(4.0, 9.0, pixelsPerVein);
    veins = mix(VEIN_AVERAGE, pow(abs(cos(vUv.x * uVeins * PI)), 12.0), sharpness);
  }
  color *= 1.0 - 0.14 * veins * (1.0 - vUv.y);

  // Thin tissue seen edge-on catches the light.
  float rim = pow(1.0 - dot(normal, view), 3.0);

  gl_FragColor = vec4(color * light + rim * 0.12, 1.0);
  #include <colorspace_fragment>
}
