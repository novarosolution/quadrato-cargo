"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, useTexture } from "@react-three/drei";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";

useTexture.preload("/maps/earth-day.jpg");

type SiteTheme = "light" | "dark";

type GlobeInteraction = {
  nx: number;
  ny: number;
  hovering: boolean;
  dragging: boolean;
  prevX: number;
  prevY: number;
  pendingDragY: number;
};

function createInteraction(): GlobeInteraction {
  return {
    nx: 0,
    ny: 0,
    hovering: false,
    dragging: false,
    prevX: 0,
    prevY: 0,
    pendingDragY: 0,
  };
}

type GlobeCtx = {
  theme: SiteTheme;
  interaction: React.MutableRefObject<GlobeInteraction>;
  reduceMotion: React.MutableRefObject<boolean>;
};

const GlobeCanvasContext = createContext<GlobeCtx | null>(null);

function readSiteTheme(): SiteTheme {
  const a = document.documentElement.getAttribute("data-theme");
  if (a === "light") return "light";
  if (a === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function subscribeSiteTheme(onStoreChange: () => void) {
  const obs = new MutationObserver(onStoreChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const onMq = () => {
    if (document.documentElement.getAttribute("data-theme")) return;
    onStoreChange();
  };
  mq.addEventListener("change", onMq);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", onMq);
  };
}

function useSiteTheme(): SiteTheme {
  return useSyncExternalStore(subscribeSiteTheme, readSiteTheme, () => "dark");
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function readReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotionSync() {
  const reduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const ref = useRef(reduced);
  useLayoutEffect(() => {
    ref.current = reduced;
  }, [reduced]);
  return { ref, reduced };
}

function AtmosphereShell({ color, opacity }: { color: string; opacity: number }) {
  return (
    <mesh scale={[1.042, 1.042, 1.042]} renderOrder={-1}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function TexturedEarth() {
  const ctx = useContext(GlobeCanvasContext);
  const group = useRef<THREE.Group>(null);
  const map = useTexture("/maps/earth-day.jpg");
  const { gl } = useThree();

  useLayoutEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy?.() ?? 8;
    /* eslint-disable react-hooks/immutability -- THREE.Texture is configured in place (drei cache). */
    map.colorSpace = THREE.SRGBColorSpace;
    map.generateMipmaps = true;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.anisotropy = Math.min(16, max);
    map.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  }, [gl, map]);

  /* South Asia / India toward camera by default (texture UV layout–dependent). */
  useLayoutEffect(() => {
    const g = group.current;
    if (g) g.rotation.y = 0.82;
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || !ctx) return;
    const ir = ctx.interaction.current;
    const reduce = ctx.reduceMotion.current;

    const drag = ir.pendingDragY;
    /* eslint-disable-next-line react-hooks/immutability -- interaction state is a ref-held struct */
    ir.pendingDragY = 0;

    if (!reduce) {
      const auto = ir.dragging ? 0.018 : 0.052;
      g.rotation.y += delta * auto + drag;
    }

    const maxTilt = 0.26;
    let targetX = 0;
    let targetZ = 0;
    if (!reduce && ir.hovering && !ir.dragging) {
      targetX = -ir.ny * maxTilt;
      targetZ = ir.nx * maxTilt * 0.7;
    }

    const k = 1 - Math.exp(-10 * delta);
    g.rotation.x += (targetX - g.rotation.x) * k;
    g.rotation.z += (targetZ - g.rotation.z) * k;
  });

  const theme = ctx?.theme ?? "dark";
  const atm =
    theme === "light"
      ? { color: "#0ea5e9", opacity: 0.14 }
      : { color: "#93c5fd", opacity: 0.28 };

  return (
    <group ref={group}>
      <AtmosphereShell color={atm.color} opacity={atm.opacity} />
      <Sphere args={[1, 128, 128]}>
        <meshStandardMaterial
          map={map}
          roughness={theme === "light" ? 0.88 : 0.78}
          metalness={0.04}
          emissive="#0c4a6e"
          emissiveIntensity={theme === "light" ? 0.06 : 0}
        />
      </Sphere>
    </group>
  );
}

function Scene() {
  const ctx = useContext(GlobeCanvasContext);
  const theme = ctx?.theme ?? "dark";
  const isLight = theme === "light";

  return (
    <>
      <ambientLight intensity={isLight ? 0.38 : 0.52} />
      <directionalLight position={[6, 2.5, 5]} intensity={isLight ? 1.35 : 1.2} color="#ffffff" />
      <directionalLight position={[-4, -1, -3]} intensity={isLight ? 0.22 : 0.42} color="#7dd3fc" />
      <Suspense fallback={null}>
        <TexturedEarth />
      </Suspense>
    </>
  );
}

const GLOBE_BG = {
  /** Mid sky so the night hemisphere reads in light UI. */
  light: 0x7dd3fc,
  dark: 0x0f172a,
} as const;

const globeLayoutClass =
  "home-orb-globe-frame relative mx-auto aspect-square w-[min(13.5rem,78vw)] overflow-hidden touch-none select-none sm:w-[min(15rem,68vw)] md:w-[min(17rem,54vw)]";

export default function HomeGlobeThreeCanvas() {
  const theme = useSiteTheme();
  const { ref: reduceMotionRef, reduced: reducedMotion } = useReducedMotionSync();
  const interactionRef = useRef<GlobeInteraction>(createInteraction());
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const globeCtx: GlobeCtx = {
    theme,
    interaction: interactionRef,
    reduceMotion: reduceMotionRef,
  };

  useEffect(() => {
    const gl = glRef.current;
    const scene = sceneRef.current;
    if (!gl || !scene) return;
    const hex = theme === "light" ? GLOBE_BG.light : GLOBE_BG.dark;
    scene.background = new THREE.Color(hex);
    gl.setClearColor(hex, 1);
    gl.toneMappingExposure = theme === "light" ? 0.92 : 1.05;
  }, [theme]);

  const updatePointerNorm = useCallback((el: HTMLDivElement, clientX: number, clientY: number) => {
    const ir = interactionRef.current;
    const r = el.getBoundingClientRect();
    const halfW = r.width / 2;
    const halfH = r.height / 2;
    ir.nx = (clientX - (r.left + r.width / 2)) / Math.max(halfW, 1);
    ir.ny = (clientY - (r.top + r.height / 2)) / Math.max(halfH, 1);
    ir.nx = Math.max(-1, Math.min(1, ir.nx));
    ir.ny = Math.max(-1, Math.min(1, ir.ny));
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const ir = interactionRef.current;
      updatePointerNorm(e.currentTarget, e.clientX, e.clientY);
      if (reduceMotionRef.current) return;
      if (ir.dragging) {
        ir.pendingDragY += (e.clientX - ir.prevX) * 0.0068;
        ir.prevX = e.clientX;
        ir.prevY = e.clientY;
      }
    },
    [reduceMotionRef, updatePointerNorm],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (reduceMotionRef.current) return;
      const ir = interactionRef.current;
      ir.dragging = true;
      ir.prevX = e.clientX;
      ir.prevY = e.clientY;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [reduceMotionRef],
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    interactionRef.current.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* released */
    }
  }, []);

  const onPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      interactionRef.current.hovering = true;
      updatePointerNorm(e.currentTarget, e.clientX, e.clientY);
    },
    [updatePointerNorm],
  );

  const onPointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const ir = interactionRef.current;
      ir.hovering = false;
      ir.dragging = false;
      ir.nx = 0;
      ir.ny = 0;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* */
      }
    },
    [],
  );

  const grabCursor = reducedMotion ? "" : "cursor-grab active:cursor-grabbing";

  return (
    <GlobeCanvasContext.Provider value={globeCtx}>
      <div className="relative mx-auto w-full max-w-[min(17rem,54vw)]">
        <p className="sr-only">Globe view — drag to spin the Earth.</p>
        <div
          className={`${globeLayoutClass} ${grabCursor}`}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerLeave}
        >
          <Canvas
            className="block! pointer-events-none h-full w-full"
            camera={{ position: [0, 0, 2.55], fov: 38, near: 0.1, far: 20 }}
            dpr={[1, 2]}
            gl={{
              alpha: false,
              antialias: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl, scene }) => {
              glRef.current = gl;
              sceneRef.current = scene;
              const initial = readSiteTheme();
              const hex = initial === "light" ? GLOBE_BG.light : GLOBE_BG.dark;
              scene.background = new THREE.Color(hex);
              gl.setClearColor(hex, 1);
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = initial === "light" ? 0.92 : 1.05;
            }}
          >
            <Scene />
          </Canvas>
        </div>
      </div>
    </GlobeCanvasContext.Provider>
  );
}
