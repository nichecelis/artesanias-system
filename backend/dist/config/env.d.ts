declare const defaultEnv: {
    NODE_ENV: "test";
    PORT: number;
    API_PREFIX: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    REDIS_URL: string;
    REDIS_PREFIX: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    CORS_ORIGINS: string;
    BCRYPT_ROUNDS: number;
    LOG_LEVEL: string;
};
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    API_PREFIX: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    REDIS_URL: string;
    REDIS_PREFIX: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX: number;
    CORS_ORIGINS: string;
    BCRYPT_ROUNDS: number;
    LOG_LEVEL: string;
};
export type Env = typeof defaultEnv;
export {};
//# sourceMappingURL=env.d.ts.map