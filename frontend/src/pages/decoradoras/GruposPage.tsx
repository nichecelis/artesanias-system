import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const schema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres'),
  tipo:        z.enum(['GRUPO', 'ELITE']),
  direccion:   z.string().optional(),
  telefono:    z.string().optional(),
  responsable: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function GruposPage() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['grupos', page],
    queryFn: () => api.get('/grupos', { params: { page, limit: 20 } }).then(r => r.data),
  });

  const { data: grupoDetalle } = useQuery({
    queryKey: ['grupo-detalle', detalle?.id],
    queryFn: () => api.get(`/grupos/${detalle.id}`).then(r => r.data.data),
    enabled: Boolean(detalle?.id),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'GRUPO' },
  });

  const openNew  = () => { setEditing(null); reset({ tipo: 'GRUPO' }); setModal(true); };
  const openEdit = (row: any) => { setEditing(row); reset(row); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = useMutation({
    mutationFn: (data: Form) =>
      editing ? api.patch(`/grupos/${editing.id}`, data) : api.post('/grupos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grupos'] }); closeModal(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/grupos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grupos'] }),
  });

  const columns = [
    { key: 'tipo',   header: 'Tipo', render: (r: any) => (
      <span className={`badge ${r.tipo === 'ELITE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
        {r.tipo}
      </span>
    )},
    { key: 'nombre',      header: 'Nombre' },
    { key: 'responsable', header: 'Responsable', render: (r: any) => r.responsable ?? '—' },
    { key: 'telefono',    header: 'Teléfono',    render: (r: any) => r.telefono ?? '—' },
    { key: 'direccion',   header: 'Dirección',   render: (r: any) => r.direccion ?? '—' },
    { key: 'miembros',    header: 'Decoradoras', render: (r: any) => (
      <span className="badge bg-gray-100 text-gray-700">{r._count?.decoradoras ?? 0}</span>
    )},
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-primary-600"><Pencil size={15} /></button>
        <button onClick={() => { if (confirm('¿Eliminar grupo?')) remove.mutate(r.id); }}
          className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Grupos y Elites</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} grupos registrados</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Nuevo grupo</button>
      </div>

      {/* Estadísticas rápidas */}
      {data?.data?.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Grupos</p>
              <p className="text-xl font-bold">{data.data.filter((g: any) => g.tipo === 'GRUPO').length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Users size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Elites</p>
              <p className="text-xl font-bold">{data.data.filter((g: any) => g.tipo === 'ELITE').length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen /> : !data?.data?.length ? (
          <EmptyState
            message="No hay grupos registrados"
            action={<button onClick={openNew} className="btn-primary">Crear primer grupo</button>}
          />
        ) : (
          <>
            <Table columns={columns} data={data.data} onRowClick={r => setDetalle(r)} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modal detalle del grupo */}
      <Modal title={`Miembros — ${detalle?.nombre ?? ''}`} open={Boolean(detalle)} onClose={() => setDetalle(null)}>
        {!grupoDetalle ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-medium">{grupoDetalle.tipo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Responsable</p>
                <p className="font-medium">{grupoDetalle.responsable ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Teléfono</p>
                <p className="font-medium">{grupoDetalle.telefono ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Dirección</p>
                <p className="font-medium">{grupoDetalle.direccion ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Decoradoras miembro ({grupoDetalle.decoradoras?.length ?? 0})
              </p>
              {grupoDetalle.decoradoras?.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Sin decoradoras asignadas</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {grupoDetalle.decoradoras?.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium">{d.nombre}</span>
                      <span className="text-gray-400 text-xs">{d.documento}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal formulario */}
      <Modal title={editing ? 'Editar grupo' : 'Nuevo grupo'} open={modal} onClose={closeModal}>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input {...register('nombre')} className="input" placeholder="Ej: Grupo Norte, Elite Centro" />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select {...register('tipo')} className="input">
                <option value="GRUPO">GRUPO</option>
                <option value="ELITE">ELITE</option>
              </select>
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Responsable / Líder</label>
              <input {...register('responsable')} className="input" placeholder="Nombre del líder del grupo" />
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input {...register('direccion')} className="input" placeholder="Dirección de la sede" />
            </div>
          </div>
          {save.isError && <p className="text-red-500 text-sm">Error al guardar</p>}
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
