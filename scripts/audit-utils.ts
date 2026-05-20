import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type CliValues = Record<string, string | undefined>;

export function parseCliValues(args: readonly string[]): CliValues {
  return Object.fromEntries(
    args.map((argument) => {
      const [key, value = "true"] = argument.replace(/^--/, "").split("=", 2);

      return [key, value];
    })
  );
}

export async function writeJsonReport(filePath: string, value: unknown) {
  const resolvedPath = resolve(process.cwd(), filePath);

  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");

  return resolvedPath;
}

export async function printOrWriteJsonReport({ out, value }: { out?: string; value: unknown }) {
  if (!out) {
    console.info(JSON.stringify(value, null, 2));
    return;
  }

  const resolvedPath = await writeJsonReport(out, value);

  console.info(`Audit JSON written to ${resolvedPath}`);
}
