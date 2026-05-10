"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const START_PROGRESS = 18;
const COMPLETE_HIDE_DELAY_MS = 260;
const FRAME_SMOOTHING = 0.085;
const MIN_FRAME_DELTA = 0.035;
const TARGET_STEPS = [
  { delay: 40, value: 34 },
  { delay: 120, value: 52 },
  { delay: 240, value: 68 },
  { delay: 420, value: 80 },
  { delay: 680, value: 88 },
  { delay: 1050, value: 93 },
  { delay: 1600, value: 96 }
] as const;

type ProgressRef = {
  current: number;
};

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const animationFrameRef = useRef<number | null>(null);
  const startRouteKeyRef = useRef<string | null>(null);
  const targetProgressRef = useRef(0);
  const timeoutRefs = useRef<ReturnType<typeof globalThis.setTimeout>[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const clearTargetTimers = useCallback(() => {
    for (const timeout of timeoutRefs.current) {
      globalThis.clearTimeout(timeout);
    }

    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    function startProgress() {
      startRouteKeyRef.current = routeKey;
      targetProgressRef.current = START_PROGRESS;
      setIsVisible(true);
      setProgress(START_PROGRESS);

      clearTargetTimers();

      timeoutRefs.current = scheduleTargetSteps(targetProgressRef);
    }

    function handleNavigationPointerDown(event: PointerEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");

      if (!anchor || shouldIgnoreNavigation(anchor)) {
        return;
      }

      startProgress();
    }

    document.addEventListener("pointerdown", handleNavigationPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handleNavigationPointerDown, true);
    };
  }, [clearTargetTimers, routeKey]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    function animate() {
      setProgress((current) => {
        const target = targetProgressRef.current;
        const distance = target - current;
        const next = current + distance * FRAME_SMOOTHING;

        return Math.abs(distance) < MIN_FRAME_DELTA ? target : next;
      });

      animationFrameRef.current = globalThis.requestAnimationFrame(animate);
    }

    animationFrameRef.current = globalThis.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        globalThis.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || startRouteKeyRef.current === routeKey) {
      return;
    }

    targetProgressRef.current = 100;
    clearTargetTimers();

    const timeout = globalThis.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      startRouteKeyRef.current = null;
      targetProgressRef.current = 0;
    }, COMPLETE_HIDE_DELAY_MS);

    return () => {
      globalThis.clearTimeout(timeout);
    };
  }, [clearTargetTimers, isVisible, routeKey]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-[var(--color-bg-brand-soft)]"
    >
      <div
        className="h-full origin-left bg-[var(--color-brand)] shadow-[0_0_18px_rgba(249,115,22,0.35)] will-change-transform"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}

function shouldIgnoreNavigation(anchor: Element) {
  const href = anchor.getAttribute("href");
  const target = anchor.getAttribute("target");

  if (!href || href.startsWith("#") || target === "_blank" || anchor.hasAttribute("download")) {
    return true;
  }

  const nextUrl = new URL(href, globalThis.location.href);
  const currentUrl = new URL(globalThis.location.href);
  const isExternal = nextUrl.origin !== currentUrl.origin;
  const isSameRoute =
    nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;

  return isExternal || isSameRoute;
}

function scheduleTargetSteps(targetProgressRef: ProgressRef) {
  return TARGET_STEPS.map((step) => scheduleTargetStep(step, targetProgressRef));
}

function scheduleTargetStep(step: (typeof TARGET_STEPS)[number], targetProgressRef: ProgressRef) {
  return globalThis.setTimeout(applyTargetStep, step.delay, step, targetProgressRef);
}

function applyTargetStep(step: (typeof TARGET_STEPS)[number], targetProgressRef: ProgressRef) {
  targetProgressRef.current = Math.max(targetProgressRef.current, step.value);
}
