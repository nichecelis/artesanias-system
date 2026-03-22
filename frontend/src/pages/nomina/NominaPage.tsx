import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, X, Edit3 } from 'lucide-react';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function showDate(d: any) {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0];
  const [y, m, day] = s.split('-');
  return `${Number(day)} ${meses[Number(m) - 1]} ${y}`;
}

const itemSchema = z.object({
  id:             z.string().optional(),
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

const editarMassSchema = z.object({
  items: z.array(itemSchema),
});

type CrearForm = z.infer<typeof crearSchema>;
type EditarMassForm = z.infer<typeof editarMassSchema>;

function calcular(salario: number, dias: number, horas: number, abono: number) {
  const salarioDia    = salario / 30;
  const subtotalDias  = Math.round(salarioDia * dias);
  const valorHora     = Math.round(salario / 30 / 9);
  const subtotalHoras = Math.round(valorHora * horas);
  const total         = subtotalDias + subtotalHoras - abono;
  return { salarioDia: Math.round(salarioDia), subtotalDias, valorHora, subtotalHoras, total };
}

// ── Fila de empleado en el formulario de creación ─────────────
function FilaEmpleado({ idx, empleados, remove, register, watch, setValue }: any) {
  const empleadoId = watch(`items.${idx}.empleadoId`);
  const dias       = watch(`items.${idx}.diasTrabajados`) || 0;
  const horas      = watch(`items.${idx}.horasExtras`) || 0;
  const abono      = watch(`items.${idx}.abonosPrestamo`) || 0;
  const emp        = empleados?.find((e: any) => e.id === empleadoId);
  const calc       = emp ? calcular(Number(emp.salario), Number(dias), Number(horas), Number(abono)) : null;

  const { data: prestamos } = useQuery({
    queryKey: ['prest-nom', empleadoId],
    queryFn:  () => api.get('/prestamos', { params: { empleadoId, soloConSaldo: true, limit: 50 } }).then(r => r.data.data),
    enabled:  Boolean(empleadoId),
  });

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="font-medium">{emp?.nombre ?? '—'}</span>
          <span className="text-gray-400 text-xs ml-2">{emp?.documento}</span>
        </div>
        <div className="w-20 text-center">
          <input {...register(`items.${idx}.diasTrabajados`)} type="number" min={0} max={31} className="input text-center text-sm py-1" placeholder="Días"/>
        </div>
        <div className="w-20 text-center">
          <input {...register(`items.${idx}.horasExtras`)} type="number" min={0} step={0.5} className="input text-center text-sm py-1" placeholder="H.Extra"/>
        </div>
        <div className="w-24">
          <select {...register(`items.${idx}.prestamoId`)} className="input text-xs py-1"
            onChange={e => { setValue(`items.${idx}.prestamoId`, e.target.value); setValue(`items.${idx}.abonosPrestamo`, 0); }}>
            <option value="">Sin préstamo</option>
            {prestamos?.map((p: any) => (
              <option key={p.id} value={p.id}>Saldo: {fmt(p.saldo)}</option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <input {...register(`items.${idx}.abonosPrestamo`)} type="number" min={0} step={0.01} className="input text-right text-sm py-1" placeholder="Abono"/>
        </div>
        <div className="w-28 text-right font-medium text-primary-700">
          {emp ? fmt(calc?.total) : '—'}
        </div>
        <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
      </div>
      {emp && (
        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
          <span>Salario: {fmt(emp.salario)}</span>
          <span>$/día: {fmt(calc?.salarioDia)}</span>
          <span>$/h.extra: {fmt(calc?.valorHora)}</span>
          <span>Pago: {fmt(calc?.subtotalDias + calc?.subtotalHoras)}</span>
          {Number(abono) > 0 && <span className="text-red-500">− Abono: {fmt(abono)}</span>}
        </div>
      )}
    </div>
  );
}

// ── Fila de empleado en edición masiva ─────────────
function FilaEmpleadoMass({ idx, empleados, prestamosPorEmpleado, register, watch, setValue }: any) {
  const fields = watch(`items`);
  const item   = fields?.[idx] ?? {};
  const dias   = Number(item.diasTrabajados) || 0;
  const horas  = Number(item.horasExtras) || 0;
  const abono  = Number(item.abonosPrestamo) || 0;
  const emp    = empleados?.find((e: any) => e.id === item.empleadoId);
  const calc   = emp ? calcular(Number(emp.salario), dias, horas, abono) : null;
  const prestamos = prestamosPorEmpleado?.[item.empleadoId] ?? [];

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="font-medium">{emp?.nombre ?? '—'}</span>
          <span className="text-gray-400 text-xs ml-2">{emp?.documento}</span>
        </div>
        <div className="w-20 text-center">
          <input {...register(`items.${idx}.diasTrabajados`)} type="number" min={0} max={31} className="input text-center text-sm py-1"/>
        </div>
        <div className="w-20 text-center">
          <input {...register(`items.${idx}.horasExtras`)} type="number" min={0} step={0.5} className="input text-center text-sm py-1"/>
        </div>
        <div className="w-24">
          <select {...register(`items.${idx}.prestamoId`)} className="input text-xs py-1"
            onChange={e => { setValue(`items.${idx}.prestamoId`, e.target.value); setValue(`items.${idx}.abonosPrestamo`, 0); }}>
            <option value="">Sin préstamo</option>
            {prestamos.map((p: any) => (
              <option key={p.id} value={p.id}>Saldo: {fmt(p.saldo)}</option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <input {...register(`items.${idx}.abonosPrestamo`)} type="number" min={0} step={0.01} className="input text-right text-sm py-1"/>
        </div>
        <div className="w-28 text-right font-medium text-primary-700">
          {emp ? fmt(calc?.total ?? 0) : '—'}
        </div>
      </div>
      {emp && (
        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
          <span>$/día: {fmt(calc?.salarioDia)}</span>
          <span>$/h.extra: {fmt(calc?.valorHora)}</span>
          <span>Pago: {fmt(calc?.subtotalDias + calc?.subtotalHoras)}</span>
          {abono > 0 && <span className="text-red-500">− Abono: {fmt(abono)}</span>}
        </div>
      )}
    </div>
  );
}

export default function NominaPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [mes, setMes]               = useState('');
  const [modal, setModal]           = useState(false);
  const [editMassModal, setEditMassModal] = useState(false);
  const [editFecha, setEditFecha]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['nomina', page, search, mes],
    queryFn: () => api.get('/nomina', { params: { page, limit: 10, search: search || undefined, mes: mes || undefined } }).then(r => r.data),
  });

  const { data: empleados } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => api.get('/empleados', { params: { limit: 500 } }).then(r => r.data.data?.filter((e: any) => e.activo)),
  });

  const crearForm = useForm<CrearForm>({
    resolver: zodResolver(crearSchema),
    defaultValues: { items: [] },
  });
  const { fields, append, remove } = useFieldArray({ control: crearForm.control, name: 'items' });

  const editarMassForm = useForm<EditarMassForm>({ resolver: zodResolver(editarMassSchema) });

  const { data: nominaParaEditar, isLoading: loadingNominaEdit } = useQuery({
    queryKey: ['nomina-para-editar', editFecha],
    queryFn: () => api.get('/nomina', { params: { fecha: editFecha, limit: 500 } }).then(r => r.data.data ?? []),
    enabled: Boolean(editFecha),
  });

  const { data: todosPrestamos } = useQuery({
    queryKey: ['prestamos-activos'],
    queryFn: () => api.get('/prestamos', { params: { soloConSaldo: true, limit: 500 } }).then(r => r.data.data ?? []),
    enabled: editMassModal,
  });

  const prestamosPorEmpleado: Record<string, any[]> = {};
  if (todosPrestamos) {
    for (const p of todosPrestamos) {
      if (!prestamosPorEmpleado[p.empleadoId]) prestamosPorEmpleado[p.empleadoId] = [];
      prestamosPorEmpleado[p.empleadoId].push(p);
    }
  }

  useEffect(() => {
    if (nominaParaEditar?.length && editMassModal) {
      const items = nominaParaEditar.map((n: any) => ({
        id:             n.id,
        empleadoId:     n.empleadoId,
        diasTrabajados: n.diasTrabajados,
        horasExtras:    Number(n.horasExtras) || 0,
        prestamoId:     n.prestamoId ?? '',
        abonosPrestamo: Number(n.abonosPrestamo) || 0,
        observaciones:  n.observaciones ?? '',
      }));
      editarMassForm.reset({ items });
    }
  }, [nominaParaEditar, editMassModal]);

  const openEditMass = () => {
    const fechaIngresada = prompt('Ingrese la fecha de nómina a editar (YYYY-MM-DD):');
    if (!fechaIngresada) return;
    setEditFecha(fechaIngresada);
    setEditMassModal(true);
  };

  const closeEditMassModal = () => {
    setEditMassModal(false);
    setEditFecha('');
    editarMassForm.reset({ items: [] });
  };

  const openModalLoaded = () => {
    crearForm.reset({ 
      fecha: '', 
      items: (empleados ?? []).map((e: any) => ({
        empleadoId: e.id, diasTrabajados: 30, horasExtras: 0, abonosPrestamo: 0, prestamoId: '', observaciones: '',
      }))
    });
    setModal(true);
  };
  const closeModal = () => { setModal(false); crearForm.reset({ items: [] }); };

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomina'] });
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      closeModal();
      toast.addToast('Nómina registrada exitosamente', 'success');
    },
  });

  const editarMass = useMutation({
    mutationFn: (items: any[]) => {
      const calls = items.map(item => api.patch(`/nomina/${item.id}`, {
        diasTrabajados: item.diasTrabajados,
        horasExtras:    item.horasExtras ?? 0,
        prestamoId:     item.prestamoId || null,
        abonosPrestamo: item.abonosPrestamo ?? 0,
        observaciones:  item.observaciones,
      }));
      return Promise.all(calls);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nomina'] });
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      closeEditMassModal();
      toast.addToast('Nómina actualizada exitosamente', 'success');
    },
  });

  const remove2 = useMutation({
    mutationFn: (id: string) => api.delete(`/nomina/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nomina'] }); qc.invalidateQueries({ queryKey: ['prestamos'] }); },
  });

  const columns = [
    { key: 'empleado',       header: 'Empleado',       render: (r: any) => r.empleado?.nombre ?? '—' },
    { key: 'fecha',          header: 'Fecha',           render: (r: any) => showDate(r.fecha) },
    { key: 'diasTrabajados', header: 'Días',            render: (r: any) => r.diasTrabajados },
    { key: 'subtotalDias',   header: 'Subtotal días',   render: (r: any) => fmt(r.subtotalDias) },
    { key: 'horasExtras',    header: 'H. Extra',        render: (r: any) => Number(r.horasExtras) > 0 ? `${r.horasExtras}h — ${fmt(r.subtotalHoras)}` : '—' },
    { key: 'abonosPrestamo', header: 'Abono préstamo',  render: (r: any) => Number(r.abonosPrestamo) > 0 ? <span className="text-red-600">− {fmt(r.abonosPrestamo)}</span> : '—' },
    { key: 'totalPagar',     header: 'Total a pagar',   render: (r: any) => <span className="font-bold text-primary-700">{fmt(r.totalPagar)}</span> },
    { key: 'acciones',       header: '', render: (r: any) => (
      <button onClick={() => { if (confirm('¿Eliminar nómina?')) remove2.mutate(r.id); }} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1>Nómina</h1><p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} registros</p></div>
        <div className="flex gap-2">
          <button onClick={openEditMass} className="btn-secondary"><Edit3 size={16}/> Editar nómina</button>
          <button onClick={openModalLoaded} className="btn-primary"><Plus size={16}/> Registrar nómina</button>
        </div>
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
          <EmptyState message="Sin registros de nómina" action={<button onClick={openModalLoaded} className="btn-primary">Registrar nómina</button>}/>
        ) : (
          <><Table columns={columns} data={data.data}/><Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/></>
        )}
      </div>

      {/* ── Modal Crear (múltiples empleados) ── */}
      <Modal title="Registrar nómina" open={modal} onClose={closeModal} size="full">
        <form onSubmit={crearForm.handleSubmit(d => crear.mutate(d))} className="space-y-4">

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="label">Fecha de pago *</label>
              <input {...crearForm.register('fecha')} type="date" className="input"/>
              {crearForm.formState.errors.fecha && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.fecha.message}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => append({ empleadoId: '', diasTrabajados: 30, horasExtras: 0, abonosPrestamo: 0 })}
                className="btn-secondary text-sm"><Plus size={14}/> Agregar</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase px-3">
              <div className="flex-1">Empleado</div>
              <div className="w-20 text-center">Días</div>
              <div className="w-20 text-center">H.Extra</div>
              <div className="w-24">Préstamo</div>
              <div className="w-24">Abono</div>
              <div className="w-28 text-right">Total</div>
              <div className="w-6"></div>
            </div>
            {fields.map((field, idx) => (
              <FilaEmpleado
                key={field.id} idx={idx}
                empleados={empleados}
                remove={remove}
                register={crearForm.register}
                watch={crearForm.watch}
                setValue={crearForm.setValue}
              />
            ))}
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

      {/* ── Modal Editar Masivo ── */}
      <Modal title={`Editar nómina — ${editFecha}`} open={editMassModal} onClose={closeEditMassModal} size="full">
        {loadingNominaEdit ? (
          <div className="flex justify-center py-12"><Spinner size="lg"/></div>
        ) : nominaParaEditar?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay registros de nómina para la fecha {editFecha}</p>
            <button onClick={closeEditMassModal} className="btn-secondary mt-4">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={editarMassForm.handleSubmit(d => editarMass.mutate(d.items))} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase px-3">
                <div className="flex-1">Empleado</div>
                <div className="w-20 text-center">Días</div>
                <div className="w-20 text-center">H.Extra</div>
                <div className="w-24">Préstamo</div>
                <div className="w-24">Abono</div>
                <div className="w-28 text-right">Total</div>
              </div>
              {editarMassForm.watch('items')?.map((_: any, idx: number) => (
                <FilaEmpleadoMass
                  key={idx} idx={idx}
                  empleados={empleados}
                  prestamosPorEmpleado={prestamosPorEmpleado}
                  register={editarMassForm.register}
                  watch={editarMassForm.watch}
                  setValue={editarMassForm.setValue}
                />
              ))}
            </div>

            {editarMass.isError && <p className="text-red-500 text-sm">Error al guardar cambios</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={editarMass.isPending} className="btn-primary">
                {editarMass.isPending ? <Spinner size="sm"/> : `Guardar ${editarMassForm.watch('items')?.length ?? 0} registros`}
              </button>
              <button type="button" onClick={closeEditMassModal} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
