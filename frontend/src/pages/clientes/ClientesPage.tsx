import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { clientesService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';

const TRANSPORTADORAS = [
  'Servientrega','Coordinadora','Deprisa','Envia','TCC',
  'Interrapidísimo','La 14','Almacenes Éxito','Domina',
  'Mensajeros Urbanos','Picap','Rappi','Otra',
];

const schema = z.object({
  nombre:         z.string().min(2, 'Mínimo 2 caracteres'),
  documento:      z.string().min(3, 'Requerido'),
  direccion:      z.string().optional(),
  telefono:       z.string().optional(),
  transportadora: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ClientesPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => clientesService.listar({ page, limit: 10, search: search || undefined }).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const openNew  = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    reset({
      nombre:         row.nombre,
      documento:      row.documento,
      direccion:      row.direccion  ?? '',
      telefono:       row.telefono   ?? '',
      transportadora: row.transportadora ?? '',
    });
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditing(null); reset({}); };

  const save = useMutation({
    mutationFn: (data: Form) =>
      editing ? clientesService.actualizar(editing.id, data) : clientesService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      closeModal();
      toast.addToast(editing ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente', 'success');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => clientesService.eliminar(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['clientes'] }),
    onError:    () => toast.addToast('No se puede eliminar: el cliente tiene pedidos asociados', 'error'),
  });

  const columns = [
    { key: 'nombre',         header: 'Nombre' },
    { key: 'documento',      header: 'Documento',      render: (r: any) => r.documento ?? '—' },
    { key: 'telefono',       header: 'Teléfono',       render: (r: any) => r.telefono ?? '—' },
    { key: 'direccion',      header: 'Dirección',      render: (r: any) => r.direccion ?? '—' },
    { key: 'transportadora', header: 'Transportadora', render: (r: any) => r.transportadora ?? '—' },
    { key: 'acciones',       header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-primary-600"><Pencil size={15} /></button>
        <button onClick={() => { if (confirm(`¿Eliminar a ${r.nombre}?`)) remove.mutate(r.id); }}
          className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Clientes</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} clientes registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nuevo cliente</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por nombre o documento..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen /> : !data?.data?.length ? (
          <EmptyState message="Sin clientes" action={<button onClick={openNew} className="btn-primary">Agregar cliente</button>} />
        ) : (
          <>
            <Table columns={columns} data={data.data} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal title={editing ? 'Editar cliente' : 'Nuevo cliente'} open={modal} onClose={closeModal}>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input {...register('nombre')} className="input" placeholder="Nombre o razón social" />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Documento *</label>
              <input {...register('documento')} className="input" placeholder="NIT o cédula" />
              {errors.documento && <p className="text-red-500 text-xs mt-1">{errors.documento.message}</p>}
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="300 000 0000" />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input {...register('direccion')} className="input" placeholder="Calle, carrera, barrio..." />
            </div>
            <div className="col-span-2">
              <label className="label">Transportadora</label>
              <select {...register('transportadora')} className="input">
                <option value="">Selecciona...</option>
                {TRANSPORTADORAS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {save.isError && <p className="text-red-500 text-sm">Error al guardar. Verifica que el documento no esté duplicado.</p>}
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
