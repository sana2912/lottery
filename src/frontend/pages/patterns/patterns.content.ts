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
    windowStep: "2. เลือก scope ของ sample",
    windowSummary: "ระบบใช้ full eligible sample ใน scope ที่เลือก ไม่มี cap 50/100/500"
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
      randomHint:
        "When a pattern is selected, examples are randomly generated to match that shape (not limited to historical draws).",
      randomHintTh: "เมื่อเลือก pattern แล้ว ตัวอย่างจะสุ่มให้ตรงรูปแบบนั้น (ไม่จำกัดแค่เลขที่เคยออกจริง)",
      shuffle: "Shuffle examples",
      syntheticBadge: "Random sample",
      title: "Number shape examples"
    },
    overview: {
      eyebrow: "Overview",
      sequenceHint:
        "Ascending / Descending: every digit is strictly greater or less than the previous (no equal digits). Applies to 2- and 3-digit prizes only.",
      sequenceHintTh:
        "เรียงขึ้น / เรียงลง: ทุกหลักต้องมากกว่าหรือน้อยกว่าหลักก่อนหน้าเสมอ (ห้ามซ้ำ) ใช้กับรางวัล 2 และ 3 หลักเท่านั้น",
      title: "Pattern overview cards"
    },
    playground: {
      eyebrow: "Playground",
      title: "Pattern playground"
    }
  }
} as const;
