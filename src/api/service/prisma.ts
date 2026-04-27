import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientWithoutOptions = new () => PrismaClient;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export function getPrisma() {
  const prisma =
    globalForPrisma.prisma ?? new (PrismaClient as unknown as PrismaClientWithoutOptions)();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
