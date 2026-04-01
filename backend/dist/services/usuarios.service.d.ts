import { Rol } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../types';
export declare class UsuariosService {
    listar(params: PaginationParams & {
        activo?: boolean | string;
    }): Promise<PaginatedResult<any>>;
    obtenerPorId(id: string): Promise<{
        id: string;
        correo: string;
        nombre: string;
        rol: import(".prisma/client").$Enums.Rol;
        activo: boolean;
        createdAt: Date;
    }>;
    obtenerPorCorreo(correo: string): Promise<{
        id: string;
        correo: string;
        nombre: string;
        rol: import(".prisma/client").$Enums.Rol;
        activo: boolean;
        createdAt: Date;
    }>;
    crear(dto: {
        nombre: string;
        correo: string;
        password: string;
        rol: Rol;
    }): Promise<{
        id: string;
        correo: string;
        nombre: string;
        rol: import(".prisma/client").$Enums.Rol;
        activo: boolean;
        createdAt: Date;
    }>;
    actualizar(id: string, dto: {
        nombre?: string;
        correo?: string;
        rol?: Rol;
        activo?: boolean;
    }): Promise<{
        id: string;
        correo: string;
        nombre: string;
        rol: import(".prisma/client").$Enums.Rol;
        activo: boolean;
        createdAt: Date;
    }>;
    actualizarPorCorreo(correo: string, dto: {
        nombre?: string;
        rol?: Rol;
        password?: string;
    }): Promise<{
        id: string;
        correo: string;
        nombre: string;
        rol: import(".prisma/client").$Enums.Rol;
        activo: boolean;
        createdAt: Date;
    }>;
    cambiarPassword(id: string, nuevaPassword: string): Promise<{
        id: string;
        correo: string;
        nombre: string;
    }>;
    eliminar(id: string): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
    }>;
}
export declare const usuariosService: UsuariosService;
//# sourceMappingURL=usuarios.service.d.ts.map