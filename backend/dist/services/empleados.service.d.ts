import { PaginationParams, PaginatedResult } from '../types';
interface CrearEmpleadoDto {
    nombre: string;
    documento: string;
    salario: number;
}
export declare class EmpleadosService {
    crear(dto: CrearEmpleadoDto): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        salario: import("@prisma/client/runtime/library").Decimal;
    }>;
    listar(params: PaginationParams): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        nominas: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            observaciones: string | null;
            abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
            prestamoId: string | null;
            totalPagar: import("@prisma/client/runtime/library").Decimal;
            empleadoId: string;
            fecha: Date;
            diasTrabajados: number;
            salarioDia: import("@prisma/client/runtime/library").Decimal;
            subtotalDias: import("@prisma/client/runtime/library").Decimal;
            horasExtras: import("@prisma/client/runtime/library").Decimal;
            valorHoraExtra: import("@prisma/client/runtime/library").Decimal;
            subtotalHoras: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        salario: import("@prisma/client/runtime/library").Decimal;
    }>;
    actualizar(id: string, dto: Partial<CrearEmpleadoDto>): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        salario: import("@prisma/client/runtime/library").Decimal;
    }>;
}
interface CrearNominaDto {
    empleadoId: string;
    fecha: string;
    diasTrabajados: number;
    horasExtras?: number;
    prestamoId?: string | null;
    abonosPrestamo?: number;
    observaciones?: string;
}
interface ActualizarNominaDto {
    fecha?: string;
    diasTrabajados?: number;
    horasExtras?: number;
    prestamoId?: string | null;
    abonosPrestamo?: number;
    observaciones?: string;
}
export declare class NominaService {
    registrar(dto: CrearNominaDto): Promise<{
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
        empleado: {
            id: string;
            nombre: string;
            salario: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        observaciones: string | null;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        empleadoId: string;
        fecha: Date;
        diasTrabajados: number;
        salarioDia: import("@prisma/client/runtime/library").Decimal;
        subtotalDias: import("@prisma/client/runtime/library").Decimal;
        horasExtras: import("@prisma/client/runtime/library").Decimal;
        valorHoraExtra: import("@prisma/client/runtime/library").Decimal;
        subtotalHoras: import("@prisma/client/runtime/library").Decimal;
    }>;
    actualizar(id: string, dto: ActualizarNominaDto): Promise<{
        prestamo: {
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saldo: import("@prisma/client/runtime/library").Decimal;
        } | null;
        empleado: {
            id: string;
            nombre: string;
            salario: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        observaciones: string | null;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        empleadoId: string;
        fecha: Date;
        diasTrabajados: number;
        salarioDia: import("@prisma/client/runtime/library").Decimal;
        subtotalDias: import("@prisma/client/runtime/library").Decimal;
        horasExtras: import("@prisma/client/runtime/library").Decimal;
        valorHoraExtra: import("@prisma/client/runtime/library").Decimal;
        subtotalHoras: import("@prisma/client/runtime/library").Decimal;
    }>;
    eliminar(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        observaciones: string | null;
        abonosPrestamo: import("@prisma/client/runtime/library").Decimal;
        prestamoId: string | null;
        totalPagar: import("@prisma/client/runtime/library").Decimal;
        empleadoId: string;
        fecha: Date;
        diasTrabajados: number;
        salarioDia: import("@prisma/client/runtime/library").Decimal;
        subtotalDias: import("@prisma/client/runtime/library").Decimal;
        horasExtras: import("@prisma/client/runtime/library").Decimal;
        valorHoraExtra: import("@prisma/client/runtime/library").Decimal;
        subtotalHoras: import("@prisma/client/runtime/library").Decimal;
    }>;
    listar(params: PaginationParams & {
        empleadoId?: string;
        mes?: string;
    }): Promise<PaginatedResult<any>>;
    totalMes(mes: string): Promise<{
        totalNomina: number | import("@prisma/client/runtime/library").Decimal;
        registros: number;
    }>;
}
export declare const empleadosService: EmpleadosService;
export declare const nominaService: NominaService;
export {};
//# sourceMappingURL=empleados.service.d.ts.map