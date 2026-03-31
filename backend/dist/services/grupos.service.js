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
    reportePagos: async (id, fechaDesde, fechaHasta) => {
        const grupo = await database_1.prisma.grupo.findUnique({
            where: { id },
            include: {
                decoradoras: { where: { activa: true } },
            },
        });
        if (!grupo)
            throw new types_1.AppError('Grupo no encontrado', 404);
        const decoradoraIds = grupo.decoradoras.map(d => d.id);
        const where = {
            decoradoraId: { in: decoradoraIds },
            pagado: true,
        };
        if (fechaDesde || fechaHasta) {
            where.fechaPago = {};
            if (fechaDesde)
                where.fechaPago.gte = new Date(fechaDesde + 'T00:00:00.000Z');
            if (fechaHasta)
                where.fechaPago.lte = new Date(fechaHasta + 'T23:59:59.999Z');
        }
        const decoraciones = await database_1.prisma.decoracion.findMany({
            where,
            include: {
                decoradora: { select: { id: true, nombre: true, documento: true } },
                pedido: { select: { codigo: true } },
                producto: { select: { nombre: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalPagos = decoraciones.reduce((acc, d) => acc + Number(d.totalPagar), 0);
        const porcentajeResponsable = grupo.porcentajeResponsable || 0;
        const montoResponsable = totalPagos * (porcentajeResponsable / 100);
        const pagosPorDecoradora = grupo.decoradoras.map(d => {
            const decoradoraPagos = decoraciones.filter(dec => dec.decoradoraId === d.id);
            const subtotal = decoradoraPagos.reduce((acc, dec) => acc + Number(dec.totalPagar), 0);
            return {
                decoradoraId: d.id,
                decoradoraNombre: d.nombre,
                decoradoraDocumento: d.documento,
                cantidadDecoraciones: decoradoraPagos.length,
                subtotal,
            };
        });
        return {
            grupo: {
                id: grupo.id,
                nombre: grupo.nombre,
                tipo: grupo.tipo,
                responsable: grupo.responsable,
                porcentajeResponsable: grupo.porcentajeResponsable,
            },
            resumen: {
                totalPagos,
                cantidadDecoraciones: decoraciones.length,
                montoResponsable,
                porcentajeResponsable,
            },
            pagosPorDecoradora,
            detalle: decoraciones,
        };
    },
};
//# sourceMappingURL=grupos.service.js.map