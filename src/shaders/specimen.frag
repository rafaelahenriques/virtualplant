uniform vec3 uBaseColor;
uniform vec3 uTipColor;
// Number of veins across the blade, or 0 for none.
uniform float uVeins;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

const float PI = 3.141592653589793;
// In view space, from the upper left and in front of the plant.
const vec3 LIGHT = vec3(-0.35, 0.75, 0.55);

void main() {
  vec3 view = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  // Blades are double sided and bent in the shader, so face the normal towards the viewer
  // directly rather than trusting the triangle's winding.
  if (dot(normal, view) < 0.0) normal = -normal;

  float light = 0.72 + 0.38 * dot(normal, normalize(LIGHT));

  vec3 color = mix(uBaseColor, uTipColor, smoothstep(0.05, 0.85, vUv.y));

  float veins = uVeins > 0.0 ? pow(abs(cos(vUv.x * uVeins * PI)), 12.0) : 0.0;
  color *= 1.0 - 0.14 * veins * (1.0 - vUv.y);

  // Thin tissue seen edge-on catches the light.
  float rim = pow(1.0 - dot(normal, view), 3.0);

  gl_FragColor = vec4(color * light + rim * 0.12, 1.0);
  #include <colorspace_fragment>
}
