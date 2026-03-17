"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gruposService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
exports.gruposService = {
    listar: async (params) => {
        const page = params.page ?? 1;
        const limit = params.limit ?? 50;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            database_1.prisma.grupo.findMany({
                where: { activo: true },
                include: { _count: { select: { decoradoras: true } } },
                orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
                skip,
                take: limit,
            }),
            database_1.prisma.grupo.count({ where: { activo: true } }),
        ]);
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },
    obtener: async (id) => {
        const grupo = await database_1.prisma.grupo.findUnique({
            where: { id },
            include: {
                decoradoras: { where: { activa: true }, select: { id: true, nombre: true, documento: true } },
                _count: { select: { decoradoras: true } },
            },
        });
        if (!grupo)
            throw new types_1.AppError('Grupo no encontrado', 404);
        return grupo;
    },
    crear: async (data) => {
        return database_1.prisma.grupo.create({ data });
    },
    actualizar: async (id, data) => {
        await exports.gruposService.obtener(id);
        return database_1.prisma.grupo.update({ where: { id }, data });
    },
    eliminar: async (id) => {
        const grupo = await exports.gruposService.obtener(id);
        const count = await database_1.prisma.decoradora.count({ where: { grupoId: id, activa: true } });
        if (count > 0)
            throw new types_1.AppError(`No se puede eliminar: tiene ${count} decoradora(s) activa(s)`, 400);
        return database_1.prisma.grupo.update({ where: { id }, data: { activo: false } });
    },
};
//# sourceMappingURL=grupos.service.js.map