export interface ApiCalendarDraw {
  id: string;
  drawDate: string;
  drawDateIso: string;
  drawNo?: string;
  status: "upcoming" | "past";
  isNextDraw: boolean;
}

export interface ApiMonthlyInsight {
  id: string;
  month: number;
  label: string;
  sampleSize: number;
  summary: string;
  hotNumbers: string[];
  coldNumbers: string[];
  patternNotes: string[];
}

export interface ApiCalendarReadModel {
  generatedAt: string;
  source: "mock" | "api";
  nextDraw: ApiCalendarDraw;
  draws: ApiCalendarDraw[];
  monthlyInsights: ApiMonthlyInsight[];
}
