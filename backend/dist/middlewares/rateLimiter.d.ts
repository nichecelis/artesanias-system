import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function requestLogger(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=rateLimiter.d.ts.map