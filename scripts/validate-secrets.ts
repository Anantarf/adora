import "dotenv/config";

function main() {
  const nextAuth = process.env.NEXTAUTH_SECRET ?? "";
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const errors: string[] = [];

  if (!nextAuth || nextAuth.length < 32) {
    errors.push(`NEXTAUTH_SECRET is missing or too short (min 32 chars)`);
  }
  if (!supabase || supabase.length < 40) {
    errors.push(`SUPABASE_SERVICE_ROLE_KEY is missing or too short (min 40 chars)`);
  }

  if (errors.length > 0) {
    console.error("Secret validation failed:");
    for (const e of errors) console.error(" - ", e);
    process.exit(1);
  }

  console.log("Secret validation passed. Consider rotating secrets regularly and store in secure secret manager.");
}

void main();
