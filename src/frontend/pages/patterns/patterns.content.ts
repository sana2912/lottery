export const patternsContent = {
  emptyState: {
    description: "ยังไม่มีข้อมูลรูปแบบเลขสำหรับรางวัลและช่วงงวดที่เลือก",
    title: "No pattern data"
  },
  filters: {
    apply: "Filter",
    prizeQuestion: "Which prize pattern do you want to inspect?",
    prizeStep: "1. เลือกรางวัลก่อน",
    prizeSummary:
      "รางวัลแต่ละประเภทมีจำนวนหลักและ sample size ไม่เท่ากัน จึงต้องเลือก prize type ก่อนวิเคราะห์ shape",
    windowStep: "2. เลือกช่วงงวดย้อนหลัง",
    windowSummary: "หลังจากเลือกรางวัลแล้ว ค่อยกำหนดจำนวนงวดที่ใช้เป็น sample window"
  },
  hero: {
    description:
      "Inspect repeat, sequence, balance, sum range, and number-shape signals by selected prize type.",
    eyebrow: "Patterns",
    title: "Prize-specific number shape analysis"
  },
  sections: {
    context: {
      eyebrow: "Context",
      title: "Selected analysis"
    },
    distribution: {
      eyebrow: "Distribution",
      title: "Distribution summary"
    },
    examples: {
      eyebrow: "Examples",
      title: "Number shape examples"
    },
    overview: {
      eyebrow: "Overview",
      title: "Pattern overview cards"
    },
    playground: {
      eyebrow: "Playground",
      title: "Pattern playground"
    }
  }
} as const;
