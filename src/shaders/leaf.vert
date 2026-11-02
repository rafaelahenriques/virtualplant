uniform float uTime;
uniform float uMotion;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 vBaseColor;
varying vec3 vTipColor;

void main() {
  vec3 bent = position;

  // Sways more towards the tip so the leaf stays attached to the stem.
  float bend = uv.y * uv.y;
  // World position offsets the phase so leaves do not move in unison.
  float phase = modelMatrix[3].x * 0.5 + modelMatrix[3].y * 0.3;
  bent.z += bend * 0.03 * sin(uTime * 1.5 + phase) * uMotion;

  vec4 viewPosition = modelViewMatrix * vec4(bent, 1.0);
  vUv = uv;
  vNormal = normalMatrix * normal;
  vViewPosition = -viewPosition.xyz;
  vBaseColor = uBaseColor;
  vTipColor = uTipColor;
  gl_Position = projectionMatrix * viewPosition;
}
