uniform sampler2D tCurrent;
uniform sampler2D tPrevious;
// How much of the previous frames to keep, from 0 to 1.
uniform float uKeep;

varying vec2 vUv;

void main() {
  vec4 current = texture2D(tCurrent, vUv);
  // A bad value would never leave the history, so it must not get in.
  if (any(isnan(current)) || any(isinf(current))) current = texture2D(tPrevious, vUv);
  gl_FragColor = mix(current, texture2D(tPrevious, vUv), uKeep);
}
