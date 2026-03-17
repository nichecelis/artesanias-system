import { Request, Response, NextFunction } from 'express';
import { pedidosService } from '../services/pedidos.service';
import { sendSuccess } from '../utils/response';

export class PedidosController {

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      console.log('📨 GET /pedidos/:id -', id);
      
      const pedido = await pedidosService.obtenerPorId(id);
      sendSuccess(res, pedido, 'Pedido obtenido correctamente', 200);
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('📨 GET /pedidos - Query:', req.query);
      
      const result = await pedidosService.listar(req.query);
      sendSuccess(res, result, 'Pedidos obtenidos correctamente', 200);
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('📨 POST /pedidos - Body:', req.body);
      
      const pedido = await pedidosService.crear(req.body);
      sendSuccess(res, pedido, 'Pedido creado correctamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      console.log('📨 PUT /pedidos/:id -', id);
      
      const pedido = await pedidosService.actualizar(id, req.body);
      sendSuccess(res, pedido, 'Pedido actualizado correctamente', 200);
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      console.log('📨 PATCH /pedidos/:id/estado -', id, estado);
      
      const pedido = await pedidosService.cambiarEstado(id, estado);
      sendSuccess(res, pedido, 'Estado del pedido actualizado', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const pedidosController = new PedidosController();