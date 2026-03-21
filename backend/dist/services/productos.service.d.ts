import { EstadoProducto } from '@prisma/client';
interface CrearProductoDto {
    nombre: string;
    descripcion?: string;
    precioVenta: number;
    precioDecoracion: number;
}
type ActualizarProductoDto = Partial<CrearProductoDto & {
    estado: EstadoProducto;
}>;
export declare class ProductosService {
    crear(dto: CrearProductoDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        estado: import(".prisma/client").$Enums.EstadoProducto;
    }>;
    listar(params: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            productoCliente: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                precioVenta: import("@prisma/client/runtime/library").Decimal;
                productoId: string;
                clienteId: string;
            }[];
        } & {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            descripcion: string | null;
            precioVenta: import("@prisma/client/runtime/library").Decimal;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
            estado: import(".prisma/client").$Enums.EstadoProducto;
        })[];
        total: number;
    }>;
    obtenerPorId(id: string): Promise<{
        productoCliente: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            precioVenta: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
            clienteId: string;
        }[];
    } & {
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        estado: import(".prisma/client").$Enums.EstadoProducto;
    }>;
    actualizar(id: string, dto: ActualizarProductoDto): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        estado: import(".prisma/client").$Enums.EstadoProducto;
    }>;
    eliminar(id: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        precioDecoracion: import("@prisma/client/runtime/library").Decimal;
        estado: import(".prisma/client").$Enums.EstadoProducto;
    }>;
}
export declare const productosService: ProductosService;
export {};
//# sourceMappingURL=productos.service.d.ts.map