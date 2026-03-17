"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosController = void 0;
const pedidos_service_1 = require("../services/pedidos.service");
class PedidosController {
    constructor() {
        this.pedidosService = new pedidos_service_1.PedidosService();
    }
    async listar(req, res) {
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
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.PedidosController = PedidosController;
//# sourceMappingURL=pedidos.controller.js.map