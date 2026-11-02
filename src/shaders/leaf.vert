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

  // Sways more further from the base, so the leaf stays attached to the stem. Measured across the
  // whole leaf, so a divided leaf's stalks and leaflets move together and stay joined.
  float bend = dot(position, position);
  // World position offsets the phase so leaves do not move in unison.
  float phase = modelMatrix[3].x * 0.5 + modelMatrix[3].y * 0.3;
  bent.z += bend * 0.015 * sin(uTime * 1.5 + phase) * uMotion;

  vec4 viewPosition = modelViewMatrix * vec4(bent, 1.0);
  vUv = uv;
  vNormal = normalMatrix * normal;
  vViewPosition = -viewPosition.xyz;
  vBaseColor = uBaseColor;
  vTipColor = uTipColor;
  gl_Position = projectionMatrix * viewPosition;
}
