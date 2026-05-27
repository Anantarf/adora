import { spawnSync } from "node:child_process";
import "dotenv/config";

const TEST_BASE_URL = process.env.E2E_BASE_URL?.trim() || "http://localhost:3000";

const sharedEnv: NodeJS.ProcessEnv = {
  ...process.env,
  NEXTAUTH_URL: TEST_BASE_URL,
  NODE_ENV: "production",
};

function run(command: string, args: string[]) {
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
          stdio: "inherit",
          env: sharedEnv,
        })
      : spawnSync(command, args, {
          stdio: "inherit",
          env: sharedEnv,
        });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "build"]);
run("npx", ["playwright", "test", "--grep", "@critical"]);
