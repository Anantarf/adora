const REQUIRED_PRODUCTION_ENV_VARS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "HEALTH_CHECK_TOKEN",
] as const;

export type ReleaseEnvStatus = {
  missing: string[];
  present: string[];
};

export function getRequiredProductionEnvStatus(env: NodeJS.ProcessEnv): ReleaseEnvStatus {
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of REQUIRED_PRODUCTION_ENV_VARS) {
    if (env[key]?.trim()) {
      present.push(key);
      continue;
    }

    missing.push(key);
  }

  return { missing, present };
}

export function normalizeBaseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}
