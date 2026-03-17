"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prestamosService = exports.PrestamosService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const response_1 = require("../utils/response");
const INCLUDE = {
    decoradora: { select: { id: true, nombre: true, documento: true } },
    empleado: { select: { id: true, nombre: true, documento: true } },
    abonos: { orderBy: { fecha: 'desc' } },
    _count: { select: { abonos: true } },
};
class PrestamosService {
    async crear(dto) {
        if (dto.tipo === 'DECORADORA') {
            const d = await database_1.prisma.decoradora.findUnique({ where: { id: dto.beneficiarioId } });
            if (!d || !d.activa)
                throw new types_1.AppError(404, 'Decoradora no encontrada');
        }
        else {
            const e = await database_1.prisma.empleado.findUnique({ where: { id: dto.beneficiarioId } });
            if (!e || !e.activo)
                throw new types_1.AppError(404, 'Empleado no encontrado');
        }
        return database_1.prisma.prestamo.create({
            data: {
                ...(dto.tipo === 'DECORADORA' ? { decoradoraId: dto.beneficiarioId } : { empleadoId: dto.beneficiarioId }),
                monto: dto.monto,
                fecha: new Date(dto.fecha + 'T00:00:00.000Z'),
                saldo: dto.monto,
                cuotas: dto.cuotas,
                observacion: dto.observacion,
            },
            include: INCLUDE,
        });
    }
    async listar(params) {
        const where = {};
        if (params.decoradoraId)
            where.decoradoraId = params.decoradoraId;
        if (params.empleadoId)
            where.empleadoId = params.empleadoId;
        if (params.tipo === 'DECORADORA')
            where.decoradoraId = { not: null };
        if (params.tipo === 'EMPLEADO')
            where.empleadoId = { not: null };
        if (params.soloConSaldo)
            where.saldo = { gt: 0 };
        if (params.search) {
            where.OR = [
                { decoradora: { nombre: { contains: params.search, mode: 'insensitive' } } },
                { empleado: { nombre: { contains: params.search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.prestamo.findMany({
                where,
                skip: (0, response_1.getPrismaSkip)(params),
                take: params.limit,
                orderBy: { fecha: 'desc' },
                include: INCLUDE,
            }),
            database_1.prisma.prestamo.count({ where }),
        ]);
        const itemsConAbonado = items.map((p) => ({
            ...p,
            totalAbonado: Number(p.monto) - Number(p.saldo),
        }));
        return { items: itemsConAbonado, total };
    }
    async obtenerPorId(id) {
        const p = await database_1.prisma.prestamo.findUnique({ where: { id }, include: INCLUDE });
        if (!p)
            throw new types_1.AppError(404, 'Préstamo no encontrado');
        return p;
    }
    async abonar(id, monto, fecha) {
        const prestamo = await this.obtenerPorId(id);
        if (Number(prestamo.saldo) <= 0)
            throw new types_1.AppError(400, 'El préstamo ya está saldado');
        if (monto > Number(prestamo.saldo))
            throw new types_1.AppError(400, `El abono supera el saldo (${prestamo.saldo})`);
        const nuevoSaldo = Number(prestamo.saldo) - monto;
        const [abono] = await database_1.prisma.$transaction([
            database_1.prisma.abono.create({
                data: { prestamoId: id, monto, fecha: new Date(fecha + 'T00:00:00.000Z') },
            }),
            database_1.prisma.prestamo.update({ where: { id }, data: { saldo: nuevoSaldo } }),
        ]);
        return { abono, saldo: nuevoSaldo };
    }
    async eliminarAbono(abonoId) {
        const abono = await database_1.prisma.abono.findUnique({ where: { id: abonoId }, include: { prestamo: true } });
        if (!abono)
            throw new types_1.AppError(404, 'Abono no encontrado');
        const nuevoSaldo = Number(abono.prestamo.saldo) + Number(abono.monto);
        await database_1.prisma.$transaction([
            database_1.prisma.abono.delete({ where: { id: abonoId } }),
            database_1.prisma.prestamo.update({ where: { id: abono.prestamoId }, data: { saldo: nuevoSaldo } }),
        ]);
        return { saldo: nuevoSaldo };
    }
    async eliminar(id) {
        const prestamo = await this.obtenerPorId(id);
        if (Number(prestamo.saldo) < Number(prestamo.monto))
            throw new types_1.AppError(400, 'No se puede eliminar: tiene abonos registrados');
        return database_1.prisma.prestamo.delete({ where: { id } });
    }
}
exports.PrestamosService = PrestamosService;
exports.prestamosService = new PrestamosService();
//# sourceMappingURL=prestamos.service.js.map