import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { config } from "dotenv";

const [, , envFileArg, separator, ...command] = process.argv;

if (!envFileArg || separator !== "--" || command.length === 0) {
  console.error("Usage: bun run scripts/run-with-env.ts <env-file> -- <command> [args...]");
  process.exit(1);
}

const result = config({
  override: true,
  path: resolve(envFileArg)
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const child = spawn(command[0], command.slice(1), {
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32"
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
