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
    }>;
    listar(params: PaginationParams & {
        tipo?: TipoBeneficiario;
        decoradoraId?: string;
        empleadoId?: string;
        soloConSaldo?: boolean;
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
    }>;
    abonar(id: string, monto: number, fecha: string): Promise<{
        abono: {
            id: string;
            createdAt: Date;
            prestamoId: string;
            fecha: Date;
            monto: import("@prisma/client/runtime/library").Decimal;
        };
        saldo: number;
    }>;
    eliminarAbono(abonoId: string): Promise<{
        saldo: number;
    }>;
    eliminar(id: string): Promise<{
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
    }>;
}
export declare const prestamosService: PrestamosService;
export {};
//# sourceMappingURL=prestamos.service.d.ts.map