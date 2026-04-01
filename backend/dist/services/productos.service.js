"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productosService = exports.ProductosService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const types_1 = require("../types");
class ProductosService {
    async crear(dto) {
        return database_1.prisma.producto.create({ data: dto });
    }
    async listar(params) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params.estado === 'ACTIVO') {
            where.estado = 'ACTIVO';
        }
        else if (params.estado === 'INACTIVO') {
            where.estado = 'INACTIVO';
        }
        const [items, total] = await Promise.all([
            database_1.prisma.producto.findMany({
                where,
                skip,
                take: limit,
                include: { productoCliente: true },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.producto.count({ where })
        ]);
        return { items, total };
    }
    async obtenerPorId(id) {
        const producto = await database_1.prisma.producto.findUnique({
            where: { id },
            include: { productoCliente: true }
        });
        if (!producto)
            throw new types_1.AppError('Producto no encontrado', 404);
        return producto;
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        return database_1.prisma.producto.update({ where: { id }, data: dto });
    }
    async inactivar(id) {
        const producto = await this.obtenerPorId(id);
        const pedidosActivos = await database_1.prisma.pedidoProducto.count({
            where: {
                productoId: id,
                pedido: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
            },
        });
        if (pedidosActivos > 0) {
            throw new types_1.AppError('No se puede inactivar: el producto tiene pedidos activos', 409);
        }
        return database_1.prisma.producto.update({
            where: { id },
            data: { estado: client_1.EstadoProducto.INACTIVO },
        });
    }
    async activar(id) {
        const producto = await this.obtenerPorId(id);
        return database_1.prisma.producto.update({
            where: { id },
            data: { estado: client_1.EstadoProducto.ACTIVO },
        });
    }
    async eliminar(id) {
        return this.inactivar(id);
    }
}
exports.ProductosService = ProductosService;
exports.productosService = new ProductosService();
//# sourceMappingURL=productos.service.js.map