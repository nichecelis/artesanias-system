import Redis from 'ioredis';
export declare const redis: Redis;
export declare const redisKeys: {
    refreshToken: (userId: string, tokenId: string) => string;
    blacklistToken: (jti: string) => string;
    rateLimit: (ip: string) => string;
    resetCode: (correo: string) => string;
};
//# sourceMappingURL=redis.d.ts.map