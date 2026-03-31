"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productoClientesService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
exports.productoClientesService = {
    listarPorProducto: async (productoId) => {
        return database_1.prisma.productoCliente.findMany({
            where: { productoId },
            include: { cliente: { select: { id: true, nombre: true, documento: true } } },
            orderBy: { cliente: { nombre: 'asc' } },
        });
    },
    listarPorCliente: async (clienteId) => {
        return database_1.prisma.productoCliente.findMany({
            where: { clienteId },
            include: { producto: { select: { id: true, nombre: true, precioVenta: true } } },
            orderBy: { producto: { nombre: 'asc' } },
        });
    },
    upsert: async (productoId, clienteId, precioVenta) => {
        return database_1.prisma.productoCliente.upsert({
            where: { productoId_clienteId: { productoId, clienteId } },
            create: { productoId, clienteId, precioVenta },
            update: { precioVenta },
            include: { cliente: { select: { id: true, nombre: true } } },
        });
    },
    eliminar: async (productoId, clienteId) => {
        const existe = await database_1.prisma.productoCliente.findUnique({
            where: { productoId_clienteId: { productoId, clienteId } },
        });
        if (!existe)
            throw new types_1.AppError('Precio no encontrado', 404);
        return database_1.prisma.productoCliente.delete({
            where: { productoId_clienteId: { productoId, clienteId } },
        });
    },
};
//# sourceMappingURL=producto-clientes.service.js.map