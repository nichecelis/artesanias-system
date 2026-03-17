import { Prisma } from '@prisma/client';
export declare class PedidosService {
    obtenerPorId(id: string): Promise<{
        cliente: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            documento: string;
            direccion: string | null;
            telefono: string | null;
            transportadora: string | null;
        };
        productos: ({
            producto: {
                id: string;
                nombre: string;
                createdAt: Date;
                updatedAt: Date;
                descripcion: string | null;
                precioVenta: Prisma.Decimal;
                precioDecoracion: Prisma.Decimal;
                estado: import(".prisma/client").$Enums.EstadoProducto;
            };
        } & {
            id: string;
            createdAt: Date;
            productoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            pedidoId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: boolean;
        fechaInicioCorte: Date | null;
        fechaConteo: Date | null;
        cantidadTareas: number | null;
        fechaAsignacion: Date | null;
        cantidadRecibida: number | null;
        fechaDespacho: Date | null;
        cortes: number | null;
        cantidadDespacho: number | null;
        cantidadFaltante: number | null;
        observaciones: string | null;
    }>;
    listar(filtros: any): Promise<{
        success: boolean;
        data: ({
            cliente: {
                id: string;
                nombre: string;
                activo: boolean;
                createdAt: Date;
                updatedAt: Date;
                documento: string;
                direccion: string | null;
                telefono: string | null;
                transportadora: string | null;
            };
            productos: ({
                producto: {
                    id: string;
                    nombre: string;
                    createdAt: Date;
                    updatedAt: Date;
                    descripcion: string | null;
                    precioVenta: Prisma.Decimal;
                    precioDecoracion: Prisma.Decimal;
                    estado: import(".prisma/client").$Enums.EstadoProducto;
                };
            } & {
                id: string;
                createdAt: Date;
                productoId: string;
                cantidadPedido: number;
                cantidadPlancha: number | null;
                pedidoId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            clienteId: string;
            codigo: string;
            laser: boolean;
            fechaInicioCorte: Date | null;
            fechaConteo: Date | null;
            cantidadTareas: number | null;
            fechaAsignacion: Date | null;
            cantidadRecibida: number | null;
            fechaDespacho: Date | null;
            cortes: number | null;
            cantidadDespacho: number | null;
            cantidadFaltante: number | null;
            observaciones: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    estadisticas(): Promise<{
        success: boolean;
        porEstado: {
            estado: any;
            cantidad: any;
        }[];
        totalMes: number;
    }>;
    crear(data: any): Promise<{
        cliente: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            documento: string;
            direccion: string | null;
            telefono: string | null;
            transportadora: string | null;
        };
        productos: ({
            producto: {
                id: string;
                nombre: string;
                createdAt: Date;
                updatedAt: Date;
                descripcion: string | null;
                precioVenta: Prisma.Decimal;
                precioDecoracion: Prisma.Decimal;
                estado: import(".prisma/client").$Enums.EstadoProducto;
            };
        } & {
            id: string;
            createdAt: Date;
            productoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            pedidoId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: boolean;
        fechaInicioCorte: Date | null;
        fechaConteo: Date | null;
        cantidadTareas: number | null;
        fechaAsignacion: Date | null;
        cantidadRecibida: number | null;
        fechaDespacho: Date | null;
        cortes: number | null;
        cantidadDespacho: number | null;
        cantidadFaltante: number | null;
        observaciones: string | null;
    }>;
    actualizar(id: string, data: any): Promise<{
        cliente: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            documento: string;
            direccion: string | null;
            telefono: string | null;
            transportadora: string | null;
        };
        productos: ({
            producto: {
                id: string;
                nombre: string;
                createdAt: Date;
                updatedAt: Date;
                descripcion: string | null;
                precioVenta: Prisma.Decimal;
                precioDecoracion: Prisma.Decimal;
                estado: import(".prisma/client").$Enums.EstadoProducto;
            };
        } & {
            id: string;
            createdAt: Date;
            productoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            pedidoId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: boolean;
        fechaInicioCorte: Date | null;
        fechaConteo: Date | null;
        cantidadTareas: number | null;
        fechaAsignacion: Date | null;
        cantidadRecibida: number | null;
        fechaDespacho: Date | null;
        cortes: number | null;
        cantidadDespacho: number | null;
        cantidadFaltante: number | null;
        observaciones: string | null;
    }>;
    actualizarSeguimientoProducto(pedidoProductoId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        productoId: string;
        cantidadPedido: number;
        cantidadPlancha: number | null;
        pedidoId: string;
    }>;
    cambiarEstado(id: string, estado: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: boolean;
        fechaInicioCorte: Date | null;
        fechaConteo: Date | null;
        cantidadTareas: number | null;
        fechaAsignacion: Date | null;
        cantidadRecibida: number | null;
        fechaDespacho: Date | null;
        cortes: number | null;
        cantidadDespacho: number | null;
        cantidadFaltante: number | null;
        observaciones: string | null;
    }>;
}
export declare const pedidosService: PedidosService;
//# sourceMappingURL=pedidos.service.d.ts.map