uniform vec3 uColor;
uniform vec3 uSunDirection;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 sun = normalize((viewMatrix * vec4(uSunDirection, 0.0)).xyz);
  float light = 0.35 + 0.65 * (0.5 + 0.5 * dot(normal, sun));

  float midrib = smoothstep(0.0, 0.05, abs(vUv.x - 0.5));

  gl_FragColor = vec4(uColor * light * mix(0.7, 1.0, midrib), 1.0);
  #include <colorspace_fragment>
}
