uniform float uTime;
uniform float uMotion;
uniform float uGrowth;

// azimuth, axial offset, radial offset
attribute vec3 aPlacement;
// start, emerge end, open start, open end
attribute vec4 aTiming;
// spread, open curl, length, width
attribute vec4 aForm;
// outline skew, outline power, open wrap, shed at
attribute vec4 aShape;
attribute vec3 aBaseColor;
attribute vec3 aTipColor;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying vec3 vBaseColor;
varying vec3 vTipColor;

const float PI = 3.141592653589793;

// Closed, a blade leans out then curves back in, and wraps around the flower's axis.
const float BUD_ANGLE = 0.6;
const float BUD_CURL = -1.2;
const float BUD_WRAP = 2.2;
// A flower head starts narrower than it finishes, so its parts spread as it opens.
const float BUD_RADIUS = 0.4;

vec3 rotateY(vec3 point, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(c * point.x + s * point.z, point.y, -s * point.x + c * point.z);
}

void main() {
  float azimuth = aPlacement.x;
  float len = aForm.z;
  float width = aForm.w;

  float emerge = smoothstep(aTiming.x, aTiming.y, uGrowth);
  emerge *= 1.0 - smoothstep(aShape.w, aShape.w + 0.04, uGrowth);
  float open = smoothstep(aTiming.z, aTiming.w, uGrowth);

  // The centre line is a circular arc in the plane of radial (z) and axial (y).
  float along = uv.y * len * emerge;
  float gust = sin(uTime * 1.2 + azimuth * 2.0) * uMotion;
  float baseAngle = mix(BUD_ANGLE, aForm.x, open) + gust * uv.y * 0.03;
  float curvature = mix(BUD_CURL, aForm.y, open) / len;
  if (abs(curvature) < 0.001) curvature = 0.001;

  float angle = baseAngle + curvature * along;
  float radial = aPlacement.z * mix(BUD_RADIUS, 1.0, open);
  radial += (cos(baseAngle) - cos(angle)) / curvature;
  float axial = aPlacement.y + (sin(angle) - sin(baseAngle)) / curvature;
  vec3 inward = vec3(0.0, sin(angle), -cos(angle));

  // The cross-section is another arc, across the outline of the blade.
  float outline = pow(max(0.0, sin(PI * pow(uv.y, aShape.x))), aShape.y);
  float across = (uv.x - 0.5) * width * emerge * outline;
  float wrapRadius = width / mix(BUD_WRAP, aShape.z, open);
  float arc = across / wrapRadius;

  vec3 blade = vec3(sin(arc) * wrapRadius, axial, radial) + inward * (1.0 - cos(arc)) * wrapRadius;
  blade += inward * 0.06 * width * sin(uv.x * 14.0 + azimuth * 5.0) * uv.y * open;
  vec3 bladeNormal = cos(arc) * inward - vec3(sin(arc), 0.0, 0.0);

  vec4 viewPosition = modelViewMatrix * vec4(rotateY(blade, azimuth), 1.0);
  vNormal = normalMatrix * rotateY(bladeNormal, azimuth);
  vViewPosition = -viewPosition.xyz;
  vUv = uv;
  vBaseColor = aBaseColor;
  vTipColor = aTipColor;
  gl_Position = projectionMatrix * viewPosition;
}
