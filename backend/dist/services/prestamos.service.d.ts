import { PaginationParams, PaginatedResult } from '../types';
type TipoBeneficiario = 'DECORADORA' | 'EMPLEADO';
interface CrearPrestamoDto {
    tipo: TipoBeneficiario;
    beneficiarioId: string;
    monto: number;
    fecha: string;
    cuotas?: number;
    observacion?: string;
}
export declare class PrestamosService {
    crear(dto: CrearPrestamoDto): Promise<{
        decoradora: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        empleado: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        _count: {
            abonos: number;
        };
        abonos: {
            id: string;
            createdAt: Date;
            fecha: Date;
            prestamoId: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        fecha: Date;
        saldo: import("@prisma/client/runtime/library").Decimal;
        decoradoraId: string | null;
        empleadoId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        cuotas: number | null;
        cuotasPagadas: number;
        observacion: string | null;
        imagen: string | null;
        archivoFirmado: string | null;
    }>;
    listar(params: PaginationParams & {
        tipo?: TipoBeneficiario;
        decoradoraId?: string;
        empleadoId?: string;
        soloConSaldo?: boolean;
        activo?: boolean | string;
    }): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        decoradora: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        empleado: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        _count: {
            abonos: number;
        };
        abonos: {
            id: string;
            createdAt: Date;
            fecha: Date;
            prestamoId: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        fecha: Date;
        saldo: import("@prisma/client/runtime/library").Decimal;
        decoradoraId: string | null;
        empleadoId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        cuotas: number | null;
        cuotasPagadas: number;
        observacion: string | null;
        imagen: string | null;
        archivoFirmado: string | null;
    }>;
    abonar(id: string, monto: number, fecha: string): Promise<{
        abono: {
            id: string;
            createdAt: Date;
            fecha: Date;
            prestamoId: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        };
        saldo: number;
        saldado: boolean;
    }>;
    eliminarAbono(abonoId: string): Promise<{
        saldo: number;
    }>;
    eliminar(id: string): Promise<{
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        fecha: Date;
        saldo: import("@prisma/client/runtime/library").Decimal;
        decoradoraId: string | null;
        empleadoId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        cuotas: number | null;
        cuotasPagadas: number;
        observacion: string | null;
        imagen: string | null;
        archivoFirmado: string | null;
    }>;
    actualizarArchivo(id: string, archivoFirmado: string): Promise<{
        decoradora: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        empleado: {
            id: string;
            nombre: string;
            documento: string;
        } | null;
        _count: {
            abonos: number;
        };
        abonos: {
            id: string;
            createdAt: Date;
            fecha: Date;
            prestamoId: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        fecha: Date;
        saldo: import("@prisma/client/runtime/library").Decimal;
        decoradoraId: string | null;
        empleadoId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        cuotas: number | null;
        cuotasPagadas: number;
        observacion: string | null;
        imagen: string | null;
        archivoFirmado: string | null;
    }>;
}
export declare const prestamosService: PrestamosService;
export {};
//# sourceMappingURL=prestamos.service.d.ts.map