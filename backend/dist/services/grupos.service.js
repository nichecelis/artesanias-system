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
        const where = {};
        if (params.activo === true || params.activo === 'true') {
            where.activo = true;
        }
        else if (params.activo === false || params.activo === 'false') {
            where.activo = false;
        }
        const [data, total] = await Promise.all([
            database_1.prisma.grupo.findMany({
                where,
                include: { _count: { select: { decoradoras: true } } },
                orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
                skip,
                take: limit,
            }),
            database_1.prisma.grupo.count({ where }),
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
        return database_1.prisma.$transaction(async (tx) => {
            const grupo = await tx.grupo.create({ data });
            if (data.responsable) {
                await tx.decoradora.updateMany({
                    where: { documento: data.responsable },
                    data: { grupoId: grupo.id },
                });
            }
            return grupo;
        });
    },
    actualizar: async (id, data) => {
        const grupoActual = await exports.gruposService.obtener(id);
        return database_1.prisma.$transaction(async (tx) => {
            const grupo = await tx.grupo.update({ where: { id }, data });
            if (data.responsable !== undefined) {
                if (grupoActual.responsable) {
                    await tx.decoradora.updateMany({
                        where: { documento: grupoActual.responsable },
                        data: { grupoId: null },
                    });
                }
                if (data.responsable) {
                    await tx.decoradora.updateMany({
                        where: { documento: data.responsable },
                        data: { grupoId: id },
                    });
                }
            }
            return grupo;
        });
    },
    eliminar: async (id) => {
        const grupo = await exports.gruposService.obtener(id);
        const count = await database_1.prisma.decoradora.count({ where: { grupoId: id, activa: true } });
        if (count > 0)
            throw new types_1.AppError(`No se puede eliminar: tiene ${count} decoradora(s) activa(s)`, 400);
        return database_1.prisma.grupo.update({ where: { id }, data: { activo: false } });
    },
    inactivar: async (id) => {
        const grupo = await exports.gruposService.obtener(id);
        const decoradorasActivas = await database_1.prisma.decoradora.count({
            where: { grupoId: id, activa: true },
        });
        if (decoradorasActivas > 0) {
            throw new types_1.AppError('No se puede inactivar: el grupo tiene decoradoras activas', 409);
        }
        return database_1.prisma.grupo.update({ where: { id }, data: { activo: false } });
    },
    activar: async (id) => {
        await exports.gruposService.obtener(id);
        return database_1.prisma.grupo.update({ where: { id }, data: { activo: true } });
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