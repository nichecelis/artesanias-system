import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ArrowLeft, Search, X } from 'lucide-react';
import { pedidosService, clientesService, productosService } from '../../services';
import { Spinner, LoadingScreen } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const schema = z.object({
  clienteId:        z.string().min(1, 'Selecciona un cliente'),
  laser:            z.enum(['TALLER', 'EXTERNO']).optional(),
  fechaInicioCorte: z.string().optional(),
  fechaConteo:      z.string().optional(),
  cantidadTareas:   z.coerce.number().int().optional(),
  fechaAsignacion:  z.string().optional(),
  cantidadRecibida: z.coerce.number().int().optional(),
  fechaDespacho:    z.string().optional(),
  corte1:           z.coerce.number().int().optional(),
  corte2:           z.coerce.number().int().optional(),
  corte3:           z.coerce.number().int().optional(),
  cantidadDespacho: z.coerce.number().int().optional(),
  observaciones:    z.string().optional(),
  productos: z.array(z.object({
    productoId:      z.string().min(1, 'Selecciona producto'),
    cantidadPedido:  z.coerce.number().int().positive('Requerido'),
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
  const [query, setQuery]           = useState('');
  const [selected, setSelected]     = useState('');
  const [open, setOpen]             = useState(false);
  const ref                         = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['clientes-buscar', query],
    queryFn: () => clientesService.listar({ page: 1, limit: 10, search: query }).then(r => r.data.data),
    enabled: query.length >= 2,
  });

  // Cargar nombre si viene de edición
  const { data: clienteActual } = useQuery({
    queryKey: ['cliente-actual', value],
    queryFn: () => clientesService.obtener(value).then(r => r.data.data),
    enabled: Boolean(value) && !selected,
  });

  useEffect(() => {
    if (clienteActual && !selected) setSelected(`${clienteActual.nombre} — ${clienteActual.documento}`);
  }, [clienteActual]);

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

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
          <span className="text-sm text-gray-800">{selected}</span>
          <button type="button" onClick={clear} className="text-gray-400 hover:text-red-500 ml-2"><X size={14} /></button>
        </div>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre o documento..."
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.length >= 2 && setOpen(true)}
          />
          {isFetching && <Spinner size="sm" className="absolute right-3 top-2.5" />}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && !selected && data && data.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {data.map((c: any) => (
            <button key={c.id} type="button" onClick={() => select(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm border-b border-gray-100 last:border-0">
              <span className="font-medium">{c.nombre}</span>
              <span className="text-gray-400 ml-2 text-xs">{c.documento}</span>
            </button>
          ))}
        </div>
      )}
      {open && !selected && query.length >= 2 && data?.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
          Sin resultados para "{query}"
        </div>
      )}
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

  useEffect(() => {
    if (pedidoRes) {
      setClienteId(pedidoRes.clienteId);
      reset({
        clienteId:        pedidoRes.clienteId,
        laser:            pedidoRes.laser ?? '',
        fechaInicioCorte: toDateStr(pedidoRes.fechaInicioCorte),
        fechaConteo:      toDateStr(pedidoRes.fechaConteo),
        cantidadTareas:   pedidoRes.cantidadTareas ?? undefined,
        fechaAsignacion:  toDateStr(pedidoRes.fechaAsignacion),
        cantidadRecibida: pedidoRes.cantidadRecibida ?? undefined,
        fechaDespacho:    toDateStr(pedidoRes.fechaDespacho),
        corte1:           pedidoRes.corte1 ?? undefined,
        corte2:           pedidoRes.corte2 ?? undefined,
        corte3:           pedidoRes.corte3 ?? undefined,
        cantidadDespacho: pedidoRes.cantidadDespacho ?? undefined,
        observaciones:    pedidoRes.observaciones ?? '',
        productos: pedidoRes.productos?.length
          ? pedidoRes.productos.map((p: any) => ({
              productoId:      p.productoId,
              cantidadPedido:  p.cantidadPedido,
              cantidadPlancha: p.cantidadPlancha ?? undefined,
            }))
          : [{ productoId: '', cantidadPedido: 1 }],
      });
    }
  }, [pedidoRes, reset]);

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
    <div className="space-y-6 max-w-3xl">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Cliente *</label>
              <ClienteBuscador
                value={clienteId}
                onChange={(id) => { setClienteId(id); setValue('clienteId', id, { shouldValidate: true }); }}
                error={errors.clienteId?.message}
              />
            </div>
            <div className="flex items-center gap-3 col-span-2">
              <div className="col-span-2">
                <label className="label">Láser</label>
                <select {...register('laser')} className="input">
                  <option value="">Selecciona...</option>
                  <option value="TALLER">En taller</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">Observaciones</label>
              <textarea {...register('observaciones')} className="input" rows={2} />
            </div>
          </div>
        </div>

        {/* ── Productos ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Productos *</h2>
            <button type="button" onClick={() => append({ productoId: '', cantidadPedido: 1 })}
              className="btn-secondary text-xs py-1.5 px-3"><Plus size={14} /> Agregar</button>
          </div>
          {errors.productos?.root && <p className="text-red-500 text-xs">{errors.productos.root.message}</p>}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
            <div className="col-span-5">Producto</div>
            <div className="col-span-3">Cant. pedido</div>
            <div className="col-span-3">Cant. plancha</div>
            <div className="col-span-1"></div>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <select {...register(`productos.${idx}.productoId`)} className="input text-sm">
                    <option value="">Selecciona...</option>
                    {productosLista?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  {errors.productos?.[idx]?.productoId && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.productos[idx]?.productoId?.message}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <input {...register(`productos.${idx}.cantidadPedido`)} type="number" min={1} placeholder="0" className="input text-sm" />
                </div>
                <div className="col-span-3">
                  <input {...register(`productos.${idx}.cantidadPlancha`)} type="number" min={0} placeholder="0" className="input text-sm" />
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  <button type="button" onClick={() => fields.length > 1 && remove(idx)}
                    className={fields.length <= 1 ? 'text-gray-200' : 'text-gray-400 hover:text-red-500'}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Proceso de corte ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Proceso de corte</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha inicio corte</label><input {...register('fechaInicioCorte')} type="date" className="input" /></div>
            <div><label className="label">Fecha conteo</label><input {...register('fechaConteo')} type="date" className="input" /></div>
            <div><label className="label">Cantidad tareas</label><input {...register('cantidadTareas')} type="number" min={0} className="input" /></div>
            <input type="number" {...register('corte1')} />
            <input type="number" {...register('corte2')} />
            <input type="number" {...register('corte3')} />
          </div>
        </div>

        {/* ── Decoración y despacho ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Decoración y despacho</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha asignación decorar</label><input {...register('fechaAsignacion')} type="date" className="input" /></div>
            <div><label className="label">Cantidad recibida</label><input {...register('cantidadRecibida')} type="number" min={0} className="input" /></div>
            <div><label className="label">Fecha despacho</label><input {...register('fechaDespacho')} type="date" className="input" /></div>
            <div><label className="label">Cantidad despacho</label><input {...register('cantidadDespacho')} type="number" min={0} className="input" /></div>
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
