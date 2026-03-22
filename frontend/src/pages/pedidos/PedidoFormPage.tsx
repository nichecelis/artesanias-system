import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Search, X, List } from 'lucide-react';
import { pedidosService, clientesService, productosService } from '../../services';
import { Spinner, LoadingScreen } from '../../components/common';
import { useToastStore } from '../../store/toast.store';
import ProcesoProducto from '../../components/ProcesoProducto';
import { useWatch } from 'react-hook-form';

const schema = z.object({
  clienteId:     z.string().min(1, 'Selecciona un cliente'),
  laser:        z.enum(['TALLER', 'EXTERNO']).optional(),
  observaciones: z.string().optional(),
  productos: z.array(z.object({
    productoId:      z.string().min(1, 'Selecciona producto'),
    cantidadPedido:  z.coerce.number().int().positive(),

    // 🔥 CORTE
    fechaInicioCorte: z.string().optional(),
    fechaConteo:      z.string().optional(),
    cantidadTareas:   z.coerce.number().int().optional(),
    corte1:           z.coerce.number().int().optional(),
    corte2:           z.coerce.number().int().optional(),
    corte3:           z.coerce.number().int().optional(),

    // 🔥 DECORACIÓN
    fechaAsignacion:  z.string().optional(),
    cantidadRecibida: z.coerce.number().int().optional(),

    // 🔥 DESPACHO
    fechaDespacho:    z.string().optional(),
    cantidadDespacho: z.coerce.number().int().optional(),

    cantidadPlancha: z.coerce.number().int().optional(),
  })).min(1, 'Agrega al menos un producto'),
});
type Form = z.infer<typeof schema>;

const toDateStr = (d: any) => d ? new Date(d).toISOString().slice(0, 10) : '';

function ClienteBuscador({ value, onChange, error }: {
  value: string;
  onChange: (id: string, nombre: string) => void;
  error?: string;
}) {
  const [query, setQuery]       = useState('');
  const [mode, setMode]         = useState<'search'|'list'>('search');
  const [selected, setSelected]  = useState('');
  const [open, setOpen]         = useState(false);
  const ref                     = useRef<HTMLDivElement>(null);

  const { data: clienteActual } = useQuery({
    queryKey: ['cliente-actual', value],
    queryFn: () => clientesService.obtener(value).then(r => r.data.data),
    enabled: Boolean(value) && !selected,
  });

  useEffect(() => {
    if (clienteActual && !selected) setSelected(`${clienteActual.nombre} — ${clienteActual.documento}`);
  }, [clienteActual]);

  const { data: sData, isFetching } = useQuery({
    queryKey: ['clientes-buscar', query],
    queryFn: () => clientesService.listar({ page: 1, limit: 500, search: query || undefined }).then(r => r.data.data),
    enabled: mode === 'search' && query.length >= 2,
  });

  const { data: lData, isFetching: isFetchingAll } = useQuery({
    queryKey: ['clientes-list'],
    queryFn: () => clientesService.listar({ page: 1, limit: 500, search: '' }).then(r => r.data.data),
    enabled: mode === 'list',
  });

  const items = mode === 'search' ? sData : lData;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (c: any) => {
    onChange(c.id, c.nombre);
    setSelected(`${c.nombre} — ${c.documento}`);
    setQuery('');
    setOpen(false);
  };

  const clear = () => { onChange('', ''); setSelected(''); setQuery(''); };

  if (selected) {
    return (
      <div ref={ref}>
        <label className="label">Cliente *</label>
        <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
          <span className="text-sm text-gray-800">{selected}</span>
          <button type="button" onClick={clear} className="text-gray-400 hover:text-red-500 ml-2"><X size={14} /></button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <label className="label">Cliente *</label>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          {mode === 'search' && <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>}
          <input
            className={`w-full input text-sm ${mode === 'search' ? 'pl-9' : 'pl-3'}`}
            placeholder={mode === 'search' ? 'Buscar por nombre o documento...' : 'Filtrar...'}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {open && items && items.length > 0 && (
            <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {items.map((c: any) => (
                <button key={c.id} type="button" onClick={() => select(c)}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0">
                  <span className="font-medium">{c.nombre}</span>
                  <span className="text-gray-400 text-xs ml-2">{c.documento}</span>
                </button>
              ))}
            </div>
          )}
          {open && mode === 'search' && query.length >= 2 && items?.length === 0 && (
            <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
              Sin resultados para "{query}"
            </div>
          )}
        </div>
        <button type="button" onClick={() => { setMode(m => m === 'search' ? 'list' : 'search'); setOpen(true); setQuery(''); }}
          className="px-3 h-[38px] rounded-lg border border-blue-500 bg-blue-500 text-white flex items-center justify-center font-bold shadow"
          title={mode === 'search' ? 'Ver todos los clientes' : 'Activar búsqueda'}
          style={{ minWidth: '44px' }}
        >
          <List size={20}/>
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function PedidoFormPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const toast      = useToastStore();
  const isEditing = Boolean(id);
  const [clienteId, setClienteId] = useState('');

  const { data: pedidoRes, isLoading: loadingPedido } = useQuery({
    queryKey: ['pedido', id],
    queryFn:  () => pedidosService.obtener(id!).then(r => r.data.data),
    enabled:  isEditing,
  });

  const { data: productosLista } = useQuery({
    queryKey: ['productos-select'],
    queryFn: () => productosService.listar({ page: 1, limit: 500 }).then(r => r.data.data),
  });

  const { register, handleSubmit, control, reset, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { laser: undefined, productos: [{ productoId: '', cantidadPedido: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'productos' });

  const productosWatch = useWatch({
    control,
    name: 'productos',
  });

  useEffect(() => {
    if (pedidoRes && productosLista?.length) {
      setClienteId(pedidoRes.clienteId);

      reset({
        clienteId: pedidoRes.clienteId,
        laser: pedidoRes.laser ?? undefined,
        observaciones: pedidoRes.observaciones ?? '',
        productos: pedidoRes.productos?.length
        ? pedidoRes.productos.map((p: any) => ({
            productoId: p.productoId,
            cantidadPedido: p.cantidadPedido,
            cantidadPlancha: p.cantidadPlancha ?? undefined,

            fechaInicioCorte: toDateStr(p.fechaInicioCorte),
            fechaConteo: toDateStr(p.fechaConteo),
            cantidadTareas: p.cantidadTareas ?? undefined,
            corte1: p.corte1 ?? undefined,
            corte2: p.corte2 ?? undefined,
            corte3: p.corte3 ?? undefined,

            fechaAsignacion: toDateStr(p.fechaAsignacion),
            cantidadRecibida: p.cantidadRecibida ?? undefined,

            fechaDespacho: toDateStr(p.fechaDespacho),
            cantidadDespacho: p.cantidadDespacho ?? undefined,
          }))
        : [{ productoId: '', cantidadPedido: 1 }],
      });
    }
  }, [pedidoRes, productosLista, reset]);

  const guardar = useMutation({
    mutationFn: (data: Form) =>
      isEditing ? pedidosService.actualizar(id!, data) : pedidosService.crear(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      toast.addToast(isEditing ? 'Pedido actualizado exitosamente' : 'Pedido creado exitosamente', 'success');
      navigate(`/pedidos/${res.data.data.id}`);
    },
  });

  if (isEditing && loadingPedido) return <LoadingScreen />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/pedidos')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
        <div>
          <h1>{isEditing ? 'Editar pedido' : 'Nuevo pedido'}</h1>
          {isEditing && <p className="text-gray-500 text-sm">{pedidoRes?.codigo}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit(d => guardar.mutate(d))} className="space-y-6">

        {/* ── Datos generales ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Información general</h2>
          <div className="space-y-4">
            <ClienteBuscador
              value={clienteId}
              onChange={(id) => { setClienteId(id); setValue('clienteId', id, { shouldValidate: true }); }}
              error={errors.clienteId?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Láser</label>
                <select {...register('laser')} className="input">
                  <option value="">Selecciona...</option>
                  <option value="TALLER">En taller</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Observaciones</label>
              <textarea {...register('observaciones')} className="input" rows={2} />
            </div>
          </div>
        </div>

        {/* ── Productos ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Productos</h2>
            <button type="button" onClick={() => append({ productoId: '', cantidadPedido: 1 })}
              className="btn-secondary text-xs py-1.5 px-3"><Plus size={14} /> Agregar</button>
          </div>
          {errors.productos?.root && <p className="text-red-500 text-xs">{errors.productos.root.message}</p>}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => {
              const productoActual = productosWatch?.[idx] ?? {};
              const cantidadPedido = productoActual?.cantidadPedido || 0;
              const cantidadDespacho = productoActual?.cantidadDespacho || 0;
              const cantidadFaltante = (cantidadDespacho || 0) - (cantidadPedido || 0);
              const faltanteColor = cantidadFaltante < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold';

              const calcularEstadoLocal = (p: any) => {
                if (p.fechaDespacho) return 'DESPACHADO';
                if (p.fechaAsignacion) return 'EN_DECORACION';
                if (p.fechaInicioCorte) return 'EN_CORTE';
                return 'PENDIENTE';
              };
              const estadoProducto = calcularEstadoLocal(productoActual);

              return (
                <div key={field.id} className="border rounded p-4 space-y-4">
                
                {/* 🔥 HEADER CON PROCESO */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-700" style={{ color: '#e72a09' }}>
                    Producto #{idx + 1}
                  </h3>
                  <ProcesoProducto estado={estadoProducto} />
                </div>

                {/* PRODUCTO */}
                <div className="grid grid-cols-12 gap-3 items-start">

                  {/* PRODUCTO */}
                  <div className="col-span-5">
                    <label className="label">Producto</label>
                    <select {...register(`productos.${idx}.productoId`)} className="input text-sm">
                      <option value="">Selecciona...</option>
                      {productosLista?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* CANTIDAD PEDIDO */}
                  <div className="col-span-3">
                    <label className="label">Cant. pedido</label>
                    <input
                      {...register(`productos.${idx}.cantidadPedido`)}
                      type="number"
                      min={1}
                      className="input text-sm"
                    />
                  </div>

                  {/* CANTIDAD PLANCHA */}
                  <div className="col-span-3">
                    <label className="label">Cant. plancha</label>
                    <input
                      {...register(`productos.${idx}.cantidadPlancha`)}
                      type="number"
                      min={0}
                      className="input text-sm"
                    />
                  </div>

                  {/* ELIMINAR */}
                  <div className="col-span-1 flex justify-center pt-6">
                    <button type="button" onClick={() => fields.length > 1 && remove(idx)}>
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>
                
                <br></br>
                {/* 🔥 CORTE */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600" style={{ color: '#27D3F5' }}>Corte</h3>
                  <br></br>
                  <div className="grid grid-cols-4 gap-3">
                    
                    <div>
                      <label className="label">Fecha inicio</label>
                      <input type="date" {...register(`productos.${idx}.fechaInicioCorte`)} className="input" />
                    </div>

                    <div>
                      <label className="label">Fecha conteo</label>
                      <input
                        type="date"
                        {...register(`productos.${idx}.fechaConteo`)}
                        className="input text-sm"
                        placeholder="Fecha conteo"
                      />
                    </div>

                    <div>
                      <label className="label">Tareas</label>
                        <input
                          type="number"
                          {...register(`productos.${idx}.cantidadTareas`)}
                          className="input text-sm"
                          placeholder="Tareas"
                        />
                    </div>

                    <div>
                      <label className="label">Corte 1</label>
                        <input
                          type="number"
                          {...register(`productos.${idx}.corte1`)}
                          className="input text-sm"
                          placeholder="Corte 1"
                        />
                    </div>

                    <div>
                      <label className="label">Corte 2</label>
                        <input
                          type="number"
                          {...register(`productos.${idx}.corte2`)}
                          className="input text-sm"
                          placeholder="Corte 2"
                        />
                    </div>

                    <div>
                      <label className="label">Corte 3</label>
                        <input
                          type="number"
                          {...register(`productos.${idx}.corte3`)}
                          className="input text-sm"
                          placeholder="Corte 3"
                        />
                    </div>

                  </div>
                </div>
                
                <br></br>
                {/* 🔥 DECORACIÓN */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600" style={{ color: '#27D3F5' }}>Decoración</h3>
                  <br></br>
                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <label className="label">Fecha asignación</label>
                      <input type="date" {...register(`productos.${idx}.fechaAsignacion`)} className="input" />
                    </div>

                    <div>
                      <label className="label">Cantidad recibida</label>
                      <input type="number" {...register(`productos.${idx}.cantidadRecibida`)} className="input" />
                    </div>

                  </div>
                </div>

                <br></br>
                {/* 🔥 DESPACHO */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600" style={{ color: '#27D3F5' }}>Despacho</h3>
                  <br></br>
                  <div className="grid grid-cols-3 gap-3">

                    <div>
                      <label className="label">Fecha despacho</label>
                      <input type="date" {...register(`productos.${idx}.fechaDespacho`)} className="input" />
                    </div>

                    <div>
                      <label className="label">Cantidad despacho</label>
                      <input type="number" {...register(`productos.${idx}.cantidadDespacho`)} className="input" />
                    </div>

                    <div>
                      <label className="label">Cantidad faltante</label>
                      <input
                        value={cantidadFaltante}
                        readOnly
                        className={`input bg-gray-100 ${faltanteColor}`}
                      />
                    </div>

                  </div>
                </div>

              </div>
              )
            
            })}
          </div>
        </div>

        {guardar.isError && <p className="text-red-500 text-sm">Error al guardar el pedido.</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting || guardar.isPending} className="btn-primary">
            {(isSubmitting || guardar.isPending) ? <Spinner size="sm" /> : (isEditing ? 'Guardar cambios' : 'Crear pedido')}
          </button>
          <button type="button" onClick={() => navigate('/pedidos')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
