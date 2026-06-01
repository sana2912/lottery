import type { LotterySurvivalRoundResponse } from "@/schema/app/lottery-survival.schema";

const PASS_COPY = [
  "ท่านยังมีชีวิตรอดอีกหนึ่งงวด",
  "ดูเหมือนโชคจะยังไม่รู้จักท่าน",
  "ระบบขอแสดงความเสียใจกับเงินที่จากไป",
  "จักรวาลกำลังทดสอบความอดทนของท่าน"
] as const;

const HIT_COPY = [
  "โชคเดินเข้ามาทัก แต่ยังไม่บอกว่าจะอยู่นานแค่ไหน",
  "งวดนี้มีเงินรางวัลกลับบ้าน ระบบขอจดไว้เป็นหลักฐาน",
  "ในที่สุดตัวเลขก็ทำตัวเป็นมิตรกับท่านบ้าง"
] as const;

const LOW_BALANCE_COPY = [
  "เหลืออีกนิดเดียวก็จะซื้อสลากไม่ได้แล้ว",
  "บางทีการเก็บเงินอาจเป็นรางวัลที่แท้จริง",
  "ระบบเริ่มได้กลิ่นความเสี่ยงจาก balance แล้ว"
] as const;

const NEAR_MISS_COPY = [
  "ใกล้มาก แต่คำว่าใกล้ยังจ่ายเงินไม่ได้",
  "ระบบเห็นแล้วเจ็บแทน เฉียดกว่านี้ก็ต้องเรียกชะตา",
  "ท่านเข้าใกล้ความหวัง แล้วความหวังก็เดินหนี"
] as const;

export function getLotterySurvivalNarratorMessage(input: {
  balanceAfter: number;
  prizeTotal: number;
  roundIndex: number;
  ticketPrice: number;
  topNearMiss?: { severity: number };
}): string {
  if (input.balanceAfter < input.ticketPrice * 5) {
    return pickCopy(LOW_BALANCE_COPY, input.roundIndex);
  }

  if (input.prizeTotal > 0) {
    return pickCopy(HIT_COPY, input.roundIndex + input.prizeTotal);
  }

  if (input.topNearMiss && input.topNearMiss.severity >= 60) {
    return pickCopy(NEAR_MISS_COPY, input.roundIndex + input.topNearMiss.severity);
  }

  return pickCopy(PASS_COPY, input.roundIndex);
}

export function getLotterySurvivalSummaryNarration(input: {
  finalBalance: number;
  roundsSurvived: number;
  startingBalance: number;
}): string {
  if (input.roundsSurvived <= 2) {
    return "มือของท่านไม่มีโชคเลย สองงวดก็จอดแล้ว";
  }

  if (input.finalBalance > input.startingBalance) {
    return "ท่านเดินออกจากระบบหวยด้วยเงินมากกว่าตอนเข้า ระบบขอปรบมือแบบระมัดระวัง";
  }

  if (input.finalBalance < 80) {
    return "เงิน 800,000 บาทพาท่านมาถึงจุดที่ซื้อต่อไม่ได้แล้ว";
  }

  return "ท่านเลือกหยุดเองก่อนระบบจะสอนบทเรียนต่อไป";
}

export function getRoundOutcomeTone(round: LotterySurvivalRoundResponse): "hit" | "miss" | "near" {
  if (round.prizeTotal > 0) {
    return "hit";
  }

  if (round.nearMisses.length > 0) {
    return "near";
  }

  return "miss";
}

function pickCopy(messages: readonly string[], seed: number): string {
  return messages[Math.abs(seed) % messages.length] ?? messages[0] ?? "";
}
