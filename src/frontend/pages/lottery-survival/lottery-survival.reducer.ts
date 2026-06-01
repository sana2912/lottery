import {
  buildLotterySurvivalSummary,
  LOTTERY_SURVIVAL_STARTING_BALANCE,
  type LotterySurvivalSummary
} from "@/frontend/pages/lottery-survival/lottery-survival.mappers";
import type { LotterySurvivalRoundResponse } from "@/schema/app/lottery-survival.schema";

export type LotterySurvivalPhase = "ended" | "playing";

export type LotterySurvivalState = {
  balance: number;
  endedBy: "bankrupt" | "stopped" | null;
  error: null | string;
  history: LotterySurvivalRoundResponse[];
  isPending: boolean;
  phase: LotterySurvivalPhase;
  roundIndex: number;
  summary: LotterySurvivalSummary | null;
};

export type LotterySurvivalAction =
  | { type: "ROUND_REQUESTED" }
  | { message: string; type: "ROUND_FAILED" }
  | { round: LotterySurvivalRoundResponse; type: "ROUND_SUCCEEDED" }
  | { type: "RESET" }
  | { type: "STOP" };

export const initialLotterySurvivalState: LotterySurvivalState = {
  balance: LOTTERY_SURVIVAL_STARTING_BALANCE,
  endedBy: null,
  error: null,
  history: [],
  isPending: false,
  phase: "playing",
  roundIndex: 1,
  summary: null
};

export function lotterySurvivalReducer(
  state: LotterySurvivalState,
  action: LotterySurvivalAction
): LotterySurvivalState {
  switch (action.type) {
    case "ROUND_REQUESTED":
      return {
        ...state,
        error: null,
        isPending: true
      };
    case "ROUND_FAILED":
      return {
        ...state,
        error: action.message,
        isPending: false
      };
    case "ROUND_SUCCEEDED": {
      const history = [...state.history, action.round];
      const isBankrupt = action.round.balanceAfter < 80;
      const summary = isBankrupt
        ? buildLotterySurvivalSummary({
            finalBalance: action.round.balanceAfter,
            history
          })
        : null;

      return {
        ...state,
        balance: action.round.balanceAfter,
        endedBy: isBankrupt ? "bankrupt" : null,
        error: null,
        history,
        isPending: false,
        phase: isBankrupt ? "ended" : "playing",
        roundIndex: state.roundIndex + 1,
        summary
      };
    }
    case "STOP":
      return {
        ...state,
        endedBy: "stopped",
        isPending: false,
        phase: "ended",
        summary: buildLotterySurvivalSummary({
          finalBalance: state.balance,
          history: state.history
        })
      };
    case "RESET":
      return initialLotterySurvivalState;
  }
}
