export const timeMachineContent = {
  actions: {
    clearTickets: "ล้างทั้งหมด",
    inspectDraw: "ดูงวดนี้",
    pause: "หยุดชั่วคราว",
    randomFill: "สุ่มเลข",
    replay: "เล่นใหม่",
    resume: "เล่นต่อ",
    start: "เริ่มจำลองย้อนเวลา"
  },
  board: {
    nearMissNote: "พลาดรางวัลที่ 1 ไป 1 หลัก",
    prizesTitle: "เลขรางวัลจริงงวดนี้",
    score: "คะแนนรวม",
    ticketsTitle: "เลขของคุณ",
    yearPrefix: "ปี"
  },
  hitReward: {
    drawLabel: "งวด",
    pointsLabel: "คะแนนวิจัย",
    ticketLabel: "เลขของคุณ",
    title: "ถูกรางวัล!",
    yearLabel: "ปี"
  },
  prizeSections: {
    FIRST: "รางวัลที่ 1",
    NEAR_FIRST: "รางวัลข้างเคียงรางวัลที่ 1",
    PRIZE2: "รางวัลที่ 2",
    PRIZE3: "รางวัลที่ 3",
    PRIZE4: "รางวัลที่ 4",
    PRIZE5: "รางวัลที่ 5",
    THREE_DIGIT: "เลข 3 ตัว",
    THREE_FRONT: "เลขหน้า 3 ตัว",
    THREE_BACK: "เลขท้าย 3 ตัว",
    TWO_DIGIT: "เลขท้าย 2 ตัว"
  },
  emptyState: {
    description: "กรอกเลข 6 หลัก 1-4 ใบ แล้วเริ่มจำลองเพื่อย้อนรอยประวัติศาสตร์หวยรัฐบาล",
    title: "ยังไม่มีการจำลอง"
  },
  errorMessage: "ไม่สามารถโหลดการจำลองได้ กรุณาลองใหม่อีกครั้ง",
  hero: {
    description:
      "เลือกเลข 6 หลัก แล้วย้อนกลับไปตามผลรางวัลจริงตั้งแต่ปี 1992 แผนกลางแสดงเลขรางวัลทุกประเภทของแต่ละงวด คะแนนเป็น research points เท่านั้น",
    eyebrow: "เครื่องเวลา",
    title: "ย้อนรอยประวัติศาสตร์หวยรัฐบาล"
  },
  hud: {
    speed: "ความเร็ว"
  },
  sections: {
    setup: {
      eyebrow: "เตรียมตัว",
      title: "เลือกเลขของคุณ"
    },
    summary: {
      bestNearMiss: "ใกล้รางวัลที่ 1 ที่สุด",
      eyebrow: "สรุปการเดินทาง",
      hits: "ถูกรางวัล",
      longestQuiet: "ช่วงเงียบยาวสุด",
      scoreChart: "คะแนนตามปี",
      title: "เรื่องราวจากการย้อนเวลา",
      totalScore: "คะแนนรวม"
    },
    tickets: {
      hint: "กรอกเลข 6 หลัก สูงสุด 4 ใบ",
      title: "เลขที่เลือก"
    }
  },
  simulation: {
    reducedMotionNotice: "โหมดการลดการเคลื่อนไหว: แสดงแผงแบบไม่มีเอฟเฟกต์เพิ่มเติม"
  }
} as const;
