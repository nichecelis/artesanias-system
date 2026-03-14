import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { reportesService } from '../../services';
import { LoadingScreen, StatCard } from '../../components/common';
import { TrendingUp, Users, Palette, FileText } from 'lucide-react';

const fmt = (n: any) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const mesActual = () => new Date().toISOString().slice(0, 7);

export default function ReportesPage() {
  const [tab, setTab]       = useState<'ventas'|'pedidos'|'decoradoras'|'nomina'>('ventas');
  const [desde, setDesde]   = useState(() => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); });
  const [hasta, setHasta]   = useState(() => new Date().toISOString().slice(0,10));
  const [mes, setMes]       = useState(mesActual());

  const { data: ventas, isLoading: loadVentas } = useQuery({
    queryKey: ['rpt-ventas', desde, hasta],
    queryFn: () => reportesService.ventasPorCliente({ desde, hasta }).then((r) => r.data.data),
    enabled: tab === 'ventas',
  });

  const { data: pedidosActivos, isLoading: loadPedidos } = useQuery({
    queryKey: ['rpt-pedidos'],
    queryFn: () => reportesService.pedidosActivos().then((r) => r.data.data),
    enabled: tab === 'pedidos',
  });

  const { data: pagosD, isLoading: loadPagos } = useQuery({
    queryKey: ['rpt-decoradoras'],
    queryFn: () => reportesService.pagosDecoradores().then((r) => r.data.data),
    enabled: tab === 'decoradoras',
  });

  const { data: nomina, isLoading: loadNomina } = useQuery({
    queryKey: ['rpt-nomina', mes],
    queryFn: () => reportesService.nominaMes(mes).then((r) => r.data.data),
    enabled: tab === 'nomina',
  });

  const TABS = [
    { key: 'ventas',      label: 'Ventas por cliente', icon: <TrendingUp size={16} /> },
    { key: 'pedidos',     label: 'Pedidos activos',    icon: <FileText size={16} /> },
    { key: 'decoradoras', label: 'Pagos decoradoras',  icon: <Palette size={16} /> },
    { key: 'nomina',      label: 'Nómina del mes',     icon: <Users size={16} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1>Reportes</h1>
        <p className="text-gray-500 text-sm">Indicadores del negocio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Ventas por cliente ─────────────────────────────── */}
      {tab === 'ventas' && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="label">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="input w-44" />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="input w-44" />
            </div>
          </div>
          {loadVentas ? <LoadingScreen /> : (
            <div className="space-y-4">
              {ventas?.resumen && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total facturado"  value={fmt(ventas.resumen.totalFacturado)}   icon={<TrendingUp size={20} />} color="green" />
                  <StatCard label="Pedidos totales"  value={ventas.resumen.totalPedidos}           icon={<FileText size={20} />}   color="blue" />
                  <StatCard label="Clientes activos" value={ventas.clientes?.length ?? 0}          icon={<Users size={20} />}      color="purple" />
                </div>
              )}
              {ventas?.clientes?.length > 0 && (
                <div className="card">
                  <h2 className="mb-4">Facturación por cliente</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventas.clientes.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: any) => fmt(v)} />
                      <Bar dataKey="totalFacturado" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Pedidos activos ────────────────────────────────── */}
      {tab === 'pedidos' && (
        <div className="space-y-4">
          {loadPedidos ? <LoadingScreen /> : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pedidosActivos?.porEstado?.map((e: any) => (
                  <div key={e.estado} className="card text-center">
                    <p className="text-xs text-gray-500 mb-1">{e.estado.replace('_',' ')}</p>
                    <p className="text-3xl font-bold text-gray-900">{e._count.id}</p>
                  </div>
                ))}
              </div>
              <div className="card">
                <h2 className="mb-4">Pedidos recientes sin despachar</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-100">
                    <thead><tr>
                      {['Código','Cliente','Estado','Días'].map((h) => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {pedidosActivos?.pedidos?.map((p: any) => (
                        <tr key={p.id}>
                          <td className="table-cell font-mono">{p.codigo}</td>
                          <td className="table-cell">{p.cliente?.nombre}</td>
                          <td className="table-cell">{p.estado}</td>
                          <td className="table-cell">{Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000)} días</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Pagos decoradoras ──────────────────────────────── */}
      {tab === 'decoradoras' && (
        <div className="space-y-4">
          {loadPagos ? <LoadingScreen /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="Total pendiente" value={fmt(pagosD?.totalPendiente)} icon={<Palette size={20} />} color="red" />
                <StatCard label="Decoraciones"    value={pagosD?.decoraciones?.length ?? 0} icon={<FileText size={20} />} color="blue" />
              </div>
              <div className="card">
                <h2 className="mb-4">Pagos pendientes por decoradora</h2>
                <div className="space-y-3">
                  {pagosD?.decoraciones?.map((d: any) => (
                    <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{d.decoradora?.nombre}</p>
                        <p className="text-xs text-gray-400">{d.pedido?.codigo}</p>
                      </div>
                      <p className="font-bold text-orange-600">{fmt(d.totalPagar)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Nómina del mes ─────────────────────────────────── */}
      {tab === 'nomina' && (
        <div className="space-y-4">
          <div>
            <label className="label">Mes</label>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="input w-44" />
          </div>
          {loadNomina ? <LoadingScreen /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total devengado"  value={fmt(nomina?.totales?.totalDevengado)} icon={<TrendingUp size={20} />} color="green" />
                <StatCard label="Total descuentos" value={fmt(nomina?.totales?.totalDescuentos)} icon={<FileText size={20} />}  color="red" />
                <StatCard label="Total neto"        value={fmt(nomina?.totales?.totalNeto)}       icon={<Users size={20} />}     color="blue" />
              </div>
              <div className="card">
                <h2 className="mb-4">Detalle por empleado</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-100">
                    <thead><tr>
                      {['Empleado','Días','HE','Devengado','Descuentos','Neto'].map((h) => (
                        <th key={h} className="table-header">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {nomina?.nominas?.map((n: any) => (
                        <tr key={n.id}>
                          <td className="table-cell">{n.empleado?.nombre}</td>
                          <td className="table-cell">{n.diasTrabajados}</td>
                          <td className="table-cell">{n.horasExtras}</td>
                          <td className="table-cell">{fmt(n.totalDevengado)}</td>
                          <td className="table-cell text-red-600">{fmt(n.descuentos)}</td>
                          <td className="table-cell font-bold">{fmt(n.totalNeto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
