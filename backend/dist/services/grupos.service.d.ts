export declare const gruposService: {
    listar: (params: {
        page?: number;
        limit?: number;
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
    }>;
    crear: (data: {
        nombre: string;
        tipo: "GRUPO" | "ELITE";
        direccion?: string;
        telefono?: string;
        responsable?: string;
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
    }>;
    actualizar: (id: string, data: {
        nombre?: string;
        tipo?: "GRUPO" | "ELITE";
        direccion?: string;
        telefono?: string;
        responsable?: string;
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
    }>;
};
//# sourceMappingURL=grupos.service.d.ts.map