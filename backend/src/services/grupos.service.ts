import { prisma } from '../config/database';
import { AppError } from '../types';

export const gruposService = {
  listar: async (params: { page?: number; limit?: number }) => {
    const page  = params.page  ?? 1;
    const limit = params.limit ?? 50;
    const skip  = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.grupo.findMany({
        where: { activo: true },
        include: { _count: { select: { decoradoras: true } } },
        orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.grupo.count({ where: { activo: true } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  },

  obtener: async (id: string) => {
    const grupo = await prisma.grupo.findUnique({
      where: { id },
      include: {
        decoradoras: { where: { activa: true }, select: { id: true, nombre: true, documento: true } },
        _count: { select: { decoradoras: true } },
      },
    });
    if (!grupo) throw new AppError('Grupo no encontrado', 404);
    return grupo;
  },

  crear: async (data: {
    nombre: string;
    tipo: 'GRUPO' | 'ELITE';
    direccion?: string;
    telefono?: string;
    responsable?: string;
  }) => {
    return prisma.grupo.create({ data });
  },

  actualizar: async (id: string, data: {
    nombre?: string;
    tipo?: 'GRUPO' | 'ELITE';
    direccion?: string;
    telefono?: string;
    responsable?: string;
  }) => {
    await gruposService.obtener(id);
    return prisma.grupo.update({ where: { id }, data });
  },

  eliminar: async (id: string) => {
    const grupo = await gruposService.obtener(id);
    const count = await prisma.decoradora.count({ where: { grupoId: id, activa: true } });
    if (count > 0) throw new AppError(`No se puede eliminar: tiene ${count} decoradora(s) activa(s)`, 400);
    return prisma.grupo.update({ where: { id }, data: { activo: false } });
  },
};
