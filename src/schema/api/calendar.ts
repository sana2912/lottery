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
  id: string;
  heatmapRows: Array<{
    cells: Array<{
      appearanceCount: number;
      digit: string;
      missingRounds: number;
      score: number;
      tone: "hot" | "warm" | "neutral" | "cool" | "cold";
    }>;
    coldDigits: string[];
    hotDigits: string[];
    position: number;
  }>;
  hotNumbers: string[];
  month: number;
  label: string;
  sampleSize: number;
  summary: string;
  prizeType?: "FIRST" | "PRIZE2" | "PRIZE3" | "PRIZE4" | "PRIZE5" | "NEAR_FIRST";
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
