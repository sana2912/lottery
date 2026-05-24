"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { timeMachineContent } from "@/frontend/pages/time-machine/time-machine.content";
import type { TimeMachineState } from "@/frontend/pages/time-machine/time-machine.reducer";
import { Button, Input, Label } from "@/frontend/primitives";

type TimeMachineControlsProps = Readonly<{
  onPause: () => void;
  onReplay: () => void;
  onResume: () => void;
  onSpeedChange: (speed: number) => void;
  state: TimeMachineState;
}>;

export function TimeMachineControls({
  onPause,
  onReplay,
  onResume,
  onSpeedChange,
  state
}: TimeMachineControlsProps) {
  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 w-[220px] rounded-none border border-[var(--color-border-soft)] bg-[var(--color-surface)]/92 p-3 backdrop-blur-md">
      <Label htmlFor="playback-speed">{timeMachineContent.hud.speed}</Label>
      <Input
        className="mt-2"
        id="playback-speed"
        max={3}
        min={0.5}
        onChange={(event) => onSpeedChange(Number(event.target.value))}
        step={0.5}
        type="range"
        value={state.playbackSpeed}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {state.phase === "running" ? (
          <Button onClick={onPause} size="sm" type="button" variant="outline">
            <Pause className="size-4" />
            {timeMachineContent.actions.pause}
          </Button>
        ) : (
          <Button onClick={onResume} size="sm" type="button" variant="outline">
            <Play className="size-4" />
            {timeMachineContent.actions.resume}
          </Button>
        )}
        <Button onClick={onReplay} size="sm" type="button" variant="outline">
          <RotateCcw className="size-4" />
          {timeMachineContent.actions.replay}
        </Button>
      </div>
    </div>
  );
}
