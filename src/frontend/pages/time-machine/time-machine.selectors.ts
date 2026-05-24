import type { TimeMachineState } from "@/frontend/pages/time-machine/time-machine.reducer";

const BASE_PLAYBACK_MS = 480;

export function selectActiveEvent(state: TimeMachineState) {
  if (!state.simulation) {
    return null;
  }

  return state.simulation.timeline[state.eventIndex] ?? null;
}

export function selectRunningScore(state: TimeMachineState): number {
  const activeEvent = selectActiveEvent(state);

  return activeEvent?.runningScore ?? 0;
}

export function selectPlaybackIntervalMs(state: TimeMachineState): number {
  return Math.round(BASE_PLAYBACK_MS / state.playbackSpeed);
}

export function selectShouldUseFallback(
  state: TimeMachineState,
  prefersReducedMotion: boolean
): boolean {
  if (prefersReducedMotion) {
    return true;
  }

  return state.renderMode === "fallback";
}
