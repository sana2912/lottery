import { getPrisma } from "@/api/service/prisma";
import { parseCliValues, printOrWriteJsonReport } from "./audit-utils";

const PRIZE_TYPE_ORDER = [
  "FIRST",
  "NEAR_FIRST",
  "PRIZE2",
  "PRIZE3",
  "PRIZE4",
  "PRIZE5",
  "THREE_DIGIT",
  "THREE_FRONT",
  "THREE_BACK",
  "TWO_DIGIT",
  "OTHER"
] as const;

const SOURCE_STATUSES = ["IMPORTED", "PARTIAL", "VERIFIED"] as const;

type PrizeType = (typeof PRIZE_TYPE_ORDER)[number];
type SourceStatus = (typeof SOURCE_STATUSES)[number];
type OutputFormat = "csv" | "json" | "table";

type CliOptions = {
  endDate?: string;
  format: OutputFormat;
  limit?: number;
  onlyMissingProfile: boolean;
  order: "asc" | "desc";
  out?: string;
  startDate?: string;
  status?: SourceStatus;
};

type DrawAuditRow = {
  drawDate: string;
  drawNo: string;
  missingFromObservedProfile: string[];
  prizeCounts: Partial<Record<PrizeType, number>>;
  sourceStatus: string;
  totalPrizes: number;
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prisma = getPrisma();

  try {
    const draws = await prisma.lotteryDraw.findMany({
      include: {
        prizes: {
          orderBy: [{ type: "asc" }, { position: "asc" }, { number: "asc" }],
          select: {
            number: true,
            position: true,
            type: true
          }
        }
      },
      orderBy: {
        drawDate: options.order
      },
      where: {
        ...(options.status ? { sourceStatus: options.status } : {}),
        ...(options.startDate || options.endDate
          ? {
              drawDate: {
                ...(options.startDate ? { gte: new Date(options.startDate) } : {}),
                ...(options.endDate ? { lte: new Date(options.endDate) } : {})
              }
            }
          : {})
      }
    });
    const observedProfile = getObservedProfile(draws);
    const rows = draws
      .map((draw) => toAuditRow(draw, observedProfile))
      .filter((row) => !options.onlyMissingProfile || row.missingFromObservedProfile.length > 0)
      .slice(0, options.limit);

    await printAudit(rows, observedProfile, options);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Draw prize audit failed: ${message}`);
  process.exitCode = 1;
});

function parseArgs(args: readonly string[]): CliOptions {
  const values = parseCliValues(args);
  const format = parseFormat(values.format);
  const order = values.order === "desc" ? "desc" : "asc";
  const status = parseSourceStatus(values.status);
  const limit = values.limit ? Number(values.limit) : undefined;

  if (values.out && format !== "json") {
    throw new Error("--out is supported only with --format=json.");
  }

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("Invalid --limit. Expected a positive integer.");
  }

  return {
    endDate: values.endDate,
    format,
    limit,
    onlyMissingProfile: values.onlyMissingProfile === "true",
    order,
    out: values.out,
    startDate: values.startDate,
    status
  };
}

function parseFormat(value: string | undefined): OutputFormat {
  if (!value) {
    return "table";
  }

  if (value === "table" || value === "csv" || value === "json") {
    return value;
  }

  throw new Error("Invalid --format. Supported values: table, csv, json.");
}

function parseSourceStatus(value: string | undefined): SourceStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (SOURCE_STATUSES.includes(value as SourceStatus)) {
    return value as SourceStatus;
  }

  throw new Error(`Invalid --status. Supported values: ${SOURCE_STATUSES.join(", ")}`);
}

function getObservedProfile(
  draws: Array<{
    prizes: Array<{ type: string }>;
  }>
) {
  const profile = new Map<PrizeType, number>();

  for (const draw of draws) {
    const counts = getPrizeCounts(draw.prizes);

    for (const prizeType of PRIZE_TYPE_ORDER) {
      profile.set(prizeType, Math.max(profile.get(prizeType) ?? 0, counts[prizeType] ?? 0));
    }
  }

  return profile;
}

function toAuditRow(
  draw: {
    drawDate: Date;
    drawNo: null | string;
    prizes: Array<{ type: string }>;
    sourceStatus: string;
  },
  observedProfile: Map<PrizeType, number>
): DrawAuditRow {
  const prizeCounts = getPrizeCounts(draw.prizes);

  return {
    drawDate: formatDate(draw.drawDate),
    drawNo: draw.drawNo ?? "",
    missingFromObservedProfile: getMissingPrizeTypes(prizeCounts, observedProfile),
    prizeCounts,
    sourceStatus: draw.sourceStatus,
    totalPrizes: draw.prizes.length
  };
}

function getPrizeCounts(prizes: Array<{ type: string }>) {
  const counts: Partial<Record<PrizeType, number>> = {};

  for (const prize of prizes) {
    const prizeType = toPrizeType(prize.type);

    counts[prizeType] = (counts[prizeType] ?? 0) + 1;
  }

  return counts;
}

function getMissingPrizeTypes(
  prizeCounts: Partial<Record<PrizeType, number>>,
  observedProfile: Map<PrizeType, number>
) {
  return PRIZE_TYPE_ORDER.flatMap((prizeType) => {
    const expectedCount = observedProfile.get(prizeType) ?? 0;
    const actualCount = prizeCounts[prizeType] ?? 0;

    return expectedCount > actualCount ? [`${prizeType}:${actualCount}/${expectedCount}`] : [];
  });
}

async function printAudit(
  rows: readonly DrawAuditRow[],
  observedProfile: Map<PrizeType, number>,
  options: CliOptions
) {
  if (options.format === "json") {
    await printOrWriteJsonReport({
      out: options.out,
      value: {
        generatedAt: new Date().toISOString(),
        observedProfile: Object.fromEntries(observedProfile),
        rows,
        summary: getSummary(rows)
      }
    });
    return;
  }

  if (options.format === "csv") {
    printCsv(rows);
    return;
  }

  printTable(rows, observedProfile);
}

function printTable(rows: readonly DrawAuditRow[], observedProfile: Map<PrizeType, number>) {
  const lines = [
    "Lottery draw prize audit",
    `Rows: ${rows.length}`,
    `Observed max profile: ${formatProfile(observedProfile)}`,
    "",
    [
      "drawDate".padEnd(10),
      "status".padEnd(8),
      "total".padStart(5),
      "prizes".padEnd(72),
      "missingObservedProfile"
    ].join(" | ")
  ];

  for (const row of rows) {
    lines.push(
      [
        row.drawDate.padEnd(10),
        row.sourceStatus.padEnd(8),
        String(row.totalPrizes).padStart(5),
        formatPrizeCounts(row.prizeCounts).padEnd(72),
        row.missingFromObservedProfile.join(", ") || "-"
      ].join(" | ")
    );
  }

  console.info(lines.join("\n"));
}

function printCsv(rows: readonly DrawAuditRow[]) {
  const header = [
    "drawDate",
    "drawNo",
    "sourceStatus",
    "totalPrizes",
    "prizes",
    "missingObservedProfile"
  ];
  const body = rows.map((row) =>
    [
      row.drawDate,
      row.drawNo,
      row.sourceStatus,
      String(row.totalPrizes),
      formatPrizeCounts(row.prizeCounts),
      row.missingFromObservedProfile.join("|")
    ].map(toCsvCell)
  );

  console.info([header, ...body].map((row) => row.join(",")).join("\n"));
}

function getSummary(rows: readonly DrawAuditRow[]) {
  const statusCounts = new Map<string, number>();
  let missingObservedProfileCount = 0;

  for (const row of rows) {
    statusCounts.set(row.sourceStatus, (statusCounts.get(row.sourceStatus) ?? 0) + 1);

    if (row.missingFromObservedProfile.length > 0) {
      missingObservedProfileCount += 1;
    }
  }

  return {
    missingObservedProfileCount,
    rows: rows.length,
    statusCounts: Object.fromEntries(statusCounts)
  };
}

function formatProfile(profile: Map<PrizeType, number>) {
  return PRIZE_TYPE_ORDER.map((prizeType) => `${prizeType}=${profile.get(prizeType) ?? 0}`)
    .filter((entry) => !entry.endsWith("=0"))
    .join(", ");
}

function formatPrizeCounts(counts: Partial<Record<PrizeType, number>>) {
  return PRIZE_TYPE_ORDER.map((prizeType) => `${prizeType}=${counts[prizeType] ?? 0}`)
    .filter((entry) => !entry.endsWith("=0"))
    .join(", ");
}

function toPrizeType(value: string): PrizeType {
  return PRIZE_TYPE_ORDER.includes(value as PrizeType) ? (value as PrizeType) : "OTHER";
}

function toCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
