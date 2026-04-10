import { Prisma } from '@prisma/client';
import { EstadoPedido, EstadoPedidoEnum } from '../types';
export declare class PedidosService {
    obtenerPorId(id: string): Promise<{
        estadoCalculado: EstadoPedidoEnum;
        productos: {
            estadoCalculado: EstadoPedidoEnum;
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
            id: string;
            createdAt: Date;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            productoId: string;
            pedidoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            fechaInicioCorte: Date | null;
            fechaConteo: Date | null;
            cantidadTareas: number | null;
            corte1: number | null;
            corte2: number | null;
            corte3: number | null;
            fechaAsignacion: Date | null;
            cantidadRecibida: number | null;
            fechaDespacho: Date | null;
            cantidadDespacho: number | null;
            cantidadFaltante: number | null;
        }[];
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: string | null;
        observaciones: string | null;
    }>;
    listar(filtros: any): Promise<{
        success: boolean;
        data: {
            estadoCalculado: EstadoPedidoEnum;
            productos: {
                estadoCalculado: EstadoPedidoEnum;
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
                id: string;
                createdAt: Date;
                estado: import(".prisma/client").$Enums.EstadoPedido;
                productoId: string;
                pedidoId: string;
                cantidadPedido: number;
                cantidadPlancha: number | null;
                fechaInicioCorte: Date | null;
                fechaConteo: Date | null;
                cantidadTareas: number | null;
                corte1: number | null;
                corte2: number | null;
                corte3: number | null;
                fechaAsignacion: Date | null;
                cantidadRecibida: number | null;
                fechaDespacho: Date | null;
                cantidadDespacho: number | null;
                cantidadFaltante: number | null;
            }[];
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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            clienteId: string;
            codigo: string;
            laser: string | null;
            observaciones: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    crear(data: any): Promise<{
        productos: {
            id: string;
            createdAt: Date;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            productoId: string;
            pedidoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            fechaInicioCorte: Date | null;
            fechaConteo: Date | null;
            cantidadTareas: number | null;
            corte1: number | null;
            corte2: number | null;
            corte3: number | null;
            fechaAsignacion: Date | null;
            cantidadRecibida: number | null;
            fechaDespacho: Date | null;
            cantidadDespacho: number | null;
            cantidadFaltante: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: string | null;
        observaciones: string | null;
    }>;
    actualizar(id: string, data: any): Promise<{
        productos: {
            id: string;
            createdAt: Date;
            estado: import(".prisma/client").$Enums.EstadoPedido;
            productoId: string;
            pedidoId: string;
            cantidadPedido: number;
            cantidadPlancha: number | null;
            fechaInicioCorte: Date | null;
            fechaConteo: Date | null;
            cantidadTareas: number | null;
            corte1: number | null;
            corte2: number | null;
            corte3: number | null;
            fechaAsignacion: Date | null;
            cantidadRecibida: number | null;
            fechaDespacho: Date | null;
            cantidadDespacho: number | null;
            cantidadFaltante: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: string | null;
        observaciones: string | null;
    }>;
    actualizarSeguimientoProducto(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        productoId: string;
        pedidoId: string;
        cantidadPedido: number;
        cantidadPlancha: number | null;
        fechaInicioCorte: Date | null;
        fechaConteo: Date | null;
        cantidadTareas: number | null;
        corte1: number | null;
        corte2: number | null;
        corte3: number | null;
        fechaAsignacion: Date | null;
        cantidadRecibida: number | null;
        fechaDespacho: Date | null;
        cantidadDespacho: number | null;
        cantidadFaltante: number | null;
    }>;
    cambiarEstado(id: string, estado: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        estado: import(".prisma/client").$Enums.EstadoPedido;
        clienteId: string;
        codigo: string;
        laser: string | null;
        observaciones: string | null;
    }>;
    /**
     * 🔥 ESTADÍSTICAS (FIX TYPE SAFE)
     */
    estadisticas(): Promise<{
        success: boolean;
        resumen: {
            total: number;
            totalMes: number;
        };
        porEstado: {
            estado: EstadoPedido;
            cantidad: number;
        }[];
    }>;
}
export declare const pedidosService: PedidosService;
//# sourceMappingURL=pedidos.service.d.ts.map