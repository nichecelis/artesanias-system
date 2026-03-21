import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Eye } from 'lucide-react';
import { decoradorasService } from '../../services';
import { api } from '../../services/api';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';

const BANCOS_COLOMBIA = [
  'Bancolombia','Banco de Bogotá','Davivienda','BBVA Colombia',
  'Banco Popular','Banco de Occidente','Banco Caja Social',
  'Colpatria','Itaú','Scotiabank Colpatria','Banco Agrario',
  'Banco Falabella','Banco Pichincha','Banco Finandina',
  'Banco Mundo Mujer','Banco W','Banco Cooperativo Coopcentral',
  'Nequi','Daviplata','Movii','Rappipay','Lulo Bank',
  'Nu Colombia','Confiar Cooperativa','Coofinep','Cotrafa',
  'JFK Cooperativa','Otra entidad',
];

const schema = z.object({
  nombre:     z.string().min(2,'Mínimo 2 caracteres'),
  documento:  z.string().min(3,'Requerido'),
  telefono:   z.string().optional(),
  grupoId:    z.string().optional(),
  banco:      z.string().optional(),
  numCuenta:  z.string().optional(),
  tipoCuenta: z.enum(['AHORROS','CORRIENTE']).optional(),
});
type Form = z.infer<typeof schema>;

const fmt = (n: any) => `$${Number(n??0).toLocaleString('es-CO')}`;

export default function DecoradorasPage() {
  const qc = useQueryClient();
  const [page,setPage]               = useState(1);
  const [search,setSearch]           = useState('');
  const [modal,setModal]             = useState(false);
  const [pagosModal,setPagosModal]   = useState(false);
  const [editing,setEditing]         = useState<any>(null);
  const [selected,setSelected]       = useState<any>(null);

  const {data,isLoading} = useQuery({
    queryKey:['decoradoras',page,search],
    queryFn:()=>decoradorasService.listar({page,limit:20,search:search||undefined}).then(r=>r.data),
  });

  const {data:grupos} = useQuery({
    queryKey:['grupos-select'],
    queryFn:()=>api.get('/grupos',{params:{limit:200}}).then(r=>r.data.data),
  });

  const {data:pagos} = useQuery({
    queryKey:['pagos-decoradora',selected?.id],
    queryFn:()=>decoradorasService.resumenPagos(selected!.id).then(r=>r.data.data),
    enabled:Boolean(selected?.id),
  });

  const {register,handleSubmit,reset,formState:{errors,isSubmitting}} = useForm<Form>({
    resolver:zodResolver(schema),
  });

  const openNew  = () => {setEditing(null);reset({});setModal(true);};
  const openEdit = (row:any) => {
    setEditing(row);
    reset({nombre:row.nombre,documento:row.documento,telefono:row.telefono??'',
      grupoId:row.grupoId??'',banco:row.banco??'',numCuenta:row.numCuenta??'',
      tipoCuenta:row.tipoCuenta??undefined});
    setModal(true);
  };
  const closeModal = () => {setModal(false);setEditing(null);};
  const openPagos  = (row:any) => {setSelected(row);setPagosModal(true);};

  const save = useMutation({
    mutationFn:(data:Form)=>{
      const payload={...data,grupoId:data.grupoId||null};
      return editing ? decoradorasService.actualizar(editing.id,payload) : decoradorasService.crear(payload);
    },
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['decoradoras']});
      closeModal();
      alert(editing ? '✅ Decoradora actualizada exitosamente' : '✅ Decoradora creada exitosamente');
    },
  });

  const columns=[
    {key:'nombre',   header:'Nombre'},
    {key:'documento',header:'Documento',render:(r:any)=>r.documento??'—'},
    {key:'grupo',    header:'Grupo',render:(r:any)=>r.grupo?(
      <span className={`badge ${r.grupo.tipo==='ELITE'?'bg-purple-100 text-purple-800':'bg-blue-100 text-blue-800'}`}>
        {r.grupo.tipo} — {r.grupo.nombre}
      </span>
    ):<span className="text-gray-400 text-xs">Sin grupo</span>},
    {key:'telefono', header:'Teléfono',render:(r:any)=>r.telefono??'—'},
    {key:'banco',    header:'Banco',   render:(r:any)=>r.banco??'—'},
	{key:'numCuenta', header:'No. Cuenta', render:(r:any)=>r.numCuenta??'—'},
	{key:'tipoCuenta',header:'Tipo',       render:(r:any)=>r.tipoCuenta??'—'},
    {key:'acciones', header:'',render:(r:any)=>(
      <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>openPagos(r)} className="text-gray-400 hover:text-green-600" title="Ver pagos"><Eye size={15}/></button>
        <button onClick={()=>openEdit(r)}  className="text-gray-400 hover:text-primary-600"><Pencil size={15}/></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Decoradoras</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.total??0} decoradoras</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16}/> Nueva decoradora</button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
        <input className="input pl-9" placeholder="Buscar decoradora..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading?<LoadingScreen/>:!data?.data?.length?(
          <EmptyState message="Sin decoradoras" action={<button onClick={openNew} className="btn-primary">Agregar decoradora</button>}/>
        ):(
          <>
            <Table columns={columns} data={data.data}/>
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/>
          </>
        )}
      </div>

      {/* Modal formulario */}
      <Modal title={editing?'Editar decoradora':'Nueva decoradora'} open={modal} onClose={closeModal}>
        <form onSubmit={handleSubmit(d=>save.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input {...register('nombre')} className="input" placeholder="Nombre completo"/>
              {errors.nombre&&<p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label">Documento *</label>
              <input {...register('documento')} className="input" placeholder="Cédula"/>
              {errors.documento&&<p className="text-red-500 text-xs mt-1">{errors.documento.message}</p>}
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="300 000 0000"/>
            </div>
            <div className="col-span-2">
              <label className="label">Grupo / Elite</label>
              <select {...register('grupoId')} className="input">
                <option value="">Sin grupo</option>
                {grupos?.map((g:any)=>(
                  <option key={g.id} value={g.id}>{g.tipo} — {g.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Banco</label>
              <select {...register('banco')} className="input">
                <option value="">Selecciona banco...</option>
                {BANCOS_COLOMBIA.map(b=>(
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Número de cuenta</label>
              <input {...register('numCuenta')} className="input" placeholder="0000000000"/>
            </div>
            <div>
              <label className="label">Tipo de cuenta</label>
              <select {...register('tipoCuenta')} className="input">
                <option value="">Selecciona...</option>
                <option value="AHORROS">Ahorros</option>
                <option value="CORRIENTE">Corriente</option>
              </select>
            </div>
          </div>
          {save.isError&&<p className="text-red-500 text-sm">Error al guardar</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting||save.isPending} className="btn-primary">
              {(isSubmitting||save.isPending)?<Spinner size="sm"/>:(editing?'Guardar':'Crear')}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal pagos */}
      <Modal title={`Pagos — ${selected?.nombre}`} open={pagosModal} onClose={()=>{setPagosModal(false);setSelected(null);}}>
        {!pagos?<div className="flex justify-center py-8"><Spinner/></div>:(
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Total pagado</p>
                <p className="text-xl font-bold text-green-700">{fmt(pagos.totalPagado)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="text-xl font-bold text-orange-700">{fmt(pagos.totalPendiente)}</p>
              </div>
            </div>
            {pagos.deudaTotal>0&&(
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Deuda préstamos</p>
                <p className="text-lg font-bold text-red-700">{fmt(pagos.deudaTotal)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Decoraciones pendientes: {pagos.decoraciones?.length??0}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pagos.decoraciones?.map((d:any)=>(
                  <div key={d.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">{d.pedido?.codigo??d.id.slice(0,8)}</span>
                    <span className="font-medium">{fmt(d.totalPagar)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
