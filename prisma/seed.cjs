const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Standard-Fächer
  const subjects = [
    "Mathematik",
    "Englisch",
    "Deutsch",
    "Biologie",
    "Physik",
    "Chemie",
    "Informatik",
    "Elektrotechnik",
    "Geschichte",
    "Geographie",
    "Französisch",
    "Spanisch",
    "BWL",
    "Recht",
    "Musik",
    "Kunst",
    "Sport",
    "Statistik",
    "Programmieren",
    "Wirtschaftsinformatik",
  ];

  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("✅ Subjects seeded.");

  console.log("🌱 Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
