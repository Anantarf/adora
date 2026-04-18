import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

type GroupDescriptionPayload = {
  targetKu?: number | string;
  schoolLevel?: string;
  [key: string]: unknown;
};

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
const isDryRun = process.argv.includes("--dry-run");

function normalizeGroupDescription(rawDescription: string): string | null {
  const trimmed = rawDescription.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as GroupDescriptionPayload;

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    if (typeof parsed.targetKu !== "string") {
      return null;
    }

    const normalizedTargetKu = Number(parsed.targetKu);
    if (!Number.isFinite(normalizedTargetKu)) {
      return null;
    }

    const normalizedPayload: GroupDescriptionPayload = {
      ...parsed,
      targetKu: normalizedTargetKu,
    };

    const normalizedDescription = JSON.stringify(normalizedPayload);
    return normalizedDescription === trimmed ? null : normalizedDescription;
  } catch {
    return null;
  }
}

async function main() {
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, description: true },
  });

  let updatedCount = 0;
  const changedGroups: Array<{ id: string; name: string }> = [];

  for (const group of groups) {
    const description = group.description;
    if (!description) {
      continue;
    }

    const normalizedDescription = normalizeGroupDescription(description);
    if (!normalizedDescription) {
      continue;
    }

    changedGroups.push({ id: group.id, name: group.name });

    if (!isDryRun) {
      await prisma.group.update({
        where: { id: group.id },
        data: { description: normalizedDescription },
      });
    }

    updatedCount += 1;
  }

  console.log(`[repair-group-meta] scanned=${groups.length} changed=${updatedCount} dryRun=${isDryRun}`);

  if (changedGroups.length > 0) {
    console.log("[repair-group-meta] affected groups:");
    changedGroups.forEach((group) => {
      console.log(`- ${group.name} (${group.id})`);
    });
  }
}

main()
  .catch((error) => {
    console.error("[repair-group-meta] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
