import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from 'three';
import { SUN_DIRECTION } from '../core/Scene';
import leafFragment from '../shaders/leaf.frag?raw';
import leafVertex from '../shaders/leaf.vert?raw';

const LEAF_COUNT = 9;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Static placeholder until the procedural generator lands in phase 2. */
export class Plant {
  readonly object = new Group();
  private readonly leafUniforms = {
    uTime: { value: 0 },
    uWind: { value: 0 },
    uColor: { value: new Color(0x5fae55) },
    uSunDirection: { value: new Vector3(...SUN_DIRECTION) },
  };

  constructor() {
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.05, 0.7, 0.02),
      new Vector3(-0.04, 1.4, -0.03),
      new Vector3(0.03, 2, 0),
    ]);

    this.object.add(
      new Mesh(
        new TubeGeometry(curve, 48, 0.025, 8),
        new MeshStandardMaterial({ color: 0x5c7a3f, roughness: 0.8 }),
      ),
    );

    const leafMaterial = new ShaderMaterial({
      vertexShader: leafVertex,
      fragmentShader: leafFragment,
      side: DoubleSide,
      uniforms: this.leafUniforms,
    });

    const leafGeometry = createLeafGeometry();
    for (let i = 0; i < LEAF_COUNT; i++) {
      const progress = i / (LEAF_COUNT - 1);
      const leaf = new Mesh(leafGeometry, leafMaterial);
      leaf.position.copy(curve.getPointAt(0.2 + 0.8 * progress));
      leaf.rotation.order = 'YXZ';
      leaf.rotation.y = i * GOLDEN_ANGLE;
      leaf.rotation.x = 1.25 - 0.6 * progress;
      leaf.scale.setScalar(1 - 0.45 * progress);
      this.object.add(leaf);
    }
  }

  update(elapsed: number, wind: number): void {
    this.leafUniforms.uTime.value = elapsed;
    this.leafUniforms.uWind.value = wind;
  }
}

/** A leaf in the XY plane, base at the origin and tip along +Y, drooping along +Z. */
function createLeafGeometry(length = 0.9, width = 0.34, segments = 12): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const v = i / segments;
    const halfWidth = (width / 2) * Math.sin(Math.PI * v ** 0.8);
    const y = length * v;
    const droop = 0.25 * length * v * v;
    positions.push(-halfWidth, y, droop, 0, y, droop - 0.015, halfWidth, y, droop);
    uvs.push(0, v, 0.5, v, 1, v);

    if (i < segments) {
      const row = i * 3;
      const next = row + 3;
      indices.push(row, row + 1, next, row + 1, next + 1, next);
      indices.push(row + 1, row + 2, next + 1, row + 2, next + 2, next + 1);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
