import "dotenv/config";
import { getRequiredProductionEnvStatus } from "@/lib/release-safety";

const envStatus = getRequiredProductionEnvStatus(process.env);

if (envStatus.missingRequired.length > 0) {
  console.error("Release check failed. Missing required production env vars:");
  for (const key of envStatus.missingRequired) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Release check passed. Required production env vars are present:");
for (const key of envStatus.present) {
  console.log(`- ${key}`);
}

if (envStatus.missingRecommended.length > 0) {
  console.warn("Recommended env vars that are still empty:");
  for (const key of envStatus.missingRecommended) {
    console.warn(`- ${key}`);
  }
}

if (envStatus.warnings.length > 0) {
  console.warn("Configuration warnings:");
  for (const warning of envStatus.warnings) {
    console.warn(`- ${warning}`);
  }
}
