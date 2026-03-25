import { prisma } from '../config/database';

export class ParametrizacionService {
  async obtener() {
    let config = await prisma.parametrizacion.findFirst();
    if (!config) {
      config = await prisma.parametrizacion.create({
        data: { nombre: 'Mi Empresa' },
      });
    }
    return config;
  }

  async actualizar(data: { nombre?: string; nit?: string; direccion?: string; telefono?: string; logo?: string }) {
    const config = await this.obtener();
    return prisma.parametrizacion.update({
      where: { id: config.id },
      data,
    });
  }
}

export const parametrizacionService = new ParametrizacionService();