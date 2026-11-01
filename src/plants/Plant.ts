import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CustomBlending,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  OneFactor,
  OneMinusDstColorFactor,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type IUniform,
} from 'three';
import type { Frame } from '../core/AnimationLoop';
import leafVertex from '../shaders/leaf.vert?raw';
import petalVertex from '../shaders/petal.vert?raw';
import stemVertex from '../shaders/stem.vert?raw';
import xrayFragment from '../shaders/xray.frag?raw';
import { createFlowerGeometry } from './Flower';
import { stepGrowth } from './GrowthSystem';

const STEM_SEGMENTS = 64;
const STEM_RADIAL_SEGMENTS = 8;
const LEAF_COUNT = 8;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Stages of growth: a seedling extends its stem and forms leaves, then the flower takes over
// at 0.4 (see WHORLS in Flower.ts). Each part changes form rather than the plant scaling up.
const SEEDLING_HEIGHT = 0.2;
const STEM_COMPLETE_AT = 0.4;
const LEAF_UNFURL_SPAN = 0.14;

const TISSUE_COLOR = 0xa9c4d6;
const PETAL_COLOR = 0xdce8f0;

interface Leaf {
  mesh: Mesh;
  /** Growth stage at which this leaf starts to unfurl. */
  birth: number;
  size: number;
  pitch: number;
}

/** Placeholder form until the procedural generator lands in phase 2. */
export class Plant {
  readonly object = new Group();
  private readonly uniforms = {
    uTime: { value: 0 },
    uWind: { value: 0 },
    uGrowth: { value: 0 },
  };
  private readonly stem: TubeGeometry;
  private readonly leaves: Leaf[] = [];
  private growth: number;

  constructor(growth: number) {
    this.growth = growth;

    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.05, 0.7, 0.02),
      new Vector3(-0.03, 1.35, 0.03),
      new Vector3(0.02, 1.9, 0.16),
    ]);

    this.stem = new TubeGeometry(curve, STEM_SEGMENTS, 0.02, STEM_RADIAL_SEGMENTS);
    this.object.add(new Mesh(this.stem, this.createMaterial(stemVertex, TISSUE_COLOR, 0, 1)));

    const leafMaterial = this.createMaterial(leafVertex, TISSUE_COLOR, 6, 1);
    const leafGeometry = createLeafGeometry();
    for (let i = 0; i < LEAF_COUNT; i++) {
      // The first two are the seedling's leaves, so the plant is never bare.
      const isSeedLeaf = i < 2;
      const progress = i / (LEAF_COUNT - 1);
      const along = isSeedLeaf ? SEEDLING_HEIGHT * 0.9 : 0.18 + 0.6 * progress;
      const leaf: Leaf = {
        mesh: new Mesh(leafGeometry, leafMaterial),
        birth: isSeedLeaf
          ? -LEAF_UNFURL_SPAN
          : ((along - SEEDLING_HEIGHT) / (1 - SEEDLING_HEIGHT)) * STEM_COMPLETE_AT,
        size: isSeedLeaf ? 0.4 : 0.55 + 0.45 * Math.sin(Math.PI * progress),
        pitch: 1.25 - 0.5 * progress,
      };
      leaf.mesh.position.copy(curve.getPointAt(along));
      leaf.mesh.rotation.order = 'YXZ';
      leaf.mesh.rotation.y = isSeedLeaf ? 0.5 + i * Math.PI : i * GOLDEN_ANGLE;
      this.leaves.push(leaf);
      this.object.add(leaf.mesh);
    }

    const flower = new Mesh(
      createFlowerGeometry(),
      // Dimmer than the rest because dozens of petals overlap.
      this.createMaterial(petalVertex, PETAL_COLOR, 7, 0.45),
    );
    // Petal positions come from the shader, so the geometry's bounds mean nothing.
    flower.frustumCulled = false;
    flower.position.copy(curve.getPointAt(1));
    // Nods towards the camera so you look into the bloom.
    flower.rotation.x = 0.8;
    this.object.add(flower);

    this.applyGrowth();
  }

  update(frame: Frame, wind: number, growthTarget: number): void {
    this.growth = stepGrowth(this.growth, growthTarget, frame.delta);
    this.uniforms.uTime.value = frame.elapsed;
    this.uniforms.uWind.value = wind;
    this.applyGrowth();
  }

  private applyGrowth(): void {
    this.uniforms.uGrowth.value = this.growth;

    const height = MathUtils.lerp(
      SEEDLING_HEIGHT,
      1,
      MathUtils.clamp(this.growth / STEM_COMPLETE_AT, 0, 1),
    );
    const rings = Math.ceil(height * STEM_SEGMENTS);
    this.stem.setDrawRange(0, rings * STEM_RADIAL_SEGMENTS * 6);

    for (const leaf of this.leaves) {
      const unfurl = MathUtils.smoothstep(this.growth, leaf.birth, leaf.birth + LEAF_UNFURL_SPAN);
      leaf.mesh.visible = unfurl > 0;
      leaf.mesh.scale.setScalar(leaf.size * unfurl);
      // Starts folded against the stem and opens outwards.
      leaf.mesh.rotation.x = MathUtils.lerp(0.15, leaf.pitch, unfurl);
    }
  }

  private createMaterial(
    vertexShader: string,
    color: number,
    veins: number,
    intensity: number,
  ): ShaderMaterial {
    const uniforms: Record<string, IUniform> = {
      ...this.uniforms,
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uVeins: { value: veins },
    };
    return new ShaderMaterial({
      vertexShader,
      fragmentShader: xrayFragment,
      uniforms,
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      // Screen blending: overlapping tissue gets brighter, as on an x-ray, but keeps its
      // detail instead of clipping to solid white.
      blending: CustomBlending,
      blendSrc: OneMinusDstColorFactor,
      blendDst: OneFactor,
    });
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
