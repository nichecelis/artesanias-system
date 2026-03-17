import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar } from 'lucide-react';
import { pedidosService } from '../../services';
import { Table, EstadoBadge, Pagination, LoadingScreen, EmptyState } from '../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = ['PENDIENTE', 'EN_CORTE', 'EN_DECORACION', 'LISTO', 'DESPACHADO', 'CANCELADO'];

interface PedidosFetchResponse {
  data: {
    data: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export default function PedidosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: response, isLoading } = useQuery<PedidosFetchResponse>({
  queryKey: ['pedidos', page, search, estado, fechaDesde, fechaHasta],
  queryFn: () => pedidosService.listar({ 
  page, 
  limit: 20, 
  search, 
  estado,
  fechaDesde: fechaDesde || undefined,
  fechaHasta: fechaHasta || undefined
}) as any,
});

  // Extracción segura: pedidos ahora lee de response.data
  const pedidos = response?.data?.data || [];
  const totalPages = response?.data?.meta?.totalPages || 1;

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      pedidosService.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  });

  const columns = [
  { key: 'codigo', header: 'Código' },
  { key: 'cliente', header: 'Cliente', render: (r: any) => r.cliente?.nombre ?? '—' },
  { 
    key: 'progreso', 
    header: 'Items / Estado', 
    render: (r: any) => (
      <div className="flex flex-col gap-1">
        {r.productos?.map((pp: any) => (
          <div key={pp.id} className="text-[10px] flex items-center gap-2">
            <span className="font-medium">{pp.producto.nombre}:</span>
            <EstadoBadge estado={pp.estado} />
          </div>
        ))}
      </div>
    ) 
  },
    { 
      key: 'acciones', 
      header: 'Acciones', 
      render: (r: any) => (
        <select
          value={r.estado}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => cambiarEstado.mutate({ id: r.id, estado: e.target.value })}
          className="text-xs border rounded px-1 py-0.5"
        >
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <button onClick={() => navigate('/pedidos/nuevo')} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Nuevo pedido
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input 
            className="w-full pl-10 pr-4 py-2 border rounded" 
            placeholder="Buscar pedido..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          />
        </div>
        <select className="border rounded px-4" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input 
          type="date"
          className="border rounded px-4 py-2"
          value={fechaDesde}
          onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
        />
        <input
          type="date"
          className="border rounded px-4 py-2"
          value={fechaHasta}
          onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingScreen />
        ) : pedidos.length === 0 ? (
          <EmptyState message="No se encontraron pedidos" />
        ) : (
          <>
            <Table columns={columns} data={pedidos} onRowClick={(r: any) => navigate(`/pedidos/${r.id}`)} />
            <div className="p-4 border-t">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
