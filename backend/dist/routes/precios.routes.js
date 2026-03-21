"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const types_1 = require("../types");
const client_1 = require("@prisma/client");
// import { authorize } from '../middlewares/auth.middleware';
const preciosRouter = (0, express_1.Router)();
// Ruta: PUT /api/v1/precios/:clienteId/:productoId
preciosRouter.put('/:clienteId/:productoId', async (req, res, next) => {
    try {
        // ✅ IDs como string (correcto para UUID)
        const { clienteId, productoId } = req.params;
        // ✅ Precio como número
        const rawPrecio = req.body.precio;
        const precio = rawPrecio !== undefined && rawPrecio !== null && rawPrecio !== ''
            ? Number(rawPrecio)
            : undefined;
        // Validaciones
        if (!clienteId || !productoId) {
            throw new types_1.AppError('clienteId y productoId son obligatorios', 400);
        }
        if (precio === undefined || isNaN(precio) || precio < 0) {
            throw new types_1.AppError('El precio es obligatorio y debe ser mayor o igual a 0', 400);
        }
        const resultado = await database_1.prisma.productoCliente.upsert({
            where: {
                productoId_clienteId: {
                    clienteId, // ✅ string
                    productoId // ✅ string
                }
            },
            update: { precioVenta: new client_1.Prisma.Decimal(precio) },
            create: {
                clienteId,
                productoId,
                precioVenta: new client_1.Prisma.Decimal(precio)
            }
        });
        res.json({
            success: true,
            message: 'Precio actualizado correctamente',
            data: resultado
        });
    }
    catch (error) {
        next(error);
    }
});
preciosRouter.get('/producto/:productoId', async (req, res, next) => {
    try {
        const { productoId } = req.params;
        const precios = await database_1.prisma.productoCliente.findMany({
            where: { productoId },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nombre: true,
                        documento: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            data: precios,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = preciosRouter;
//# sourceMappingURL=precios.routes.js.map