"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuariosService = exports.UsuariosService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const types_1 = require("../types");
const response_1 = require("../utils/response");
class UsuariosService {
    async listar(params) {
        const where = {};
        if (params.search) {
            where.OR = [
                { nombre: { contains: params.search, mode: 'insensitive' } },
                { correo: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.usuario.findMany({
                where,
                skip: (0, response_1.getPrismaSkip)(params),
                take: params.limit,
                orderBy: { nombre: 'asc' },
                select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
            }),
            database_1.prisma.usuario.count({ where }),
        ]);
        return { items, total };
    }
    async obtenerPorId(id) {
        const u = await database_1.prisma.usuario.findUnique({
            where: { id },
            select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
        });
        if (!u)
            throw new types_1.AppError('Usuario no encontrado', 404);
        return u;
    }
    async obtenerPorCorreo(correo) {
        const u = await database_1.prisma.usuario.findUnique({
            where: { correo: correo.toLowerCase() },
            select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
        });
        if (!u)
            throw new types_1.AppError('Usuario no encontrado', 404);
        return u;
    }
    async crear(dto) {
        const existe = await database_1.prisma.usuario.findUnique({ where: { correo: dto.correo.toLowerCase() } });
        if (existe)
            throw new types_1.AppError('Ya existe un usuario con ese correo', 409);
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
        return database_1.prisma.usuario.create({
            data: { nombre: dto.nombre, correo: dto.correo.toLowerCase(), passwordHash, rol: dto.rol },
            select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
        });
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        if (dto.correo) {
            const existe = await database_1.prisma.usuario.findFirst({ where: { correo: dto.correo.toLowerCase(), NOT: { id } } });
            if (existe)
                throw new types_1.AppError('Ese correo ya está en uso', 409);
        }
        return database_1.prisma.usuario.update({
            where: { id },
            data: { ...dto, correo: dto.correo?.toLowerCase() },
            select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
        });
    }
    async actualizarPorCorreo(correo, dto) {
        const usuario = await this.obtenerPorCorreo(correo);
        const updateData = {};
        if (dto.nombre !== undefined) {
            updateData.nombre = dto.nombre;
        }
        if (dto.rol !== undefined) {
            updateData.rol = dto.rol;
        }
        if (dto.password !== undefined) {
            updateData.passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
        }
        if (Object.keys(updateData).length === 0) {
            throw new types_1.AppError('No se proporcionaron datos para actualizar', 400);
        }
        return database_1.prisma.usuario.update({
            where: { correo: correo.toLowerCase() },
            data: updateData,
            select: { id: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true },
        });
    }
    async cambiarPassword(id, nuevaPassword) {
        await this.obtenerPorId(id);
        const passwordHash = await bcryptjs_1.default.hash(nuevaPassword, 12);
        return database_1.prisma.usuario.update({
            where: { id },
            data: { passwordHash },
            select: { id: true, nombre: true, correo: true },
        });
    }
    async eliminar(id) {
        await this.obtenerPorId(id);
        return database_1.prisma.usuario.update({
            where: { id },
            data: { activo: false },
            select: { id: true, nombre: true, activo: true },
        });
    }
}
exports.UsuariosService = UsuariosService;
exports.usuariosService = new UsuariosService();
//# sourceMappingURL=usuarios.service.js.map