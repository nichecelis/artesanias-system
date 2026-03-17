"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'VENTAS'));
const rangoFechasSchema = zod_1.z.object({
    desde: zod_1.z.coerce.date(),
    hasta: zod_1.z.coerce.date(),
});
// Reporte: ventas por cliente en rango de fechas
router.get('/ventas-por-cliente', async (req, res, next) => {
    try {
        const { desde, hasta } = rangoFechasSchema.parse(req.query);
        const data = await database_1.prisma.pedido.groupBy({
            by: ['clienteId'],
            where: { createdAt: { gte: desde, lte: hasta } },
            _count: { id: true },
            _sum: { cantidadPedido: true, cantidadDespacho: true },
        });
        // Enriquecer con nombres de clientes
        const clienteIds = data.map((d) => d.clienteId);
        const clientes = await database_1.prisma.cliente.findMany({
            where: { id: { in: clienteIds } },
            select: { id: true, nombre: true },
        });
        const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
        const result = data.map((d) => ({
            ...d,
            clienteNombre: clienteMap.get(d.clienteId) ?? 'Desconocido',
        }));
        (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
});
// Reporte: pedidos activos con estado
router.get('/pedidos-activos', async (_req, res, next) => {
    try {
        const data = await database_1.prisma.pedido.findMany({
            where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
            include: { cliente: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.sendSuccess)(res, data);
    }
    catch (error) {
        next(error);
    }
});
// Reporte: pagos pendientes a decoradoras
router.get('/pagos-decoradoras', async (_req, res, next) => {
    try {
        const data = await database_1.prisma.decoracion.findMany({
            where: { pagado: false, fechaIngreso: { not: null } },
            include: {
                decoradora: { select: { nombre: true } },
                pedido: { select: { codigo: true } },
                producto: { select: { nombre: true } },
            },
            orderBy: { fechaIngreso: 'asc' },
        });
        const totalPendiente = data.reduce((acc, d) => acc + Number(d.totalPagar), 0);
        (0, response_1.sendSuccess)(res, { decoraciones: data, totalPendiente });
    }
    catch (error) {
        next(error);
    }
});
// Reporte: nómina del mes
router.get('/nomina-mes', async (req, res, next) => {
    try {
        const { mes } = zod_1.z.object({ mes: zod_1.z.string().regex(/^\d{4}-\d{2}$/) }).parse(req.query);
        const [year, month] = mes.split('-').map(Number);
        const data = await database_1.prisma.nomina.findMany({
            where: {
                fecha: {
                    gte: new Date(year, month - 1, 1),
                    lte: new Date(year, month, 0),
                },
            },
            include: { empleado: { select: { nombre: true, salario: true } } },
            orderBy: { empleado: { nombre: 'asc' } },
        });
        const totalNomina = data.reduce((acc, n) => acc + Number(n.totalPagar), 0);
        (0, response_1.sendSuccess)(res, { nominas: data, totalNomina, mes });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=reportes.routes.js.map