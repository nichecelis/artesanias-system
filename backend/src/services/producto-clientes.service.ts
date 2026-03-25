import { prisma } from '../config/database';
import { AppError } from '../types';

export const productoClientesService = {

  listarPorProducto: async (productoId: string) => {
    return prisma.productoCliente.findMany({
      where: { productoId },
      include: { cliente: { select: { id: true, nombre: true, documento: true } } },
      orderBy: { cliente: { nombre: 'asc' } },
    });
  },

  listarPorCliente: async (clienteId: string) => {
    return prisma.productoCliente.findMany({
      where: { clienteId },
      include: { producto: { select: { id: true, nombre: true, precioVenta: true } } },
      orderBy: { producto: { nombre: 'asc' } },
    });
  },

  upsert: async (productoId: string, clienteId: string, precioVenta: number) => {
    return prisma.productoCliente.upsert({
      where:  { productoId_clienteId: { productoId, clienteId } },
      create: { productoId, clienteId, precioVenta },
      update: { precioVenta },
      include: { cliente: { select: { id: true, nombre: true } } },
    });
  },

  eliminar: async (productoId: string, clienteId: string) => {
    const existe = await prisma.productoCliente.findUnique({
      where: { productoId_clienteId: { productoId, clienteId } },
    });
    if (!existe) throw new AppError('Precio no encontrado', 404);
    return prisma.productoCliente.delete({
      where: { productoId_clienteId: { productoId, clienteId } },
    });
  },
};
