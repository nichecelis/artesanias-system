import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Trash2, PlusCircle, X, List } from 'lucide-react';
import { api } from '../../services/api';
import { decoradorasService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const fmt  = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const toDate = (d: any) => d ? new Date(d).toISOString().slice(0,10) : '';
const showDate = (d: any) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

function SelectorBeneficiario({ tipo, selected, onSelect, onClear, error }: any) {
  const [q, setQ]       = useState('');
  const [mode, setMode] = useState<'search'|'list'>('search');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const queryFn = (q: string) => tipo === 'DECORADORA'
    ? decoradorasService.listar({ page: 1, limit: 50, search: q || undefined }).then(r => r.data.data)
    : api.get('/empleados', { params: { search: q || undefined, limit: 50 } }).then(r => r.data.data);

  const { data: searchData } = useQuery({ queryKey: ['ben-search', tipo, q], queryFn: () => queryFn(q), enabled: mode === 'search' && q.length >= 2 });
  const { data: listData }   = useQuery({ queryKey: ['ben-list', tipo], queryFn: () => queryFn(''), enabled: mode === 'list' });
  const items = mode === 'search' ? searchData : listData;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  if (selected) return (
    <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
      <span className="text-sm font-medium">{selected.nombre} <span className="text-gray-400 text-xs ml-1">{selected.documento}</span></span>
      <button type="button" onClick={onClear}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-1">
        <div className="relative flex-1">
          {mode === 'search' && <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>}
          <input className={`input text-sm ${mode === 'search' ? 'pl-9' : 'pl-3'}`}
            placeholder={mode === 'search' ? `Buscar ${tipo === 'DECORADORA' ? 'decoradora' : 'empleado'}...` : 'Filtrar...'}
            value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}/>
        </div>
        <button type="button" onClick={() => { setMode(m => m === 'search' ? 'list' : 'search'); setOpen(true); setQ(''); }}
          className={`px-2.5 rounded-lg border text-sm ${mode === 'list' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
          <List size={15}/>
        </button>
      </div>
      {open && items?.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {items.map((item: any) => (
            <button key={item.id} type="button" onClick={() => { onSelect(item); setQ(''); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0">
              <span className="font-medium">{item.nombre}</span>
              <span className="text-gray-400 text-xs ml-2">{item.documento}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const crearSchema = z.object({
  tipo:           z.enum(['DECORADORA','EMPLEADO']),
  beneficiarioId: z.string().min(1, 'Selecciona beneficiario'),
  monto:          z.coerce.number().positive('Requerido'),
  fecha:          z.string().min(1, 'Requerido'),
  cuotas:      z.coerce.number().int().positive().optional(),
  observacion:    z.string().optional(),
});
const abonoSchema = z.object({
  monto: z.coerce.number().positive('Requerido'),
  fecha: z.string().min(1, 'Requerido'),
});
type CrearForm = z.infer<typeof crearSchema>;
type AbonoForm = z.infer<typeof abonoSchema>;

export default function PrestamosPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [soloSaldo, setSoloSaldo]   = useState(false);
  const [modal, setModal]           = useState<'crear'|'detalle'|null>(null);
  const [selected, setSelected]     = useState<any>(null);
  const [selBenef, setSelBenef]     = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['prestamos', page, search, filtroTipo, soloSaldo],
    queryFn: () => api.get('/prestamos', { params: {
      page, limit: 10,
      search:      search    || undefined,
      tipo:        filtroTipo || undefined,
      soloConSaldo: soloSaldo || undefined,
    }}).then(r => r.data),
  });

  const { data: detalleData, refetch: refetchDetalle } = useQuery({
    queryKey: ['prestamo-detalle', selected?.id],
    queryFn: () => api.get(`/prestamos/${selected.id}`).then(r => r.data.data),
    enabled: Boolean(selected?.id) && modal === 'detalle',
  });

  const crearForm = useForm<CrearForm>({ resolver: zodResolver(crearSchema), defaultValues: { tipo: 'DECORADORA' } });
  const abonoForm = useForm<AbonoForm>({ resolver: zodResolver(abonoSchema) });
  const tipoWatch = crearForm.watch('tipo');

  const closeModal = () => { setModal(null); setSelected(null); setSelBenef(null); crearForm.reset({ tipo: 'DECORADORA' }); abonoForm.reset(); };

  const crear = useMutation({
    mutationFn: (d: CrearForm) => api.post('/prestamos', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      closeModal();
      toast.addToast('Préstamo creado exitosamente', 'success');
    },
  });

  const abonar = useMutation({
    mutationFn: (d: AbonoForm) => api.post(`/prestamos/${selected.id}/abonos`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      refetchDetalle();
      abonoForm.reset();
      toast.addToast('Abono registrado exitosamente', 'success');
    },
  });

  const eliminarAbono = useMutation({
    mutationFn: (abonoId: string) => api.delete(`/prestamos/abonos/${abonoId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prestamos'] }); refetchDetalle(); },
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => api.delete(`/prestamos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prestamos'] }); closeModal(); },
    onError: () => toast.addToast('No se puede eliminar: tiene abonos registrados', 'error'),
  });

  const columns = [
    { key: 'beneficiario', header: 'Beneficiario', render: (r: any) => (
      <div>
        <p className="font-medium">{r.decoradora?.nombre ?? r.empleado?.nombre ?? '—'}</p>
        <p className="text-xs text-gray-400">{r.decoradora?.documento ?? r.empleado?.documento ?? ''}</p>
      </div>
    )},
    { key: 'tipo', header: 'Tipo', render: (r: any) => (
      <span className={`badge ${r.decoradoraId ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
        {r.decoradoraId ? 'Decoradora' : 'Empleado'}
      </span>
    )},
    { key: 'fecha',  header: 'Fecha',  render: (r: any) => showDate(r.fecha) },
    { key: 'monto',        header: 'Monto inicial', render: (r: any) => fmt(r.monto) },
    { key: 'totalAbonado', header: 'Abonado',        render: (r: any) => <span className="text-green-700">{fmt(r.totalAbonado)}</span> },
    { key: 'saldo',        header: 'Saldo / Deuda',  render: (r: any) => (
      <span className={Number(r.saldo) > 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
        {fmt(r.saldo)}{Number(r.saldo) === 0 ? ' ✓' : ''}
      </span>
    )},
    { key: 'cuotas', header: 'Cuotas', render: (r: any) => r.cuotas ? `${r._count?.abonos ?? 0} / ${r.cuotas}` : '—' },
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setSelected(r); setModal('detalle'); }}
          className="text-xs btn-secondary py-1 px-2">Ver / Abonar</button>
        <button onClick={() => { if (confirm('¿Eliminar préstamo?')) eliminar.mutate(r.id); }}
          className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Préstamos</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} préstamos registrados</p>
        </div>
        <button onClick={() => setModal('crear')} className="btn-primary"><Plus size={16}/> Nuevo préstamo</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar por nombre..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <select className="input w-44" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos</option>
          <option value="DECORADORA">Decoradoras</option>
          <option value="EMPLEADO">Empleados</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={soloSaldo} onChange={e => setSoloSaldo(e.target.checked)} className="w-4 h-4"/>
          Solo con saldo
        </label>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen/> : !data?.data?.length ? (
          <EmptyState message="Sin préstamos" action={<button onClick={() => setModal('crear')} className="btn-primary">Nuevo préstamo</button>}/>
        ) : (
          <>
            <Table columns={columns} data={data.data}/>
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/>
          </>
        )}
      </div>

      {/* Modal Crear */}
      <Modal title="Nuevo préstamo" open={modal === 'crear'} onClose={closeModal}>
        <form onSubmit={crearForm.handleSubmit(d => crear.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Tipo de beneficiario *</label>
            <select {...crearForm.register('tipo')} className="input"
              onChange={e => { crearForm.setValue('tipo', e.target.value as any); crearForm.setValue('beneficiarioId', ''); setSelBenef(null); }}>
              <option value="DECORADORA">Decoradora</option>
              <option value="EMPLEADO">Empleado</option>
            </select>
          </div>
          <div>
            <label className="label">{tipoWatch === 'DECORADORA' ? 'Decoradora' : 'Empleado'} *</label>
            <SelectorBeneficiario
              tipo={tipoWatch}
              selected={selBenef}
              onSelect={(b: any) => { setSelBenef(b); crearForm.setValue('beneficiarioId', b.id, { shouldValidate: true }); }}
              onClear={() => { setSelBenef(null); crearForm.setValue('beneficiarioId', ''); }}
              error={crearForm.formState.errors.beneficiarioId?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monto *</label>
              <input {...crearForm.register('monto')} type="number" min={1} step={0.01} className="input"/>
              {crearForm.formState.errors.monto && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.monto.message}</p>}
            </div>
            <div>
              <label className="label">Fecha *</label>
              <input {...crearForm.register('fecha')} type="date" className="input"/>
              {crearForm.formState.errors.fecha && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.fecha.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Cantidad de cuotas</label>
            <input {...crearForm.register('cuotas')} type="number" min={1} placeholder="Ej: 12" className="input"/>
          </div>
          <div>
            <label className="label">Observación</label>
            <textarea {...crearForm.register('observacion')} rows={2} className="input"/>
          </div>
          {crear.isError && <p className="text-red-500 text-sm">Error al crear préstamo</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={crear.isPending} className="btn-primary">
              {crear.isPending ? <Spinner size="sm"/> : 'Crear préstamo'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle / Abonos */}
      <Modal title={`Préstamo — ${detalleData?.decoradora?.nombre ?? detalleData?.empleado?.nombre ?? ''}`} open={modal === 'detalle'} onClose={closeModal}>
        {!detalleData ? <div className="flex justify-center py-8"><Spinner/></div> : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Monto inicial</p>
                <p className="font-bold text-lg">{fmt(detalleData.monto)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">Total abonado</p>
                <p className="font-bold text-lg text-green-700">{fmt(Number(detalleData.monto) - Number(detalleData.saldo))}</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${Number(detalleData.saldo) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-400">Saldo</p>
                <p className={`font-bold text-lg ${Number(detalleData.saldo) > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(detalleData.saldo)}</p>
              </div>
            </div>

            {detalleData.observacion && (
              <p className="text-sm text-gray-500 italic bg-gray-50 rounded p-2">{detalleData.observacion}</p>
            )}

            {/* Nuevo abono */}
            {Number(detalleData.saldo) > 0 && (
              <form onSubmit={abonoForm.handleSubmit(d => abonar.mutate(d))} className="border border-gray-200 rounded-lg p-3 space-y-3">
                <p className="text-sm font-medium text-gray-700">Registrar abono</p>
                <div className="flex gap-2">
                  <input {...abonoForm.register('monto')} type="number" min={1} step={0.01}
                    placeholder={`Máx: ${fmt(detalleData.saldo)}`} className="input flex-1 text-sm"/>
                  <input {...abonoForm.register('fecha')} type="date" className="input w-36 text-sm"/>
                  <button type="submit" disabled={abonar.isPending} className="btn-primary text-sm px-3">
                    {abonar.isPending ? <Spinner size="sm"/> : <PlusCircle size={16}/>}
                  </button>
                </div>
                {(abonoForm.formState.errors.monto || abonoForm.formState.errors.fecha) && (
                  <p className="text-red-500 text-xs">Ingresa monto y fecha válidos</p>
                )}
                {abonar.isError && <p className="text-red-500 text-xs">Error al registrar abono</p>}
              </form>
            )}

            {/* Lista abonos */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Abonos ({detalleData.abonos?.length ?? 0})</p>
              {detalleData.abonos?.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-3">Sin abonos registrados</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {detalleData.abonos?.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                      <span className="text-gray-500">{showDate(a.fecha)}</span>
                      <span className="font-medium text-green-700">{fmt(a.monto)}</span>
                      <button onClick={() => { if (confirm('¿Eliminar abono?')) eliminarAbono.mutate(a.id); }}
                        className="text-gray-300 hover:text-red-500"><X size={13}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
