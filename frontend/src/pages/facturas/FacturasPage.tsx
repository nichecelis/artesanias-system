import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, FileText, Trash2, Eye, Download, X } from 'lucide-react';
import { api } from '../../services/api';
import { facturasService, clientesService } from '../../services';
import { Table, Pagination, Modal, LoadingScreen, EmptyState, Spinner } from '../../components/common';
import { useToastStore } from '../../store/toast.store';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCompanySettings, generateReportHeader, generateReportFooter, generateFilename } from '../../utils/reportUtils';

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const showDate = (d: any) => {
  if (!d) return '—';
  const match = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, day] = match;
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${Number(day)} ${meses[Number(m) - 1]} ${y}`;
  }
  return d;
};

const schema = z.object({
  clienteId: z.string().min(1, 'Seleccione cliente'),
  fecha: z.string().min(1, 'Requerido'),
  descuento: z.coerce.number().min(0).optional(),
  montoPagado: z.coerce.number().min(0).optional(),
  observaciones: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function FacturasPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientesDropdown, setClientesDropdown] = useState<any[]>([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState<any[]>([]);
  const [pedidosAgrupados, setPedidosAgrupados] = useState<any>({});
  const [pedidosExpandidos, setPedidosExpandidos] = useState<Set<string>>(new Set());
  const [saldoAnterior, setSaldoAnterior] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', page, search],
    queryFn: () => facturasService.listar({ page, limit: 10, search: search || undefined }).then(r => r.data),
  });

  const { data: clientesList } = useQuery({
    queryKey: ['clientes-buscar', clienteSearch],
    queryFn: () => clientesService.listar({ page: 1, limit: 50, search: clienteSearch || undefined }).then(r => r.data.data),
    enabled: clienteSearch.length >= 2,
  });

  useEffect(() => {
    if (clientesList) setClientesDropdown(clientesList);
  }, [clientesList]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientesDropdown([]);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { descuento: 0, montoPagado: 0 }
  });

  const clienteId = watch('clienteId');
  const descuentoGlobal = watch('descuento') || 0;
  const montoPagado = watch('montoPagado') || 0;

  const { data: pedidosCliente, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos-cliente-factura', clienteId],
    queryFn: () => facturasService.obtenerPedidosCliente(clienteId).then(r => r.data.data),
    enabled: Boolean(clienteId),
  });

  const { data: saldoData } = useQuery({
    queryKey: ['saldo-anterior', clienteId],
    queryFn: () => facturasService.obtenerSaldoAnterior(clienteId).then(r => r.data.data),
    enabled: Boolean(clienteId),
  });

  useEffect(() => {
    if (saldoData?.saldoAnterior !== undefined) {
      setSaldoAnterior(saldoData.saldoAnterior);
    }
  }, [saldoData]);

  useEffect(() => {
    if (pedidosCliente) {
      const agrupados: any = {};
      const items: any[] = [];
      
      pedidosCliente.forEach((pedido: any) => {
        agrupados[pedido.codigo] = {
          pedidoId: pedido.id,
          codigo: pedido.codigo,
          fecha: pedido.fecha,
          productos: [],
          seleccionado: false,
        };
        
        pedido.productos.forEach((prod: any) => {
          agrupados[pedido.codigo].productos.push({
            pedidoProductoId: prod.id,
            pedidoCodigo: pedido.codigo,
            productoNombre: prod.nombre,
            cantidad: prod.cantidad,
            precioUnitario: prod.precioUnitario,
            precioOriginal: prod.precioOriginal,
            esPrecioEspecial: prod.esPrecioEspecial,
            total: prod.total,
            corte1: prod.corte1,
            corte2: prod.corte2,
            corte3: prod.corte3,
            seleccionado: false,
            descuento: 0,
          });
          items.push(agrupados[pedido.codigo].productos[agrupados[pedido.codigo].productos.length - 1]);
        });
      });
      
      setPedidosAgrupados(agrupados);
      setPedidosDisponibles(items);
    }
  }, [pedidosCliente]);

  const togglePedido = (codigo: string) => {
    const nuevosAgrupados = { ...pedidosAgrupados };
    nuevosAgrupados[codigo].seleccionado = !nuevosAgrupados[codigo].seleccionado;
    
    nuevosAgrupados[codigo].productos.forEach((prod: any) => {
      prod.seleccionado = nuevosAgrupados[codigo].seleccionado;
    });
    
    setPedidosAgrupados(nuevosAgrupados);
    setPedidosDisponibles(Object.values(nuevosAgrupados).flatMap((p: any) => p.productos));
  };

  const toggleExpandirPedido = (codigo: string) => {
    const nuevos = new Set(pedidosExpandidos);
    if (nuevos.has(codigo)) {
      nuevos.delete(codigo);
    } else {
      nuevos.add(codigo);
    }
    setPedidosExpandidos(nuevos);
  };

  const subtotal = pedidosDisponibles
    .filter(i => i.seleccionado)
    .reduce((acc, i) => acc + i.total - i.descuento, 0);
  const descuentoTotal = descuentoGlobal + pedidosDisponibles
    .filter(i => i.seleccionado)
    .reduce((acc, i) => acc + i.descuento, 0);
  const total = subtotal;
  const saldo = total + saldoAnterior - montoPagado;
  const totalPagar = saldo;

  const crear = useMutation({
    mutationFn: (d: Form) => {
      const items = pedidosDisponibles
        .filter(i => i.seleccionado)
        .map(i => ({
          pedidoProductoId: i.pedidoProductoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuento: i.descuento,
        }));
      return facturasService.crear({ 
        clienteId: d.clienteId,
        fecha: d.fecha,
        descuento: d.descuento,
        montoPagado: d.montoPagado,
        observaciones: d.observaciones,
        items 
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      closeModal();
      toast.addToast('Factura creada exitosamente', 'success');
    },
    onError: () => {
      toast.addToast('Error al crear factura', 'error');
    }
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => facturasService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      toast.addToast('Factura eliminada', 'success');
    },
  });

  const openModal = () => {
    reset({ clienteId: '', fecha: new Date().toISOString().split('T')[0], descuento: 0, montoPagado: 0, observaciones: '' });
    setClientesDropdown([]);
    setClienteSearch('');
    setPedidosDisponibles([]);
    setPedidosAgrupados({});
    setPedidosExpandidos(new Set());
    setSaldoAnterior(0);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setSelected(null);
    setPedidosDisponibles([]);
    setPedidosAgrupados({});
    setPedidosExpandidos(new Set());
  };

  const verFactura = (row: any) => {
    setSelected(row);
    setViewModal(true);
  };

  const generarPDF = async (factura: any) => {
    const doc = new jsPDF();
    const company = await getCompanySettings();
    
    generateReportHeader(doc, company, 'FACTURA DE VENTA', `No. ${factura.numero} - Fecha: ${showDate(factura.fecha)}`);
    
    let yPos = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`${factura.cliente.nombre}`, 14, yPos);
    yPos += 5;
    doc.text(`CC/NIT: ${factura.cliente.documento}`, 14, yPos);
    if (factura.cliente.direccion) {
      yPos += 5;
      doc.text(`Dirección: ${factura.cliente.direccion}`, 14, yPos);
    }
    if (factura.cliente.telefono) {
      yPos += 5;
      doc.text(`Tel: ${factura.cliente.telefono}`, 14, yPos);
    }
    
    const tableData = factura.items.map((item: any, idx: number) => [
      idx + 1,
      item.pedidoProducto?.producto?.nombre || item.pedidoProducto?.producto?.producto?.nombre || '—',
      item.pedidoProducto?.pedido?.codigo || '—',
      item.pedidoProducto?.corte1 ?? '—',
      item.pedidoProducto?.corte2 ?? '—',
      item.pedidoProducto?.corte3 ?? '—',
      item.cantidad,
      fmt(item.precioUnitario),
      fmt(item.total),
      fmt(item.descuento),
      fmt(item.total - item.descuento),
    ]);

    doc.autoTable({
      startY: yPos + 8,
      head: [['#', 'PRODUCTO', 'PEDIDO', 'CORTE 1', 'CORTE 2', 'CORTE 3', 'CANT', 'P. UND', 'TOTAL', 'DCTO', 'SUBTOTAL']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 37, 36] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text(`Subtotal: ${fmt(factura.subtotal)}`, 140, finalY);
    doc.text(`Descuento: ${fmt(factura.descuento)}`, 140, finalY + 6);
    doc.text(`Total: ${fmt(factura.total)}`, 140, finalY + 12);
    doc.text(`Saldo Anterior: ${fmt(factura.saldoAnterior)}`, 140, finalY + 18);
    doc.text(`Pago: ${fmt(factura.montoPagado)}`, 140, finalY + 24);
    doc.text(`Saldo: ${fmt(factura.saldo)}`, 140, finalY + 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL A PAGAR: ${fmt(factura.totalPagar)}`, 140, finalY + 42);

    if (factura.observaciones) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observaciones: ${factura.observaciones}`, 14, finalY + 50);
    }

    generateReportFooter(doc);
    doc.save(generateFilename(`Factura_${factura.numero}`));
  };

  const columns = [
    { key: 'numero', header: 'No. Factura' },
    { key: 'cliente', header: 'Cliente', render: (r: any) => r.cliente?.nombre ?? '—' },
    { key: 'fecha', header: 'Fecha', render: (r: any) => showDate(r.fecha) },
    { key: 'total', header: 'Total', render: (r: any) => fmt(r.total) },
    { key: 'totalPagar', header: 'Total Pagar', render: (r: any) => <span className="font-bold">{fmt(r.totalPagar)}</span> },
    { key: 'acciones', header: '', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => verFactura(r)} className="text-blue-600 hover:text-blue-800"><Eye size={16}/></button>
        <button onClick={() => generarPDF(r)} className="text-green-600 hover:text-green-800"><Download size={16}/></button>
        <button onClick={() => { if (confirm('¿Eliminar factura?')) eliminar.mutate(r.id); }} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1>Facturas</h1><p className="text-gray-500 text-sm">{data?.meta?.total ?? 0} registros</p></div>
        <button onClick={openModal} className="btn-primary"><Plus size={16}/> Nueva factura</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input pl-9" placeholder="Buscar por cliente..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? <LoadingScreen/> : !data?.data?.length ? (
          <EmptyState message="Sin facturas registradas" action={<button onClick={openModal} className="btn-primary">Nueva factura</button>}/>
        ) : (
          <><Table columns={columns} data={data.data}/><Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage}/></>
        )}
      </div>

      {/* Modal Crear Factura */}
      <Modal title="Nueva Factura" open={modal} onClose={closeModal} size="full">
        <form onSubmit={handleSubmit(d => crear.mutate(d))} className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1" ref={dropdownRef}>
              <label className="label">Cliente *</label>
              {watch('clienteId') ? (
                <div className="input flex items-center justify-between bg-primary-50 border-primary-300">
                  <span>{clientesDropdown.find(c => c.id === watch('clienteId'))?.nombre || '—'}</span>
                  <button type="button" onClick={() => { reset({ clienteId: '', fecha: new Date().toISOString().split('T')[0], descuento: 0, montoPagado: 0, observaciones: '' }); setSaldoAnterior(0); }}>
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <input className="input" placeholder="Buscar cliente..."
                  value={clienteSearch}
                  onChange={e => { setClienteSearch(e.target.value); setClientesDropdown(clientesList || []); }}
                  onFocus={() => setClientesDropdown(clientesList || [])}
                />
              )}
              {clientesDropdown.length > 0 && !watch('clienteId') && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {clientesDropdown.map((c: any) => (
                    <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm border-b last:border-0"
                      onClick={() => { setValue('clienteId', c.id); setClienteSearch(''); setClientesDropdown([]); }}>
                      {c.nombre} <span className="text-gray-400">{c.documento}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message}</p>}
            </div>
            <div className="w-40">
              <label className="label">Fecha *</label>
              <input {...register('fecha')} type="date" className="input"/>
              {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
            </div>
            <div className="w-40">
              <label className="label">Descuento global</label>
              <input {...register('descuento')} type="number" min="0" className="input"/>
            </div>
          </div>

          {loadingPedidos ? (
            <div className="text-center py-8"><Spinner/></div>
          ) : Object.keys(pedidosAgrupados).length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Productos por pedido</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left w-8"></th>
                      <th className="px-2 py-2 text-left w-8"></th>
                      <th className="px-2 py-2 text-left">Producto</th>
                      <th className="px-2 py-2 text-center">C1</th>
                      <th className="px-2 py-2 text-center">C2</th>
                      <th className="px-2 py-2 text-center">C3</th>
                      <th className="px-2 py-2 text-center">Cant</th>
                      <th className="px-2 py-2 text-right">P. Und</th>
                      <th className="px-2 py-2 text-right">Total</th>
                      <th className="px-2 py-2 text-right">Dto</th>
                      <th className="px-2 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(pedidosAgrupados).map((pedido: any) => (
                      <>
                        <tr key={pedido.codigo} className="bg-gray-100 border-t-2 border-gray-300">
                          <td className="px-2 py-1">
                            <input 
                              type="checkbox" 
                              checked={pedido.seleccionado} 
                              onChange={() => togglePedido(pedido.codigo)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <button 
                              type="button"
                              onClick={() => toggleExpandirPedido(pedido.codigo)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {pedidosExpandidos.has(pedido.codigo) ? '▼' : '▶'}
                            </button>
                          </td>
                          <td colSpan={9} className="font-medium">
                            Pedido: {pedido.codigo} ({pedido.productos.length} producto{pedido.productos.length > 1 ? 's' : ''})
                          </td>
                        </tr>
                        {pedidosExpandidos.has(pedido.codigo) && pedido.productos.map((item: any) => (
                          <tr key={item.pedidoProductoId} className={item.seleccionado ? 'bg-green-50' : 'border-b'}>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1"></td>
                            <td className="px-2 py-1 pl-8">
                              {item.productoNombre}
                              {item.esPrecioEspecial && (
                                <span className="ml-1 text-xs text-green-600 font-medium">★</span>
                              )}
                            </td>
                            <td className="px-2 py-1 text-center">{item.corte1 ?? '—'}</td>
                            <td className="px-2 py-1 text-center">{item.corte2 ?? '—'}</td>
                            <td className="px-2 py-1 text-center">{item.corte3 ?? '—'}</td>
                            <td className="px-2 py-1 text-center">{item.cantidad}</td>
                            <td className="px-2 py-1 text-right">
                              <div className="flex flex-col items-end">
                                <span className={item.esPrecioEspecial ? 'text-green-600 font-medium' : ''}>{fmt(item.precioUnitario)}</span>
                                {item.esPrecioEspecial && item.precioOriginal && (
                                  <span className="text-xs text-gray-400 line-through">{fmt(item.precioOriginal)}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1 text-right">{fmt(item.total)}</td>
                            <td className="px-2 py-1">
                              <input type="number" min="0" value={item.descuento} onChange={e => {
                                const updated = [...pedidosDisponibles];
                                const idx = updated.findIndex(i => i.pedidoProductoId === item.pedidoProductoId);
                                if (idx !== -1) {
                                  updated[idx].descuento = Number(e.target.value);
                                  setPedidosDisponibles(updated);
                                  const newAgrupados = { ...pedidosAgrupados };
                                  const prodIdx = newAgrupados[pedido.codigo].productos.findIndex((p: any) => p.pedidoProductoId === item.pedidoProductoId);
                                  if (prodIdx !== -1) {
                                    newAgrupados[pedido.codigo].productos[prodIdx].descuento = Number(e.target.value);
                                  }
                                  setPedidosAgrupados(newAgrupados);
                                }
                              }}
                                className="w-20 input text-right text-xs py-1" disabled={!item.seleccionado}/>
                            </td>
                            <td className="px-2 py-1 text-right font-medium">{fmt(item.seleccionado ? item.total - item.descuento : 0)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : clienteId ? (
            <p className="text-gray-500 text-center py-4">No hay productos disponibles para facturar</p>
          ) : null}

          {pedidosDisponibles.some(i => i.seleccionado) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Descuento global:</span><span>{fmt(descuentoGlobal)}</span></div>
              <div className="flex justify-between text-sm"><span>Total productos:</span><span>{fmt(total)}</span></div>
              <div className="flex justify-between text-sm bg-yellow-50 p-2 rounded"><span>Saldo anterior:</span><span className="font-medium">{fmt(saldoAnterior)}</span></div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="label">¿Cuánto pagó el cliente?</label>
                  <input {...register('montoPagado')} type="number" min="0" step="100" className="input"/>
                </div>
              </div>
              <div className="flex justify-between text-sm"><span>Saldo (Total + Anterior - Pago):</span><span>{fmt(saldo)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total a Pagar:</span><span className="text-primary-700">{fmt(totalPagar)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">Observaciones</label>
            <textarea {...register('observaciones')} rows={2} className="input"/>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={crear.isPending || !pedidosDisponibles.some(i => i.seleccionado)} className="btn-primary">
              {crear.isPending ? <Spinner size="sm"/> : 'Crear Factura'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Factura */}
      <Modal title={`Factura ${selected?.numero || ''}`} open={viewModal} onClose={() => setViewModal(false)} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Cliente</p>
                <p>{selected.cliente?.nombre}</p>
                <p className="text-gray-500">{selected.cliente?.documento}</p>
                {selected.cliente?.direccion && <p className="text-gray-500">{selected.cliente.direccion}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">Fecha</p>
                <p>{showDate(selected.fecha)}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left">Producto</th>
                    <th className="px-2 py-2 text-left">Pedido</th>
                    <th className="px-2 py-2 text-center">C1</th>
                    <th className="px-2 py-2 text-center">C2</th>
                    <th className="px-2 py-2 text-center">C3</th>
                    <th className="px-2 py-2 text-center">Cant</th>
                    <th className="px-2 py-2 text-right">P. Und</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-2 py-2">{item.pedidoProducto?.producto?.nombre || '—'}</td>
                      <td className="px-2 py-2">{item.pedidoProducto?.pedido?.codigo || '—'}</td>
                      <td className="px-2 py-2 text-center">{item.pedidoProducto?.corte1 ?? '—'}</td>
                      <td className="px-2 py-2 text-center">{item.pedidoProducto?.corte2 ?? '—'}</td>
                      <td className="px-2 py-2 text-center">{item.pedidoProducto?.corte3 ?? '—'}</td>
                      <td className="px-2 py-2 text-center">{item.cantidad}</td>
                      <td className="px-2 py-2 text-right">{fmt(item.precioUnitario)}</td>
                      <td className="px-2 py-2 text-right">{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(selected.subtotal)}</span></div>
              <div className="flex justify-between"><span>Descuento:</span><span>{fmt(selected.descuento)}</span></div>
              <div className="flex justify-between"><span>Total productos:</span><span>{fmt(selected.total)}</span></div>
              <div className="flex justify-between"><span>Saldo Anterior:</span><span className="font-medium">{fmt(selected.saldoAnterior)}</span></div>
              <div className="flex justify-between"><span>Pago del cliente:</span><span className="text-green-600 font-medium">-{fmt(selected.montoPagado)}</span></div>
              <div className="flex justify-between"><span>Saldo pendiente:</span><span>{fmt(selected.saldo)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total a Pagar:</span><span className="text-primary-700">{fmt(selected.totalPagar)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => generarPDF(selected)} className="btn-primary"><Download size={16}/> Descargar PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
