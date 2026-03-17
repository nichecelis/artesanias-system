import { Router } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../types';
// Importa tu middleware de autenticación si es necesario
// import { authorize } from '../middlewares/auth.middleware';

const preciosRouter = Router();

// Ruta: PUT /api/v1/precios/:clienteId/:productoId
preciosRouter.put('/:clienteId/:productoId', async (req, res, next) => {
  try {
    const { clienteId, productoId } = req.params;
    const { precio } = req.body;

    if (precio === undefined || precio < 0) {
      throw new AppError('El precio es obligatorio y debe ser mayor a 0', 400);
    }

    // Actualizamos o creamos el precio especial en la tabla intermedia
    const resultado = await prisma.productoCliente.upsert({
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
  } catch (error) {
    next(error);
  }
});

export default preciosRouter;
