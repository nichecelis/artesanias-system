import { PaginationParams, PaginatedResult } from '../types';
interface CrearDecoracionDto {
    pedidoId: string;
    decoradoraId: string;
    productoId: string;
    fechaEgreso: string;
    cantidadEgreso: number;
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
export declare class DecoracionesService {
    crear(dto: CrearDecoracionDto): Promise<{
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
        fechaIngreso: Date | null;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
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
        fechaIngreso: Date | null;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
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
    eliminar(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        fechaIngreso: Date | null;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
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
        fechaIngreso: Date | null;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
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
        fechaIngreso: Date | null;
        pedidoId: string;
        decoradoraId: string;
        fechaEgreso: Date;
        cantidadEgreso: number;
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
}
export declare const decoracionesService: DecoracionesService;
export {};
//# sourceMappingURL=decoraciones.service.d.ts.map