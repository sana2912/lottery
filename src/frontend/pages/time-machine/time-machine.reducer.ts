import type {
  TimeMachineSimulationResponse,
  TimeMachineTimelineEvent
} from "@/schema/app/time-machine.schema";

export type TimeMachinePhase = "setup" | "running" | "paused" | "finished";

export type TimeMachineRenderMode = "scene" | "fallback";

export type TimeMachineState = {
  error: string | null;
  eventIndex: number;
  isPending: boolean;
  phase: TimeMachinePhase;
  playbackSpeed: number;
  renderMode: TimeMachineRenderMode;
  simulation: TimeMachineSimulationResponse | null;
};

export type TimeMachineAction =
  | { type: "SIMULATION_ERROR"; error: string }
  | { type: "SIMULATION_REQUESTED" }
  | { type: "SIMULATION_SUCCEEDED"; simulation: TimeMachineSimulationResponse }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TICK" }
  | { type: "SET_PLAYBACK_SPEED"; playbackSpeed: number }
  | { type: "SET_RENDER_MODE"; renderMode: TimeMachineRenderMode }
  | { type: "REPLAY" }
  | { type: "RESET" };

export const initialTimeMachineState: TimeMachineState = {
  error: null,
  eventIndex: 0,
  isPending: false,
  phase: "setup",
  playbackSpeed: 1,
  renderMode: "scene",
  simulation: null
};

export function timeMachineReducer(
  state: TimeMachineState,
  action: TimeMachineAction
): TimeMachineState {
  switch (action.type) {
    case "SIMULATION_REQUESTED":
      return {
        ...state,
        error: null,
        isPending: true
      };
    case "SIMULATION_SUCCEEDED":
      return {
        ...state,
        error: null,
        eventIndex: 0,
        isPending: false,
        phase: "running",
        simulation: action.simulation
      };
    case "SIMULATION_ERROR":
      return {
        ...state,
        error: action.error,
        isPending: false,
        phase: "setup"
      };
    case "PAUSE":
      if (state.phase !== "running") {
        return state;
      }

      return {
        ...state,
        phase: "paused"
      };
    case "RESUME":
      if (state.phase !== "paused") {
        return state;
      }

      return {
        ...state,
        phase: "running"
      };
    case "SET_PLAYBACK_SPEED":
      return {
        ...state,
        playbackSpeed: action.playbackSpeed
      };
    case "SET_RENDER_MODE":
      return {
        ...state,
        renderMode: action.renderMode
      };
    case "TICK": {
      if (state.phase !== "running" || !state.simulation) {
        return state;
      }

      const nextIndex = state.eventIndex + 1;

      if (nextIndex >= state.simulation.timeline.length) {
        return {
          ...state,
          phase: "finished"
        };
      }

      return {
        ...state,
        eventIndex: nextIndex
      };
    }
    case "REPLAY":
      if (!state.simulation) {
        return initialTimeMachineState;
      }

      return {
        ...state,
        error: null,
        eventIndex: 0,
        phase: "running"
      };
    case "RESET":
      return initialTimeMachineState;
    default:
      return state;
  }
}

export function getTimelineEvent(
  simulation: TimeMachineSimulationResponse | null,
  eventIndex: number
): TimeMachineTimelineEvent | null {
  if (!simulation) {
    return null;
  }

  return simulation.timeline[eventIndex] ?? null;
}
