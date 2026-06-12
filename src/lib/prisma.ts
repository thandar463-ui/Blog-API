import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { info } from "node:console";
const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });


export const prisma = new PrismaClient({
    adapter: adapter,
    log: ['query', 'info', 'warn', 'error'],
});