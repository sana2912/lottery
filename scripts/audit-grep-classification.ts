import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseCliValues, writeJsonReport } from "./audit-utils";

const DEFAULT_OUT = "reports/audit/grep-classification.json";

const SYMBOLS = [
  "appearanceCount",
  "maxAppearanceCount",
  "seen",
  "drawPresence",
  "frequencyPercent",
  "drawCount",
  "hitCount",
  "missingDrawCount",
  "trendScore",
  "score",
  "Math.min",
  "SIX_DIGIT_ALL",
  "THREE_FRONT",
  "THREE_BACK",
  "buildOnDemandAnalysisReadModel",
  "analysis_snapshot_runs"
] as const;

type Classification =
  | "correct"
  | "needs-rename-copy-fix"
  | "needs-formula-fix"
  | "needs-denominator-metadata"
  | "dangerous-legacy-path"
  | "must-be-removed"
  | "must-be-covered-by-tests";

type GrepHit = {
  classification: Classification;
  file: string;
  line: number;
  lineText: string;
  symbol: (typeof SYMBOLS)[number];
};

async function main() {
  const values = parseCliValues(process.argv.slice(2));
  const root = resolve(process.cwd());
  const hits: GrepHit[] = [];

  for await (const filePath of walkTypeScript(root)) {
    const relativePath = relative(root, filePath).replaceAll("\\", "/");

    if (shouldSkip(relativePath)) {
      continue;
    }

    const content = await readFile(filePath, "utf8");
    const lines = content.split("\n");

    for (const [index, lineText] of lines.entries()) {
      for (const symbol of SYMBOLS) {
        if (!lineText.includes(symbol)) {
          continue;
        }

        hits.push({
          classification: classifyHit(relativePath, symbol, lineText),
          file: relativePath,
          line: index + 1,
          lineText: lineText.trim(),
          symbol
        });
      }
    }
  }

  const summary = summarize(hits);
  const report = {
    generatedAt: new Date().toISOString(),
    hitCount: hits.length,
    hits,
    summary,
    symbols: SYMBOLS
  };

  await writeJsonReport(values.out ?? DEFAULT_OUT, report);
  console.info(`Grep classification written (${hits.length} hits).`);
}

function classifyHit(file: string, symbol: (typeof SYMBOLS)[number], line: string): Classification {
  if (file.includes(".test.") || file.startsWith("tests/")) {
    return "must-be-covered-by-tests";
  }

  if (symbol === "buildOnDemandAnalysisReadModel") {
    return file.includes("on-demand-read-model.ts") ? "correct" : "dangerous-legacy-path";
  }

  if (symbol === "analysis_snapshot_runs") {
    return file.includes("audit") || file.includes("compute-analysis-snapshot")
      ? "correct"
      : "needs-denominator-metadata";
  }

  if (symbol === "drawPresence") {
    return "must-be-removed";
  }

  if (symbol === "seen" && !file.includes("lastSeen") && !file.includes("Last seen")) {
    return "needs-rename-copy-fix";
  }

  if (symbol === "Math.min" && (line.includes("frequencyPercent") || line.includes("clamp"))) {
    return "needs-formula-fix";
  }

  if (symbol === "appearanceCount" && file.includes("frontend/pages/calendar")) {
    if (line.includes("??") || line.includes("appearanceCount")) {
      return "dangerous-legacy-path";
    }
  }

  if (
    (symbol === "hitCount" || symbol === "missingDrawCount") &&
    (file.includes("analytics.mappers") || file.includes("watchlist.service"))
  ) {
    if (line.includes("sort") || line.includes(">") || line.includes("frequencyPercent")) {
      return line.includes("frequencyPercent") ? "correct" : "needs-formula-fix";
    }
  }

  if (symbol === "frequencyPercent" && line.includes("drawCount")) {
    return "needs-formula-fix";
  }

  if (
    file.includes("number-stats.ts") ||
    file.includes("position-heatmap.ts") ||
    file.includes("digit-events.ts")
  ) {
    return "correct";
  }

  if (file.includes("docs/calculate.md") && symbol === "frequencyPercent") {
    return "needs-rename-copy-fix";
  }

  if (symbol === "THREE_FRONT" || symbol === "THREE_BACK") {
    return file.includes("analysis-context") || file.includes("prize-sample")
      ? "correct"
      : "needs-denominator-metadata";
  }

  if (symbol === "SIX_DIGIT_ALL") {
    return "correct";
  }

  return "needs-denominator-metadata";
}

function summarize(hits: readonly GrepHit[]) {
  const byClassification = new Map<Classification, number>();
  const bySymbol = new Map<string, number>();

  for (const hit of hits) {
    byClassification.set(hit.classification, (byClassification.get(hit.classification) ?? 0) + 1);
    bySymbol.set(hit.symbol, (bySymbol.get(hit.symbol) ?? 0) + 1);
  }

  return {
    byClassification: Object.fromEntries(byClassification),
    bySymbol: Object.fromEntries(bySymbol)
  };
}

function shouldSkip(relativePath: string) {
  return (
    relativePath.startsWith("node_modules/") ||
    relativePath.startsWith("src/generated/") ||
    relativePath.startsWith(".next/") ||
    relativePath.startsWith("reports/")
  );
}

async function* walkTypeScript(directory: string): AsyncGenerator<string> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "generated") {
        continue;
      }

      yield* walkTypeScript(fullPath);
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
