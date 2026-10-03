const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  const [users, labs, userCount, labCount] = await Promise.all([
    prisma.user.findMany({ select: { email: true, role: true }, take: 5 }),
    prisma.laboratory.findMany({ select: { name: true, code: true }, take: 5 }),
    prisma.user.count(),
    prisma.laboratory.count(),
  ]);

  console.log(JSON.stringify({ userCount, labCount, users, labs }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
