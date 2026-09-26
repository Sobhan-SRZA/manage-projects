import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

export const prisma = new PrismaClient({ adapter });