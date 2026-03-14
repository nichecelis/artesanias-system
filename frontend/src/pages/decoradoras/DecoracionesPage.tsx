import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, CheckCircle, X, List } from 'lucide-react';
import { api } from '../../services/api';
import { decoradorasService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const fmt    = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const toDate = (d: any) => d ? new Date(d).toISOString().slice(0,10) : '';
const showDate = (d: any) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

// ── Selector con búsqueda + listado ──────────────────────────
function Selector({ label, placeholder, queryKey, queryFn, displayFn, subFn, selected, onSelect, onClear, error }: any) {
  const [q, setQ]       = useState('');
  const [mode, setMode] = useState<'search'|'list'>('search');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: sData } = useQuery({ queryKey: [queryKey+'-s', q], queryFn: () => queryFn(q), enabled: mode==='search' && q.length>=2 });
  const { data: lData } = useQuery({ queryKey: [queryKey+'-l'],    queryFn: () => queryFn(''), enabled: mode==='list' });
  const items = mode==='search' ? sData : lData;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  if (selected) return (
    <div>
      {label && <label className="label">{label} *</label>}
      <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
        <span className="text-sm font-medium">{displayFn(selected)} {subFn && <span className="text-gray-400 text-xs ml-1">{subFn(selected)}</span>}</span>
        <button type="button" onClick={onClear}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div>
      {label && <label className="label">{label} *</label>}
      <div ref={ref} className="relative">
        <div className="flex gap-1">
          <div className="relative flex-1">
            {mode==='search' && <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>}
            <input className={`input text-sm ${mode==='search'?'pl-9':'pl-3'}`} placeholder={mode==='search' ? placeholder : 'Filtrar...'}
              value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}/>
          </div>
          <button type="button" onClick={()=>{setMode(m=>m==='search'?'list':'search');setOpen(true);setQ('');}}
            className={`px-2.5 rounded-lg border text-sm ${mode==='list'?'bg-primary-50 border-primary-300 text-primary-700':'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
            <List size={15}/>
          </button>
        </div>
        {open && items?.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {items.map((item: any) => (
              <button key={item.id} type="button" onClick={()=>{onSelect(item);setQ('');setOpen(false);}}
                className="w-full text-left px-3 py-2.5 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0">
                <span className="font-medium">{displayFn(item)}</span>
                {subFn && <span className="text-gray-400 text-xs ml-2">{subFn(item)}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const itemSchema = z.object({
  pedidoId:      z.string().min(1,'Requerido'),
  productoId:    z.string().min(1,'Requerido'),
  cantidadEgreso:z.coerce.number().int().positive('Requerido'),
  fechaEgreso:   z.string().min(1,'Requerido'),
});

const crearSchema = z.object({
  decoradoraId: z.string().min(1,'Selecciona decoradora'),
  items: z.array(itemSchema).min(1,'Agrega al menos un ítem'),
});

const editarSchema = z.object({
  fechaEgreso:     z.string().optional(),
  cantidadEgreso:  z.coerce.number().int().positive().optional(),
  fechaIngreso:    z.string().optional(),
  cantidadIngreso: z.coerce.number().int().min(0).optional(),
  arreglos:        z.coerce.number().int().min(0).optional(),
  perdidas:        z.coerce.number().int().min(0).optional(),
  compras:         z.coerce.number().min(0).optional(),
  abonosPrestamo:  z.coerce.number().min(0).optional(),
  prestamoId:      z.string().optional(),
});

type CrearForm  = z.infer<typeof crearSchema>;
type EditarForm = z.infer<typeof editarSchema>;

// Estado de selector por ítem
type ItemState = { pedido: any; producto: any; };

export default function DecoracionesPage() {
  const qc = useQueryClient();
  const [page,setPage]           = useState(1);
  const [search,setSearch]       = useState('');
  const [filtroDoc,setFiltroDoc] = useState('');
  const [modal,setModal]         = useState<'crear'|'editar'|null>(null);
  const [editing,setEditing]     = useState<any>(null);
  const [selDec,setSelDec]       = useState<any>(null);
  const [itemStates,setItemStates] = useState<ItemState[]>([{pedido:null,producto:null}]);

  const { data: todasDec } = useQuery({
    queryKey:['dec-filtro'], queryFn:()=>decoradorasService.listar({page:1,limit:500}).then(r=>r.data.data)
  });

  const { data, isLoading } = useQuery({
    queryKey:['decoraciones',page,search,filtroDoc],
    queryFn:()=>api.get('/decoraciones',{params:{page,limit:20,search:search||undefined,decoradoraId:filtroDoc||undefined}}).then(r=>r.data),
  });

  const { data: prestamosDecoradora } = useQuery({
    queryKey: ['prestamos-dec-edit', editing?.decoradora?.id],
    queryFn: () => api.get('/prestamos', { params: { decoradoraId: editing.decoradora.id, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled: Boolean(editing?.decoradora?.id) && modal === 'editar',
  });

  const crearForm  = useForm<CrearForm>({resolver:zodResolver(crearSchema),defaultValues:{items:[{pedidoId:'',productoId:'',cantidadEgreso:1,fechaEgreso:''}]}});
  const editarForm = useForm<EditarForm>({resolver:zodResolver(editarSchema)});
  const {fields,append,remove} = useFieldArray({control:crearForm.control,name:'items'});

  const setItemState = (idx:number, partial:Partial<ItemState>) =>
    setItemStates(prev => { const n=[...prev]; n[idx]={...n[idx],...partial}; return n; });

  const addItem = () => {
    append({pedidoId:'',productoId:'',cantidadEgreso:1,fechaEgreso:''});
    setItemStates(prev=>[...prev,{pedido:null,producto:null}]);
  };

  const removeItem = (idx:number) => {
    remove(idx);
    setItemStates(prev=>prev.filter((_,i)=>i!==idx));
  };

  const closeModal = () => {
    setModal(null); setEditing(null); setSelDec(null);
    setItemStates([{pedido:null,producto:null}]);
    crearForm.reset({items:[{pedidoId:'',productoId:'',cantidadEgreso:1,fechaEgreso:''}]});
    editarForm.reset();
  };

  const openEditar = (row:any) => {
    setEditing(row);
    editarForm.reset({
      fechaEgreso:     toDate(row.fechaEgreso),
      cantidadEgreso:  row.cantidadEgreso,
      fechaIngreso:    toDate(row.fechaIngreso),
      cantidadIngreso: row.cantidadIngreso??undefined,
      arreglos:        row.arreglos??0,
      perdidas:        row.perdidas??0,
      compras:         Number(row.compras)??0,
    });
    setModal('editar');
  };

  const crear = useMutation({
    mutationFn: async (d:CrearForm) => {
      const calls = d.items.map(item => api.post('/decoraciones',{
        decoradoraId: d.decoradoraId,
        pedidoId:     item.pedidoId,
        productoId:   item.productoId,
        fechaEgreso:  item.fechaEgreso,
        cantidadEgreso: item.cantidadEgreso,
      }));
      return Promise.all(calls);
    },
    onSuccess: () => { qc.invalidateQueries({queryKey:['decoraciones']}); closeModal(); },
  });

  const editar = useMutation({
    mutationFn:(d:EditarForm)=>{
      const p:any={...d};
      if(!p.fechaIngreso) delete p.fechaIngreso;
      if(p.cantidadIngreso===undefined) delete p.cantidadIngreso;
      return api.patch(`/decoraciones/${editing.id}`,p);
    },
    onSuccess:()=>{qc.invalidateQueries({queryKey:['decoraciones']});closeModal();},
  });

  const eliminar = useMutation({
    mutationFn:(id:string)=>api.delete(`/decoraciones/${id}`),
    onSuccess:()=>qc.invalidateQueries({queryKey:['decoraciones']}),
    onError:()=>alert('No se puede eliminar una decoración pagada'),
  });

  const pagar = useMutation({
    mutationFn:(id:string)=>api.patch(`/decoraciones/${id}/pagar`,{}),
    onSuccess:()=>qc.invalidateQueries({queryKey:['decoraciones']}),
  });

  const columns=[
    {key:'decoradora',header:'Decoradora',  render:(r:any)=>r.decoradora?.nombre??'—'},
    {key:'pedido',    header:'Pedido',       render:(r:any)=>r.pedido?.codigo??'—'},
    {key:'producto',  header:'Producto',     render:(r:any)=>r.producto?.nombre??'—'},
    {key:'fechaEgreso',header:'F.Egreso',   render:(r:any)=>showDate(r.fechaEgreso)},
    {key:'cantE',     header:'Cant.E',       render:(r:any)=>r.cantidadEgreso},
    {key:'fechaIngreso',header:'F.Ingreso', render:(r:any)=>showDate(r.fechaIngreso)},
    {key:'cantI',     header:'Cant.I',       render:(r:any)=>r.cantidadIngreso??'—'},
    {key:'precio',    header:'Precio',       render:(r:any)=>fmt(r.precioDecoracion)},
    {key:'total',     header:'Total',        render:(r:any)=>fmt(r.total)},
    {key:'compras',   header:'Compras',      render:(r:any)=>fmt(r.compras)},
    {key:'totalPagar',header:'A pagar',      render:(r:any)=><span className="font-semibold text-primary-700">{fmt(r.totalPagar)}</span>},
    {key:'pagado',    header:'Estado',       render:(r:any)=>(
      <span className={`badge ${r.pagado?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-700'}`}>{r.pagado?'Pagado':'Pendiente'}</span>
    )},
    {key:'acciones',header:'',render:(r:any)=>(
      <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
        {!r.pagado&&<>
          <button onClick={()=>openEditar(r)} className="text-gray-400 hover:text-primary-600"><Pencil size={14}/></button>
          {r.cantidadIngreso&&<button onClick={()=>{if(confirm('¿Marcar como pagada?'))pagar.mutate(r.id);}} className="text-gray-400 hover:text-green-600"><CheckCircle size={14}/></button>}
          <button onClick={()=>{if(confirm('¿Eliminar?'))eliminar.mutate(r.id);}} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
        </>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1>Decoraciones</h1><p className="text-gray-500 text-sm">{data?.meta?.total??0} registros</p></div>
        <button onClick={()=>setModal('crear')} className="btn-primary"><Plus size={16}/> Nueva decoración</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar pedido, decoradora, producto..."
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        <select className="input w-56" value={filtroDoc} onChange={e=>setFiltroDoc(e.target.value)}>
          <option value="">Todas las decoradoras</option>
          {todasDec?.map((d:any)=><option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading?<LoadingScreen/>:!data?.data?.length?(
          <EmptyState message="Sin decoraciones" action={<button onClick={()=>setModal('crear')} className="btn-primary">Nueva decoración</button>}/>
        ):(
          <><Table columns={columns} data={data.data}/><Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/></>
        )}
      </div>

      {/* ── Modal Crear ── */}
      <Modal title="Nueva decoración" open={modal==='crear'} onClose={closeModal}>
        <form onSubmit={crearForm.handleSubmit(d=>crear.mutate(d))} className="space-y-5">

          <Selector
            label="Decoradora"
            placeholder="Buscar por nombre o documento..."
            queryKey="dec-cr"
            queryFn={(q:string)=>decoradorasService.listar({page:1,limit:50,search:q||undefined}).then(r=>r.data.data)}
            displayFn={(d:any)=>d.nombre}
            subFn={(d:any)=>d.documento}
            selected={selDec}
            onSelect={(d:any)=>{setSelDec(d);crearForm.setValue('decoradoraId',d.id,{shouldValidate:true});}}
            onClear={()=>{setSelDec(null);crearForm.setValue('decoradoraId','');}}
            error={crearForm.formState.errors.decoradoraId?.message}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Productos a entregar</p>
              <button type="button" onClick={addItem} className="btn-secondary text-xs py-1.5 px-3"><Plus size={13}/> Agregar</button>
            </div>

            {fields.map((field,idx)=>{
              const st = itemStates[idx] ?? {pedido:null,producto:null};
              return (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Ítem {idx+1}</span>
                    {fields.length>1&&<button type="button" onClick={()=>removeItem(idx)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>}
                  </div>

                  <Selector
                    placeholder="Buscar pedido por código o cliente..."
                    queryKey={`ped-cr-${idx}`}
                    queryFn={(q:string)=>api.get('/pedidos',{params:{search:q||undefined,limit:50}}).then(r=>r.data.data)}
                    displayFn={(p:any)=>p.codigo}
                    subFn={(p:any)=>p.cliente?.nombre}
                    selected={st.pedido}
                    onSelect={(p:any)=>{
                      setItemState(idx,{pedido:p,producto:null});
                      crearForm.setValue(`items.${idx}.pedidoId`,p.id,{shouldValidate:true});
                      crearForm.setValue(`items.${idx}.productoId`,'');
                    }}
                    onClear={()=>{
                      setItemState(idx,{pedido:null,producto:null});
                      crearForm.setValue(`items.${idx}.pedidoId`,'');
                      crearForm.setValue(`items.${idx}.productoId`,'');
                    }}
                    error={crearForm.formState.errors.items?.[idx]?.pedidoId?.message}
                  />

                  <ProductoDelPedido
                    pedidoId={st.pedido?.id}
                    selected={st.producto}
                    onSelect={(pp:any)=>{setItemState(idx,{...st,producto:pp});crearForm.setValue(`items.${idx}.productoId`,pp.productoId,{shouldValidate:true});}}
                    onClear={()=>{setItemState(idx,{...st,producto:null});crearForm.setValue(`items.${idx}.productoId`,'');}}
                    error={crearForm.formState.errors.items?.[idx]?.productoId?.message}
                  />

                  {st.producto && (
                    <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 flex justify-between">
                      <span>Precio decoración:</span>
                      <strong>{fmt(st.producto.producto?.precioDecoracion)}</strong>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Fecha egreso *</label>
                      <input {...crearForm.register(`items.${idx}.fechaEgreso`)} type="date" className="input text-sm"/>
                      {crearForm.formState.errors.items?.[idx]?.fechaEgreso&&<p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.items[idx]?.fechaEgreso?.message}</p>}
                    </div>
                    <div>
                      <label className="label">Cantidad egreso *</label>
                      <input {...crearForm.register(`items.${idx}.cantidadEgreso`)} type="number" min={1} className="input text-sm"/>
                      {crearForm.formState.errors.items?.[idx]?.cantidadEgreso&&<p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.items[idx]?.cantidadEgreso?.message}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {crear.isError&&<p className="text-red-500 text-sm">Error al crear. Verifica los datos.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={crear.isPending} className="btn-primary">
              {crear.isPending?<Spinner size="sm"/>:`Crear ${fields.length} decoración${fields.length>1?'es':''}`}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Editar ── */}
      <Modal title={`Editar — ${editing?.pedido?.codigo??''}`} open={modal==='editar'} onClose={closeModal}>
        <form onSubmit={editarForm.handleSubmit(d=>editar.mutate(d))} className="space-y-4">
          {editing&&(
            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3 text-sm">
              <div><p className="text-xs text-gray-400">Decoradora</p><p className="font-medium">{editing.decoradora?.nombre}</p></div>
              <div><p className="text-xs text-gray-400">Pedido</p><p className="font-medium">{editing.pedido?.codigo}</p></div>
              <div><p className="text-xs text-gray-400">Producto</p><p className="font-medium">{editing.producto?.nombre}</p></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha egreso</label><input {...editarForm.register('fechaEgreso')} type="date" className="input"/></div>
            <div><label className="label">Cantidad egreso</label><input {...editarForm.register('cantidadEgreso')} type="number" min={1} className="input"/></div>
          </div>
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Ingreso (devolución)</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Fecha ingreso</label><input {...editarForm.register('fechaIngreso')} type="date" className="input"/></div>
              <div><label className="label">Cantidad ingreso</label><input {...editarForm.register('cantidadIngreso')} type="number" min={0} className="input"/></div>
              <div><label className="label">Arreglos</label><input {...editarForm.register('arreglos')} type="number" min={0} className="input"/></div>
              <div><label className="label">Pérdidas</label><input {...editarForm.register('perdidas')} type="number" min={0} className="input"/></div>
              <div className="col-span-2"><label className="label">Compras</label><input {...editarForm.register('compras')} type="number" min={0} step={0.01} className="input"/></div>
              <div className="col-span-2">
                <label className="label">Préstamo a descontar</label>
                <select {...editarForm.register('prestamoId')} className="input">
                  <option value="">Sin préstamo</option>
                  {prestamosDecoradora?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      Saldo: {fmt(p.saldo)} — Monto inicial: {fmt(p.monto)} ({new Date(p.fecha).toLocaleDateString('es-CO')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Valor abono al préstamo</label><input {...editarForm.register('abonosPrestamo')} type="number" min={0} step={0.01} className="input" placeholder="Valor que abona al préstamo"/></div>
            </div>
          </div>
          {editing&&(
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Precio decoración</span><span>{fmt(editing.precioDecoracion)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total (egreso × precio)</span><span>{fmt(editing.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Compras</span><span>− {fmt(editing.compras)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Abono préstamo</span><span>− {fmt(editing.abonosPrestamo)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total a pagar</span><span className="text-primary-700">{fmt(editing.totalPagar)}</span></div>
            </div>
          )}
          {editar.isError&&<p className="text-red-500 text-sm">Error al guardar</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={editar.isPending} className="btn-primary">{editar.isPending?<Spinner size="sm"/>:'Guardar'}</button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Sub-componente selector de producto del pedido ───────────
function ProductoDelPedido({pedidoId, selected, onSelect, onClear, error}: any) {
  const {data} = useQuery({
    queryKey:['prods-pedido',pedidoId],
    queryFn:()=>api.get(`/pedidos/${pedidoId}`).then(r=>r.data.data.productos),
    enabled:Boolean(pedidoId),
  });

  if (!pedidoId) return <div className="input bg-gray-50 text-gray-400 text-sm">Selecciona un pedido primero</div>;
  if (selected) return (
    <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
      <span className="text-sm font-medium">{selected.producto?.nombre}</span>
      <button type="button" onClick={onClear}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
    </div>
  );

  return (
    <div>
      <select className="input text-sm" value="" onChange={e=>{
        const pp=data?.find((p:any)=>p.productoId===e.target.value);
        if(pp) onSelect(pp);
      }}>
        <option value="">Selecciona producto del pedido...</option>
        {data?.map((pp:any)=>(
          <option key={pp.productoId} value={pp.productoId}>{pp.producto?.nombre} — Cant: {pp.cantidadPedido}</option>
        ))}
      </select>
      {error&&<p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
