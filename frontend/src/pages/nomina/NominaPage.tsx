import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const showDate = (d: any) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

const itemSchema = z.object({
  empleadoId:     z.string().min(1, 'Requerido'),
  diasTrabajados: z.coerce.number().int().min(0).max(31),
  horasExtras:    z.coerce.number().min(0).optional(),
  prestamoId:     z.string().optional(),
  abonosPrestamo: z.coerce.number().min(0).optional(),
  observaciones:  z.string().optional(),
});

const crearSchema = z.object({
  fecha: z.string().min(1, 'Requerido'),
  items: z.array(itemSchema).min(1, 'Agrega al menos un empleado'),
});

const editarSchema = z.object({
  fecha:          z.string().optional(),
  diasTrabajados: z.coerce.number().int().min(0).max(31).optional(),
  horasExtras:    z.coerce.number().min(0).optional(),
  prestamoId:     z.string().optional(),
  abonosPrestamo: z.coerce.number().min(0).optional(),
  observaciones:  z.string().optional(),
});

type CrearForm = z.infer<typeof crearSchema>;
type EditarForm = z.infer<typeof editarSchema>;

function calcular(salario: number, dias: number, horas: number, abono: number) {
  const salarioDia   = salario / 30;
  const subtotalDias = salarioDia * dias;
  const valorHora    = salario / 30 / 9;
  const subtotalHoras = valorHora * horas;
  const total        = subtotalDias + subtotalHoras - abono;
  return { salarioDia, subtotalDias, valorHora, subtotalHoras, total };
}

// ── Fila de empleado en el formulario de creación ─────────────
function FilaEmpleado({ idx, empleados, remove, register, watch, setValue, errors }: any) {
  const empleadoId    = watch(`items.${idx}.empleadoId`);
  const dias          = watch(`items.${idx}.diasTrabajados`) || 0;
  const horas         = watch(`items.${idx}.horasExtras`) || 0;
  const abono         = watch(`items.${idx}.abonosPrestamo`) || 0;
  const emp           = empleados?.find((e: any) => e.id === empleadoId);
  const calc          = emp ? calcular(Number(emp.salario), Number(dias), Number(horas), Number(abono)) : null;

  const { data: prestamos } = useQuery({
    queryKey: ['prest-nom', empleadoId],
    queryFn:  () => api.get('/prestamos', { params: { empleadoId, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled:  Boolean(empleadoId),
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase">Empleado {idx + 1}</span>
        <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500"><X size={15}/></button>
      </div>

      {/* Selector empleado */}
      <div>
        <label className="label">Empleado *</label>
        <select {...register(`items.${idx}.empleadoId`)} className="input"
          onChange={e => {
            setValue(`items.${idx}.empleadoId`, e.target.value, { shouldValidate: true });
            setValue(`items.${idx}.prestamoId`, '');
            setValue(`items.${idx}.abonosPrestamo`, 0);
          }}>
          <option value="">Selecciona empleado...</option>
          {empleados?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.nombre} — {e.documento}</option>
          ))}
        </select>
        {errors?.items?.[idx]?.empleadoId && <p className="text-red-500 text-xs mt-1">{errors.items[idx].empleadoId.message}</p>}
      </div>

      {emp && (
        <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 grid grid-cols-3 gap-2">
          <span>Salario: <strong>{fmt(emp.salario)}</strong></span>
          <span>$/día: <strong>{fmt(calc?.salarioDia)}</strong></span>
          <span>$/h.extra: <strong>{fmt(calc?.valorHora)}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Días trabajados *</label>
          <input {...register(`items.${idx}.diasTrabajados`)} type="number" min={0} max={31} className="input text-sm"/>
        </div>
        <div>
          <label className="label">Horas extras</label>
          <input {...register(`items.${idx}.horasExtras`)} type="number" min={0} step={0.5} className="input text-sm" placeholder="0"/>
        </div>
      </div>

      {/* Préstamo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Préstamo a descontar</label>
          <select {...register(`items.${idx}.prestamoId`)} className="input text-sm"
            onChange={e => { setValue(`items.${idx}.prestamoId`, e.target.value); setValue(`items.${idx}.abonosPrestamo`, 0); }}>
            <option value="">Sin préstamo</option>
            {prestamos?.map((p: any) => (
              <option key={p.id} value={p.id}>Saldo: {fmt(p.saldo)} ({showDate(p.fecha)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Valor abono</label>
          <input {...register(`items.${idx}.abonosPrestamo`)} type="number" min={0} step={0.01} className="input text-sm" placeholder="0"/>
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <input {...register(`items.${idx}.observaciones`)} className="input text-sm"/>
      </div>

      {/* Preview total */}
      {emp && (
        <div className="bg-gray-50 rounded p-2 space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">{dias} días × {fmt(calc?.salarioDia)}</span><span>{fmt(calc?.subtotalDias)}</span></div>
          {Number(horas) > 0 && <div className="flex justify-between"><span className="text-gray-500">{horas} h.extra × {fmt(calc?.valorHora)}</span><span>{fmt(calc?.subtotalHoras)}</span></div>}
          {Number(abono) > 0 && <div className="flex justify-between"><span className="text-gray-500">Abono préstamo</span><span className="text-red-600">− {fmt(abono)}</span></div>}
          <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="text-primary-700">{fmt(calc?.total)}</span></div>
        </div>
      )}
    </div>
  );
}

export default function NominaPage() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [mes, setMes]         = useState('');
  const [modal, setModal]     = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editEmpleado, setEditEmpleado] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['nomina', page, search, mes],
    queryFn: () => api.get('/nomina', { params: { page, limit: 20, search: search || undefined, mes: mes || undefined } }).then(r => r.data),
  });

  const { data: empleados } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => api.get('/empleados', { params: { limit: 500 } }).then(r => r.data.data?.filter((e: any) => e.activo)),
  });

  const { data: prestamosEdit } = useQuery({
    queryKey: ['prest-edit-nom', editEmpleado?.id],
    queryFn: () => api.get('/prestamos', { params: { empleadoId: editEmpleado.id, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled: Boolean(editEmpleado?.id),
  });

  const crearForm = useForm<CrearForm>({
    resolver: zodResolver(crearSchema),
    defaultValues: { items: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: crearForm.control, name: 'items' });

  const editarForm = useForm<EditarForm>({ resolver: zodResolver(editarSchema) });

  const openEdit = (row: any) => {
    setEditing(row);
    const emp = empleados?.find((e: any) => e.id === row.empleadoId) ?? row.empleado;
    setEditEmpleado(emp);
    editarForm.reset({
      fecha:          new Date(row.fecha).toISOString().slice(0,10),
      diasTrabajados: row.diasTrabajados,
      horasExtras:    Number(row.horasExtras),
      prestamoId:     row.prestamoId ?? '',
      abonosPrestamo: Number(row.abonosPrestamo),
      observaciones:  row.observaciones ?? '',
    });
    setEditModal(true);
  };

  const openModal = () => {
    const itemsIniciales = (empleados ?? []).map((e: any) => ({
      empleadoId: e.id, diasTrabajados: 30, horasExtras: 0, abonosPrestamo: 0, prestamoId: '', observaciones: '',
    }));
    crearForm.reset({ fecha: '', items: itemsIniciales });
    setModal(true);
  };
  const closeModal = () => { setModal(false); crearForm.reset({ items: [] }); };
  const closeEditModal = () => { setEditModal(false); setEditing(null); setEditEmpleado(null); editarForm.reset(); };

  const crear = useMutation({
    mutationFn: async (d: CrearForm) => {
      const calls = d.items.map(item => api.post('/nomina', {
        empleadoId:     item.empleadoId,
        fecha:          d.fecha,
        diasTrabajados: item.diasTrabajados,
        horasExtras:    item.horasExtras ?? 0,
        prestamoId:     item.prestamoId || null,
        abonosPrestamo: item.abonosPrestamo ?? 0,
        observaciones:  item.observaciones,
      }));
      return Promise.all(calls);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nomina'] }); qc.invalidateQueries({ queryKey: ['prestamos'] }); closeModal(); },
  });

  const editar = useMutation({
    mutationFn: (d: EditarForm) => api.patch(`/nomina/${editing.id}`, { ...d, prestamoId: d.prestamoId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nomina'] }); qc.invalidateQueries({ queryKey: ['prestamos'] }); closeEditModal(); },
  });

  const remove2 = useMutation({
    mutationFn: (id: string) => api.delete(`/nomina/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nomina'] }); qc.invalidateQueries({ queryKey: ['prestamos'] }); },
  });

  const salEdit = Number(editEmpleado?.salario ?? 0);
  const diasEdit = editarForm.watch('diasTrabajados') || 0;
  const horasEdit = editarForm.watch('horasExtras') || 0;
  const abonoEdit = editarForm.watch('abonosPrestamo') || 0;
  const calcEdit = salEdit > 0 ? calcular(salEdit, Number(diasEdit), Number(horasEdit), Number(abonoEdit)) : null;

  const columns = [
    { key: 'empleado',       header: 'Empleado',       render: (r: any) => r.empleado?.nombre ?? '—' },
    { key: 'fecha',          header: 'Fecha',           render: (r: any) => showDate(r.fecha) },
    { key: 'diasTrabajados', header: 'Días',            render: (r: any) => r.diasTrabajados },
    { key: 'subtotalDias',   header: 'Subtotal días',   render: (r: any) => fmt(r.subtotalDias) },
    { key: 'horasExtras',    header: 'H. Extra',        render: (r: any) => Number(r.horasExtras) > 0 ? `${r.horasExtras}h — ${fmt(r.subtotalHoras)}` : '—' },
    { key: 'abonosPrestamo', header: 'Abono préstamo',  render: (r: any) => Number(r.abonosPrestamo) > 0 ? <span className="text-red-600">− {fmt(r.abonosPrestamo)}</span> : '—' },
    { key: 'totalPagar',     header: 'Total a pagar',   render: (r: any) => <span className="font-bold text-primary-700">{fmt(r.totalPagar)}</span> },
    { key: 'acciones',       header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-primary-600"><Pencil size={14}/></button>
        <button onClick={() => { if (confirm('¿Eliminar nómina?')) remove2.mutate(r.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1>Nómina</h1><p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} registros</p></div>
        <button onClick={openModal} className="btn-primary"><Plus size={16}/> Registrar nómina</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar empleado..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <input type="month" className="input w-44" value={mes} onChange={e => { setMes(e.target.value); setPage(1); }}/>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen/> : !data?.data?.length ? (
          <EmptyState message="Sin registros de nómina" action={<button onClick={() => setModal(true)} className="btn-primary">Registrar nómina</button>}/>
        ) : (
          <><Table columns={columns} data={data.data}/><Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/></>
        )}
      </div>

      {/* ── Modal Crear (múltiples empleados) ── */}
      <Modal title="Registrar nómina" open={modal} onClose={closeModal}>
        <form onSubmit={crearForm.handleSubmit(d => crear.mutate(d))} className="space-y-4">

          <div>
            <label className="label">Fecha de pago *</label>
            <input {...crearForm.register('fecha')} type="date" className="input"/>
            {crearForm.formState.errors.fecha && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.fecha.message}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Empleados</p>
              <button type="button"
                onClick={() => append({ empleadoId: '', diasTrabajados: 30, horasExtras: 0, abonosPrestamo: 0 })}
                className="btn-secondary text-xs py-1.5 px-3"><Plus size={13}/> Agregar empleado</button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {fields.map((field, idx) => (
                <FilaEmpleado
                  key={field.id} idx={idx}
                  empleados={empleados}
                  remove={remove}
                  register={crearForm.register}
                  watch={crearForm.watch}
                  setValue={crearForm.setValue}
                  errors={crearForm.formState.errors}
                />
              ))}
            </div>
          </div>

          {crear.isError && <p className="text-red-500 text-sm">Error al registrar nómina</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={crear.isPending} className="btn-primary">
              {crear.isPending ? <Spinner size="sm"/> : `Registrar ${fields.length} nómina${fields.length > 1 ? 's' : ''}`}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Editar ── */}
      <Modal title={`Editar — ${editing?.empleado?.nombre ?? ''}`} open={editModal} onClose={closeEditModal}>
        <form onSubmit={editarForm.handleSubmit(d => editar.mutate(d))} className="space-y-4">
          {editEmpleado && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 grid grid-cols-3 gap-2">
              <span>Salario: <strong>{fmt(editEmpleado.salario)}</strong></span>
              <span>$/día: <strong>{fmt(calcEdit?.salarioDia)}</strong></span>
              <span>$/h.extra: <strong>{fmt(calcEdit?.valorHora)}</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input {...editarForm.register('fecha')} type="date" className="input"/>
            </div>
            <div>
              <label className="label">Días trabajados</label>
              <input {...editarForm.register('diasTrabajados')} type="number" min={0} max={31} className="input"/>
            </div>
          </div>
          <div>
            <label className="label">Horas extras</label>
            <input {...editarForm.register('horasExtras')} type="number" min={0} step={0.5} className="input" placeholder="0"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Préstamo</label>
              <select {...editarForm.register('prestamoId')} className="input text-sm">
                <option value="">Sin préstamo</option>
                {prestamosEdit?.map((p: any) => (
                  <option key={p.id} value={p.id}>Saldo: {fmt(p.saldo)} ({showDate(p.fecha)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Valor abono</label>
              <input {...editarForm.register('abonosPrestamo')} type="number" min={0} step={0.01} className="input" placeholder="0"/>
            </div>
          </div>
          <div>
            <label className="label">Observaciones</label>
            <textarea {...editarForm.register('observaciones')} rows={2} className="input"/>
          </div>

          {calcEdit && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{diasEdit} días × {fmt(calcEdit.salarioDia)}</span><span>{fmt(calcEdit.subtotalDias)}</span></div>
              {Number(horasEdit) > 0 && <div className="flex justify-between"><span className="text-gray-500">{horasEdit} h.extra × {fmt(calcEdit.valorHora)}</span><span>{fmt(calcEdit.subtotalHoras)}</span></div>}
              {Number(abonoEdit) > 0 && <div className="flex justify-between"><span className="text-gray-500">Abono préstamo</span><span className="text-red-600">− {fmt(abonoEdit)}</span></div>}
              <div className="flex justify-between font-bold border-t pt-2"><span>Total a pagar</span><span className="text-primary-700">{fmt(calcEdit.total)}</span></div>
            </div>
          )}

          {editar.isError && <p className="text-red-500 text-sm">Error al guardar</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={editar.isPending} className="btn-primary">
              {editar.isPending ? <Spinner size="sm"/> : 'Guardar'}
            </button>
            <button type="button" onClick={closeEditModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
