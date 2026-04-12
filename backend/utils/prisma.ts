import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Forzar a Node a confiar en los certificados de Supabase si hay interceptores de red
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export { prisma };
