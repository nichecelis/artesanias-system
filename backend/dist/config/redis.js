"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisKeys = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    keyPrefix: env_1.env.REDIS_PREFIX,
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        logger_1.logger.warn(`Redis reconectando... intento ${times}`);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
});
exports.redis.on('connect', () => logger_1.logger.info('Redis: conectando...'));
exports.redis.on('ready', () => logger_1.logger.info('Redis: listo'));
exports.redis.on('error', (err) => logger_1.logger.error('Redis error:', err));
exports.redis.on('close', () => logger_1.logger.warn('Redis: conexión cerrada'));
// Helpers tipados para tokens
exports.redisKeys = {
    refreshToken: (userId, tokenId) => `refresh:${userId}:${tokenId}`,
    blacklistToken: (jti) => `blacklist:${jti}`,
    rateLimit: (ip) => `ratelimit:${ip}`,
    resetCode: (correo) => `reset:${correo}`,
};
//# sourceMappingURL=redis.js.map