export declare const gruposService: {
    listar: (params: {
        page?: number;
        limit?: number;
        activo?: boolean | string;
    }) => Promise<{
        data: ({
            _count: {
                decoradoras: number;
            };
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    obtener: (id: string) => Promise<{
        _count: {
            decoradoras: number;
        };
        decoradoras: {
            id: string;
            nombre: string;
            documento: string;
        }[];
    } & {
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
    }>;
    crear: (data: {
        nombre: string;
        tipo: "GRUPO" | "ELITE";
        direccion?: string;
        telefono?: string;
        responsable?: string;
        porcentajeResponsable?: number;
    }) => Promise<{
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
    }>;
    actualizar: (id: string, data: {
        nombre?: string;
        tipo?: "GRUPO" | "ELITE";
        direccion?: string;
        telefono?: string;
        responsable?: string;
        porcentajeResponsable?: number;
    }) => Promise<{
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
    }>;
    eliminar: (id: string) => Promise<{
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
    }>;
    inactivar: (id: string) => Promise<{
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
    }>;
    activar: (id: string) => Promise<{
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
    }>;
    reportePagos: (id: string, fechaDesde?: string, fechaHasta?: string) => Promise<{
        grupo: {
            id: string;
            nombre: string;
            tipo: import(".prisma/client").$Enums.TipoGrupo;
            responsable: string | null;
            porcentajeResponsable: number;
        };
        resumen: {
            totalPagos: number;
            cantidadDecoraciones: number;
            montoResponsable: number;
            porcentajeResponsable: number;
        };
        pagosPorDecoradora: {
            decoradoraId: string;
            decoradoraNombre: string;
            decoradoraDocumento: string;
            cantidadDecoraciones: number;
            subtotal: number;
        }[];
        detalle: ({
            producto: {
                nombre: string;
            };
            pedido: {
                codigo: string;
            };
            decoradora: {
                id: string;
                nombre: string;
                documento: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            total: import("@prisma/client/runtime/library").Decimal;
            precioDecoracion: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
            pedidoId: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            totalPagar: import("@prisma/client/runtime/library").Decimal;
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
            pagado: boolean;
        })[];
    }>;
};
//# sourceMappingURL=grupos.service.d.ts.map