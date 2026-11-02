uniform vec3 uBaseColor;
uniform vec3 uTipColor;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 vBaseColor;
varying vec3 vTipColor;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  vNormal = normalMatrix * normal;
  vViewPosition = -viewPosition.xyz;
  vBaseColor = uBaseColor;
  vTipColor = uTipColor;
  gl_Position = projectionMatrix * viewPosition;
}
