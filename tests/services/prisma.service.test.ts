import { afterEach, describe, expect, test } from "bun:test";
import { getPrisma } from "@/api/service/prisma";
import type { PrismaClient } from "@/generated/prisma/client";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
let createdClients: PrismaClient[] = [];
const mutableEnv = process.env as Record<string, string | undefined>;

afterEach(async () => {
  const prisma = (globalThis as { prisma?: PrismaClient }).prisma;
  const clients = new Set(createdClients);

  if (prisma) {
    clients.add(prisma);
  }

  createdClients = [];
  delete (globalThis as { prisma?: PrismaClient }).prisma;

  try {
    await Promise.all([...clients].map((client) => client.$disconnect()));
  } finally {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    if (originalNodeEnv === undefined) {
      delete mutableEnv.NODE_ENV;
    } else {
      mutableEnv.NODE_ENV = originalNodeEnv;
    }
  }
});

describe("prisma service", () => {
  test("caches one client in production runtime", () => {
    process.env.DATABASE_URL = "postgresql://prisma:prisma@localhost:5432/prisma";
    mutableEnv.NODE_ENV = "production";

    const first = getPrisma();
    const second = getPrisma();

    createdClients = [first, second];

    expect(second).toBe(first);
  });
});
