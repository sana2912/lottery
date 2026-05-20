import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { csvParse } from "d3-dsv";
import { getPrisma } from "@/api/service/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  type LotteryDrawSeedFile,
  type LotteryDrawSeedInput,
  lotteryDrawSeedFileSchema
} from "@/schema/app/draw-seed.schema";
import type { SourceStatus } from "@/schema/app/source.schema";

type CsvHistoryRow = {
  draw_date: string;
  draw_date_text: string;
  first_prize: string;
  first_prize_digits: string;
  has_detail_section: string;
  last2_number: string;
  last3_numbers: string;
  near_first_prize: string;
  prize2_numbers: string;
  prize3_numbers: string;
  prize4_numbers: string;
  prize5_numbers: string;
  source_file: string;
  source_url: string;
  special_first_prize_raw: string;
  year_be: string;
};

export type SeedReport = {
  createdDraws: number;
  inputPath: string;
  prizeRows: number;
  totalDraws: number;
  updatedDraws: number;
};

export const DEFAULT_SEED_PATH = "lottory-histoty";

export async function loadDrawSeedFile(inputPath: string) {
  const resolvedPath = resolve(process.cwd(), inputPath);
  const fileStats = await stat(resolvedPath);

  if (fileStats.isDirectory()) {
    return loadDrawSeedFileFromCsvDirectory(resolvedPath);
  }

  if (extname(resolvedPath).toLowerCase() === ".csv") {
    return loadDrawSeedFileFromCsvFiles([resolvedPath], resolvedPath);
  }

  return readJsonSeedFile(resolvedPath);
}

export async function seedDraws(
  seedFile: LotteryDrawSeedFile,
  inputPath: string
): Promise<SeedReport> {
  const prisma = getPrisma();
  const report: SeedReport = {
    createdDraws: 0,
    inputPath,
    prizeRows: 0,
    totalDraws: seedFile.draws.length,
    updatedDraws: 0
  };

  try {
    for (const draw of seedFile.draws) {
      const result = await prisma.$transaction(async (transaction) => {
        const drawDate = toDate(draw.drawDate);
        const existingDraw = await transaction.lotteryDraw.findUnique({
          where: {
            lotteryType_drawDate: {
              drawDate,
              lotteryType: draw.lotteryType
            }
          }
        });
        const persistedDraw = await transaction.lotteryDraw.upsert({
          create: toDrawCreateInput(draw, seedFile),
          update: toDrawUpdateInput(draw, seedFile),
          where: {
            lotteryType_drawDate: {
              drawDate,
              lotteryType: draw.lotteryType
            }
          }
        });

        await transaction.lotteryPrize.deleteMany({
          where: {
            drawId: persistedDraw.id
          }
        });

        if (draw.prizes.length > 0) {
          await transaction.lotteryPrize.createMany({
            data: draw.prizes.map((prize) => ({
              drawId: persistedDraw.id,
              number: prize.number,
              position: prize.position,
              type: prize.type
            }))
          });
        }

        return {
          created: !existingDraw,
          prizeCount: draw.prizes.length
        };
      });

      report.prizeRows += result.prizeCount;

      if (result.created) {
        report.createdDraws += 1;
      } else {
        report.updatedDraws += 1;
      }
    }

    return report;
  } finally {
    await prisma.$disconnect();
  }
}

export function createSeedFileFromCsvRows(
  rows: readonly CsvHistoryRow[],
  sourceName: string
): LotteryDrawSeedFile {
  return lotteryDrawSeedFileSchema.parse({
    draws: rows.map((row) => toDrawSeedInput(row)),
    source: {
      metadata: {
        format: "csv-history",
        importedFrom: sourceName
      },
      name: "myhora csv history",
      status: "PARTIAL"
    }
  });
}

async function readJsonSeedFile(inputPath: string) {
  const raw = await readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);

  return lotteryDrawSeedFileSchema.parse(parsed);
}

async function loadDrawSeedFileFromCsvDirectory(inputPath: string) {
  const entries = await readdir(inputPath, { withFileTypes: true });
  const csvFiles = entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".csv")
    .map((entry) => resolve(inputPath, entry.name))
    .sort((a, b) => a.localeCompare(b));

  if (csvFiles.length === 0) {
    throw new Error(`No CSV files found in ${inputPath}.`);
  }

  return loadDrawSeedFileFromCsvFiles(csvFiles, inputPath);
}

async function loadDrawSeedFileFromCsvFiles(csvFiles: readonly string[], inputPath: string) {
  const rows = (
    await Promise.all(
      csvFiles.map(async (csvFile) => parseCsvRows(await readFile(csvFile, "utf8")))
    )
  ).flat();

  return createSeedFileFromCsvRows(rows, basename(inputPath));
}

function parseCsvRows(content: string): CsvHistoryRow[] {
  return csvParse(content.trim()) as CsvHistoryRow[];
}

function toDrawSeedInput(row: CsvHistoryRow): LotteryDrawSeedInput {
  const prizes = [
    ...toNumberPrizes("FIRST", row.first_prize),
    ...toNumberPrizes("THREE_DIGIT", row.last3_numbers),
    ...toNumberPrizes("TWO_DIGIT", row.last2_number),
    ...toNumberPrizes("NEAR_FIRST", row.near_first_prize),
    ...toNumberPrizes("PRIZE2", row.prize2_numbers),
    ...toNumberPrizes("PRIZE3", row.prize3_numbers),
    ...toNumberPrizes("PRIZE4", row.prize4_numbers),
    ...toNumberPrizes("PRIZE5", row.prize5_numbers)
  ];

  return {
    drawDate: row.draw_date,
    lotteryType: "THAI_GOVERNMENT",
    metadata: {
      drawDateText: row.draw_date_text,
      firstPrizeDigits: row.first_prize_digits,
      hasDetailSection: row.has_detail_section === "True",
      sourceFile: row.source_file,
      ...(row.special_first_prize_raw ? { specialFirstPrizeRaw: row.special_first_prize_raw } : {}),
      yearBe: row.year_be
    },
    prizes,
    sourceStatus: getCsvDrawSourceStatus(row, prizes.length),
    sourceUrl: row.source_url
  };
}

function toNumberPrizes(
  type:
    | "FIRST"
    | "THREE_DIGIT"
    | "TWO_DIGIT"
    | "NEAR_FIRST"
    | "PRIZE2"
    | "PRIZE3"
    | "PRIZE4"
    | "PRIZE5",
  value: string
) {
  return splitPipeValues(value).map((number, index) => ({
    number,
    position: needsPosition(type, value) ? index + 1 : undefined,
    type
  }));
}

function splitPipeValues(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter((item) => /^\d+$/.test(item));
}

function needsPosition(type: string, value: string) {
  return type !== "FIRST" && splitPipeValues(value).length > 1;
}

function getCsvDrawSourceStatus(row: CsvHistoryRow, prizeCount: number): SourceStatus {
  if (prizeCount === 0) {
    return "IMPORTED";
  }

  if (row.has_detail_section !== "True") {
    return "PARTIAL";
  }

  return "VERIFIED";
}

function toDrawCreateInput(
  draw: LotteryDrawSeedInput,
  seedFile: LotteryDrawSeedFile
): Prisma.LotteryDrawCreateInput {
  return {
    drawDate: toDate(draw.drawDate),
    drawNo: draw.drawNo,
    lotteryType: draw.lotteryType,
    metadata: toPrismaJson(getDrawMetadata(draw, seedFile)),
    publishedAt: toOptionalDate(draw.publishedAt ?? seedFile.source?.publishedAt),
    sourceStatus: getDrawSourceStatus(draw, seedFile),
    sourceUrl: draw.sourceUrl ?? seedFile.source?.url
  };
}

function toDrawUpdateInput(
  draw: LotteryDrawSeedInput,
  seedFile: LotteryDrawSeedFile
): Prisma.LotteryDrawUpdateInput {
  return {
    drawNo: draw.drawNo,
    metadata: toPrismaJson(getDrawMetadata(draw, seedFile)),
    publishedAt: toOptionalDate(draw.publishedAt ?? seedFile.source?.publishedAt),
    sourceStatus: getDrawSourceStatus(draw, seedFile),
    sourceUrl: draw.sourceUrl ?? seedFile.source?.url
  };
}

function getDrawMetadata(draw: LotteryDrawSeedInput, seedFile: LotteryDrawSeedFile) {
  if (!seedFile.source?.metadata && !seedFile.source?.name) {
    return draw.metadata ? stripUndefinedValues(draw.metadata) : undefined;
  }

  const metadata: Record<string, unknown> = {};

  if (seedFile.source?.name) {
    metadata.sourceName = seedFile.source.name;
  }

  if (seedFile.source?.metadata) {
    Object.assign(metadata, seedFile.source.metadata);
  }

  if (draw.metadata) {
    Object.assign(metadata, draw.metadata);
  }

  return Object.keys(metadata).length > 0 ? stripUndefinedValues(metadata) : undefined;
}

function getDrawSourceStatus(
  draw: LotteryDrawSeedInput,
  seedFile: LotteryDrawSeedFile
): SourceStatus {
  return draw.sourceStatus ?? seedFile.source?.status ?? "IMPORTED";
}

function toOptionalDate(value: string | undefined) {
  return value ? toDate(value) : undefined;
}

function toDate(value: string) {
  return new Date(value);
}

function toPrismaJson(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function stripUndefinedValues(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
