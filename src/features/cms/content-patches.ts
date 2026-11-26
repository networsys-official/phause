import { prisma } from "../../infrastructure/database/prisma";

const PATCHES = [
  { id: "20261120-01-aware-spacing" },
  { id: "20261123-01-home-navigation-href" },
] as const;

export async function applyContentPatches() {
  for (const patch of PATCHES) {
    await prisma.contentPatch.upsert({
      where: { id: patch.id },
      update: {},
      create: { id: patch.id },
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  applyContentPatches()
    .catch((error) => {
      console.error("Content patch failed:", error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
