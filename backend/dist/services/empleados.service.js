"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nominaService = exports.empleadosService = exports.NominaService = exports.EmpleadosService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const response_1 = require("../utils/response");
class EmpleadosService {
    async crear(dto) {
        const existe = await database_1.prisma.empleado.findUnique({ where: { documento: dto.documento.trim() } });
        if (existe)
            throw new types_1.AppError(409, 'Ya existe un empleado con ese documento');
        return database_1.prisma.empleado.create({ data: { ...dto, documento: dto.documento.trim() } });
    }
    async listar(params) {
        const where = params.search ? {
            OR: [
                { nombre: { contains: params.search, mode: 'insensitive' } },
                { documento: { contains: params.search, mode: 'insensitive' } },
            ],
        } : {};
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.empleado.findMany({ where, skip: (0, response_1.getPrismaSkip)(params), take: params.limit, orderBy: { nombre: 'asc' } }),
            database_1.prisma.empleado.count({ where }),
        ]);
        return { items, total };
    }
    async obtenerPorId(id) {
        const empleado = await database_1.prisma.empleado.findUnique({
            where: { id },
            include: { nominas: { orderBy: { fecha: 'desc' }, take: 12 } },
        });
        if (!empleado)
            throw new types_1.AppError(404, 'Empleado no encontrado');
        return empleado;
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        return database_1.prisma.empleado.update({ where: { id }, data: dto });
    }
}
exports.EmpleadosService = EmpleadosService;
const INCLUDE_NOMINA = {
    empleado: { select: { id: true, nombre: true, salario: true } },
    prestamo: { select: { id: true, monto: true, saldo: true } },
};
function calcularNomina(salario, diasTrabajados, horasExtras, abonosPrestamo) {
    const salarioDia = salario / 30;
    const subtotalDias = salarioDia * diasTrabajados;
    const valorHoraExtra = salario / 30 / 9; // sueldo ÷ 30 ÷ 9
    const subtotalHoras = valorHoraExtra * horasExtras;
    const totalPagar = subtotalDias + subtotalHoras - abonosPrestamo;
    return {
        salarioDia: Math.round(salarioDia * 100) / 100,
        subtotalDias: Math.round(subtotalDias * 100) / 100,
        valorHoraExtra: Math.round(valorHoraExtra * 100) / 100,
        subtotalHoras: Math.round(subtotalHoras * 100) / 100,
        totalPagar: Math.round(totalPagar * 100) / 100,
    };
}
class NominaService {
    async registrar(dto) {
        const empleado = await database_1.prisma.empleado.findUnique({ where: { id: dto.empleadoId } });
        if (!empleado || !empleado.activo)
            throw new types_1.AppError(404, 'Empleado no encontrado');
        const horasExtras = dto.horasExtras ?? 0;
        const abonosPrestamo = dto.abonosPrestamo ?? 0;
        // Validar préstamo si se especifica
        if (dto.prestamoId) {
            const prestamo = await database_1.prisma.prestamo.findUnique({ where: { id: dto.prestamoId } });
            if (!prestamo)
                throw new types_1.AppError(404, 'Préstamo no encontrado');
            if (abonosPrestamo > Number(prestamo.saldo))
                throw new types_1.AppError(400, `El abono supera el saldo del préstamo ($${prestamo.saldo})`);
        }
        const calc = calcularNomina(Number(empleado.salario), dto.diasTrabajados, horasExtras, abonosPrestamo);
        return database_1.prisma.$transaction(async (tx) => {
            // Descontar abono del préstamo si aplica
            if (dto.prestamoId && abonosPrestamo > 0) {
                await tx.prestamo.update({
                    where: { id: dto.prestamoId },
                    data: { saldo: { decrement: abonosPrestamo } },
                });
            }
            return tx.nomina.create({
                data: {
                    empleadoId: dto.empleadoId,
                    prestamoId: dto.prestamoId ?? null,
                    fecha: (() => { const d = new Date(dto.fecha); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); })(),
                    diasTrabajados: dto.diasTrabajados,
                    horasExtras,
                    abonosPrestamo,
                    observaciones: dto.observaciones,
                    ...calc,
                },
                include: INCLUDE_NOMINA,
            });
        });
    }
    async actualizar(id, dto) {
        const nomina = await database_1.prisma.nomina.findUnique({ where: { id }, include: { empleado: true } });
        if (!nomina)
            throw new types_1.AppError(404, 'Registro de nómina no encontrado');
        const horasExtras = dto.horasExtras ?? Number(nomina.horasExtras);
        const abonoNuevo = dto.abonosPrestamo ?? Number(nomina.abonosPrestamo);
        const abonoAnterior = Number(nomina.abonosPrestamo);
        const prestamoNuevo = dto.prestamoId !== undefined ? dto.prestamoId : nomina.prestamoId;
        const calc = calcularNomina(Number(nomina.empleado.salario), dto.diasTrabajados ?? nomina.diasTrabajados, horasExtras, abonoNuevo);
        return database_1.prisma.$transaction(async (tx) => {
            // Revertir abono anterior
            if (nomina.prestamoId && abonoAnterior > 0) {
                await tx.prestamo.update({ where: { id: nomina.prestamoId }, data: { saldo: { increment: abonoAnterior } } });
            }
            // Aplicar nuevo abono
            if (prestamoNuevo && abonoNuevo > 0) {
                const p = await tx.prestamo.findUnique({ where: { id: prestamoNuevo } });
                const saldoBase = nomina.prestamoId === prestamoNuevo ? Number(p.saldo) + abonoAnterior : Number(p.saldo);
                if (abonoNuevo > saldoBase)
                    throw new types_1.AppError(400, `El abono supera el saldo ($${saldoBase})`);
                await tx.prestamo.update({ where: { id: prestamoNuevo }, data: { saldo: { decrement: abonoNuevo } } });
            }
            return tx.nomina.update({
                where: { id },
                data: {
                    ...(dto.fecha ? { fecha: (() => { const d = new Date(dto.fecha); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); })() } : {}),
                    diasTrabajados: dto.diasTrabajados ?? nomina.diasTrabajados,
                    horasExtras,
                    abonosPrestamo: abonoNuevo,
                    prestamoId: prestamoNuevo,
                    observaciones: dto.observaciones,
                    ...calc,
                },
                include: INCLUDE_NOMINA,
            });
        });
    }
    async eliminar(id) {
        const nomina = await database_1.prisma.nomina.findUnique({ where: { id } });
        if (!nomina)
            throw new types_1.AppError(404, 'Registro de nómina no encontrado');
        return database_1.prisma.$transaction(async (tx) => {
            // Revertir abono si tenía
            if (nomina.prestamoId && Number(nomina.abonosPrestamo) > 0) {
                await tx.prestamo.update({ where: { id: nomina.prestamoId }, data: { saldo: { increment: Number(nomina.abonosPrestamo) } } });
            }
            return tx.nomina.delete({ where: { id } });
        });
    }
    async listar(params) {
        const where = {};
        if (params.empleadoId)
            where.empleadoId = params.empleadoId;
        if (params.mes) {
            const [year, month] = params.mes.split('-').map(Number);
            where.fecha = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
        }
        if (params.search) {
            where.empleado = { nombre: { contains: params.search, mode: 'insensitive' } };
        }
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.nomina.findMany({
                where, skip: (0, response_1.getPrismaSkip)(params), take: params.limit,
                orderBy: { fecha: 'desc' },
                include: INCLUDE_NOMINA,
            }),
            database_1.prisma.nomina.count({ where }),
        ]);
        return { items, total };
    }
    async totalMes(mes) {
        const [year, month] = mes.split('-').map(Number);
        const resultado = await database_1.prisma.nomina.aggregate({
            where: { fecha: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
            _sum: { totalPagar: true },
            _count: { id: true },
        });
        return { totalNomina: resultado._sum.totalPagar ?? 0, registros: resultado._count.id };
    }
}
exports.NominaService = NominaService;
exports.empleadosService = new EmpleadosService();
exports.nominaService = new NominaService();
//# sourceMappingURL=empleados.service.js.map