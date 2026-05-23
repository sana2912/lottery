export function formatPatternOptionLabel(label: string, percent: number) {
  return `${label} — ${percent.toFixed(2)}%`;
}

export function roundPatternPercent(value: number) {
  return Math.round(value * 100) / 100;
}
