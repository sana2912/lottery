import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function getPrisma() {
  const prisma = globalForPrisma.prisma ?? createPrismaClient();

  globalForPrisma.prisma = prisma;

  return prisma;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const adapter = new PrismaPg({ connectionString });
  console.time("prisma.create client");

  try {
    return new PrismaClient({ adapter });
  } finally {
    console.timeEnd("prisma.create client");
  }
}
