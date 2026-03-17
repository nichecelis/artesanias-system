"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoradorasService = exports.DecoradorasService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const response_1 = require("../utils/response");
const INCLUDE_BASE = {
    grupo: { select: { id: true, nombre: true, tipo: true } },
    _count: { select: { decoraciones: true, prestamos: true } },
    prestamos: { where: { saldo: { gt: 0 } }, select: { saldo: true } },
};
class DecoradorasService {
    async crear(dto) {
        const existe = await database_1.prisma.decoradora.findUnique({ where: { documento: dto.documento.trim() } });
        if (existe)
            throw new types_1.AppError(409, 'Ya existe una decoradora con ese documento');
        const { grupoId, ...rest } = dto;
        const data = { ...rest, documento: dto.documento.trim() };
        if (grupoId)
            data.grupo = { connect: { id: grupoId } };
        return database_1.prisma.decoradora.create({ data });
    }
    async listar(params) {
        const where = {};
        if (params.search) {
            where.OR = [
                { nombre: { contains: params.search, mode: 'insensitive' } },
                { documento: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.decoradora.findMany({
                where,
                skip: (0, response_1.getPrismaSkip)(params),
                take: params.limit,
                orderBy: { [params.sortBy ?? 'nombre']: params.sortOrder },
                include: INCLUDE_BASE,
            }),
            database_1.prisma.decoradora.count({ where }),
        ]);
        const itemsConDeuda = items.map((d) => ({
            ...d,
            deudaTotal: d.prestamos.reduce((acc, p) => acc + Number(p.saldo), 0),
        }));
        return { items: itemsConDeuda, total };
    }
    async obtenerPorId(id) {
        const decoradora = await database_1.prisma.decoradora.findUnique({
            where: { id },
            include: {
                grupo: { select: { id: true, nombre: true, tipo: true } },
                decoraciones: {
                    orderBy: { fechaEgreso: 'desc' },
                    take: 20,
                    include: {
                        pedido: { select: { codigo: true } },
                        producto: { select: { nombre: true } },
                    },
                },
                prestamos: {
                    orderBy: { fecha: 'desc' },
                    include: { abonos: { orderBy: { fecha: 'desc' } } },
                },
            },
        });
        if (!decoradora)
            throw new types_1.AppError(404, 'Decoradora no encontrada');
        return decoradora;
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        const { grupoId, ...rest } = dto;
        const data = { ...rest };
        if (grupoId !== undefined) {
            data.grupo = grupoId ? { connect: { id: grupoId } } : { disconnect: true };
        }
        return database_1.prisma.decoradora.update({ where: { id }, data });
    }
    async resumenPagos(id) {
        await this.obtenerPorId(id);
        const [pendientes, totalPagado, prestamosActivos] = await database_1.prisma.$transaction([
            database_1.prisma.decoracion.findMany({
                where: { decoradoraId: id, pagado: false, fechaIngreso: { not: null } },
                select: {
                    id: true, totalPagar: true, fechaIngreso: true,
                    pedido: { select: { codigo: true } },
                    producto: { select: { nombre: true } },
                },
            }),
            database_1.prisma.decoracion.aggregate({
                where: { decoradoraId: id, pagado: true },
                _sum: { totalPagar: true },
            }),
            database_1.prisma.prestamo.findMany({
                where: { decoradoraId: id, saldo: { gt: 0 } },
                select: { saldo: true },
            }),
        ]);
        const totalPendiente = pendientes.reduce((acc, d) => acc + Number(d.totalPagar), 0);
        const deudaTotal = prestamosActivos.reduce((acc, p) => acc + Number(p.saldo), 0);
        return {
            decoraciones: pendientes,
            totalPendiente,
            totalPagado: totalPagado._sum.totalPagar ?? 0,
            deudaTotal,
        };
    }
}
exports.DecoradorasService = DecoradorasService;
exports.decoradorasService = new DecoradorasService();
//# sourceMappingURL=decoradoras.service.js.map