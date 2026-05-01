import { DEFAULT_SEED_PATH, loadDrawSeedFile, seedDraws } from "@/api/service/draw-seed.service";

async function main() {
  const inputPath = process.argv[2] ?? DEFAULT_SEED_PATH;
  const seedFile = await loadDrawSeedFile(inputPath);
  const report = await seedDraws(seedFile, inputPath);

  console.info(
    [
      `Seeded ${report.totalDraws} draw(s) from ${report.inputPath}.`,
      `Created: ${report.createdDraws}. Updated: ${report.updatedDraws}.`,
      `Prize rows replaced: ${report.prizeRows}.`
    ].join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Draw seed failed: ${message}`);
  process.exitCode = 1;
});
