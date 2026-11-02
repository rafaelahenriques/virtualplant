import {
  Color,
  CustomBlending,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  OneFactor,
  OneMinusDstColorFactor,
  ShaderMaterial,
  type Object3D,
} from 'three';
import leafVertex from '../shaders/leaf.vert?raw';
import petalVertex from '../shaders/petal.vert?raw';
import specimenFragment from '../shaders/specimen.frag?raw';
import stemVertex from '../shaders/stem.vert?raw';
import xrayFragment from '../shaders/xray.frag?raw';
import type { BodySpec, HeadSpec, LeafSpec, Species, StemSpec } from './form';
import {
  createBodyGeometry,
  createHeadGeometry,
  createStemGeometry,
  STEM_RADIAL_SEGMENTS,
} from './geometry';
import { describeGrowth } from './GrowthSystem';

const TISSUE_XRAY = 0xa9c4d6;
const PETAL_XRAY = 0xdce8f0;
const STEM_SEGMENTS = 48;
// A leaf starts folded against its stem and opens outwards.
const FOLDED_PITCH = 0.15;
// The camera has settled on the flower by the time the bud has formed.
const FRAMING_COMPLETE_AT = 0.55;

/** The x-ray view of the plant, or its true colours inside the scan window. */
export type Look = 'xray' | 'specimen';

type Materials = Record<Look, ShaderMaterial>;

interface MaterialOptions {
  vertexShader: string;
  xray: number;
  glow: number;
  veins: number;
  flex?: number;
  baseColor?: number;
  tipColor?: number;
}

/** One species, built once from its form and then shown at any growth stage. */
export class Plant {
  readonly object = new Group();
  private readonly uniforms = {
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uGrowth: { value: 0 },
    uReveal: { value: 0 },
  };
  private readonly parts: { mesh: Mesh; materials: Materials }[] = [];
  private readonly stems: { spec: StemSpec; mesh: Mesh }[] = [];
  private readonly leaves: { spec: LeafSpec; mesh: Mesh }[] = [];
  private readonly heads: { spec: HeadSpec; object: Object3D }[] = [];
  private readonly bodies: { spec: BodySpec; object: Group }[] = [];
  private growth = 0;

  constructor(readonly species: Species) {
    const form = species.createForm();
    form.stems.forEach((spec) => this.addStem(spec));
    form.leaves.forEach((spec) => this.addLeaf(spec));
    form.heads.forEach((spec) => this.addHead(spec, this.object));
    form.bodies.forEach((spec) => this.addBody(spec));
    this.object.visible = false;
    this.setLook('xray');
  }

  get stage(): string {
    return describeGrowth(this.growth);
  }

  /** Where the camera should look at the current growth stage, in centimetres. */
  get view(): { center: number; span: number } {
    const { seedling, bloom } = this.species.framing;
    const t = MathUtils.smoothstep(this.growth, 0, FRAMING_COMPLETE_AT);
    return {
      center: MathUtils.lerp(seedling.center, bloom.center, t),
      span: MathUtils.lerp(seedling.span, bloom.span, t),
    };
  }

  get reveal(): { value: number } {
    return this.uniforms.uReveal;
  }

  /** Triangles drawn at full bloom, counting every instance. */
  get triangleCount(): number {
    return this.parts.reduce((total, { mesh }) => {
      const instances = 'instanceCount' in mesh.geometry ? Number(mesh.geometry.instanceCount) : 1;
      return total + ((mesh.geometry.index?.count ?? 0) / 3) * instances;
    }, 0);
  }

  update(elapsed: number, growth: number, motion: number): void {
    this.growth = growth;
    this.uniforms.uTime.value = elapsed;
    this.uniforms.uMotion.value = motion;
    this.uniforms.uGrowth.value = growth;

    for (const { spec, mesh } of this.stems) {
      const t = MathUtils.clamp((growth - spec.start) / (spec.end - spec.start), 0, 1);
      const rings = Math.ceil(MathUtils.lerp(spec.initial, 1, t) * STEM_SEGMENTS);
      mesh.visible = growth >= spec.start;
      mesh.geometry.setDrawRange(0, rings * STEM_RADIAL_SEGMENTS * 6);
    }

    for (const { spec, mesh } of this.leaves) {
      const unfurl = MathUtils.smoothstep(growth, spec.birth, spec.birth + spec.span);
      mesh.visible = unfurl > 0;
      mesh.scale.setScalar(Math.max(0.001, spec.length * unfurl));
      mesh.rotation.x = MathUtils.lerp(FOLDED_PITCH, spec.pitch, unfurl);
    }

    for (const { spec, object } of this.bodies) {
      const t = MathUtils.smoothstep(growth, spec.start, spec.end);
      object.visible = growth >= spec.start;
      const height = MathUtils.lerp(spec.initial, 1, t);
      const girth = MathUtils.lerp(Math.min(1, spec.initial * 2.5), 1, t);
      object.scale.set(girth, height, girth);
    }

    for (const { spec, object } of this.heads) {
      if (!spec.budRotation || !spec.openAt) continue;
      const t = MathUtils.smoothstep(growth, spec.openAt[0], spec.openAt[1]);
      object.rotation.set(
        MathUtils.lerp(spec.budRotation[0], spec.rotation[0], t),
        MathUtils.lerp(spec.budRotation[1], spec.rotation[1], t),
        MathUtils.lerp(spec.budRotation[2], spec.rotation[2], t),
        'YXZ',
      );
    }
  }

  setLook(look: Look): void {
    for (const { mesh, materials } of this.parts) mesh.material = materials[look];
  }

  private addStem(spec: StemSpec): void {
    const geometry = createStemGeometry(spec.curve, spec.radius, STEM_SEGMENTS);
    const materials = this.createMaterials({
      vertexShader: stemVertex,
      xray: TISSUE_XRAY,
      glow: 1,
      veins: 0,
      baseColor: spec.color,
      tipColor: spec.color,
    });
    const mesh = new Mesh(geometry);
    this.parts.push({ mesh, materials });
    this.stems.push({ spec, mesh });
    this.object.add(mesh);
  }

  private addLeaf(spec: LeafSpec): void {
    const materials = this.createMaterials({
      vertexShader: leafVertex,
      xray: TISSUE_XRAY,
      glow: 1,
      veins: spec.veins,
      baseColor: spec.baseColor,
      tipColor: spec.tipColor,
    });
    const mesh = new Mesh(spec.blade);
    mesh.position.copy(spec.position);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = spec.azimuth;
    this.parts.push({ mesh, materials });
    this.leaves.push({ spec, mesh });
    this.object.add(mesh);
  }

  private addHead(spec: HeadSpec, parent: Object3D): void {
    const materials = this.createMaterials({
      vertexShader: petalVertex,
      xray: PETAL_XRAY,
      glow: spec.glow,
      veins: spec.veins,
      flex: spec.rigid ? 0 : 1,
    });
    const mesh = new Mesh(createHeadGeometry(spec.blades, spec.detail));
    // Blade positions come from the shader, so the geometry's bounds mean nothing.
    mesh.frustumCulled = false;
    mesh.position.copy(spec.position);
    mesh.rotation.set(...spec.rotation, 'YXZ');
    this.parts.push({ mesh, materials });
    this.heads.push({ spec, object: mesh });
    parent.add(mesh);
  }

  private addBody(spec: BodySpec): void {
    const group = new Group();
    group.position.copy(spec.position);
    group.rotation.set(...spec.rotation, 'YXZ');

    const materials = this.createMaterials({
      vertexShader: stemVertex,
      xray: TISSUE_XRAY,
      glow: 0.5,
      veins: 0,
      baseColor: spec.baseColor,
      tipColor: spec.tipColor,
    });
    const mesh = new Mesh(createBodyGeometry(spec.profile, spec.ribs, spec.ribDepth));
    this.parts.push({ mesh, materials });
    group.add(mesh);

    spec.heads.forEach((head) => this.addHead(head, group));
    this.bodies.push({ spec, object: group });
    this.object.add(group);
  }

  private createMaterials({
    vertexShader,
    xray,
    glow,
    veins,
    flex = 1,
    baseColor = 0xffffff,
    tipColor = 0xffffff,
  }: MaterialOptions): Materials {
    return {
      xray: new ShaderMaterial({
        vertexShader,
        fragmentShader: xrayFragment,
        uniforms: {
          ...this.uniforms,
          uFlex: { value: flex },
          uBaseColor: { value: new Color(baseColor) },
          uTipColor: { value: new Color(tipColor) },
          uColor: { value: new Color(xray) },
          uIntensity: { value: glow },
          uVeins: { value: veins },
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
          uFlex: { value: flex },
          uBaseColor: { value: new Color(baseColor) },
          uTipColor: { value: new Color(tipColor) },
          uVeins: { value: veins },
        },
        side: DoubleSide,
      }),
    };
  }
}
