uniform float uTime;
uniform float uWind;
uniform float uGrowth;

attribute float aAzimuth;
attribute float aStart;
attribute float aSpread;
attribute float aLength;
attribute float aWidth;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

const float PI = 3.141592653589793;
const float BASE_RADIUS = 0.02;

// How long a petal takes to push out of the bud, in growth units.
const float EMERGE_SPAN = 0.16;
// The whole flower stays a closed bud until this growth stage.
const float OPEN_START = 0.6;

// Closed, a petal leans out then curves back in, and wraps around the flower's axis.
const float BUD_ANGLE = 0.6;
const float BUD_CURL = -1.2;
const float BUD_WRAP = 5.0;
// Open, it lies at its own spread angle with the tip relaxing outwards and a shallow cup.
const float OPEN_CURL = 0.5;
const float OPEN_WRAP = 1.2;

vec3 rotateY(vec3 point, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * point.x + s * point.z, point.y, -s * point.x + c * point.z);
}

void main() {
  float emerge = smoothstep(aStart, aStart + EMERGE_SPAN, uGrowth);
  float open = smoothstep(max(OPEN_START, aStart + 0.1), 1.0, uGrowth);

  // The petal's centre line is a circular arc in the plane of radial (z) and axial (y).
  float along = uv.y * aLength * emerge;
  float gust = sin(uTime * (1.0 + uWind * 3.0) + aAzimuth * 2.0);
  float baseAngle = mix(BUD_ANGLE, aSpread, open) + gust * uv.y * (0.01 + uWind * 0.07);
  float curvature = mix(BUD_CURL, OPEN_CURL, open) / aLength;
  if (abs(curvature) < 0.001) curvature = 0.001;

  float angle = baseAngle + curvature * along;
  float radial = BASE_RADIUS + (cos(baseAngle) - cos(angle)) / curvature;
  float axial = (sin(angle) - sin(baseAngle)) / curvature;
  vec3 inward = vec3(0.0, sin(angle), -cos(angle));

  // Its cross-section is another arc, across the outline of the petal.
  // Narrow at the base, widest past the middle, with a rounded tip.
  float outline = pow(max(0.0, sin(PI * pow(uv.y, 1.6))), 0.6);
  float across = (uv.x - 0.5) * aWidth * emerge * outline;
  float wrap = mix(BUD_WRAP, OPEN_WRAP, open);
  float arc = wrap * across;

  vec3 petal = vec3(sin(arc) / wrap, axial, radial) + inward * (1.0 - cos(arc)) / wrap;
  petal += inward * 0.06 * aWidth * sin(uv.x * 14.0 + aAzimuth * 5.0) * uv.y * open;
  vec3 petalNormal = cos(arc) * inward - vec3(sin(arc), 0.0, 0.0);

  vec4 viewPosition = modelViewMatrix * vec4(rotateY(petal, aAzimuth), 1.0);
  vNormal = normalMatrix * rotateY(petalNormal, aAzimuth);
  vViewPosition = -viewPosition.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * viewPosition;
}
