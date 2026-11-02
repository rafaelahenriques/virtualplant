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
} from 'three';
import type { Frame } from '../core/AnimationLoop';
import leafVertex from '../shaders/leaf.vert?raw';
import petalVertex from '../shaders/petal.vert?raw';
import specimenFragment from '../shaders/specimen.frag?raw';
import stemVertex from '../shaders/stem.vert?raw';
import xrayFragment from '../shaders/xray.frag?raw';
import { createFlowerGeometry } from './Flower';
import { describeGrowth, stepGrowth } from './GrowthSystem';

const STEM_SEGMENTS = 64;
const STEM_RADIAL_SEGMENTS = 8;
const LEAF_COUNT = 8;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Stages of growth: a seedling extends its stem and forms leaves, then the flower takes over
// at 0.4 (see WHORLS in Flower.ts). Each part changes form rather than the plant scaling up.
const SEEDLING_HEIGHT = 0.2;
const STEM_COMPLETE_AT = 0.4;
const LEAF_UNFURL_SPAN = 0.14;

const STEM_TISSUE: Tissue = { xray: 0xa9c4d6, base: 0x5f9c78, tip: 0x5f9c78, veins: 0, glow: 1 };
const LEAF_TISSUE: Tissue = { xray: 0xa9c4d6, base: 0x2f7a5f, tip: 0x8fcf9f, veins: 6, glow: 1 };
// Dimmer on the x-ray because dozens of petals overlap.
const PETAL_TISSUE: Tissue = {
  xray: 0xdce8f0,
  base: 0xd81e62,
  tip: 0xffb3c6,
  veins: 7,
  glow: 0.45,
};

/** The x-ray view of the plant, or its true colours inside the scan window. */
export type Look = 'xray' | 'specimen';

interface Tissue {
  xray: number;
  base: number;
  tip: number;
  veins: number;
  glow: number;
}

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
  private readonly parts: { mesh: Mesh; materials: Record<Look, ShaderMaterial> }[] = [];
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
    const stem = new Mesh(this.stem);
    this.parts.push({ mesh: stem, materials: this.createMaterials(stemVertex, STEM_TISSUE) });
    this.object.add(stem);

    const leafMaterials = this.createMaterials(leafVertex, LEAF_TISSUE);
    const leafGeometry = createLeafGeometry();
    for (let i = 0; i < LEAF_COUNT; i++) {
      // The first two are the seedling's leaves, so the plant is never bare.
      const isSeedLeaf = i < 2;
      const progress = i / (LEAF_COUNT - 1);
      const along = isSeedLeaf ? SEEDLING_HEIGHT * 0.9 : 0.18 + 0.6 * progress;
      const leaf: Leaf = {
        mesh: new Mesh(leafGeometry),
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
      this.parts.push({ mesh: leaf.mesh, materials: leafMaterials });
      this.object.add(leaf.mesh);
    }

    const flower = new Mesh(createFlowerGeometry());
    this.parts.push({ mesh: flower, materials: this.createMaterials(petalVertex, PETAL_TISSUE) });
    // Petal positions come from the shader, so the geometry's bounds mean nothing.
    flower.frustumCulled = false;
    flower.position.copy(curve.getPointAt(1));
    // Nods towards the camera so you look into the bloom.
    flower.rotation.x = 0.8;
    this.object.add(flower);

    this.setLook('xray');
    this.applyGrowth();
  }

  get stage(): string {
    return describeGrowth(this.growth);
  }

  update(frame: Frame, wind: number, growthTarget: number): void {
    this.growth = stepGrowth(this.growth, growthTarget, frame.delta);
    this.uniforms.uTime.value = frame.elapsed;
    this.uniforms.uWind.value = wind;
    this.applyGrowth();
  }

  setLook(look: Look): void {
    for (const { mesh, materials } of this.parts) mesh.material = materials[look];
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

  private createMaterials(vertexShader: string, tissue: Tissue): Record<Look, ShaderMaterial> {
    return {
      xray: new ShaderMaterial({
        vertexShader,
        fragmentShader: xrayFragment,
        uniforms: {
          ...this.uniforms,
          uColor: { value: new Color(tissue.xray) },
          uIntensity: { value: tissue.glow },
          uVeins: { value: tissue.veins },
        },
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        // Screen blending: overlapping tissue gets brighter, as on an x-ray, but keeps its
        // detail instead of clipping to solid white.
        blending: CustomBlending,
        blendSrc: OneMinusDstColorFactor,
        blendDst: OneFactor,
      }),
      specimen: new ShaderMaterial({
        vertexShader,
        fragmentShader: specimenFragment,
        uniforms: {
          ...this.uniforms,
          uBaseColor: { value: new Color(tissue.base) },
          uTipColor: { value: new Color(tissue.tip) },
          uVeins: { value: tissue.veins },
        },
        side: DoubleSide,
      }),
    };
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
