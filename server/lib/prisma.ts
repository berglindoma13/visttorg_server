import { PrismaClient } from '@prisma/client'


declare module NodeJS {
  interface Global {
    prisma: PrismaClient;
  }
}

// Prevent multiple instances of Prisma Client in development
declare const global: NodeJS.Global

const prismaInstance = global.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') { global.prisma = prismaInstance }

export { prismaInstance }