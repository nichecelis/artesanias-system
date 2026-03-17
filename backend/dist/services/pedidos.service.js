"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosService = exports.PedidosService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const types_1 = require("../types");
class PedidosService {
    async obtenerPorId(id) {
        console.log('🔍 Buscando pedido con ID:', id);
        // Validar que el ID sea un UUID válido
        if (!id || id.length !== 36) {
            throw new types_1.AppError('ID de pedido inválido', 400);
        }
        const pedido = await database_1.prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: true,
                productos: {
                    include: { producto: true }
                }
            }
        });
        if (!pedido) {
            console.log('❌ Pedido no encontrado:', id);
            throw new types_1.AppError('Pedido no encontrado', 404);
        }
        console.log('✅ Pedido encontrado:', pedido.codigo);
        return pedido;
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
        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.createdAt = {
                ...(filtros.fechaDesde && { gte: new Date(filtros.fechaDesde) }),
                ...(filtros.fechaHasta && { lte: new Date(new Date(filtros.fechaHasta).setHours(23, 59, 59, 999)) }),
            };
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
            data: pedidos,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async estadisticas() {
        const [porEstado, totalMes] = await database_1.prisma.$transaction([
            database_1.prisma.pedido.groupBy({
                by: ['estado'],
                _count: { id: true },
                orderBy: undefined
            }),
            database_1.prisma.pedido.count({
                where: {
                    createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                }
            })
        ]);
        return {
            success: true,
            porEstado: porEstado.map((e) => ({
                estado: e.estado,
                cantidad: e._count?.id || 0
            })),
            totalMes
        };
    }
    async crear(data) {
        // Validar que productos es un array
        if (!data.productos || !Array.isArray(data.productos) || data.productos.length === 0) {
            throw new types_1.AppError("El pedido debe incluir al menos un producto", 400);
        }
        // Validar que clienteId existe
        if (!data.clienteId) {
            throw new types_1.AppError("El cliente es requerido", 400);
        }
        const count = await database_1.prisma.pedido.count();
        const codigo = `PED-${(count + 1).toString().padStart(3, '0')}`;
        return database_1.prisma.pedido.create({
            data: {
                codigo,
                clienteId: data.clienteId,
                estado: data.estado || 'PENDIENTE',
                productos: {
                    create: data.productos.map((p) => ({
                        productoId: p.productoId,
                        cantidadPedido: Number(p.cantidadPedido),
                        cantidadPlancha: Number(p.cantidadPlancha || 0)
                    }))
                }
            },
            include: { cliente: true, productos: { include: { producto: true } } }
        });
    }
    async actualizar(id, data) {
        const pedido = await this.obtenerPorId(id);
        const { productos, ...resto } = data;
        // Actualización de productos con sus nuevos campos de seguimiento
        if (productos && Array.isArray(productos)) {
            // Para simplificar, si envías la lista de productos, recreamos el seguimiento
            // O puedes implementar una lógica de actualización por ID de PedidoProducto
            await database_1.prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } });
            resto.productos = {
                create: productos.map((p) => ({
                    productoId: p.productoId,
                    cantidadPedido: Number(p.cantidadPedido),
                    cantidadPlancha: Number(p.cantidadPlancha || 0),
                    estado: p.estado || 'PENDIENTE',
                    fechaInicioCorte: p.fechaInicioCorte ? new Date(p.fechaInicioCorte) : null,
                    fechaConteo: p.fechaConteo ? new Date(p.fechaConteo) : null,
                    cantidadRecibida: p.cantidadRecibida,
                    fechaDespacho: p.fechaDespacho ? new Date(p.fechaDespacho) : null,
                    // ... mapear los demás campos nuevos
                }))
            };
        }
        return database_1.prisma.pedido.update({
            where: { id },
            data: resto,
            include: { cliente: true, productos: { include: { producto: true } } }
        });
    }
    // Nuevo método para actualizar solo un producto del pedido
    async actualizarSeguimientoProducto(pedidoProductoId, data) {
        return database_1.prisma.pedidoProducto.update({
            where: { id: pedidoProductoId },
            data: {
                ...data,
                fechaInicioCorte: data.fechaInicioCorte ? new Date(data.fechaInicioCorte) : undefined,
                fechaDespacho: data.fechaDespacho ? new Date(data.fechaDespacho) : undefined,
            }
        });
    }
    async cambiarEstado(id, estado) {
        const estadosValidos = Object.values(client_1.EstadoPedido);
        if (!estadosValidos.includes(estado)) {
            throw new types_1.AppError(`Estado inválido. Permitidos: ${estadosValidos.join(', ')}`, 400);
        }
        return database_1.prisma.pedido.update({
            where: { id },
            data: { estado: estado }
        });
    }
}
exports.PedidosService = PedidosService;
exports.pedidosService = new PedidosService();
//# sourceMappingURL=pedidos.service.js.map