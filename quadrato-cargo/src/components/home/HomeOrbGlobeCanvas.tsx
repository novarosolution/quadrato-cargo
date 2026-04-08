"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";

const EARTH_MAP_URL = "/maps/earth-texture.jpeg";
/** Max width for height sampling (keeps displacement build fast). */
const DISPLACE_SAMPLE_MAX_W = 1536;
const SPHERE_WIDTH_SEGS = 200;
const SPHERE_HEIGHT_SEGS = 125;
const DISPLACE_SCALE = 0.068;
const DISPLACE_FLOOR = 0.09;

/** Deterministic [0,1) — avoids Math.random in render (eslint react-hooks/purity). */
function hash01(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function rasterizeForSampling(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas,
): { data: Uint8ClampedArray; w: number; h: number } {
  let w = "width" in image ? image.width : (image as HTMLImageElement).naturalWidth;
  let h = "height" in image ? image.height : (image as HTMLImageElement).naturalHeight;
  if (w < 2 || h < 2) {
    return { data: new Uint8ClampedArray(4), w: 1, h: 1 };
  }
  if (w > DISPLACE_SAMPLE_MAX_W) {
    h = Math.max(2, Math.round((h * DISPLACE_SAMPLE_MAX_W) / w));
    w = DISPLACE_SAMPLE_MAX_W;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { data: new Uint8ClampedArray(4), w: 1, h: 1 };
  }
  ctx.drawImage(image as CanvasImageSource, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

function sampleLuminanceBilinear(
  data: Uint8ClampedArray,
  iw: number,
  ih: number,
  u: number,
  v: number,
): number {
  const uu = ((u % 1) + 1) % 1;
  const vv = ((v % 1) + 1) % 1;
  const x = uu * (iw - 1);
  const y = vv * (ih - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, iw - 1);
  const y1 = Math.min(y0 + 1, ih - 1);
  const tx = x - x0;
  const ty = y - y0;
  const i = (x: number, y: number) => {
    const o = (y * iw + x) * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const a = i(x0, y0);
  const b = i(x1, y0);
  const c = i(x0, y1);
  const d = i(x1, y1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/**
 * Real 3D relief: vertices pushed along normals from map luminance (land up, oceans low).
 */
function buildDisplacedEarthGeometry(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  radius: number,
  widthSegments: number,
  heightSegments: number,
  dispScale: number,
  luminanceFloor: number,
): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const { data, w, h } = rasterizeForSampling(image);
  if (w < 2 || h < 2) return geom;

  const pos = geom.attributes.position as THREE.BufferAttribute;
  const uv = geom.attributes.uv as THREE.BufferAttribute;
  const nrm = geom.attributes.normal as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const lum = sampleLuminanceBilinear(data, w, h, u, 1 - v);
    const lift = Math.max(0, lum - luminanceFloor) * dispScale;
    const nx = nrm.getX(i);
    const ny = nrm.getY(i);
    const nz = nrm.getZ(i);
    pos.setXYZ(i, pos.getX(i) + nx * lift, pos.getY(i) + ny * lift, pos.getZ(i) + nz * lift);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function GlobeOrbitControls() {
  const { camera, gl } = useThree();
  const ref = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const oc = new OrbitControlsImpl(camera, gl.domElement);
    oc.enableZoom = false;
    oc.enablePan = false;
    oc.rotateSpeed = 0.65;
    oc.minPolarAngle = Math.PI * 0.32;
    oc.maxPolarAngle = Math.PI * 0.68;
    ref.current = oc;
    return () => {
      oc.dispose();
      ref.current = null;
    };
  }, [camera, gl]);

  useFrame(() => {
    ref.current?.update();
  });

  return null;
}

function useProceduralCloudTexture() {
  const texture = useMemo(() => {
    const w = 1200;
    const h = 600;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      const cx = hash01(i * 17 + 1) * w;
      const cy = hash01(i * 17 + 2) * h;
      const rx = 16 + hash01(i * 17 + 3) * 75;
      const ry = 10 + hash01(i * 17 + 4) * 42;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, `rgba(255,255,255,${0.06 + hash01(i * 17 + 5) * 0.32})`);
      g.addColorStop(0.5, "rgba(255,255,255,0.035)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, hash01(i * 17 + 6) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }, []);

  useLayoutEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}

function AtmosphereMesh() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0x8ec8ff) },
          uPower: { value: 2.15 },
          uStrength: { value: 0.68 },
        },
        vertexShader: `
          varying vec3 vNorm;
          varying vec3 vPos;
          void main() {
            vNorm = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vPos = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uPower;
          uniform float uStrength;
          varying vec3 vNorm;
          varying vec3 vPos;
          void main() {
            vec3 viewDir = normalize(vPos);
            float edge = 1.0 - abs(dot(normalize(vNorm), viewDir));
            float glow = pow(edge, uPower) * uStrength;
            gl_FragColor = vec4(uColor * glow, glow);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh scale={1.09} renderOrder={3} material={material}>
      <sphereGeometry args={[1, 72, 72]} />
    </mesh>
  );
}

function CloudLayer({ radiusScale }: { radiusScale: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const cloudTex = useProceduralCloudTexture();

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.016;
  });

  if (!cloudTex) return null;

  return (
    <mesh ref={ref} scale={radiusScale} renderOrder={1}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshBasicMaterial
        map={cloudTex}
        transparent
        opacity={0.4}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Displaced 3D mesh + same map (unlit = no black far side). */
function EarthBody() {
  const loadedTexture = useLoader(THREE.TextureLoader, EARTH_MAP_URL);
  const texture = useMemo(() => {
    const t = loadedTexture.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, [loadedTexture]);

  useLayoutEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const geometry = useMemo(() => {
    const img = texture.image as HTMLImageElement;
    if (!img || !("width" in img) || img.width < 4) {
      return new THREE.SphereGeometry(1, 96, 64);
    }
    return buildDisplacedEarthGeometry(
      img,
      1,
      SPHERE_WIDTH_SEGS,
      SPHERE_HEIGHT_SEGS,
      DISPLACE_SCALE,
      DISPLACE_FLOOR,
    );
  }, [texture]);

  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  /** Sits just outside tallest displaced land + small gap. */
  const cloudRadius = 1 + DISPLACE_SCALE * (1 - DISPLACE_FLOOR) + 0.012;

  return (
    <>
      <mesh geometry={geometry} renderOrder={0}>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <CloudLayer radiusScale={cloudRadius} />
    </>
  );
}

function EarthGroup() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.11;
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        <EarthBody />
      </Suspense>
      <AtmosphereMesh />
    </group>
  );
}

function StarField() {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 42 + hash01(i * 3) * 58;
      const theta = hash01(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(2 * hash01(i * 3 + 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.038} color="#c8daf4" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["transparent"]} />
      <StarField />
      <EarthGroup />
      <GlobeOrbitControls />
    </>
  );
}

/**
 * Full 3D Earth: displaced mesh from map height (real geometry), unlit albedo on full sphere,
 * procedural clouds, additive atmosphere. Texture: `/public/maps/earth-texture.jpeg` (equirectangular works best).
 */
export default function HomeOrbGlobeCanvas({ className }: { className?: string }) {
  return (
    <div className={className} style={{ touchAction: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 2.72], fov: 40, near: 0.1, far: 200 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
