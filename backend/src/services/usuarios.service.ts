import bcrypt from 'bcryptjs';
import { Rol } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginationParams, PaginatedResult } from '../types';
import { getPrismaSkip } from '../utils/response';

export class UsuariosService {

  async listar(params: PaginationParams & { activo?: boolean | string }): Promise<PaginatedResult<any>> {
    const where: any = {};
    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { correo: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.activo === true || params.activo === 'true') {
      where.activo = true;
    } else if (params.activo === false || params.activo === 'false') {
      where.activo = false;
    }
    const [items, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { nombre: 'asc' },
        select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
      }),
      prisma.usuario.count({ where }),
    ]);
    return { items, total };
  }

  async obtenerPorId(id: string) {
    const u = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
    if (!u) throw new AppError('Usuario no encontrado', 404);
    return u;
  }

  async obtenerPorCorreo(correo: string) {
    const u = await prisma.usuario.findUnique({
      where: { correo: correo.toLowerCase() },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
    if (!u) throw new AppError('Usuario no encontrado', 404);
    return u;
  }

  async crear(dto: { nombre: string; correo: string; password: string; rol: Rol }) {
    const existe = await prisma.usuario.findUnique({ where: { correo: dto.correo.toLowerCase() } });
    if (existe) throw new AppError('Ya existe un usuario con ese correo', 409);
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return prisma.usuario.create({
      data: { nombre: dto.nombre, correo: dto.correo.toLowerCase(), passwordHash, rol: dto.rol },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
  }

  async actualizar(id: string, dto: { nombre?: string; correo?: string; rol?: Rol; activo?: boolean }) {
    await this.obtenerPorId(id);
    if (dto.correo) {
      const existe = await prisma.usuario.findFirst({ where: { correo: dto.correo.toLowerCase(), NOT: { id } } });
      if (existe) throw new AppError('Ese correo ya está en uso', 409);
    }
    return prisma.usuario.update({
      where: { id },
      data: { ...dto, correo: dto.correo?.toLowerCase() },
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
  }

  async actualizarPorCorreo(
    correo: string, 
    dto: { nombre?: string; rol?: Rol; password?: string }
  ) {
    const usuario = await this.obtenerPorCorreo(correo);
    
    const updateData: any = {};
    
    if (dto.nombre !== undefined) {
      updateData.nombre = dto.nombre;
    }
    
    if (dto.rol !== undefined) {
      updateData.rol = dto.rol;
    }
    
    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    
    if (Object.keys(updateData).length === 0) {
      throw new AppError('No se proporcionaron datos para actualizar', 400);
    }
    
    return prisma.usuario.update({
      where: { correo: correo.toLowerCase() },
      data: updateData,
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
    });
  }

  async cambiarPassword(id: string, nuevaPassword: string) {
    await this.obtenerPorId(id);
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);
    return prisma.usuario.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, nombre: true, correo: true },
    });
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    return prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: { id: true, nombre: true, activo: true },
    });
  }
}

export const usuariosService = new UsuariosService();
