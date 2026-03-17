export declare const productoClientesService: {
    listarPorProducto: (productoId: string) => Promise<({
        cliente: {
            id: string;
            nombre: string;
            documento: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        clienteId: string;
    })[]>;
    listarPorCliente: (clienteId: string) => Promise<({
        producto: {
            id: string;
            nombre: string;
            precioVenta: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        clienteId: string;
    })[]>;
    upsert: (productoId: string, clienteId: string, precioVenta: number) => Promise<{
        cliente: {
            id: string;
            nombre: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        clienteId: string;
    }>;
    eliminar: (productoId: string, clienteId: string) => Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        precioVenta: import("@prisma/client/runtime/library").Decimal;
        productoId: string;
        clienteId: string;
    }>;
};
//# sourceMappingURL=producto-clientes.service.d.ts.map