export type ReleaseEnvStatus = {
  missingRequired: string[];
  missingRecommended: string[];
  present: string[];
  warnings: string[];
};

export function getRequiredProductionEnvStatus(env: NodeJS.ProcessEnv): ReleaseEnvStatus {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const present: string[] = [];
  const warnings: string[] = [];

  const requiredChecks = [
    {
      label: "DATABASE_URL",
      values: ["DATABASE_URL"],
    },
    {
      label: "DIRECT_URL",
      values: ["DIRECT_URL"],
    },
    {
      label: "NEXTAUTH_SECRET",
      values: ["NEXTAUTH_SECRET"],
    },
    {
      label: "NEXTAUTH_URL",
      values: ["NEXTAUTH_URL"],
    },
    {
      label: "SUPABASE_URL",
      values: ["SUPABASE_URL"],
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      values: ["SUPABASE_SERVICE_ROLE_KEY"],
    },
  ] as const;

  for (const check of requiredChecks) {
    const foundKey = check.values.find((key) => env[key]?.trim());
    if (foundKey) {
      present.push(foundKey);
      continue;
    }

    missingRequired.push(check.label);
  }

  const recommendedKeys = [
    "DEFAULT_RESET_PASSWORD",
    "HEALTH_CHECK_TOKEN",
    "PRISMA_SLOW_QUERY_THRESHOLD_MS",
    "SMOKE_BASE_URL",
    "ALERT_WEBHOOK_URL",
    "ALERT_MIN_SEVERITY",
    "ALERT_COOLDOWN_MS",
    "RESTORE_REHEARSAL_DATABASE_URL",
    "RESTORE_REHEARSAL_CONFIRM",
  ] as const;

  for (const key of recommendedKeys) {
    if (env[key]?.trim()) {
      present.push(key);
    } else {
      missingRecommended.push(key);
    }
  }

  const normalizedNextAuthUrl = normalizeBaseUrl(env.NEXTAUTH_URL);
  if (env.NEXTAUTH_URL?.trim() && !normalizedNextAuthUrl) {
    warnings.push("NEXTAUTH_URL ada tetapi bukan absolute URL yang valid.");
  }

  if (env.NODE_ENV === "production" && normalizedNextAuthUrl?.includes("localhost")) {
    warnings.push("NEXTAUTH_URL masih mengarah ke localhost padahal NODE_ENV=production.");
  }

  const normalizedSupabaseUrl = normalizeBaseUrl(env.SUPABASE_URL);
  const normalizedPublicSupabaseUrl = normalizeBaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (normalizedSupabaseUrl && normalizedPublicSupabaseUrl && normalizedSupabaseUrl !== normalizedPublicSupabaseUrl) {
    warnings.push("SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_URL berbeda. Samakan nilainya untuk menghindari konfigurasi server/client yang tidak konsisten.");
  }

  if (env.NODE_ENV === "production" && !normalizedSupabaseUrl && normalizedPublicSupabaseUrl) {
    warnings.push("SUPABASE_URL belum diisi. Untuk server production, set SUPABASE_URL secara eksplisit meskipun NEXT_PUBLIC_SUPABASE_URL sudah ada.");
  }

  const normalizedSmokeUrl = normalizeBaseUrl(env.SMOKE_BASE_URL);
  if (env.SMOKE_BASE_URL?.trim() && !normalizedSmokeUrl) {
    warnings.push("SMOKE_BASE_URL ada tetapi bukan absolute URL yang valid.");
  }

  if (env.ALERT_WEBHOOK_URL?.trim()) {
    const normalizedAlertUrl = normalizeBaseUrl(env.ALERT_WEBHOOK_URL);
    if (!normalizedAlertUrl) {
      warnings.push("ALERT_WEBHOOK_URL ada tetapi bukan absolute URL yang valid.");
    }
  }

  return { missingRequired, missingRecommended, present, warnings };
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
