"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const types_1 = require("../types");
// Importa tu middleware de autenticación si es necesario
// import { authorize } from '../middlewares/auth.middleware';
const preciosRouter = (0, express_1.Router)();
// Ruta: PUT /api/v1/precios/:clienteId/:productoId
preciosRouter.put('/:clienteId/:productoId', async (req, res, next) => {
    try {
        const { clienteId, productoId } = req.params;
        const { precio } = req.body;
        if (precio === undefined || precio < 0) {
            throw new types_1.AppError('El precio es obligatorio y debe ser mayor a 0', 400);
        }
        // Actualizamos o creamos el precio especial en la tabla intermedia
        const resultado = await database_1.prisma.productoCliente.upsert({
            where: {
                productoId_clienteId: {
                    clienteId,
                    productoId
                }
            },
            update: { precioVenta: precio },
            create: {
                clienteId,
                productoId,
                precioVenta: precio
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
exports.default = preciosRouter;
//# sourceMappingURL=precios.routes.js.map