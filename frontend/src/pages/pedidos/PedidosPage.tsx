import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import { pedidosService } from '../../services';
import { Table, EstadoBadge, Pagination, LoadingScreen, EmptyState } from '../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = ['PENDIENTE','EN_CORTE','EN_DECORACION','LISTO','DESPACHADO','CANCELADO'];

export default function PedidosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pedidos', page, search, estado],
    queryFn: () => pedidosService.listar({ page, limit: 20, search: search || undefined, estado: estado || undefined }).then((r) => r.data),
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      pedidosService.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  });

  const columns = [
    { key: 'codigo',         header: 'Código' },
    { key: 'cliente',        header: 'Cliente',        render: (r: any) => r.cliente?.nombre ?? '—' },
    { key: 'cantidadPedido', header: 'Cantidad' },
    { key: 'estado',         header: 'Estado',         render: (r: any) => <EstadoBadge estado={r.estado} /> },
    { key: 'createdAt',      header: 'Fecha',          render: (r: any) => format(new Date(r.createdAt), 'dd MMM yyyy', { locale: es }) },
    { key: 'acciones',       header: '',               render: (r: any) => (
      <select
        value={r.estado}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => cambiarEstado.mutate({ id: r.id, estado: e.target.value })}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
      >
        {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Pedidos</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} pedidos en total</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')} className="btn-primary">
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por código o cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-48"
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPage(1); }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <LoadingScreen />
        ) : !data?.data?.length ? (
          <EmptyState
            message="No hay pedidos"
            action={<button onClick={() => navigate('/pedidos/nuevo')} className="btn-primary">Crear primer pedido</button>}
          />
        ) : (
          <>
            <Table columns={columns} data={data.data} onRowClick={(r) => navigate(`/pedidos/${r.id}`)} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
