import { getRequiredProductionEnvStatus } from "@/lib/release-safety";

const envStatus = getRequiredProductionEnvStatus(process.env);

if (envStatus.missing.length > 0) {
  console.error("Release check failed. Missing required production env vars:");
  for (const key of envStatus.missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Release check passed. Required production env vars are present:");
for (const key of envStatus.present) {
  console.log(`- ${key}`);
}
