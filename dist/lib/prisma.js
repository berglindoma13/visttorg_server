"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prismaClientPropertyName = `__prevent-name-collision__prisma`;
const getPrismaClient = () => {
    if (process.env.NODE_ENV === `production`) {
        return new client_1.PrismaClient();
    }
    else {
        const newGlobalThis = globalThis;
        if (!newGlobalThis[prismaClientPropertyName]) {
            newGlobalThis[prismaClientPropertyName] = new client_1.PrismaClient();
        }
        return newGlobalThis[prismaClientPropertyName];
    }
};
const prismaInstance = getPrismaClient();
exports.default = prismaInstance;
