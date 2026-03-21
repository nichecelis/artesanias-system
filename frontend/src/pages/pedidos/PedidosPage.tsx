import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Pencil, CheckCircle } from 'lucide-react';
import { pedidosService } from '../../services';
import { Table, EstadoBadge, Pagination, LoadingScreen, EmptyState } from '../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = ['PENDIENTE', 'EN_CORTE', 'EN_DECORACION', 'LISTO', 'DESPACHADO', 'CANCELADO'];
const PROCESO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-gray-100 text-gray-700',
  EN_CORTE: 'bg-blue-100 text-blue-700',
  EN_DECORACION: 'bg-purple-100 text-purple-700',
  LISTO: 'bg-green-100 text-green-700',
  DESPACHADO: 'bg-yellow-100 text-yellow-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

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
  const [proceso, setProceso] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: response, isLoading, refetch } = useQuery<PedidosFetchResponse>({
    queryKey: ['pedidos', page, search, estado, proceso, fechaDesde, fechaHasta],
    queryFn: () => pedidosService.listar({
      page,
      limit: 20,
      search,
      estado,
      proceso,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined
    }) as any,
  });

  const pedidos = response?.data?.data || [];
  const totalPages = response?.data?.meta?.totalPages || 1;

  const cambiarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      pedidosService.cambiarEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      alert('✅ Estado del pedido actualizado exitosamente');
    },
  });

  const getEstadoColor = (estado: string) => PROCESO_COLORS[estado] || 'bg-gray-100 text-gray-700';

  const columns = [
    { key: 'codigo', header: 'Código' },

    {
      key: 'fecha',
      header: 'Fecha',
      render: (r: any) => {
        try {
          const f = r.createdAt || r.fecha;
          const date = new Date(f);
          if (!f || isNaN(date.getTime())) return '—';
          return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
        } catch {
          return '—';
        }
      }
    },

    { key: 'cliente', header: 'Cliente', render: (r: any) => r.cliente?.nombre ?? '—' },

    {
      key: 'productos',
      header: 'Productos',
      render: (r: any) => (
        <div className="flex flex-col gap-1 max-w-xs">
          {r.productos?.map((pp: any) => (
            <div key={pp.id} className="text-xs flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
              <span className="font-medium truncate max-w-[120px]">{pp.producto?.nombre ?? '—'}</span>
              <span className="text-gray-500">x{pp.cantidadPedido}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getEstadoColor(pp.estado)}`}>
                {pp.estado?.replace('EN_', '')}
              </span>
            </div>
          ))}
        </div>
      )
    },

    {
      key: 'estadoGlobal',
      header: 'Estado',
      render: (r: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoColor(r.estadoCalculado || r.estado)}`}>
          {(r.estadoCalculado || r.estado)?.replace('EN_', ' ')}
        </span>
      )
    },

    {
      key: 'acciones',
      header: 'Acciones',
      render: (r: any) => (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/pedidos/${r.id}`)}
            className="text-gray-400 hover:text-blue-600"
            title="Ver / Editar"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => navigate(`/pedidos/${r.id}?edit=true`)}
            className="text-gray-400 hover:text-primary-600"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <select
            value={r.estadoCalculado || r.estado}
            onChange={(e) => cambiarEstado.mutate({ id: r.id, estado: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="text-xs border rounded px-1 py-0.5 bg-white"
          >
            {ESTADOS.filter(s => s !== 'CANCELADO').map((s) => (
              <option key={s} value={s}>{s.replace('EN_', ' ')}</option>
            ))}
          </select>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-gray-500 text-sm">{response?.data?.meta?.total ?? 0} pedidos en total</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')} className="btn-primary">
          <Plus size={18} /> Nuevo pedido
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded"
              placeholder="Buscar por código o cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="border rounded px-4 py-2"
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1); }}
          >
            <option value="">Todos</option>
            {ESTADOS.filter(s => s !== 'CANCELADO').map(s => (
              <option key={s} value={s}>{s.replace('EN_', ' ')}</option>
            ))}
          </select>
          <select
            className="border rounded px-4 py-2"
            value={proceso}
            onChange={(e) => { setProceso(e.target.value); setPage(1); }}
          >
            <option value="">Por proceso</option>
            <option value="sin_corte">Sin iniciar corte</option>
            <option value="en_corte">En corte</option>
            <option value="sin_decoracion">Sin decoración</option>
            <option value="en_decoracion">En decoración</option>
            <option value="sin_despacho">Sin despacho</option>
            <option value="despachados">Despachados</option>
          </select>
          <input
            type="date"
            className="border rounded px-4 py-2"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            title="Fecha desde"
          />
          <input
            type="date"
            className="border rounded px-4 py-2"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            title="Fecha hasta"
          />
          {(estado || proceso || fechaDesde || fechaHasta) && (
            <button
              onClick={() => {
                setEstado('');
                setProceso('');
                setFechaDesde('');
                setFechaHasta('');
                setPage(1);
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
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
