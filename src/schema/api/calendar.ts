export interface ApiCalendarDraw {
  id: string;
  drawDate: string;
  drawDateIso: string;
  drawNo?: string;
  status: "upcoming" | "past";
  isNextDraw: boolean;
}

export interface ApiMonthlyInsight {
  coldNumbers: string[];
  dataCompleteness?: "complete" | "partial";
  drawCount?: number;
  id: string;
  heatmapRows: Array<{
    cells: Array<{
      appearanceCount: number;
      digit: string;
      eventCount?: number;
      eventRatePercent?: number;
      expectedRatePercent?: number;
      expectedPresenceRatePercent?: number;
      hitCount?: number;
      hitRatePercent?: number;
      lift?: number;
      missingRounds: number;
      opportunityCount?: number;
      presenceRatePercent?: number;
      sampleEventCount?: number;
      score: number;
      tone: "hot" | "warm" | "neutral" | "cool" | "cold";
    }>;
    coldDigits: string[];
    hotDigits: string[];
    position: number;
  }>;
  hotNumbers: string[];
  month?: number;
  year?: number;
  label: string;
  opportunityCountPerPosition?: number;
  prizesPerDrawActual?: number;
  prizesPerDrawExpected?: number | null;
  sampleSize: number;
  summary: string;
  prizeType?:
    | "FIRST"
    | "THREE_DIGIT"
    | "THREE_FRONT"
    | "THREE_BACK"
    | "TWO_DIGIT"
    | "NEAR_FIRST"
    | "PRIZE2"
    | "PRIZE3"
    | "PRIZE4"
    | "PRIZE5";
  scope?: "ALL_TIME" | "MONTH";
  windowPreset?: "ALL";
  windowSize?: number;
  positionInsights: Array<{
    coldNumbers: Array<{
      appearanceCount: number;
      digit: string;
      missingRounds: number;
    }>;
    hotNumbers: Array<{
      appearanceCount: number;
      digit: string;
      missingRounds: number;
    }>;
    position: number;
  }>;
  patternNotes: string[];
}

export interface ApiCalendarReadModel {
  generatedAt: string;
  source: "mock" | "api";
  nextDraw: ApiCalendarDraw;
  draws: ApiCalendarDraw[];
  monthlyInsights: ApiMonthlyInsight[];
}
