uniform sampler2D tCurrent;
uniform sampler2D tPrevious;
// How much of the previous frames to keep, from 0 to 1.
uniform float uKeep;

varying vec2 vUv;

void main() {
  gl_FragColor = mix(texture2D(tCurrent, vUv), texture2D(tPrevious, vUv), uKeep);
}
