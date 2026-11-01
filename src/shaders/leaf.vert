uniform float uTime;
uniform float uWind;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vec3 bent = position;

  // Bend grows towards the tip so the leaf stays attached to the stem.
  float bend = uv.y * uv.y;
  // World position offsets the phase so leaves do not move in unison.
  float phase = modelMatrix[3].x * 5.0 + modelMatrix[3].y * 3.0;
  float gust = sin(uTime * (1.5 + uWind * 4.0) + phase);
  bent.z += bend * (0.02 + uWind * 0.25) * gust;

  vec4 viewPosition = modelViewMatrix * vec4(bent, 1.0);
  vUv = uv;
  vNormal = normalMatrix * normal;
  vViewPosition = -viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}
