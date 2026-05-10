export const analyticsContent = {
  emptyState: {
    description: "ไม่มีสถิติสำหรับรางวัลและช่วงงวดที่เลือก",
    title: "No analytics records"
  },
  errorState: {
    description:
      "Analytics service ยังตอบกลับไม่ได้หรือ response ไม่ตรง schema ให้เช็ค API/database แล้ว refresh หน้าอีกครั้ง",
    title: "Analytics data unavailable"
  },
  filters: {
    prizeLabel: "Prize type",
    prizeSummary: "เลือกรางวัลก่อน เพราะเลข 2, 3 และ 6 หลักควรอ่านสัญญาณไม่เหมือนกัน",
    title: "Analytics filters",
    windowLabel: "Window"
  },
  hero: {
    description:
      "Historical draw data is grouped into frequency, position, recency, and shape signals. These signals describe past behavior only.",
    eyebrow: "Analytics",
    title: "Frequency, position, and recency signals"
  },
  metrics: {
    numberLength: "Number length",
    prizeType: "Prize type",
    sampleSize: "Sample size",
    windowSize: "Window"
  },
  notes: {
    sixDigit:
      "เลข 6 หลักซ้ำตรงตัวเกิดยากมาก ตารางเลขตรงตัวจึงไม่ควรถูกอ่านเป็น ranking หลัก ให้ดู position, digit distribution และ shape signal เป็นหลัก"
  },
  sections: {
    digitDistribution: {
      eyebrow: "Digits",
      title: "Overall digit distribution"
    },
    digitStats: {
      eyebrow: "Positions",
      title: "Digit position stats"
    },
    exactExamples: {
      eyebrow: "Examples",
      title: "Recent historical examples"
    },
    numberStats: {
      eyebrow: "Numbers",
      title: "เลขที่ออกบ่อยในช่วงนี้"
    },
    repeatedThreeDigit: {
      eyebrow: "3-digit numbers",
      title: "Repeated 3-digit numbers"
    },
    shapeSummary: {
      eyebrow: "Shapes",
      title: "Shape summary teaser"
    }
  },
  tableHeaders: {
    digit: "Digit",
    frequency: "Frequency",
    hits: "Hits",
    missing: "Missing draws",
    number: "Number",
    pattern: "Pattern",
    position: "Position",
    share: "Share"
  }
} as const;
