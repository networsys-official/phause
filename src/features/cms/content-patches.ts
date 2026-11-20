import { prisma } from "@/infrastructure/database/prisma";

const PATCHES = [
  { id: "20261120-01-aware-spacing", old: "Strengthen. Aware.Defend.", new: "Strengthen. Aware. Defend." },
] as const;

function replaceJsonValue(value: unknown, patch: (typeof PATCHES)[number]): unknown {
  if (typeof value === "string") return value === patch.old ? patch.new : value;
  if (Array.isArray(value)) return value.map((item) => replaceJsonValue(item, patch));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceJsonValue(item, patch)]));
  }
  return value;
}

export async function applyContentPatches() {
  for (const patch of PATCHES) {
    await prisma.$transaction(async (tx) => {
      const blocks = await tx.pageBlock.findMany({ where: { deletedAt: null } });
      for (const block of blocks) {
        const nextProps = replaceJsonValue(block.props, patch);
        if (JSON.stringify(nextProps) !== JSON.stringify(block.props)) {
          await tx.pageBlock.update({ where: { id: block.id }, data: { props: nextProps as never } });
        }
      }

      await tx.seo.updateMany({ where: { title: patch.old }, data: { title: patch.new } });
      await tx.seo.updateMany({ where: { description: patch.old }, data: { description: patch.new } });
      await tx.setting.updateMany({ where: { value: patch.old }, data: { value: patch.new } });
      await tx.footer.updateMany({ where: { title: patch.old }, data: { title: patch.new } });
      await tx.footer.updateMany({ where: { copyright: patch.old }, data: { copyright: patch.new } });
      await tx.footer.updateMany({ where: { description: patch.old }, data: { description: patch.new } });
      await tx.navigation.updateMany({ where: { label: patch.old }, data: { label: patch.new } });
      await tx.navigationItem.updateMany({ where: { label: patch.old }, data: { label: patch.new } });

      await tx.contentPatch.upsert({ where: { id: patch.id }, update: {}, create: { id: patch.id } });
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
