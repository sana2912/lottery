import { toApiCalendarReadModel } from "@/api/model/dto/calendar.dto";
import { calendarReadModelSchema } from "@/schema/app/calendar.schema";

const calendarFixtureInput = {
  generatedAt: new Date("2026-04-27T00:00:00.000Z"),
  source: "mock",
  nextDraw: {
    id: "draw-2026-05-01",
    drawDate: "1 พฤษภาคม 2026",
    drawDateIso: new Date("2026-05-01T00:00:00.000Z"),
    drawNo: "17/2026",
    status: "upcoming",
    isNextDraw: true
  },
  draws: [
    {
      id: "draw-2026-05-01",
      drawDate: "1 พฤษภาคม 2026",
      drawDateIso: new Date("2026-05-01T00:00:00.000Z"),
      drawNo: "17/2026",
      status: "upcoming",
      isNextDraw: true
    },
    {
      id: "draw-2026-04-16",
      drawDate: "16 เมษายน 2026",
      drawDateIso: new Date("2026-04-16T00:00:00.000Z"),
      drawNo: "16/2026",
      status: "past",
      isNextDraw: false
    }
  ],
  monthlyInsights: [
    {
      id: "monthly-insight-may",
      month: 5,
      label: "พฤษภาคม",
      sampleSize: 12,
      summary: "เดือนพฤษภาคมใน sample mock มีเลขท้ายคี่มากกว่าเลขท้ายคู่เล็กน้อย",
      hotNumbers: ["47", "24"],
      coldNumbers: ["03", "91"],
      patternNotes: ["กลุ่มเลขสูงพบถี่กว่าเลขต่ำ", "sample size ยังเล็ก ต้องแสดงความไม่แน่นอน"]
    }
  ]
} as const;

export const calendarMockReadModel = calendarReadModelSchema.parse(
  toApiCalendarReadModel(calendarFixtureInput)
);
