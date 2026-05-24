"use client";

import { useEffect, useReducer, useState } from "react";
import {
  TimeMachineEmptySimulation,
  TimeMachineErrorBanner,
  TimeMachineSetupScreen,
  TimeMachineSummaryScreen
} from "@/frontend/pages/time-machine/time-machine.components";
import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import { TimeMachineControls } from "@/frontend/pages/time-machine/time-machine.controls";
import { runTimeMachineSimulation } from "@/frontend/pages/time-machine/time-machine.data";
import { TimeMachineDrawBoard } from "@/frontend/pages/time-machine/time-machine.draw-board";
import { TimeMachineHitReward } from "@/frontend/pages/time-machine/time-machine.hit-reward";
import {
  defaultTimeMachineFormState,
  getFilledTickets,
  normalizeTicketInput,
  randomSixDigit,
  toTimeMachinePayload
} from "@/frontend/pages/time-machine/time-machine.mappers";
import {
  initialTimeMachineState,
  timeMachineReducer
} from "@/frontend/pages/time-machine/time-machine.reducer";
import TimeMachineScene from "@/frontend/pages/time-machine/time-machine.scene";
import {
  selectActiveEvent,
  selectPlaybackIntervalMs,
  selectRunningScore,
  selectShouldUseFallback
} from "@/frontend/pages/time-machine/time-machine.selectors";
import { timeMachineSimulationRequestSchema } from "@/schema/app/time-machine.schema";

export function TimeMachinePage() {
  const [state, dispatch] = useReducer(timeMachineReducer, initialTimeMachineState);
  const [formState, setFormState] = useState(defaultTimeMachineFormState);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setPrefersReducedMotion(media.matches);

      if (media.matches) {
        dispatch({ renderMode: "fallback", type: "SET_RENDER_MODE" });
      }
    };

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (state.phase !== "running" || !state.simulation) {
      return;
    }

    const interval = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, selectPlaybackIntervalMs(state));

    return () => window.clearInterval(interval);
  }, [state]);

  const useFallback = selectShouldUseFallback(state, prefersReducedMotion);
  const activeEvent = selectActiveEvent(state);
  const runningScore = selectRunningScore(state);

  async function handleStart() {
    dispatch({ type: "SIMULATION_REQUESTED" });

    try {
      const payload = timeMachineSimulationRequestSchema.parse(toTimeMachinePayload(formState));
      const simulation = await runTimeMachineSimulation(payload);

      dispatch({ simulation, type: "SIMULATION_SUCCEEDED" });
    } catch {
      dispatch({ error: timeMachineContent.errorMessage, type: "SIMULATION_ERROR" });
    }
  }

  function handleRandomFill() {
    setFormState((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) => (ticket.trim() ? ticket : randomSixDigit()))
    }));
  }

  function handleClear() {
    setFormState(defaultTimeMachineFormState);
  }

  function handleTicketChange(index: number, value: string) {
    setFormState((current) => ({
      ...current,
      tickets: current.tickets.map((ticket, ticketIndex) =>
        ticketIndex === index ? normalizeTicketInput(value) : ticket
      )
    }));
  }

  if (state.phase === "setup") {
    return (
      <div className="space-y-4">
        {state.error ? <TimeMachineErrorBanner message={state.error} /> : null}
        <TimeMachineSetupScreen
          formState={formState}
          isPending={state.isPending}
          onClear={handleClear}
          onRandomFill={handleRandomFill}
          onStart={handleStart}
          onTicketChange={handleTicketChange}
        />
        {getFilledTickets(formState.tickets).length === 0 ? <TimeMachineEmptySimulation /> : null}
      </div>
    );
  }

  if (state.phase === "finished" && state.simulation) {
    return (
      <TimeMachineSummaryScreen
        onReplay={() => dispatch({ type: "REPLAY" })}
        simulation={state.simulation}
      />
    );
  }

  if (!state.simulation) {
    return <TimeMachineEmptySimulation message={timeMachineContent.errorMessage} />;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <TimeMachineScene />

      {useFallback ? (
        <p className="relative z-10 px-4 pt-4 text-sm text-[var(--color-text-muted)] md:px-6">
          {timeMachineContent.simulation.reducedMotionNotice}
        </p>
      ) : null}

      <TimeMachineHitReward activeEvent={activeEvent} eventIndex={state.eventIndex} />

      <TimeMachineDrawBoard
        activeEvent={activeEvent}
        runningScore={runningScore}
        tickets={state.simulation.tickets}
      />

      <TimeMachineControls
        onPause={() => dispatch({ type: "PAUSE" })}
        onReplay={() => dispatch({ type: "REPLAY" })}
        onResume={() => dispatch({ type: "RESUME" })}
        onSpeedChange={(playbackSpeed) => dispatch({ playbackSpeed, type: "SET_PLAYBACK_SPEED" })}
        state={state}
      />
    </div>
  );
}
