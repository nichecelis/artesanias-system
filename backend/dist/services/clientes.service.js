"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesService = exports.ClientesService = void 0;
const database_1 = require("../config/database");
const types_1 = require("../types");
const response_1 = require("../utils/response");
class ClientesService {
    async crear(dto) {
        const existe = await database_1.prisma.cliente.findUnique({
            where: { documento: dto.documento.trim() },
        });
        if (existe)
            throw new types_1.AppError(409, 'Ya existe un cliente con ese documento');
        return database_1.prisma.cliente.create({ data: { ...dto, documento: dto.documento.trim() } });
    }
    async listar(params) {
        const where = params.search
            ? {
                OR: [
                    { nombre: { contains: params.search, mode: 'insensitive' } },
                    { documento: { contains: params.search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [items, total] = await database_1.prisma.$transaction([
            database_1.prisma.cliente.findMany({
                where,
                skip: (0, response_1.getPrismaSkip)(params),
                take: params.limit,
                orderBy: { [params.sortBy ?? 'nombre']: params.sortOrder },
                include: { _count: { select: { pedidos: true } } },
            }),
            database_1.prisma.cliente.count({ where }),
        ]);
        return { items, total };
    }
    async obtenerPorId(id) {
        const cliente = await database_1.prisma.cliente.findUnique({
            where: { id },
            include: {
                pedidos: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 10,
                    select: {
                        id: true,
                        codigo: true,
                        estado: true,
                        // cantidadPedido: true, // ❌ ELIMINA ESTA LÍNEA, el campo no existe
                        createdAt: true,
                        // Si necesitas mostrar cantidades, usualmente están en la relación productos:
                        _count: {
                            select: { productos: true }
                        }
                    }
                }
            }
        });
        return cliente;
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id);
        if (dto.documento) {
            const existe = await database_1.prisma.cliente.findFirst({
                where: { documento: dto.documento.trim(), NOT: { id } },
            });
            if (existe)
                throw new types_1.AppError(409, 'Ese documento ya está en uso');
        }
        return database_1.prisma.cliente.update({ where: { id }, data: dto });
    }
    async eliminar(id) {
        const cliente = await this.obtenerPorId(id);
        const pedidos = await database_1.prisma.pedido.count({ where: { clienteId: id } });
        if (pedidos > 0)
            throw new types_1.AppError(409, 'No se puede eliminar: el cliente tiene pedidos');
        return database_1.prisma.cliente.update({ where: { id }, data: { activo: false } });
    }
}
exports.ClientesService = ClientesService;
exports.clientesService = new ClientesService();
//# sourceMappingURL=clientes.service.js.map