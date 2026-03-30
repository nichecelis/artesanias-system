import { useState, useRef, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, CheckCircle, X, List, ChevronDown, ChevronRight, Edit3, Users, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { decoradorasService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCompanySettings, generateReportHeader, generateReportFooter, generateFilename } from '../../utils/reportUtils';

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

const editarGrupoSchema = z.object({
  fechaIngreso:    z.string().optional().nullable(),
  cantidadIngreso:  z.coerce.number().int().min(0).optional().nullable(),
  arreglos:        z.coerce.number().int().min(0).optional().nullable(),
  perdidas:        z.coerce.number().int().min(0).optional().nullable(),
  compras:         z.coerce.number().min(0).optional().nullable(),
});
type EditarGrupoForm = z.infer<typeof editarGrupoSchema>;

// Estado de selector por ítem
type ItemState = { pedido: any; producto: any; };

export default function DecoracionesPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [search,setSearch]       = useState('');
  const [filtroDoc,setFiltroDoc] = useState<any>(null);
  const [modal,setModal]         = useState<'crear'|'editar'|'masivo'|'editarGrupo'|null>(null);
  const [editing,setEditing]     = useState<any>(null);
  const [grupoEditando,setGrupoEditando] = useState<any>(null);
  const [selDec,setSelDec]       = useState<any>(null);
  const [itemStates,setItemStates] = useState<ItemState[]>([{pedido:null,producto:null}]);
  const [fechaDesde,setFechaDesde] = useState('');
  const [fechaHasta,setFechaHasta] = useState('');
  const [seleccionadas,setSeleccionadas] = useState<Set<string>>(new Set());
  const [gruposExpandidos,setGruposExpandidos] = useState<Set<string>>(new Set());
  const [filtroGrupo, setFiltroGrupo] = useState<any>(null);
  const [reporteModal, setReporteModal] = useState<any>(null);
  const [reporteData, setReporteData] = useState<any>(null);
  const [reporteLoading, setReporteLoading] = useState(false);

  const { data: todasDec } = useQuery({
    queryKey:['dec-filtro'], queryFn:()=>decoradorasService.listar({page:1,limit:500}).then(r=>r.data.data)
  });

  const { data: grupos } = useQuery({
    queryKey:['grupos-list'],
    queryFn:()=>api.get('/grupos',{params:{limit:500}}).then(r=>r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey:['decoraciones',search,filtroDoc,fechaDesde,fechaHasta],
    queryFn:()=>api.get('/decoraciones',{params:{limit:1000,search:search||undefined,decoradoraId:filtroDoc?.id||undefined,fechaDesde:fechaDesde||undefined,fechaHasta:fechaHasta||undefined,agrupado:true}}).then(r=>r.data),
  });

  const decoradorasDelGrupo = filtroGrupo 
    ? (todasDec?.filter((d: any) => d.grupoId === filtroGrupo.id) || [])
    : (todasDec || []);
  const decoradoraIdsDelGrupo = new Set((decoradorasDelGrupo || []).map((d: any) => d.id));

  const gruposFiltrados = (data?.data || []).filter((g: any) => decoradoraIdsDelGrupo.has(g.decoradoraId));

  useEffect(() => {
    if (reporteModal) {
      setReporteLoading(true);
      api.get('/decoraciones/reporte-por-grupo', {
        params: {
          grupoId: filtroGrupo?.id,
          decoradoraId: filtroDoc?.id,
          fechaDesde,
          fechaHasta,
          search,
          incluirPagadas: true,
        }
      }).then(r => {
        setReporteData(r.data.data);
        setReporteLoading(false);
      }).catch(() => {
        setReporteLoading(false);
      });
    }
  }, [reporteModal, filtroGrupo, filtroDoc, fechaDesde, fechaHasta, search]);

  const { data: prestamosDecoradora } = useQuery({
    queryKey: ['prestamos-dec-edit', editing?.decoradora?.id],
    queryFn: () => api.get('/prestamos', { params: { decoradoraId: editing?.decoradora?.id, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled: Boolean(editing?.decoradora?.id) && modal === 'editar',
  });

  const { data: prestamosGrupo } = useQuery({
    queryKey: ['prestamos-grupo', grupoEditando?.decoradoraId],
    queryFn: () => api.get('/prestamos', { params: { decoradoraId: grupoEditando?.decoradoraId, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled: Boolean(grupoEditando?.decoradoraId) && modal === 'editarGrupo',
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

  const openEditarDetalle = (dec: any, grupo: any) => {
    setEditing({ ...dec, decoradora: { id: grupo.decoradoraId, nombre: grupo.decoradoraNombre } });
    editarForm.reset({
      fechaEgreso:     toDate(dec.fechaEgreso),
      cantidadEgreso:  dec.cantidadEgreso,
      fechaIngreso:    toDate(dec.fechaIngreso),
      cantidadIngreso: dec.cantidadIngreso??undefined,
      arreglos:        dec.arreglos??0,
      perdidas:        dec.perdidas??0,
      compras:         Number(dec.compras)??0,
      abonosPrestamo:  dec.abonosPrestamo??undefined,
      prestamoId:      dec.prestamoId??'',
    });
    setModal('editar');
  };

  const openEditarGrupo = (grupo: any) => {
    setGrupoEditando(grupo);
    setModal('editarGrupo');
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
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['decoraciones']});
      closeModal();
      toast.addToast('Decoración creada exitosamente', 'success');
    },
  });

  const editar = useMutation({
    mutationFn:(d:EditarForm)=>{
      const p:any={...d};
      if(!p.fechaIngreso) delete p.fechaIngreso;
      if(p.cantidadIngreso===undefined) delete p.cantidadIngreso;
      return api.patch(`/decoraciones/${editing.id}`,p);
    },
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['decoraciones']});
      closeModal();
      toast.addToast('Decoración actualizada exitosamente', 'success');
    },
  });

  const editarGrupo = useMutation({
    mutationFn: async (data: EditarGrupoForm) => {
      if (!grupoEditando) return;
      const ids = grupoEditando.productos.filter((p: any) => !p.pagado).map((p: any) => p.id);
      const calls = ids.map((id: string) => {
        const p: any = {};
        if (data.fechaIngreso !== undefined) p.fechaIngreso = data.fechaIngreso || null;
        if (data.cantidadIngreso !== undefined) p.cantidadIngreso = data.cantidadIngreso;
        if (data.arreglos !== undefined) p.arreglos = data.arreglos;
        if (data.perdidas !== undefined) p.perdidas = data.perdidas;
        if (data.compras !== undefined) p.compras = data.compras;
        return api.patch(`/decoraciones/${id}`, p);
      });
      return Promise.all(calls);
    },
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['decoraciones']});
      setModal(null);
      setGrupoEditando(null);
      toast.addToast('Decoraciones actualizadas exitosamente', 'success');
    },
  });

  const eliminar = useMutation({
    mutationFn:(id:string)=>api.delete(`/decoraciones/${id}`),
    onSuccess:()=>qc.invalidateQueries({queryKey:['decoraciones']}),
    onError:()=>toast.addToast('No se puede eliminar una decoración pagada', 'error'),
  });

  const pagar = useMutation({
    mutationFn:(id:string)=>api.patch(`/decoraciones/${id}/pagar`,{}),
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['decoraciones']});
      toast.addToast('Decoración marcada como pagada', 'success');
    },
  });

  const pagarMasivo = useMutation({
    mutationFn: async () => {
      const ids = Array.from(seleccionadas);
      const result = await api.post('/decoraciones/pagar-masivo', { ids });
      return result.data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({queryKey:['decoraciones']});
      setSeleccionadas(new Set());
      setModal(null);
      toast.addToast(`${result.data.decoracionesPagadas.length} decoración(es) marcada(s) como pagada(s)`, 'success');
    },
    onError: (error: any) => {
      toast.addToast(error.response?.data?.message || 'Error al pagar decoraciones', 'error');
    },
  });

  const toggleSeleccion = (id: string) => {
    setSeleccionadas(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleTodas = () => {
    const todosIds = (data?.data ?? []).flatMap((g: any) =>
      g.productos.filter((p: any) => !p.pagado && p.cantidadIngreso).map((p: any) => p.id)
    );
    if (seleccionadas.size === todosIds.length) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(todosIds));
    }
  };

  const toggleGrupo = (key: string) => {
    setGruposExpandidos(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const toggleProducto = (prodId: string) => {
    setSeleccionadas(prev => {
      const s = new Set(prev);
      s.has(prodId) ? s.delete(prodId) : s.add(prodId);
      return s;
    });
  };

  const toggleTodosProductos = (grupo: any) => {
    const ids = grupo.productos.filter((p: any) => !p.pagado && p.cantidadIngreso).map((p: any) => p.id);
    const todosSeleccionados = ids.every((id: string) => seleccionadas.has(id));
    
    setSeleccionadas(prev => {
      const s = new Set(prev);
      if (todosSeleccionados) {
        ids.forEach((id: string) => s.delete(id));
      } else {
        ids.forEach((id: string) => s.add(id));
      }
      return s;
    });
  };

  const pagablesAgrupados = gruposFiltrados.flatMap((g: any) =>
    g.productos.filter((p: any) => !p.pagado && p.cantidadIngreso)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Decoraciones</h1>
          <p className="text-gray-500 text-sm">
            {`${gruposFiltrados.length} grupos`}
          </p>
        </div>
        <button onClick={()=>setModal('crear')} className="btn-primary"><Plus size={16}/> Nueva</button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar pedido, decoradora, producto..."
            value={search} onChange={e=>{setSearch(e.target.value);}}/>
        </div>
        <div className="w-48">
          <Selector
            label=""
            placeholder="Buscar decoradora..."
            queryKey="dec-filtro"
            queryFn={(q:string)=>decoradorasService.listar({page:1,limit:50,search:q||undefined}).then(r=>r.data.data)}
            displayFn={(d:any)=>d.nombre}
            subFn={(d:any)=>d.documento}
            selected={filtroDoc}
            onSelect={(d:any)=>setFiltroDoc(d)}
            onClear={()=>setFiltroDoc(null)}
            error=""
          />
        </div>
        <div className="w-48">
          <Selector
            label=""
            placeholder="Filtrar por grupo..."
            queryKey="grupos-filtro"
            queryFn={(q:string)=>{
              const filtered = grupos?.filter((g: any) => 
                g.nombre.toLowerCase().includes(q.toLowerCase())
              ) || [];
              return Promise.resolve(filtered);
            }}
            displayFn={(d:any)=>d.nombre}
            subFn={()=>''}
            selected={filtroGrupo}
            onSelect={(d:any)=>setFiltroGrupo(d)}
            onClear={()=>setFiltroGrupo(null)}
            error=""
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Desde</label>
          <input type="date" className="input w-36 text-sm" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Hasta</label>
          <input type="date" className="input w-36 text-sm" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)}/>
        </div>
        {(filtroDoc || fechaDesde || fechaHasta || search || filtroGrupo) && (
          <button
            onClick={() => { setFiltroDoc(null); setFechaDesde(''); setFechaHasta(''); setSearch(''); setFiltroGrupo(null); }}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Limpiar
          </button>
        )}
        <button
          onClick={() => setReporteModal({ grupo: filtroGrupo, filtroDoc, fechaDesde, fechaHasta, search, gruposFiltrados })}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <FileText size={14}/> Generar Reporte
        </button>
        {seleccionadas.size > 0 && (
          <button onClick={()=>setModal('masivo')} className="btn-primary text-sm flex items-center gap-1">
            <CheckCircle size={14}/> Pagar {seleccionadas.size}
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading?<LoadingScreen/>:!gruposFiltrados.length?(
          <EmptyState message="Sin decoraciones" action={<button onClick={()=>setModal('crear')} className="btn-primary">Nueva decoración</button>}/>
        ): (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-center w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={seleccionadas.size === pagablesAgrupados.length && pagablesAgrupados.length > 0}
                      onChange={toggleTodas}
                    />
                  </th>
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Pedido</th>
                  <th className="px-3 py-2 text-left">Decoradora</th>
                  <th className="px-3 py-2 text-center">Productos</th>
                  <th className="px-3 py-2 text-right">Cant. Egreso</th>
                  <th className="px-3 py-2 text-right">Cant. Ingreso</th>
                  <th className="px-3 py-2 text-right">Total a Pagar</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gruposFiltrados.map((grupo: any) => {
                  const key = `${grupo.pedidoId}-${grupo.decoradoraId}`;
                  const expandido = gruposExpandidos.has(key);
                  const productosPagables = grupo.productos.filter((p: any) => !p.pagado && p.cantidadIngreso);
                  const idsPagables = productosPagables.map((p: any) => p.id);
                  const todosSeleccionados = idsPagables.length > 0 && idsPagables.every((id: string) => seleccionadas.has(id));
                  
                  return (
                    <Fragment key={key}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={todosSeleccionados}
                            onChange={() => toggleTodosProductos(grupo)}
                            disabled={productosPagables.length === 0}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => toggleGrupo(key)} className="cursor-pointer">
                            {expandido ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium cursor-pointer" onClick={() => toggleGrupo(key)}>{grupo.pedidoCodigo}</td>
                        <td className="px-3 py-2 cursor-pointer" onClick={() => toggleGrupo(key)}>
                          <div className="flex flex-col">
                            <span>{grupo.decoradoraNombre}</span>
                            <span className="text-xs text-gray-400">{grupo.decoradoraDocumento}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center cursor-pointer" onClick={() => toggleGrupo(key)}>
                          <span className={`${productosPagables.length > 0 ? 'text-blue-600 font-medium' : ''}`}>
                            {grupo.productos.length} ({productosPagables.length} por pagar)
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right cursor-pointer" onClick={() => toggleGrupo(key)}>{grupo.totalCantidadEgreso}</td>
                        <td className="px-3 py-2 text-right cursor-pointer" onClick={() => toggleGrupo(key)}>{grupo.totalCantidadIngreso || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold text-primary-700 cursor-pointer" onClick={() => toggleGrupo(key)}>{fmt(grupo.totalAPagar)}</td>
                        <td className="px-3 py-2 text-center cursor-pointer" onClick={() => toggleGrupo(key)}>
                          {(() => {
                            const todosPagados = grupo.productos.every((p: any) => p.pagado);
                            const algunoPorPagar = grupo.productos.some((p: any) => !p.pagado && p.cantidadIngreso);
                            if (todosPagados) {
                              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Pagado</span>;
                            } else if (algunoPorPagar) {
                              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Por pagar</span>;
                            } else {
                              return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Pendiente</span>;
                            }
                          })()}
                        </td>
                        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2 justify-center">
                            {!grupo.productos.every((p: any) => p.pagado) && (
                              <button
                                onClick={() => openEditarGrupo(grupo)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar todos"
                              >
                                <Edit3 size={14}/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandido && grupo.productos.map((prod: any) => (
                        <tr key={prod.id} className={`bg-gray-50 border-b border-gray-100 text-xs ${!prod.pagado && prod.cantidadIngreso ? 'hover:bg-gray-100' : ''}`}>
                          <td className="px-3 py-1 text-center" onClick={e => e.stopPropagation()}>
                            {!prod.pagado && prod.cantidadIngreso && (
                              <input
                                type="checkbox"
                                className="w-3 h-3"
                                checked={seleccionadas.has(prod.id)}
                                onChange={() => toggleProducto(prod.id)}
                              />
                            )}
                          </td>
                          <td className="px-3 py-1 pl-6 text-gray-500">{prod.productoNombre}</td>
                          <td className="px-3 py-1 text-gray-500">Cant: {prod.cantidadEgreso} / {prod.cantidadIngreso || '—'}</td>
                          <td className="px-3 py-1 text-gray-500">{showDate(prod.fechaEgreso)}</td>
                          <td className="px-3 py-1 text-right">{prod.precioDecoracion ? fmt(prod.precioDecoracion) : '—'}</td>
                          <td className="px-3 py-1 text-right">{fmt(prod.total)}</td>
                          <td className="px-3 py-1 text-right font-medium">{fmt(prod.totalPagar)}</td>
                          <td className="px-3 py-1 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${prod.pagado ? 'bg-green-100 text-green-700' : prod.cantidadIngreso ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {prod.pagado ? 'Pagado' : prod.cantidadIngreso ? 'Por pagar' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-center" onClick={e => e.stopPropagation()}>
                            {!prod.pagado && (
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => openEditarDetalle(prod, grupo)} className="text-gray-400 hover:text-primary-600"><Pencil size={12}/></button>
                                <button onClick={() => { if (confirm('¿Eliminar?')) eliminar.mutate(prod.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                    <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Precio decoración:</span>
                        <strong>{fmt(st.producto.producto?.precioDecoracion)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tareas:</span>
                        <strong>{st.producto.cantidadTareas ?? '—'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Recibido:</span>
                        <strong>{st.producto.cantidadRecibida ?? 0} / {st.producto.cantidadTareas ?? '?'}</strong>
                      </div>
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

      {/* ── Modal Pago Masivo ── */}
      <Modal title="Confirmar pago masivo" open={modal==='masivo'} onClose={()=>setModal(null)}>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-gray-700">¿Marcar como pagadas <strong>{seleccionadas.size}</strong> decoración(es)?</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={()=>pagarMasivo.mutate()} disabled={pagarMasivo.isPending} className="btn-primary">
              {pagarMasivo.isPending ? <Spinner size="sm"/> : 'Confirmar pago'}
            </button>
            <button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
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
            <div><label className="label">Fecha egreso</label><input {...editarForm.register('fechaEgreso')} type="date" className="input" disabled={editing?.pagado}/></div>
            <div><label className="label">Cantidad egreso</label><input {...editarForm.register('cantidadEgreso')} type="number" min={1} className="input" disabled={editing?.pagado}/></div>
          </div>
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Ingreso (devolución)</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Fecha ingreso</label><input {...editarForm.register('fechaIngreso')} type="date" className="input" disabled={editing?.pagado}/></div>
              <div><label className="label">Cantidad ingreso</label><input {...editarForm.register('cantidadIngreso')} type="number" min={0} className="input" disabled={editing?.pagado}/></div>
              <div><label className="label">Arreglos</label><input {...editarForm.register('arreglos')} type="number" min={0} className="input" disabled={editing?.pagado}/></div>
              <div><label className="label">Pérdidas</label><input {...editarForm.register('perdidas')} type="number" min={0} className="input" disabled={editing?.pagado}/></div>
              <div className="col-span-2"><label className="label">Compras</label><input {...editarForm.register('compras')} type="number" min={0} step={0.01} className="input" disabled={editing?.pagado}/></div>
              <div className="col-span-2">
                {editing?.prestamoId ? (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-xs text-green-700 font-medium">Préstamo ya aplicado</p>
                    <p className="text-xs text-green-600">Abono: {fmt(editing.abonosPrestamo)}</p>
                  </div>
                ) : (
                  <>
                    <label className="label">Préstamo a descontar</label>
                    <select {...editarForm.register('prestamoId')} className="input">
                      <option value="">Sin préstamo</option>
                      {prestamosDecoradora?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          Saldo: {fmt(p.saldo)} — Monto inicial: {fmt(p.monto)} ({new Date(p.fecha).toLocaleDateString('es-CO')})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div className="col-span-2">
                {editing?.prestamoId ? (
                  <div className="bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-500">Abono al préstamo: {fmt(editing.abonosPrestamo)}</p>
                  </div>
                ) : (
                  <><label className="label">Valor abono al préstamo</label><input {...editarForm.register('abonosPrestamo')} type="number" min={0} step={0.01} className="input" placeholder="Valor que abona al préstamo"/></>
                )}
              </div>
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

      {/* ── Modal Editar Grupo ── */}
      <Modal title={`Editar Grupo — ${grupoEditando?.decoradoraNombre ?? ''}`} open={modal === 'editarGrupo'} onClose={() => { setModal(null); setGrupoEditando(null); }} size="2xl">
        {grupoEditando && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Pedido:</span> {grupoEditando.pedidoCodigo}</p>
              <p><span className="font-medium">Decoradora:</span> {grupoEditando.decoradoraNombre} ({grupoEditando.decoradoraDocumento})</p>
            </div>

            {/* ── Sección de Préstamo (a nivel de grupo) ── */}
            {!grupoEditando.productos.some((p: any) => p.prestamoId) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-purple-700 uppercase">Préstamo (descuento único por grupo)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs">Préstamo a descontar</label>
                    <select
                      className="input text-xs py-1"
                      onChange={(e) => { grupoEditando._prestamoId = e.target.value || undefined; }}
                    >
                      <option value="">Sin préstamo</option>
                      {prestamosGrupo?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          Saldo: {fmt(p.saldo)} — Monto: {fmt(p.monto)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Valor a descontar</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="input text-xs py-1"
                      placeholder="0"
                      onChange={(e) => { grupoEditando._abonoPrestamo = e.target.value ? parseFloat(e.target.value) : undefined; }}
                    />
                  </div>
                </div>
              </div>
            )}
            {grupoEditando.productos.some((p: any) => p.prestamoId) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium">Préstamo ya aplicado a este grupo</p>
              </div>
            )}

            <div className="max-h-[50vh] overflow-y-auto space-y-3">
              {grupoEditando.productos.filter((p: any) => !p.pagado).map((prod: any, idx: number) => (
                <div key={prod.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{prod.productoNombre}</p>
                    <span className="text-xs text-gray-500">Egreso: {prod.cantidadEgreso}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="label text-xs">Fecha Ingreso</label>
                      <input
                        type="date"
                        className="input text-xs py-1"
                        defaultValue={toDate(prod.fechaIngreso)}
                        onChange={(e) => { prod._fechaIngreso = e.target.value || undefined; }}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Cant. Ingreso</label>
                      <input
                        type="number"
                        min={0}
                        className="input text-xs py-1"
                        defaultValue={prod.cantidadIngreso || ''}
                        placeholder={prod.cantidadIngreso ? '' : '0'}
                        onChange={(e) => { prod._cantidadIngreso = e.target.value ? parseInt(e.target.value) : undefined; }}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Arreglos</label>
                      <input
                        type="number"
                        min={0}
                        className="input text-xs py-1"
                        defaultValue={prod.arreglos || ''}
                        placeholder="0"
                        onChange={(e) => { prod._arreglos = e.target.value ? parseInt(e.target.value) : undefined; }}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Pérdidas</label>
                      <input
                        type="number"
                        min={0}
                        className="input text-xs py-1"
                        defaultValue={prod.perdidas || ''}
                        placeholder="0"
                        onChange={(e) => { prod._perdidas = e.target.value ? parseInt(e.target.value) : undefined; }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="label text-xs">Compras</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="input text-xs py-1"
                        defaultValue={prod.compras || ''}
                        placeholder="0"
                        disabled={!!prod.prestamoId}
                        onChange={(e) => { prod._compras = e.target.value ? parseFloat(e.target.value) : undefined; }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {grupoEditando.productos.filter((p: any) => p.pagado).length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">
                    {grupoEditando.productos.filter((p: any) => p.pagado).length} productos ya pagados (no se pueden editar)
                  </p>
                  {grupoEditando.productos.filter((p: any) => p.pagado).map((prod: any) => (
                    <div key={prod.id} className="flex justify-between text-xs text-gray-400">
                      <span>{prod.productoNombre}</span>
                      <span>Pagado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editarGrupo.isError && <p className="text-red-500 text-sm">Error al guardar</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const productosNoPagados = grupoEditando.productos.filter((p: any) => !p.pagado);
                  let prestamoAplicado = false;
                  
                  const calls = productosNoPagados.map((prod: any) => {
                    const data: any = {};
                    if (prod._fechaIngreso !== undefined) data.fechaIngreso = prod._fechaIngreso;
                    if (prod._cantidadIngreso !== undefined) data.cantidadIngreso = prod._cantidadIngreso;
                    if (prod._arreglos !== undefined) data.arreglos = prod._arreglos;
                    if (prod._perdidas !== undefined) data.perdidas = prod._perdidas;
                    if (prod._compras !== undefined) data.compras = prod._compras;
                    
                    if (grupoEditando._prestamoId && grupoEditando._abonoPrestamo && !prestamoAplicado) {
                      data.prestamoId = grupoEditando._prestamoId;
                      data.abonosPrestamo = grupoEditando._abonoPrestamo;
                      prestamoAplicado = true;
                    }
                    
                    return api.patch(`/decoraciones/${prod.id}`, data);
                  });
                  
                  Promise.all(calls).then(() => {
                    qc.invalidateQueries({ queryKey: ['decoraciones'] });
                    setModal(null);
                    setGrupoEditando(null);
                    toast.addToast('Decoraciones actualizadas exitosamente', 'success');
                  }).catch(() => {
                    toast.addToast('Error al guardar', 'error');
                  });
                }}
                disabled={editarGrupo.isPending}
                className="btn-primary"
              >
                {editarGrupo.isPending ? <Spinner size="sm"/> : 'Guardar todos'}
              </button>
              <button type="button" onClick={() => { setModal(null); setGrupoEditando(null); }} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Reporte de Pagos */}
      <Modal title="Reporte de Decoraciones" open={Boolean(reporteModal)} onClose={() => setReporteModal(null)} size="full">
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary text-sm" onClick={async () => { await generarPDFDecoraciones(reporteData); }}>
              <FileText size={14} className="inline mr-1"/> Generar PDF
            </button>
          </div>

          {reporteLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg"/>
            </div>
          ) : !reporteData || reporteData.items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Sin decoraciones con los filtros aplicados</p>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Totales</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-700">
                      {reporteData.totales.cantidadDecoraciones}
                    </p>
                    <p className="text-xs text-gray-500">Decoraciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-700">
                      {fmt(reporteData.totales.totalEgresos)}
                    </p>
                    <p className="text-xs text-gray-500">$ Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-700">
                      {fmt(reporteData.totales.subtotal)}
                    </p>
                    <p className="text-xs text-gray-500">$ Subtotal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-700">
                      {fmt(reporteData.totales.totalAPagar)}
                    </p>
                    <p className="text-xs text-gray-500">$ Total a Pagar</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-700">
                      {reporteData.items.length}
                    </p>
                    <p className="text-xs text-gray-500">Decoradoras</p>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <h3 className="font-medium mb-2">Detalle por Decoradora</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-2 text-left">NOMBRE</th>
                        <th className="px-2 py-2 text-left">ELITE/GRUPO</th>
                        <th className="px-2 py-2 text-center">RESP.</th>
                        <th className="px-2 py-2 text-right">$ COMPRAS</th>
                        <th className="px-2 py-2 text-right">$ TOTAL</th>
                        <th className="px-2 py-2 text-right">$ ABONO PRESTAMO</th>
                        <th className="px-2 py-2 text-right">$ SALDO PRESTAMO</th>
                        <th className="px-2 py-2 text-right">$ SUBTOTAL</th>
                        <th className="px-2 py-2 text-right">$ TOTAL A PAGAR</th>
                        <th className="px-2 py-2 text-center">CUENTA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reporteData.items.map((item: any, idx: number) => (
                        <Fragment key={idx}>
                          <tr className={item.esResponsable ? 'bg-blue-50' : ''}>
                            <td className="px-2 py-2 font-medium">
                              {item.decoradoraNombre}
                              {item.esResponsable && (
                                <span className="ml-1 text-[10px] text-blue-600 bg-blue-100 px-1 rounded">
                                  +{item.porcentajeAdicional}%
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.grupoTipo === 'ELITE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.grupoNombre || '—'}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {item.esResponsable ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">Si</span>
                              ) : '—'}
                            </td>
                            <td className="px-2 py-2 text-right">{fmt(item.totalCompras)}</td>
                            <td className="px-2 py-2 text-right">{fmt(item.totalEgresos)}</td>
                            <td className="px-2 py-2 text-right">{fmt(item.totalAbonosPrestamo)}</td>
                            <td className="px-2 py-2 text-right">{fmt(item.saldoPrestamos)}</td>
                            <td className="px-2 py-2 text-right">{fmt(item.subtotal)}</td>
                            <td className="px-2 py-2 text-right font-bold text-primary-700">{fmt(item.totalAPagar)}</td>
                            <td className="px-2 py-2 text-center font-mono text-[10px]">
                              {item.decoradoraNumCuenta || '—'}
                            </td>
                          </tr>
                          {item.calculoPorcentaje && (
                            <tr className="bg-blue-50/50 text-[10px] text-blue-600">
                              <td colSpan={4} className="px-2 py-1">
                                Cálculo responsable: {fmt(item.calculoPorcentaje.totalOtrosMiembros)} × {item.calculoPorcentaje.porcentaje}% = {fmt(item.calculoPorcentaje.adicional)}
                              </td>
                              <td colSpan={6} className="px-2 py-1 text-right">
                                (Suma otros miembros × porcentaje = adicional)
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td className="px-2 py-2">TOTALES</td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2"></td>
                        <td className="px-2 py-2 text-right">{fmt(reporteData.totales.totalCompras)}</td>
                        <td className="px-2 py-2 text-right">{fmt(reporteData.totales.totalEgresos)}</td>
                        <td className="px-2 py-2 text-right">{fmt(reporteData.totales.totalAbonosPrestamo)}</td>
                        <td className="px-2 py-2 text-right">{fmt(reporteData.totales.saldoPrestamos)}</td>
                        <td className="px-2 py-2 text-right">{fmt(reporteData.totales.subtotal)}</td>
                        <td className="px-2 py-2 text-right text-primary-700">{fmt(reporteData.totales.totalAPagar)}</td>
                        <td className="px-2 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

async function generarPDFDecoraciones(reporteData: any) {
  if (!reporteData || !reporteData.items) return;
  
  const doc = new jsPDF({ orientation: 'landscape' });
  const company = await getCompanySettings();
  
  let yPos = generateReportHeader(doc, company, 'REPORTE DE DECORACIONES POR GRUPO', `Fecha: ${new Date().toLocaleDateString('es-CO')}`);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total a Pagar: ${fmt(reporteData.totales.totalAPagar)}`, 14, yPos);
  doc.text(`Decoraciones: ${reporteData.totales.cantidadDecoraciones}`, 120, yPos);
  doc.text(`Decoradoras: ${reporteData.items.length}`, 200, yPos);
  
  yPos += 10;
  
  const tableData = reporteData.items.map((item: any, idx: number) => [
    item.decoradoraNombre,
    item.grupoNombre || '—',
    item.esResponsable ? 'Si' : 'No',
    fmt(item.totalCompras),
    fmt(item.totalEgresos),
    fmt(item.totalAbonosPrestamo),
    fmt(item.saldoPrestamos),
    fmt(item.subtotal),
    fmt(item.totalAPagar),
    item.decoradoraNumCuenta || '—',
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [['NOMBRE', 'ELITE/GRUPO', 'RESP.', '$ COMPRAS', '$ TOTAL', '$ ABONO PRESTAMO', '$ SALDO PRESTAMO', '$ SUBTOTAL', '$ TOTAL A PAGAR', 'CUENTA']],
    body: tableData,
    foot: [
      ['TOTALES', '', '', fmt(reporteData.totales.totalCompras), fmt(reporteData.totales.totalEgresos), fmt(reporteData.totales.totalAbonosPrestamo), fmt(reporteData.totales.saldoPrestamos), fmt(reporteData.totales.subtotal), fmt(reporteData.totales.totalAPagar), '']
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 37, 36] },
    footStyles: { fillColor: [229, 231, 235], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      8: { cellWidth: 22 },
      9: { cellWidth: 20 },
    },
  });
  
  let finalY = (doc as any).lastAutoTable.finalY || 55;
  
  reporteData.items.forEach((item: any) => {
    if (item.calculoPorcentaje) {
      finalY += 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(59, 130, 246);
      doc.text(`${item.decoradoraNombre}: ${fmt(item.calculoPorcentaje.totalOtrosMiembros)} × ${item.calculoPorcentaje.porcentaje}% = ${fmt(item.calculoPorcentaje.adicional)}`, 14, finalY);
    }
  });
  
  generateReportFooter(doc);
  doc.save(generateFilename('reporte-decoraciones'));
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
      <div className="flex flex-col">
        <span className="text-sm font-medium">{selected.producto?.nombre}</span>
        <span className="text-xs text-gray-500">
          Tareas: {selected.cantidadTareas ?? '—'} | Recibido: {selected.cantidadRecibida ?? 0}/{selected.cantidadTareas ?? '?'}
        </span>
      </div>
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
          <option key={pp.productoId} value={pp.productoId}>
            {pp.producto?.nombre} — Cant: {pp.cantidadPedido} | Tareas: {pp.cantidadTareas ?? '—'} | Recibido: {pp.cantidadRecibida ?? 0}
          </option>
        ))}
      </select>
      {error&&<p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
