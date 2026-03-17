import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, DollarSign, X } from 'lucide-react';
import { productosService, clientesService } from '../../services';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const schema = z.object({
  nombre:           z.string().min(2),
  descripcion:      z.string().optional(),
  precioVenta:      z.coerce.number().min(0),
  precioDecoracion: z.coerce.number().min(0),
});
type Form = z.infer<typeof schema>;

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;

// ── Buscador de cliente inline ───────────────────────────────
function ClienteSearch({ onSelect }: { onSelect: (c: any) => void }) {
  const [q, setQ]     = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['clientes-search-precios', q],
    queryFn: () => clientesService.listar({ page: 1, limit: 8, search: q }).then(r => r.data.data),
    enabled: q.length >= 2,
  });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9 text-sm" placeholder="Buscar cliente por nombre o documento..."
          value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} />
      </div>
      {open && data && data.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {data.map((c: any) => (
            <button key={c.id} type="button" onClick={() => { onSelect(c); setQ(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0">
              <span className="font-medium">{c.nombre}</span>
              <span className="text-gray-400 ml-2 text-xs">{c.documento}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductosPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [preciosModal, setPreciosModal] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [clienteSelec, setClienteSelec] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['productos', page, search],
    queryFn: () => productosService.listar({ page, limit: 20, search: search || undefined }).then(r => r.data),
  });

  const { data: precios, refetch: refetchPrecios } = useQuery({
    queryKey: ['precios-producto', selected?.id],
    queryFn: () => api.get(`/precios/producto/${selected.id}`).then(r => r.data.data),
    enabled: Boolean(selected?.id),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const openNew  = () => { setEditing(null); reset({ precioVenta: 0, precioDecoracion: 0 }); setModal(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    reset({ nombre: row.nombre, descripcion: row.descripcion ?? '', precioVenta: Number(row.precioVenta), precioDecoracion: Number(row.precioDecoracion) });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); };

  const openPrecios = (row: any) => { setSelected(row); setClienteSelec(null); setNuevoPrecio(''); setPreciosModal(true); };
  const closePrecios = () => { setPreciosModal(false); setSelected(null); setClienteSelec(null); setNuevoPrecio(''); };

  const save = useMutation({
    mutationFn: (d: Form) => editing ? productosService.actualizar(editing.id, d) : productosService.crear(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['productos'] }); closeModal(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => productosService.eliminar(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productos'] }),
    onError: () => alert('No se puede eliminar: el producto tiene registros asociados'),
  });

  const upsertPrecio = useMutation({
    mutationFn: () => 
      api.put(`/precios/${clienteSelec.id}/${selected.id}`, { // 👈 orden correcto
        precio: Number(nuevoPrecio) // 👈 nombre correcto
      }),
    onSuccess: () => { 
      refetchPrecios(); 
      setClienteSelec(null); 
      setNuevoPrecio(''); 
    },
  });

  const deletePrecio = useMutation({
    mutationFn: (clienteId: string) => 
      api.delete(`/precios/${clienteId}/${selected.id}`),
    onSuccess: () => refetchPrecios(),
  });

  const columns = [
    { key: 'nombre',           header: 'Nombre' },
    { key: 'precioVenta',      header: 'Precio base',       render: (r: any) => fmt(r.precioVenta) },
    { key: 'precioDecoracion', header: 'Precio decoración', render: (r: any) => fmt(r.precioDecoracion) },
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openPrecios(r)} className="text-gray-400 hover:text-green-600" title="Precios por cliente"><DollarSign size={15} /></button>
        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-primary-600"><Pencil size={15} /></button>
        <button onClick={() => { if (confirm('¿Eliminar producto?')) remove.mutate(r.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Productos</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} productos</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nuevo producto</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar producto..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen /> : !data?.data?.length ? (
          <EmptyState message="Sin productos" action={<button onClick={openNew} className="btn-primary">Agregar producto</button>} />
        ) : (
          <>
            <Table columns={columns} data={data.data} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modal producto */}
      <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} open={modal} onClose={closeModal}>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input {...register('nombre')} className="input" />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea {...register('descripcion')} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Precio venta base *</label>
              <input {...register('precioVenta')} type="number" min={0} step={0.01} className="input" />
            </div>
            <div>
              <label className="label">Precio decoración *</label>
              <input {...register('precioDecoracion')} type="number" min={0} step={0.01} className="input" />
            </div>
          </div>
          {save.isError && <p className="text-red-500 text-sm">Error al guardar</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || save.isPending} className="btn-primary">
              {(isSubmitting || save.isPending) ? <Spinner size="sm" /> : (editing ? 'Guardar' : 'Crear')}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal precios por cliente */}
      <Modal title={`Precios por cliente — ${selected?.nombre}`} open={preciosModal} onClose={closePrecios}>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            Precio base: <strong>{fmt(selected?.precioVenta)}</strong>. Los precios por cliente sobreescriben este valor.
          </div>

          {/* Agregar precio */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Agregar / actualizar precio</p>
            <ClienteSearch onSelect={c => { setClienteSelec(c); setNuevoPrecio(''); }} />
            {clienteSelec && (
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-primary-50 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
                  <span>{clienteSelec.nombre}</span>
                  <button onClick={() => setClienteSelec(null)}><X size={13} className="text-gray-400" /></button>
                </div>
                <input type="number" min={0} step={0.01} placeholder="Precio" value={nuevoPrecio}
                  onChange={e => setNuevoPrecio(e.target.value)}
                  className="input w-36 text-sm" />
                <button onClick={() => nuevoPrecio && upsertPrecio.mutate()}
                  disabled={!nuevoPrecio || upsertPrecio.isPending}
                  className="btn-primary text-sm py-2 px-3">
                  {upsertPrecio.isPending ? <Spinner size="sm" /> : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          {/* Lista de precios */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Precios configurados ({precios?.length ?? 0})</p>
            {!precios?.length ? (
              <p className="text-sm text-gray-400 italic text-center py-4">Sin precios especiales por cliente</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {precios.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{p.cliente.nombre}</span>
                      <span className="text-gray-400 text-xs ml-2">{p.cliente.documento}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary-700">{fmt(p.precioVenta)}</span>
                      <button onClick={() => { if (confirm('¿Eliminar precio?')) deletePrecio.mutate(p.clienteId); }}
                        className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
