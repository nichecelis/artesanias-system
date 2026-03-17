import { Request, Response, NextFunction } from 'express';
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function authorize(...allowedRoles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map