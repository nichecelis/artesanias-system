import { TipoCuenta } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../types';
interface CrearDecoradoraDto {
    nombre: string;
    documento: string;
    telefono?: string;
    grupoId?: string | null;
    banco?: string;
    numCuenta?: string;
    tipoCuenta?: TipoCuenta;
}
type ActualizarDecoradoraDto = Partial<CrearDecoradoraDto & {
    activa: boolean;
}>;
export declare class DecoradorasService {
    crear(dto: CrearDecoradoraDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        telefono: string | null;
        banco: string | null;
        numCuenta: string | null;
        tipoCuenta: import(".prisma/client").$Enums.TipoCuenta | null;
        grupoId: string | null;
        activa: boolean;
    }>;
    listar(params: PaginationParams & {
        activa?: boolean | string;
    }): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        grupo: {
            id: string;
            nombre: string;
            tipo: import(".prisma/client").$Enums.TipoGrupo;
        } | null;
        decoraciones: ({
            producto: {
                nombre: string;
            };
            pedido: {
                codigo: string;
            };
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
        })[];
        prestamos: ({
            abonos: {
                id: string;
                createdAt: Date;
                prestamoId: string;
                fecha: Date;
                monto: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            decoradoraId: string | null;
            empleadoId: string | null;
            fecha: Date;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
            cuotas: number | null;
            observacion: string | null;
            imagen: string | null;
            archivoFirmado: string | null;
        })[];
    } & {
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        telefono: string | null;
        banco: string | null;
        numCuenta: string | null;
        tipoCuenta: import(".prisma/client").$Enums.TipoCuenta | null;
        grupoId: string | null;
        activa: boolean;
    }>;
    actualizar(id: string, dto: ActualizarDecoradoraDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        telefono: string | null;
        banco: string | null;
        numCuenta: string | null;
        tipoCuenta: import(".prisma/client").$Enums.TipoCuenta | null;
        grupoId: string | null;
        activa: boolean;
    }>;
    inactivar(id: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        telefono: string | null;
        banco: string | null;
        numCuenta: string | null;
        tipoCuenta: import(".prisma/client").$Enums.TipoCuenta | null;
        grupoId: string | null;
        activa: boolean;
    }>;
    activar(id: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        telefono: string | null;
        banco: string | null;
        numCuenta: string | null;
        tipoCuenta: import(".prisma/client").$Enums.TipoCuenta | null;
        grupoId: string | null;
        activa: boolean;
    }>;
    resumenPagos(id: string): Promise<{
        decoraciones: {
            producto: {
                nombre: string;
            };
            pedido: {
                codigo: string;
            };
            id: string;
            fechaIngreso: Date | null;
            totalPagar: import("@prisma/client/runtime/library").Decimal;
        }[];
        totalPendiente: number;
        totalPagado: number | import("@prisma/client/runtime/library").Decimal;
        deudaTotal: number;
    }>;
}
export declare const decoradorasService: DecoradorasService;
export {};
//# sourceMappingURL=decoradoras.service.d.ts.map