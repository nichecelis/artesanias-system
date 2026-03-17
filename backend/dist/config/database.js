"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ]
            : [{ emit: 'event', level: 'error' }],
    });
if (env_1.env.NODE_ENV === 'development') {
    // Log de queries en desarrollo
    exports.prisma.$on('query', (e) => {
        logger_1.logger.debug(`Prisma Query: ${e.query} — ${e.duration}ms`);
    });
}
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error:', e);
});
if (env_1.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=database.js.map