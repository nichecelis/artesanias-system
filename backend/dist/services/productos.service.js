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
        const [items, total] = await Promise.all([
            database_1.prisma.producto.findMany({
                where: { estado: 'ACTIVO' }, // 👈 FILTRO CLAVE
                skip,
                take: limit,
                include: { productoCliente: true },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.producto.count({
                where: { estado: 'ACTIVO' } // 👈 IMPORTANTE también aquí
            })
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
    async eliminar(id) {
        await this.obtenerPorId(id);
        const decoracionesActivas = await database_1.prisma.decoracion.count({
            where: { productoId: id, fechaIngreso: null },
        });
        if (decoracionesActivas > 0) {
            throw new types_1.AppError('No se puede eliminar: el producto tiene decoraciones activas', 409);
        }
        return database_1.prisma.producto.update({
            where: { id },
            data: { estado: client_1.EstadoProducto.INACTIVO },
        });
    }
}
exports.ProductosService = ProductosService;
exports.productosService = new ProductosService();
//# sourceMappingURL=productos.service.js.map