import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, KeyRound, UserX, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const ROLES = ['ADMINISTRADOR','PRODUCCION','VENTAS','CONTABILIDAD'];

const ROL_COLORS: Record<string,string> = {
  ADMINISTRADOR: 'bg-red-100 text-red-800',
  PRODUCCION:    'bg-blue-100 text-blue-800',
  VENTAS:        'bg-green-100 text-green-800',
  CONTABILIDAD:  'bg-yellow-100 text-yellow-800',
};

const crearSchema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  correo:   z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol:      z.enum(['ADMINISTRADOR','PRODUCCION','VENTAS','CONTABILIDAD']),
});

const editarSchema = z.object({
  nombre: z.string().min(2),
  correo: z.string().email(),
  rol:    z.enum(['ADMINISTRADOR','PRODUCCION','VENTAS','CONTABILIDAD']),
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
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'crear'|'editar'|'password'|null>(null);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', page, search],
    queryFn: () => api.get('/usuarios', { params: { page, limit: 20, search: search || undefined } }).then(r => r.data),
  });

  const crearForm = useForm<CrearForm>({ resolver: zodResolver(crearSchema), defaultValues: { rol: 'VENTAS' } });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); closeModal(); },
  });

  const editar = useMutation({
    mutationFn: (d: EditarForm) => api.patch(`/usuarios/${selected.id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); closeModal(); },
  });

  const cambiarPass = useMutation({
    mutationFn: (d: PassForm) => api.patch(`/usuarios/${selected.id}/password`, { password: d.password }),
    onSuccess: () => { closeModal(); alert('Contraseña actualizada'); },
  });

  const toggleActivo = useMutation({
    mutationFn: (row: any) => api.patch(`/usuarios/${row.id}`, { activo: !row.activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'correo', header: 'Correo' },
    { key: 'rol',    header: 'Rol', render: (r: any) => (
      <span className={`badge ${ROL_COLORS[r.rol] ?? 'bg-gray-100'}`}>{r.rol}</span>
    )},
    { key: 'activo', header: 'Estado', render: (r: any) => (
      <span className={`badge ${r.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        {r.activo ? 'Activo' : 'Inactivo'}
      </span>
    )},
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => openEditar(r)} className="text-gray-400 hover:text-primary-600" title="Editar"><Pencil size={14} /></button>
        <button onClick={() => openPassword(r)} className="text-gray-400 hover:text-yellow-600" title="Cambiar contraseña"><KeyRound size={14} /></button>
        <button onClick={() => { if (confirm(`¿${r.activo ? 'Desactivar' : 'Activar'} a ${r.nombre}?`)) toggleActivo.mutate(r); }}
          className={`text-gray-400 ${r.activo ? 'hover:text-red-600' : 'hover:text-green-600'}`}
          title={r.activo ? 'Desactivar' : 'Activar'}>
          {r.activo ? <UserX size={14} /> : <UserCheck size={14} />}
        </button>
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

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por nombre o correo..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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
