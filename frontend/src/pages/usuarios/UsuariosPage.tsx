import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, KeyRound, UserX, UserCheck, Eye, EyeOff, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';
import { ROLES_LIST, ROL_COLORS, type Rol } from '../../types';

const crearSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  correo:   z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol:      z.enum(['ADMINISTRADOR','PRODUCCION','CONTABILIDAD'] as [Rol, ...Rol[]]),
});

const editarSchema = z.object({
  nombre: z.string().min(2),
  correo: z.string().email(),
  rol:    z.enum(['ADMINISTRADOR','PRODUCCION','CONTABILIDAD'] as [Rol, ...Rol[]]),
});

const passSchema = z.object({
  password:  z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string().min(6),
}).refine(d => d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });

type CrearForm  = z.infer<typeof crearSchema>;
type EditarForm = z.infer<typeof editarSchema>;
type PassForm   = z.infer<typeof passSchema>;

export default function UsuariosPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'crear'|'editar'|'password'|null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', page, search, mostrarInactivos],
    queryFn: () => {
      const params: any = { page, limit: 10, search: search || undefined };
      if (!mostrarInactivos) {
        params.activo = true;
      }
      return api.get('/usuarios', { params }).then(r => r.data);
    },
  });

  const crearForm = useForm<CrearForm>({ resolver: zodResolver(crearSchema), defaultValues: { rol: 'PRODUCCION' } });
  const editarForm = useForm<EditarForm>({ resolver: zodResolver(editarSchema) });
  const passForm  = useForm<PassForm>({ resolver: zodResolver(passSchema) });

  const closeModal = () => { setModal(null); setSelected(null); crearForm.reset(); editarForm.reset(); passForm.reset(); };

  const openEditar = (row: any) => {
    setSelected(row);
    editarForm.reset({ nombre: row.nombre, correo: row.correo, rol: row.rol });
    setModal('editar');
  };

  const openPassword = (row: any) => { setSelected(row); passForm.reset(); setModal('password'); };

  const crear = useMutation({
    mutationFn: (d: CrearForm) => api.post('/usuarios', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
      toast.addToast('Usuario creado exitosamente', 'success');
    },
  });

  const editar = useMutation({
    mutationFn: (d: EditarForm) => api.patch(`/usuarios/${selected.id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      closeModal();
      toast.addToast('Usuario actualizado exitosamente', 'success');
    },
  });

  const cambiarPass = useMutation({
    mutationFn: (d: PassForm) => api.patch(`/usuarios/${selected.id}/password`, { password: d.password }),
    onSuccess: () => { closeModal(); toast.addToast('Contraseña actualizada', 'success'); },
  });

  const inactivar = useMutation({
    mutationFn: (id: string) => api.patch(`/usuarios/${id}`, { activo: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.addToast('Usuario inactivado exitosamente', 'success');
    },
    onError: () => toast.addToast('No se puede inactivar', 'error'),
  });

  const activar = useMutation({
    mutationFn: (id: string) => api.patch(`/usuarios/${id}`, { activo: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.addToast('Usuario activado exitosamente', 'success');
    },
    onError: () => toast.addToast('Error al activar usuario', 'error'),
  });

  const columns = [
    { key: 'nombre', header: 'Nombre', render: (r: any) => (
      <div className="flex items-center gap-2">
        <span className={!r.activo ? 'text-gray-400 line-through' : ''}>{r.nombre}</span>
        {!r.activo && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactivo</span>}
      </div>
    )},
    { key: 'correo', header: 'Correo' },
    { key: 'rol',    header: 'Rol', render: (r: { rol: Rol }) => (
      <span className={`badge ${ROL_COLORS[r.rol] ?? 'bg-gray-100'}`}>{r.rol}</span>
    )},
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEditar(r)} className="text-gray-400 hover:text-primary-600" title="Editar"><Pencil size={15} /></button>
        <button onClick={() => openPassword(r)} className="text-gray-400 hover:text-yellow-600" title="Cambiar contraseña"><KeyRound size={15} /></button>
        {r.activo ? (
          <button onClick={() => { if (confirm(`¿Inactivar a ${r.nombre}?`)) inactivar.mutate(r.id); }}
            className="text-gray-400 hover:text-red-600" title="Inactivar"><X size={15} /></button>
        ) : (
          <button onClick={() => { if (confirm(`¿Activar a ${r.nombre}?`)) activar.mutate(r.id); }}
            className="text-gray-400 hover:text-green-600" title="Activar"><Check size={15} /></button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Usuarios</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} usuarios registrados</p>
        </div>
        <button onClick={() => setModal('crear')} className="btn-primary"><Plus size={16} /> Nuevo usuario</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por nombre o correo..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
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
          <EmptyState message="Sin usuarios" action={<button onClick={() => setModal('crear')} className="btn-primary">Crear usuario</button>} />
        ) : (
          <>
            <Table columns={columns} data={data.data} />
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {/* Modal crear */}
      <Modal title="Nuevo usuario" open={modal === 'crear'} onClose={closeModal}>
        <form onSubmit={crearForm.handleSubmit(d => crear.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input {...crearForm.register('nombre')} className="input" placeholder="Nombre completo" />
              {crearForm.formState.errors.nombre && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.nombre.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Correo *</label>
              <input {...crearForm.register('correo')} type="email" className="input" placeholder="correo@empresa.com" />
              {crearForm.formState.errors.correo && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.correo.message}</p>}
            </div>
            <div>
              <label className="label">Contraseña *</label>
              <input {...crearForm.register('password')} type="password" className="input" placeholder="Mínimo 6 caracteres" />
              {crearForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{crearForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Rol *</label>
              <select {...crearForm.register('rol')} className="input">
                {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {crear.isError && <p className="text-red-500 text-sm">Error al crear. Verifica que el correo no esté duplicado.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={crear.isPending} className="btn-primary">
              {crear.isPending ? <Spinner size="sm" /> : 'Crear usuario'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal editar */}
      <Modal title={`Editar — ${selected?.nombre}`} open={modal === 'editar'} onClose={closeModal}>
        <form onSubmit={editarForm.handleSubmit(d => editar.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input {...editarForm.register('nombre')} className="input" />
              {editarForm.formState.errors.nombre && <p className="text-red-500 text-xs mt-1">{editarForm.formState.errors.nombre.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Correo *</label>
              <input {...editarForm.register('correo')} type="email" className="input" />
              {editarForm.formState.errors.correo && <p className="text-red-500 text-xs mt-1">{editarForm.formState.errors.correo.message}</p>}
            </div>
            <div>
              <label className="label">Rol *</label>
              <select {...editarForm.register('rol')} className="input">
                {ROLES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {editar.isError && <p className="text-red-500 text-sm">Error al actualizar.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={editar.isPending} className="btn-primary">
              {editar.isPending ? <Spinner size="sm" /> : 'Guardar'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal contraseña */}
      <Modal title={`Contraseña — ${selected?.nombre}`} open={modal === 'password'} onClose={closeModal}>
        <form onSubmit={passForm.handleSubmit(d => cambiarPass.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nueva contraseña *</label>
            <input {...passForm.register('password')} type="password" className="input" placeholder="Mínimo 6 caracteres" />
            {passForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirmar contraseña *</label>
            <input {...passForm.register('confirmar')} type="password" className="input" />
            {passForm.formState.errors.confirmar && <p className="text-red-500 text-xs mt-1">{passForm.formState.errors.confirmar.message}</p>}
          </div>
          {cambiarPass.isError && <p className="text-red-500 text-sm">Error al cambiar contraseña.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={cambiarPass.isPending} className="btn-primary">
              {cambiarPass.isPending ? <Spinner size="sm" /> : 'Actualizar contraseña'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
