import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import "dotenv/config";

const BACKUP_DIR = join(process.cwd(), "output", "backups");
const RESTORE_CONFIRMATION = "I_UNDERSTAND_THIS_TARGET_WILL_BE_CLEANED";

type RunOptions = {
  env?: NodeJS.ProcessEnv;
  allowFailure?: boolean;
};

function run(command: string, args: string[], options: RunOptions = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: options.env ?? process.env,
    shell: false,
  });

  if (result.error) {
    if (options.allowFailure) {
      return 127;
    }

    console.error(`${command} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (!options.allowFailure && result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.status ?? 0;
}

function requireCommand(command: string) {
  const status = run(command, ["--version"], { allowFailure: true });
  if (status !== 0) {
    console.error(`${command} is required for backup rehearsal but was not found in PATH.`);
    process.exit(1);
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const directUrl = process.env.DIRECT_URL?.trim();
  if (!directUrl) {
    console.error("Backup rehearsal failed. DIRECT_URL is required.");
    process.exit(1);
  }

  requireCommand("pg_dump");
  requireCommand("pg_restore");

  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = join(BACKUP_DIR, `schema-rehearsal-${timestamp()}.dump`);

  run("pg_dump", [
    "--dbname",
    directUrl,
    "--schema-only",
    "--format",
    "custom",
    "--file",
    backupFile,
  ]);

  run("pg_restore", ["--list", backupFile]);

  const restoreUrl = process.env.RESTORE_REHEARSAL_DATABASE_URL?.trim();
  if (!restoreUrl) {
    console.log(`Backup rehearsal passed. Created and inspected ${backupFile}.`);
    console.log("Set RESTORE_REHEARSAL_DATABASE_URL plus RESTORE_REHEARSAL_CONFIRM to run a real restore rehearsal.");
    return;
  }

  if (process.env.RESTORE_REHEARSAL_CONFIRM !== RESTORE_CONFIRMATION) {
    console.error(
      `Restore rehearsal target is configured, but RESTORE_REHEARSAL_CONFIRM must equal ${RESTORE_CONFIRMATION}.`,
    );
    process.exit(1);
  }

  run("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--dbname",
    restoreUrl,
    backupFile,
  ]);

  console.log("Restore rehearsal passed against RESTORE_REHEARSAL_DATABASE_URL.");
}

void main();
