import { api } from './api';

// ─── Tipos comunes ─────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Auth ──────────────────────────────────────────────────
export const authService = {
  login: (correo: string, password: string) =>
    api.post<ApiResponse<any>>('/auth/login', { correo, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<ApiResponse<any>>('/auth/me'),
};

// ─── Productos ─────────────────────────────────────────────
export const productosService = {
  listar:   (params: { page: number; limit: number; estado?: string }) => api.get<PaginatedResponse<any>>('/productos', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/productos/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/productos', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/productos/${id}`, data),
  inactivar: (id: string)  => api.patch(`/productos/${id}/inactivar`),
  activar: (id: string)    => api.patch(`/productos/${id}/activar`),
};

// ─── Clientes ──────────────────────────────────────────────
export const clientesService = {
  listar:   (params: { page: number; limit: number; search?: string; activo?: boolean }) => api.get<PaginatedResponse<any>>('/clientes', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/clientes/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/clientes', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/clientes/${id}`, data),
  eliminar: (documento: string) => api.delete(`/clientes/documento/${documento}`),
  activar: (documento: string, data: any) => api.patch(`/clientes/documento/${documento}`, { ...data, activo: true }),
};

// ─── Pedidos ───────────────────────────────────────────────
export const pedidosService = {
  listar(params: { page: number; limit: number; search: string; estado: string; proceso?: string; fechaDesde?: string; fechaHasta?: string }) 
  {
    return api.get('/pedidos', { params });
  },
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/pedidos/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/pedidos', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/pedidos/${id}`, data),
  cambiarEstado: (id: string, estado: string) =>
    api.patch<ApiResponse<any>>(`/pedidos/${id}/estado`, { estado }),
  estadisticas: () => api.get<ApiResponse<any>>('/pedidos/estadisticas'),
};

// ─── Decoradoras ───────────────────────────────────────────
export const decoradorasService = {
  listar:   (params: { page: number; limit: number; search?: string; activa?: boolean }) => api.get<PaginatedResponse<any>>('/decoradoras', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/decoradoras/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/decoradoras', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/decoradoras/${id}`, data),
  inactivar: (id: string)  => api.patch(`/decoradoras/${id}/inactivar`),
  activar: (id: string)    => api.patch(`/decoradoras/${id}/activar`),
  resumenPagos: (id: string) => api.get<ApiResponse<any>>(`/decoradoras/${id}/pagos`),
};

// ─── Decoraciones ──────────────────────────────────────────
export const decoracionesService = {
  listar:   (params?: any) => api.get<PaginatedResponse<any>>('/decoraciones', { params }),
  registrarEgreso: (data: any) => api.post<ApiResponse<any>>('/decoraciones/egreso', data),
  registrarIngreso: (id: string, data: any) =>
    api.patch<ApiResponse<any>>(`/decoraciones/${id}/ingreso`, data),
  marcarPagado: (id: string) => api.patch<ApiResponse<any>>(`/decoraciones/${id}/pagar`, {}),
};

// ─── Préstamos ─────────────────────────────────────────────
export const prestamosService = {
  crear:    (data: any)   => api.post<ApiResponse<any>>('/prestamos', data),
  listarPorDecoradora: (id: string) =>
    api.get<ApiResponse<any[]>>(`/prestamos/decoradora/${id}`),
  abonar: (id: string, data: any) =>
    api.post<ApiResponse<any>>(`/prestamos/${id}/abonos`, data),
};

// ─── Empleados ─────────────────────────────────────────────
export const empleadosService = {
  listar:   (params?: any) => api.get<PaginatedResponse<any>>('/empleados', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/empleados/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/empleados', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/empleados/${id}`, data),
};

// ─── Nómina ────────────────────────────────────────────────
export const nominaService = {
  listar:   (params?: any) => api.get<PaginatedResponse<any>>('/nomina', { params }),
  registrar: (data: any)   => api.post<ApiResponse<any>>('/nomina', data),
  totalMes: (mes: string)  => api.get<ApiResponse<any>>('/nomina/total-mes', { params: { mes } }),
};

// ─── Facturas ───────────────────────────────────────────────
export const facturasService = {
  listar:   (params?: any) => api.get<PaginatedResponse<any>>('/facturas', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/facturas/${id}`),
  crear:    (data: any)    => api.post<ApiResponse<any>>('/facturas', data),
  actualizar: (id: string, data: any) => api.patch<ApiResponse<any>>(`/facturas/${id}`, data),
  eliminar: (id: string)   => api.delete(`/facturas/${id}`),
  obtenerPedidosCliente: (clienteId: string) =>
    api.get<ApiResponse<any>>(`/facturas/cliente/${clienteId}/pedidos`),
  obtenerSaldoAnterior: (clienteId: string) =>
    api.get<ApiResponse<any>>(`/facturas/cliente/${clienteId}/saldo-anterior`),
};

// ─── Despachos ─────────────────────────────────────────────
export const despachosService = {
  listar:   (params?: any) => api.get<PaginatedResponse<any>>('/despachos', { params }),
  obtener:  (id: string)   => api.get<ApiResponse<any>>(`/despachos/${id}`),
  despachar: (id: string, data: any) => 
    api.patch<ApiResponse<any>>(`/despachos/${id}/despachar`, data),
};

// ─── Reportes ──────────────────────────────────────────────
export const reportesService = {
  ventasPorCliente: (params: any) =>
    api.get<ApiResponse<any>>('/reportes/ventas-por-cliente', { params }),
  pedidosActivos: () =>
    api.get<ApiResponse<any>>('/reportes/pedidos-activos'),
  pagosDecoradores: () =>
    api.get<ApiResponse<any>>('/reportes/pagos-decoradoras'),
  nominaMes: (mes: string) =>
    api.get<ApiResponse<any>>('/reportes/nomina-mes', { params: { mes } }),
};

// ─── Parametrización ─────────────────────────────────────────
export const parametrizacionService = {
  obtener: () => api.get<ApiResponse<any>>('/parametrizacion'),
  actualizar: (data: any) => api.patch<ApiResponse<any>>('/parametrizacion', data),
};
