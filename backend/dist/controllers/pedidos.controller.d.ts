import { Request, Response, NextFunction } from 'express';
export declare class PedidosController {
    obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void>;
    listar(req: Request, res: Response, next: NextFunction): Promise<void>;
    crear(req: Request, res: Response, next: NextFunction): Promise<void>;
    actualizar(req: Request, res: Response, next: NextFunction): Promise<void>;
    cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const pedidosController: PedidosController;
//# sourceMappingURL=pedidos.controller.d.ts.map