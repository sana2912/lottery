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

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const animationFrameRef = useRef<number | null>(null);
  const startRouteKeyRef = useRef<string | null>(null);
  const targetProgressRef = useRef(0);
  const timeoutRefs = useRef<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const clearTargetTimers = useCallback(() => {
    for (const timeout of timeoutRefs.current) {
      window.clearTimeout(timeout);
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

      timeoutRefs.current = TARGET_STEPS.map(({ delay, value }) =>
        window.setTimeout(() => {
          targetProgressRef.current = Math.max(targetProgressRef.current, value);
        }, delay)
      );
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

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || startRouteKeyRef.current === routeKey) {
      return;
    }

    targetProgressRef.current = 100;
    clearTargetTimers();

    const timeout = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      startRouteKeyRef.current = null;
      targetProgressRef.current = 0;
    }, COMPLETE_HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
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

  const nextUrl = new URL(href, window.location.href);
  const currentUrl = new URL(window.location.href);
  const isExternal = nextUrl.origin !== currentUrl.origin;
  const isSameRoute =
    nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;

  return isExternal || isSameRoute;
}
