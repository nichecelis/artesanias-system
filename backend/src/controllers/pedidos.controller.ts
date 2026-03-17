import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidos.service';

export class PedidosController {
  private pedidosService: PedidosService;

  constructor() {
    this.pedidosService = new PedidosService();
  }
  async listar(req: Request, res: Response) {
    try {
        const { fechaDesde, fechaHasta, busqueda, page, limit, estado } = req.query;
        
        const pedidos = await this.pedidosService.listar({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            search: busqueda ? String(busqueda) : undefined,
            estado: estado ? String(estado) : undefined,
            fechaDesde: fechaDesde ? String(fechaDesde) : undefined,
            fechaHasta: fechaHasta ? String(fechaHasta) : undefined,
        });
        
        return res.json({
            success: true,
            data: pedidos // Retorna el objeto { data, meta } del servicio
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
  }
}
