export function computeGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export function movingAverage(series: number[], window: number): number[] {
  if (window <= 1) return series.slice();
  const out: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = series.slice(start, i + 1);
    const avg = subset.reduce((a, b) => a + b, 0) / subset.length;
    out.push(avg);
  }
  return out;
}

export function summarize(values: number[]): { sum: number; avg: number } {
  if (!values.length) return { sum: 0, avg: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return { sum, avg: sum / values.length };
}


