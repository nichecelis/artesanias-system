import { PaginationParams, PaginatedResult } from '../types';
interface CrearDecoracionDto {
    pedidoId: string;
    decoradoraId: string;
    productos: {
        productoId: string;
        fechaEgreso: string;
        cantidadEgreso: number;
    }[];
}
interface ActualizarDecoracionDto {
    fechaEgreso?: string;
    cantidadEgreso?: number;
    fechaIngreso?: string;
    cantidadIngreso?: number;
    arreglos?: number;
    perdidas?: number;
    compras?: number;
    abonosPrestamo?: number;
    prestamoId?: string | null;
    pagado?: boolean;
}
interface ActualizarDecoracionBatchDto {
    id: string;
    fechaIngreso?: string;
    cantidadIngreso?: number;
    arreglos?: number;
    perdidas?: number;
    compras?: number;
    abonosPrestamo?: number;
    prestamoId?: string | null;
    pagado?: boolean;
}
export declare class DecoracionesService {
    crear(dto: CrearDecoracionDto): Promise<({
        producto: {
            id: string;
            nombre: string;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        };
        pedido: {
            cliente: {
                nombre: string;
            };
            id: string;
            codigo: string;
        };
        decoradora: {
            id: string;
            nombre: string;
        };
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    })[]>;
    actualizar(id: string, dto: ActualizarDecoracionDto): Promise<{
        producto: {
            id: string;
            nombre: string;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        };
        pedido: {
            cliente: {
                nombre: string;
            };
            id: string;
            codigo: string;
        };
        decoradora: {
            id: string;
            nombre: string;
        };
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    }>;
    actualizarVarias(items: ActualizarDecoracionBatchDto[]): Promise<({
        producto: {
            id: string;
            nombre: string;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        };
        pedido: {
            cliente: {
                nombre: string;
            };
            id: string;
            codigo: string;
        };
        decoradora: {
            id: string;
            nombre: string;
        };
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    })[]>;
    eliminar(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    }>;
    listar(params: PaginationParams & {
        decoradoraId?: string;
        pedidoId?: string;
        pagado?: boolean;
        fechaDesde?: string;
        fechaHasta?: string;
    }): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        producto: {
            id: string;
            nombre: string;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        };
        pedido: {
            cliente: {
                nombre: string;
            };
            id: string;
            codigo: string;
        };
        decoradora: {
            id: string;
            nombre: string;
        };
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    }>;
    marcarPagado(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
        fechaIngreso: Date | null;
        cantidadIngreso: number | null;
        arreglos: number;
        perdidas: number;
        compras: import("@prisma/client/runtime/library").Decimal;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        pagado: boolean;
    }>;
    pagarDecoraciones(ids: string[]): Promise<{
        decoracionesPagadas: string[];
    }>;
    listarAgrupado(params: PaginationParams & {
        decoradoraId?: string;
        pedidoId?: string;
        pagado?: boolean;
        fechaDesde?: string;
        fechaHasta?: string;
    }): Promise<{
        items: any[];
        total: number;
    }>;
    reportePorGrupo(params: {
        grupoId?: string;
        decoradoraId?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        search?: string;
        incluirPagadas?: boolean;
    }): Promise<{
        grupo: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            direccion: string | null;
            telefono: string | null;
            tipo: import(".prisma/client").$Enums.TipoGrupo;
            responsable: string | null;
            porcentajeResponsable: number;
        } | null;
        items: any[];
        totales: {
            cantidadDecoraciones: any;
            totalEgresos: any;
            totalCompras: any;
            totalAbonosPrestamo: any;
            saldoPrestamos: any;
            subtotal: any;
            totalAPagar: any;
        };
    }>;
}
export declare const decoracionesService: DecoracionesService;
export {};
//# sourceMappingURL=decoraciones.service.d.ts.map