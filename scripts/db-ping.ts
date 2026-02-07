import { prisma } from "../src/lib/prisma";

async function main() {
  const r = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log(r);
}
main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });