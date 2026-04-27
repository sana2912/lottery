import type { ApiDraw } from "@/schema/api/draw";

type DrawDtoInput = {
  id: string;
  drawDate: Date | string;
  lotteryType: string;
};

export function toApiDraw(draw: DrawDtoInput): ApiDraw {
  return {
    id: draw.id,
    drawDate: draw.drawDate instanceof Date ? draw.drawDate.toISOString() : draw.drawDate,
    lotteryType: draw.lotteryType
  };
}
