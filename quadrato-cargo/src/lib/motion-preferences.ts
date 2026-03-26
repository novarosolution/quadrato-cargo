"use client";

import { useReducedMotion } from "framer-motion";
import { useMemo, useSyncExternalStore } from "react";

type MotionPreferences = {
  reduceMotion: boolean;
  allowAmbientMotion: boolean;
  allowHoverMotion: boolean;
};

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function useMotionPreferences(): MotionPreferences {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const mounted = useHydrated();

  const { isLowPowerDevice, isCoarsePointer } = useMemo(() => {
    if (!mounted || typeof window === "undefined") {
      return { isLowPowerDevice: true, isCoarsePointer: true };
    }

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const saveData = nav.connection?.saveData === true;
    const lowCpu = Number(nav.hardwareConcurrency ?? 8) <= 4;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    return {
      isLowPowerDevice: saveData || lowCpu || coarse,
      isCoarsePointer: coarse
    };
  }, [mounted]);

  const reduceMotion = !mounted || prefersReducedMotion || isLowPowerDevice;
  return {
    reduceMotion,
    allowAmbientMotion: mounted && !reduceMotion,
    allowHoverMotion: mounted && !prefersReducedMotion && !isCoarsePointer
  };
}
