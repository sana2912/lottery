import type { SimulationDraw } from "@/api/service/time-machine/near-miss";

export const simulationFixtureDraws: SimulationDraw[] = [
  {
    drawDate: "2024-01-16T00:00:00.000Z",
    id: "draw-2024-01",
    prizes: [
      { number: "123456", type: "FIRST" },
      { number: "123457", type: "NEAR_FIRST" },
      { number: "12345", type: "THREE_FRONT" },
      { number: "456", type: "THREE_BACK" },
      { number: "56", type: "TWO_DIGIT" }
    ]
  },
  {
    drawDate: "2023-12-16T00:00:00.000Z",
    id: "draw-2023-12",
    prizes: [
      { number: "999999", type: "FIRST" },
      { number: "888888", type: "NEAR_FIRST" },
      { number: "111", type: "THREE_FRONT" },
      { number: "222", type: "THREE_BACK" },
      { number: "33", type: "TWO_DIGIT" }
    ]
  },
  {
    drawDate: "2023-11-16T00:00:00.000Z",
    id: "draw-2023-11",
    prizes: [
      { number: "654321", type: "FIRST" },
      { number: "654322", type: "NEAR_FIRST" },
      { number: "654", type: "THREE_FRONT" },
      { number: "321", type: "THREE_BACK" },
      { number: "21", type: "TWO_DIGIT" }
    ]
  },
  {
    drawDate: "2023-10-16T00:00:00.000Z",
    id: "draw-2023-10",
    prizes: [
      { number: "000000", type: "FIRST" },
      { number: "000001", type: "NEAR_FIRST" },
      { number: "000", type: "THREE_FRONT" },
      { number: "000", type: "THREE_BACK" },
      { number: "00", type: "TWO_DIGIT" }
    ]
  }
];
