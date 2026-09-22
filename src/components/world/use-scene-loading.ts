"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * How much of the world has arrived.
 *
 * Every texture `useLoader` fetches goes through three's shared
 * `DefaultLoadingManager`, so subscribing to it reports real progress across
 * all six tiles without each one having to report in.
 *
 * This reports progress only. Readiness is decided by the Suspense boundary
 * in World, because the manager cannot answer it: on a warm cache every
 * texture can resolve before this hook's effect subscribes, and then no
 * progress event ever arrives.
 */
export function useSceneLoading(expected: number) {
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const manager = THREE.DefaultLoadingManager;

    // Other handlers may already be attached (drei installs its own), so the
    // previous ones are called through rather than replaced.
    const prevProgress = manager.onProgress;
    const prevError = manager.onError;

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      setLoaded(itemsLoaded);
      prevProgress?.(url, itemsLoaded, itemsTotal);
    };

    // A texture that 404s would otherwise hold the boot screen up forever.
    // Letting the scene through on error shows whatever did load, which is
    // strictly better than a bar frozen at 80%.
    manager.onError = (url) => {
      setFailed(true);
      prevError?.(url);
    };

    return () => {
      manager.onProgress = prevProgress;
      manager.onError = prevError;
    };
  }, []);

  return {
    // A failed texture still counts as arrived: the bar should reach the end
    // rather than stall short of it while the scene shows what it has.
    loaded: failed ? expected : Math.min(loaded, expected),
    total: expected,
  };
}
