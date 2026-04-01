"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const database_1 = require("../config/database");
const response_1 = require("../utils/response");
const salesForecast_service_1 = require("../services/salesForecast.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'));
const rangoFechasSchema = zod_1.z.object({
    desde: zod_1.z.coerce.date(),
    hasta: zod_1.z.coerce.date(),
});
// Reporte: ventas por cliente en rango de fechas
router.get('/ventas-por-cliente', async (req, res, next) => {
    try {
        const { desde, hasta } = rangoFechasSchema.parse(req.query);
        const pedidos = await database_1.prisma.pedido.findMany({
            where: { createdAt: { gte: desde, lte: hasta } },
            select: {
                clienteId: true,
                productos: {
                    select: {
                        cantidadPedido: true,
                        cantidadDespacho: true,
                    }
                }
            },
        });
        const clienteIds = [...new Set(pedidos.map((p) => p.clienteId))];
        const clientes = await database_1.prisma.cliente.findMany({
            where: { id: { in: clienteIds } },
            select: { id: true, nombre: true },
        });
        const clienteMap = new Map(clientes.map((c) => [c.id, c.nombre]));
        const result = clienteIds.map((clienteId) => {
            const clientePedidos = pedidos.filter((p) => p.clienteId === clienteId);
            const totalPedido = clientePedidos.reduce((acc, p) => acc + p.productos.reduce((a, pp) => a + pp.cantidadPedido, 0), 0);
            const totalDespachado = clientePedidos.reduce((acc, p) => acc + p.productos.reduce((a, pp) => a + (pp.cantidadDespacho || 0), 0), 0);
            return {
                clienteId,
                clienteNombre: clienteMap.get(clienteId) ?? 'Desconocido',
                cantidadPedidos: clientePedidos.length,
                _sum: { cantidadPedido: totalPedido, cantidadDespacho: totalDespachado },
            };
        });
        (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
});
// Reporte: pedidos activos con estado
router.get('/pedidos-activos', async (_req, res, next) => {
    try {
        const pedidos = await database_1.prisma.pedido.findMany({
            where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
            include: { cliente: { select: { nombre: true } } },
            orderBy: { createdAt: 'desc' },
        });
        const porEstado = await database_1.prisma.pedido.groupBy({
            by: ['estado'],
            where: { estado: { notIn: ['DESPACHADO', 'CANCELADO'] } },
            _count: { id: true },
        });
        (0, response_1.sendSuccess)(res, { porEstado, pedidos });
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
        const nominas = data.map((n) => ({
            id: n.id,
            empleadoId: n.empleadoId,
            empleado: n.empleado,
            fecha: n.fecha,
            diasTrabajados: n.diasTrabajados,
            salarioDia: Number(n.salarioDia),
            subtotalDias: Number(n.subtotalDias),
            horasExtras: Number(n.horasExtras),
            valorHoraExtra: Number(n.valorHoraExtra),
            subtotalHoras: Number(n.subtotalHoras),
            totalDevengado: Number(n.subtotalDias) + Number(n.subtotalHoras),
            abonosPrestamo: Number(n.abonosPrestamo),
            descuentos: Number(n.abonosPrestamo),
            totalPagar: Number(n.totalPagar),
            totalNeto: Number(n.totalPagar),
            observaciones: n.observaciones,
        }));
        const totales = nominas.reduce((acc, n) => ({
            totalDevengado: acc.totalDevengado + n.totalDevengado,
            totalDescuentos: acc.totalDescuentos + n.descuentos,
            totalNeto: acc.totalNeto + n.totalNeto,
        }), { totalDevengado: 0, totalDescuentos: 0, totalNeto: 0 });
        (0, response_1.sendSuccess)(res, { nominas, totales, mes });
    }
    catch (error) {
        next(error);
    }
});
// Predicción de ventas con ML
router.get('/prediccion-ventas', async (req, res, next) => {
    try {
        const months = parseInt(String(req.query.meses || '3'), 10);
        const result = await salesForecast_service_1.salesForecastService.predict(Math.min(months, 12));
        (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
});
router.get('/prediccion-productos', async (req, res, next) => {
    try {
        const months = parseInt(String(req.query.meses || '3'), 10);
        const result = await salesForecast_service_1.salesForecastService.predictByProduct(Math.min(months, 6));
        (0, response_1.sendSuccess)(res, result);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=reportes.routes.js.map