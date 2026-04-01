import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Eye, EyeOff, Check, X } from 'lucide-react';
import { empleadosService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const schema = z.object({
  nombre:    z.string().min(2),
  documento: z.string().min(3),
  salario:   z.coerce.number().min(1),
});
type Form = z.infer<typeof schema>;

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;

export default function EmpleadosPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['empleados', page, mostrarInactivos],
    queryFn: () => {
      const params: any = { page, limit: 10 };
      if (!mostrarInactivos) {
        params.activo = true;
      }
      return empleadosService.listar(params).then((r) => r.data);
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', documento: '', salario: 0 },
  });

  const openNew  = () => { setEditing(null); reset({ nombre: '', documento: '', salario: 0 }); setModal(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    reset({ nombre: row.nombre, documento: row.documento, salario: Number(row.salario) });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = useMutation({
    mutationFn: (data: Form) =>
      editing ? empleadosService.actualizar(editing.id, data) : empleadosService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empleados'] });
      closeModal();
      toast.addToast(editing ? 'Empleado actualizado exitosamente' : 'Empleado creado exitosamente', 'success');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => empleadosService.inactivar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empleados'] });
      toast.addToast('Empleado inactivado exitosamente', 'success');
    },
    onError: () => toast.addToast('No se puede inactivar: el empleado tiene registros asociados', 'error'),
  });

  const activate = useMutation({
    mutationFn: (id: string) => empleadosService.activar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empleados'] });
      toast.addToast('Empleado activado exitosamente', 'success');
    },
    onError: () => toast.addToast('Error al activar empleado', 'error'),
  });

  const columns = [
    { key: 'nombre',    header: 'Nombre', render: (r: any) => (
      <div className="flex items-center gap-2">
        <span className={!r.activo ? 'text-gray-400 line-through' : ''}>{r.nombre}</span>
        {!r.activo && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactivo</span>}
      </div>
    )},
    { key: 'documento', header: 'Documento',   render: (r: any) => r.documento ?? '—' },
    { key: 'salario',   header: 'Salario',      render: (r: any) => fmt(r.salario) },
    { key: 'acciones',  header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-primary-600">
          <Pencil size={15} />
        </button>
        {r.activo ? (
          <button onClick={() => { if (confirm(`¿Inactivar a ${r.nombre}?`)) remove.mutate(r.id); }}
            className="text-gray-400 hover:text-red-600" title="Inactivar"><X size={15} /></button>
        ) : (
          <button onClick={() => { if (confirm(`¿Activar a ${r.nombre}?`)) activate.mutate(r.id); }}
            className="text-gray-400 hover:text-green-600" title="Activar"><Check size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Empleados</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} empleados</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nuevo empleado</button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setMostrarInactivos(!mostrarInactivos); setPage(1); }}
          className={`btn-secondary flex items-center gap-2 ${mostrarInactivos ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : ''}`}
          title={mostrarInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
        >
          {mostrarInactivos ? <EyeOff size={16} /> : <Eye size={16} />}
          {mostrarInactivos ? 'Ocultando inactivos' : 'Ver inactivos'}
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen /> : !data?.data?.length ? (
          <EmptyState message="Sin empleados" action={<button onClick={openNew} className="btn-primary">Agregar empleado</button>} />
        ) : (
          <>
            <Table columns={columns} data={data.data} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal title={editing ? 'Editar empleado' : 'Nuevo empleado'} open={modal} onClose={closeModal}>
        <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input {...register('nombre')} className="input" />
          </div>
          <div>
            <label className="label">Documento *</label>
            <input {...register('documento')} className="input" placeholder="Cédula o NIT" />
          </div>
          <div>
            <label className="label">Salario *</label>
            <input {...register('salario')} type="number" min={0} className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting || save.isPending} className="btn-primary">
              {(isSubmitting || save.isPending) ? <Spinner size="sm" /> : (editing ? 'Guardar' : 'Crear')}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
