"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaInstance = void 0;
const client_1 = require("@prisma/client");
const prismaInstance = global.prisma || new client_1.PrismaClient();
exports.prismaInstance = prismaInstance;
if (process.env.NODE_ENV === 'development') {
    global.prisma = prismaInstance;
}
