"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosService = exports.PedidosService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const types_1 = require("../types");
const calcularEstado_1 = require("../utils/calcularEstado");
/**
 * 🔥 Calcula estado global del pedido
 */
function calcularEstadoPedido(productos) {
    if (productos.every(p => (0, calcularEstado_1.calcularEstado)(p) === 'DESPACHADO')) {
        return client_1.EstadoPedido.DESPACHADO;
    }
    if (productos.every(p => ['LISTO', 'DESPACHADO'].includes((0, calcularEstado_1.calcularEstado)(p)))) {
        return client_1.EstadoPedido.LISTO;
    }
    if (productos.some(p => (0, calcularEstado_1.calcularEstado)(p) === 'EN_DECORACION')) {
        return client_1.EstadoPedido.EN_DECORACION;
    }
    if (productos.some(p => (0, calcularEstado_1.calcularEstado)(p) === 'EN_CORTE')) {
        return client_1.EstadoPedido.EN_CORTE;
    }
    return client_1.EstadoPedido.PENDIENTE;
}
/**
 * 🔥 MAPEO CORRECTO
 */
function mapProducto(p) {
    const cantidadPedido = Number(p.cantidadPedido || 0);
    const cantidadDespacho = Number(p.cantidadDespacho || 0);
    return {
        productoId: p.productoId,
        cantidadPedido,
        cantidadPlancha: p.cantidadPlancha ? Number(p.cantidadPlancha) : null,
        // 🔥 CORTE
        fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
        fechaConteo: p.fechaConteo ? new Date(p.fechaConteo) : null,
        cantidadTareas: p.cantidadTareas ? Number(p.cantidadTareas) : null,
        corte1: p.corte1 ? Number(p.corte1) : null,
        corte2: p.corte2 ? Number(p.corte2) : null,
        corte3: p.corte3 ? Number(p.corte3) : null,
        // 🔥 DECORACIÓN
        fechaAsignacion: p.fechaAsignacion ? new Date(p.fechaAsignacion) : null,
        cantidadRecibida: p.cantidadRecibida ? Number(p.cantidadRecibida) : null,
        // 🔥 DESPACHO
        fechaDespacho: p.fechaDespacho ? new Date(p.fechaDespacho) : null,
        cantidadDespacho,
        cantidadFaltante: cantidadPedido - cantidadDespacho,
        estado: p.estado || client_1.EstadoPedido.PENDIENTE
    };
}
class PedidosService {
    async obtenerPorId(id) {
        if (!id)
            throw new types_1.AppError('ID requerido', 400);
        const pedido = await database_1.prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                productos: { include: { producto: true } }
            }
        });
        if (!pedido)
            throw new types_1.AppError('Pedido no encontrado', 404);
        const productos = pedido.productos.map(p => ({
            ...p,
            estadoCalculado: (0, calcularEstado_1.calcularEstado)(p)
        }));
        return {
            ...pedido,
            estadoCalculado: calcularEstadoPedido(productos),
            productos
        };
    }
    async listar(filtros) {
        const page = Number(filtros.page) || 1;
        const limit = Number(filtros.limit) || 20;
        const where = {};
        if (filtros.search) {
            where.OR = [
                { codigo: { contains: filtros.search, mode: 'insensitive' } },
                { cliente: { nombre: { contains: filtros.search, mode: 'insensitive' } } }
            ];
        }
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        const [total, pedidos] = await database_1.prisma.$transaction([
            database_1.prisma.pedido.count({ where }),
            database_1.prisma.pedido.findMany({
                where,
                include: {
                    cliente: true,
                    productos: { include: { producto: true } }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);
        return {
            success: true,
            data: pedidos.map(pedido => {
                const productos = pedido.productos.map(p => ({
                    ...p,
                    estadoCalculado: (0, calcularEstado_1.calcularEstado)(p)
                }));
                return {
                    ...pedido,
                    estadoCalculado: calcularEstadoPedido(productos),
                    productos
                };
            }),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async crear(data) {
        if (!data.productos?.length) {
            throw new types_1.AppError("Debe incluir productos", 400);
        }
        if (!data.clienteId) {
            throw new types_1.AppError("Cliente requerido", 400);
        }
        const count = await database_1.prisma.pedido.count();
        const codigo = `PED-${(count + 1).toString().padStart(3, '0')}`;
        const pedido = await database_1.prisma.pedido.create({
            data: {
                codigo,
                clienteId: data.clienteId,
                laser: data.laser || null,
                estado: client_1.EstadoPedido.PENDIENTE,
                observaciones: data.observaciones,
                productos: {
                    create: data.productos.map(mapProducto)
                }
            },
            include: { productos: true }
        });
        // 🔥 recalcular estado
        const estado = calcularEstadoPedido(pedido.productos.map(p => ({ ...p, estadoCalculado: (0, calcularEstado_1.calcularEstado)(p) })));
        await database_1.prisma.pedido.update({
            where: { id: pedido.id },
            data: { estado }
        });
        return pedido;
    }
    async actualizar(id, data) {
        await this.obtenerPorId(id);
        const { productos, ...resto } = data;
        if (productos) {
            await database_1.prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });
            resto.productos = {
                create: productos.map(mapProducto)
            };
        }
        const pedido = await database_1.prisma.pedido.update({
            where: { id },
            data: {
                ...resto,
                laser: resto.laser || null
            },
            include: { productos: true }
        });
        // 🔥 recalcular estado
        const estado = calcularEstadoPedido(pedido.productos.map(p => ({ ...p, estadoCalculado: (0, calcularEstado_1.calcularEstado)(p) })));
        await database_1.prisma.pedido.update({
            where: { id },
            data: { estado }
        });
        return pedido;
    }
    async actualizarSeguimientoProducto(id, data) {
        const cantidadPedido = Number(data.cantidadPedido || 0);
        const cantidadDespacho = Number(data.cantidadDespacho || 0);
        const producto = await database_1.prisma.pedidoProducto.update({
            where: { id },
            data: {
                fechaInicioCorte: data.fechaInicioCorte ? new Date(data.fechaInicioCorte) : undefined,
                fechaConteo: data.fechaConteo ? new Date(data.fechaConteo) : undefined,
                fechaAsignacion: data.fechaAsignacion ? new Date(data.fechaAsignacion) : undefined,
                fechaDespacho: data.fechaDespacho ? new Date(data.fechaDespacho) : undefined,
                cantidadTareas: data.cantidadTareas ? Number(data.cantidadTareas) : undefined,
                corte1: data.corte1 ? Number(data.corte1) : undefined,
                corte2: data.corte2 ? Number(data.corte2) : undefined,
                corte3: data.corte3 ? Number(data.corte3) : undefined,
                cantidadRecibida: data.cantidadRecibida ? Number(data.cantidadRecibida) : undefined,
                cantidadDespacho,
                cantidadFaltante: cantidadPedido - cantidadDespacho
            }
        });
        // 🔥 recalcular pedido
        const productos = await database_1.prisma.pedidoProducto.findMany({
            where: { pedidoId: producto.pedidoId }
        });
        const estado = calcularEstadoPedido(productos.map(p => ({ ...p, estadoCalculado: (0, calcularEstado_1.calcularEstado)(p) })));
        await database_1.prisma.pedido.update({
            where: { id: producto.pedidoId },
            data: { estado }
        });
        return producto;
    }
    async cambiarEstado(id, estado) {
        if (!Object.values(client_1.EstadoPedido).includes(estado)) {
            throw new types_1.AppError('Estado inválido', 400);
        }
        return database_1.prisma.pedido.update({
            where: { id },
            data: { estado: estado }
        });
    }
    /**
     * 🔥 ESTADÍSTICAS (FIX TYPE SAFE)
     */
    async estadisticas() {
        const [porEstadoRaw, totalMes, total] = await database_1.prisma.$transaction([
            database_1.prisma.pedido.groupBy({
                by: ['estado'],
                _count: { id: true },
                orderBy: undefined
            }),
            database_1.prisma.pedido.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),
            database_1.prisma.pedido.count()
        ]);
        const porEstado = porEstadoRaw;
        return {
            success: true,
            resumen: { total, totalMes },
            porEstado: porEstado.map(e => ({
                estado: e.estado,
                cantidad: e._count.id
            }))
        };
    }
}
exports.PedidosService = PedidosService;
exports.pedidosService = new PedidosService();
//# sourceMappingURL=pedidos.service.js.map