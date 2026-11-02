uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  if (stipple() > uReveal) discard;

  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vViewPosition);

  // Tissue seen edge-on is denser, which gives the glowing x-ray outline.
  // Rounding can put the dot product just above 1, and a power of a negative number is NaN.
  float density = pow(max(0.0, 1.0 - abs(dot(normal, view))), 2.0);
  // Edges converge at the tip, so fade the rim there or it piles up into a bright point.
  float rim = smoothstep(0.38, 0.5, abs(vUv.x - 0.5)) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
  float veins = veinPattern() * (1.0 - 0.6 * vUv.y);

  float intensity = 0.05 + 0.5 * density + 0.1 * rim + 0.3 * veins;
  // This pass renders in linear light, so faint tissue needs lowering to stay translucent.
  gl_FragColor = vec4(uColor * pow(intensity * uIntensity, 1.7), 1.0);
  #include <colorspace_fragment>
}
