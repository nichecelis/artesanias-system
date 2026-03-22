import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
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
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['empleados', page],
    queryFn: () => empleadosService.listar({ page, limit: 10 }).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { salarioBase: 0 },
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

  const columns = [
    { key: 'nombre',    header: 'Nombre' },
    { key: 'documento', header: 'Documento',   render: (r: any) => r.documento ?? '—' },
    { key: 'salario',   header: 'Salario',      render: (r: any) => fmt(r.salario) },
    { key: 'activo',    header: 'Estado',        render: (r: any) => (
      <span className={`badge ${r.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
        {r.activo ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { key: 'acciones',  header: '', render: (r: any) => (
      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="text-gray-400 hover:text-primary-600">
        <Pencil size={15} />
      </button>
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
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Spinner size="sm" /> : (editing ? 'Guardar' : 'Crear')}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
