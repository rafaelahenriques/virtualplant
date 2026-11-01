varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  vNormal = normalMatrix * normal;
  vViewPosition = -viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}
