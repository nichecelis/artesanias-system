import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Package, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, X } from 'lucide-react';
import { despachosService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const toDate = (d: any) => {
  if (!d) return '';
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return '';
};
const showDate = (d: any) => {
  if (!d) return '—';
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, day] = match;
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${Number(day)} ${meses[Number(m) - 1]} ${y}`;
  }
  return d;
};

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'DESPACHADO':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={12}/> Despachado</span>;
    case 'COMPLETO':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Completo</span>;
    case 'PARCIAL':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock size={12}/> Parcial</span>;
    case 'PENDIENTE':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1"><AlertCircle size={12}/> Pendiente</span>;
    case 'SIN_INGRESO':
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Sin ingreso</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{estado}</span>;
  }
};

export default function DespachosPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());

  const { data: response, isLoading } = useQuery({
    queryKey: ['despachos', page, search],
    queryFn: () => despachosService.listar({ page, limit: 10, search: search || undefined }),
  });

  const data = response?.data?.data || { items: [], total: 0 };
  const items = data.items || [];
  const total = data.total || 0;

  const togglePedido = (pedidoId: string) => {
    setExpandedPedidos(prev => {
      const s = new Set(prev);
      s.has(pedidoId) ? s.delete(pedidoId) : s.add(pedidoId);
      return s;
    });
  };

  const openModal = (item: any) => {
    setSelected(item);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setSelected(null);
  };

  const getProgreso = (item: any) => {
    const pedido = item.cantidadPedido || 0;
    const despachado = item.cantidadDespacho || 0;
    if (pedido === 0) return 0;
    return Math.round((despachado / pedido) * 100);
  };

  const columns = [
    { key: 'pedido', header: 'Pedido', render: (r: any) => (
      <div className="flex items-center gap-2">
        <button onClick={() => togglePedido(r.pedidoId)} className="text-gray-400 hover:text-gray-600">
          {expandedPedidos.has(r.pedidoId) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
        </button>
        <span className="font-medium">{r.pedido?.codigo}</span>
      </div>
    )},
    { key: 'cliente', header: 'Cliente', render: (r: any) => (
      <div className="text-sm">
        <p className="font-medium">{r.pedido?.cliente?.nombre}</p>
        <p className="text-gray-500 text-xs">{r.pedido?.cliente?.documento}</p>
      </div>
    )},
    { key: 'producto', header: 'Producto', render: (r: any) => (
      <span className="text-sm">{r.producto?.nombre}</span>
    )},
    { key: 'pedido', header: 'Pedido', render: (r: any) => (
      <span className="text-center font-medium">{r.cantidadPedido ?? 0}</span>
    )},
    { key: 'despacho', header: 'Despachado', render: (r: any) => (
      <div className="text-center">
        <span className="font-medium">{r.cantidadDespacho ?? 0}</span>
        {r.cantidadPedido && (
          <span className="text-gray-400 text-xs"> / {r.cantidadPedido}</span>
        )}
      </div>
    )},
    { key: 'progreso', header: 'Progreso', render: (r: any) => {
      const pct = getProgreso(r);
      return (
        <div className="w-24">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-orange-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8">{pct}%</span>
          </div>
        </div>
      );
    }},
    { key: 'fechaDespacho', header: 'Último Despacho', render: (r: any) => (
      <span className="text-sm">{showDate(r.fechaDespacho)}</span>
    )},
    { key: 'estado', header: 'Estado', render: (r: any) => getEstadoBadge(r.estadoCalculado) },
    { key: 'acciones', header: '', render: (r: any) => (
      <button 
        onClick={() => openModal(r)} 
        className="text-blue-600 hover:text-blue-800"
        disabled={r.cantidadDespacho >= r.cantidadPedido}
      >
        <Package size={16}/>
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Despachos</h1>
          <p className="text-gray-500 text-sm">{total} productos listos para despachar</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar por pedido, cliente o producto..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen/> : !items.length ? (
          <EmptyState message="No hay productos para despachar" />
        ) : (
          <>
            <Table columns={columns} data={items}/>
            <Pagination page={page} totalPages={Math.ceil(total / 10)} onChange={setPage}/>
          </>
        )}
      </div>

      {/* Modal Registrar Despacho */}
      <Modal title="Registrar Despacho" open={modal} onClose={closeModal} size="lg">
        {selected && (
          <DespachoForm item={selected} onClose={closeModal} onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['despachos'] });
            closeModal();
            toast.addToast('Despacho registrado exitosamente', 'success');
          }} />
        )}
      </Modal>
    </div>
  );
}

function DespachoForm({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess: () => void }) {
  const toast = useToastStore();
  const [caja1Fecha, setCaja1Fecha] = useState(toDate(item.fechaDespacho) || '');
  const [caja1Cantidad, setCaja1Cantidad] = useState(0);
  const [caja2Fecha, setCaja2Fecha] = useState('');
  const [caja2Cantidad, setCaja2Cantidad] = useState(0);
  const [caja3Fecha, setCaja3Fecha] = useState('');
  const [caja3Cantidad, setCaja3Cantidad] = useState(0);

  const mutation = useMutation({
    mutationFn: (data: any) => despachosService.despachar(item.id, data),
    onSuccess,
    onError: (err: any) => toast.addToast(err.response?.data?.message || 'Error al registrar despacho', 'error'),
  });

  const totalPedido = item.cantidadPedido || 0;
  const yaDespachado = item.cantidadDespacho || 0;
  const disponible = totalPedido - yaDespachado;
  const totalCajas = caja1Cantidad + caja2Cantidad + caja3Cantidad;
  const restante = Math.max(0, disponible - totalCajas);

  const handleSubmit = () => {
    const data: any = {};
    if (caja1Fecha && caja1Cantidad > 0) {
      data.caja1Fecha = caja1Fecha;
      data.caja1Cantidad = caja1Cantidad;
    }
    if (caja2Fecha && caja2Cantidad > 0) {
      data.caja2Fecha = caja2Fecha;
      data.caja2Cantidad = caja2Cantidad;
    }
    if (caja3Fecha && caja3Cantidad > 0) {
      data.caja3Fecha = caja3Fecha;
      data.caja3Cantidad = caja3Cantidad;
    }
    
    if (Object.keys(data).length === 0) {
      toast.addToast('Ingrese al menos una caja con fecha y cantidad', 'error');
      return;
    }
    
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Info del producto */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Pedido</p>
            <p className="font-medium">{item.pedido?.codigo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Cliente</p>
            <p className="font-medium">{item.pedido?.cliente?.nombre}</p>
            <p className="text-xs text-gray-500">{item.pedido?.cliente?.documento}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Producto</p>
            <p className="font-medium">{item.producto?.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Progreso</p>
            <p className="font-medium">
              {yaDespachado} / {totalPedido} unidades despachadas
              <span className="text-gray-500 text-xs ml-2">
                ({Math.round((yaDespachado / totalPedido) * 100) || 0}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Campos de cajas */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700">Cajas</h3>
        
        <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-600">Caja #1</div>
          <div className="space-y-2">
            <div>
              <label className="label text-xs">Fecha despacho</label>
              <input type="date" className="input" value={caja1Fecha} onChange={e => setCaja1Fecha(e.target.value)}/>
            </div>
            <div>
              <label className="label text-xs">Cantidad</label>
              <input type="number" min="0" max={disponible} className="input" value={caja1Cantidad} onChange={e => setCaja1Cantidad(parseInt(e.target.value) || 0)}/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-600">Caja #2</div>
          <div className="space-y-2">
            <div>
              <label className="label text-xs">Fecha despacho</label>
              <input type="date" className="input" value={caja2Fecha} onChange={e => setCaja2Fecha(e.target.value)}/>
            </div>
            <div>
              <label className="label text-xs">Cantidad</label>
              <input type="number" min="0" max={disponible - caja1Cantidad} className="input" value={caja2Cantidad} onChange={e => setCaja2Cantidad(parseInt(e.target.value) || 0)}/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-600">Caja #3</div>
          <div className="space-y-2">
            <div>
              <label className="label text-xs">Fecha despacho</label>
              <input type="date" className="input" value={caja3Fecha} onChange={e => setCaja3Fecha(e.target.value)}/>
            </div>
            <div>
              <label className="label text-xs">Cantidad</label>
              <input type="number" min="0" max={disponible - caja1Cantidad - caja2Cantidad} className="input" value={caja3Cantidad} onChange={e => setCaja3Cantidad(parseInt(e.target.value) || 0)}/>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Total unidades despachadas:</span>
          <span className="font-medium text-blue-800">{yaDespachado + totalCajas}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Unidades restantes:</span>
          <span className="font-medium text-blue-800">{restante}</span>
        </div>
        {restante === 0 && (
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm mt-2 pt-2 border-t border-blue-200">
            <CheckCircle size={16}/> ¡Producto completamente despachado!
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Spinner size="sm"/> : 'Registrar Despacho'}
        </button>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
      </div>
    </div>
  );
}
