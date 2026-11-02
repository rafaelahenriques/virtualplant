varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vBaseColor;
varying vec3 vTipColor;

// In view space, from the upper left and in front of the plant.
const vec3 LIGHT = vec3(-0.35, 0.75, 0.55);

void main() {
  if (stipple() > uReveal) discard;

  vec3 view = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  // Blades are double sided and bent in the shader, so face the normal towards the viewer
  // directly rather than trusting the triangle's winding.
  if (dot(normal, view) < 0.0) normal = -normal;

  float light = 0.72 + 0.38 * dot(normal, normalize(LIGHT));

  vec3 color = mix(vBaseColor, vTipColor, smoothstep(0.05, 0.85, vUv.y));
  color *= 1.0 - 0.14 * veinPattern() * (1.0 - vUv.y);

  // Thin tissue seen edge-on catches the light. Rounding can put the dot product just above 1,
  // and a power of a negative number is NaN.
  float rim = pow(max(0.0, 1.0 - dot(normal, view)), 3.0);

  gl_FragColor = vec4(color * light + rim * 0.12, 1.0);
  #include <colorspace_fragment>
}
