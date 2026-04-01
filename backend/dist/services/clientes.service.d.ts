import { PaginationParams, PaginatedResult } from '../types';
interface CrearClienteDto {
    nombre: string;
    documento: string;
    direccion?: string;
    telefono?: string;
    transportadora?: string;
}
type ActualizarClienteDto = Partial<CrearClienteDto>;
export declare class ClientesService {
    crear(dto: CrearClienteDto): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    listar(params: PaginationParams & {
        activo?: boolean | string;
    }): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        pedidos: {
            id: string;
            createdAt: Date;
            _count: {
                productos: number;
            };
            estado: import(".prisma/client").$Enums.EstadoPedido;
            codigo: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    obtenerPorDocumento(documento: string): Promise<{
        pedidos: {
            id: string;
            createdAt: Date;
            _count: {
                productos: number;
            };
            estado: import(".prisma/client").$Enums.EstadoPedido;
            codigo: string;
        }[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    actualizar(id: string, dto: ActualizarClienteDto): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    eliminar(id: string): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    actualizarPorDocumento(documento: string, dto: {
        nombre?: string;
        direccion?: string;
        telefono?: string;
        transportadora?: string;
        documento?: string;
    }): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
    eliminarPorDocumento(documento: string): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        documento: string;
        direccion: string | null;
        telefono: string | null;
        transportadora: string | null;
    }>;
}
export declare const clientesService: ClientesService;
export {};
//# sourceMappingURL=clientes.service.d.ts.map