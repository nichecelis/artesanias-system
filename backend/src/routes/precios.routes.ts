import { Router } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { Prisma } from '@prisma/client';
// import { authorize } from '../middlewares/auth.middleware';

const preciosRouter = Router();

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
      throw new AppError('clienteId y productoId son obligatorios', 400);
    }

    if (precio === undefined || isNaN(precio) || precio < 0) {
      throw new AppError('El precio es obligatorio y debe ser mayor o igual a 0', 400);
    }

    const resultado = await prisma.productoCliente.upsert({
      where: {
        productoId_clienteId: {
          clienteId,     // ✅ string
          productoId     // ✅ string
        }
      },
      update: { precioVenta: new Prisma.Decimal(precio) },
      create: {
        clienteId,
        productoId,
        precioVenta: new Prisma.Decimal(precio)
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

preciosRouter.get('/producto/:productoId', async (req, res, next) => {
  try {
    const { productoId } = req.params;

    const precios = await prisma.productoCliente.findMany({
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
  } catch (error) {
    next(error);
  }
});

export default preciosRouter;
