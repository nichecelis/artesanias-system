import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { reportesService } from '../../services';
import { LoadingScreen, StatCard } from '../../components/common';
import { TrendingUp, Users, Palette, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import type { Rol } from '../../types';

const fmt = (n: unknown) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;
const mesActual = () => new Date().toISOString().slice(0, 7);

const ALL_TABS = [
  { key: 'ventas',      label: 'Ventas por cliente', icon: <TrendingUp size={16} />, roles: ['ADMINISTRADOR', 'PRODUCCION', 'CONTABILIDAD'] as Rol[] },
  { key: 'pedidos',     label: 'Pedidos activos',    icon: <FileText size={16} />, roles: ['ADMINISTRADOR', 'PRODUCCION', 'CONTABILIDAD'] as Rol[] },
  { key: 'decoradoras', label: 'Pagos decoradoras',  icon: <Palette size={16} />, roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { key: 'nomina',      label: 'Nómina del mes',    icon: <Users size={16} />,   roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
] as const;

export default function ReportesPage() {
  const { usuario } = useAuthStore();
  const userRole = usuario?.rol || '';

  const visibleTabs = useMemo(() => {
    return ALL_TABS.filter(t => t.roles.includes(userRole as Rol));
  }, [userRole]);

  const defaultTab = visibleTabs[0]?.key || 'ventas';
  const [tab, setTab] = useState<typeof defaultTab>(defaultTab);

  const currentTabIndex = useMemo(() => {
    const idx = visibleTabs.findIndex(t => t.key === tab);
    return idx >= 0 ? idx : 0;
  }, [visibleTabs, tab]);

  useEffect(() => {
    if (!visibleTabs.find(t => t.key === tab) && visibleTabs[0]) {
      setTab(visibleTabs[0].key);
    }
  }, [visibleTabs]);
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

  return (
    <div className="space-y-6">
      <div>
        <h1>Reportes</h1>
        <p className="text-gray-500 text-sm">Indicadores del negocio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200">
        {visibleTabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
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
              {ventas && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard label="Total unidades"    value={ventas.reduce((acc: number, v: any) => acc + (v._sum?.cantidadPedido || 0), 0)} icon={<TrendingUp size={20} />} color="green" />
                  <StatCard label="Pedidos totales"  value={ventas.reduce((acc: number, v: any) => acc + v.cantidadPedidos, 0)} icon={<FileText size={20} />} color="blue" />
                  <StatCard label="Clientes activos" value={ventas.length} icon={<Users size={20} />} color="purple" />
                </div>
              )}
              {ventas?.length > 0 && (
                <div className="card">
                  <h2 className="mb-4">Pedidos por cliente</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventas} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="clienteNombre" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v: any) => v} />
                      <Bar dataKey="cantidadPedidos" name="Pedidos" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {ventas?.length > 0 && (
                <div className="card">
                  <h2 className="mb-4">Detalle por cliente</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-gray-100">
                      <thead><tr>
                        {['Cliente', 'Pedidos', 'Cant. Pedida', 'Cant. Despachada'].map((h) => (
                          <th key={h} className="table-header">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {ventas?.map((v: any) => (
                          <tr key={v.clienteId}>
                            <td className="table-cell">{v.clienteNombre}</td>
                            <td className="table-cell">{v.cantidadPedidos}</td>
                            <td className="table-cell">{v._sum?.cantidadPedido ?? 0}</td>
                            <td className="table-cell">{v._sum?.cantidadDespacho ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              {(() => {
                const decoraciones = pagosD?.decoraciones || [];
                const porDecoradora = decoraciones.reduce((acc: any, d: any) => {
                  const key = d.decoradora?.id || d.decoradoraId;
                  if (!acc[key]) {
                    acc[key] = {
                      decoradora: d.decoradora,
                      decoraciones: [],
                      total: 0
                    };
                  }
                  acc[key].decoraciones.push(d);
                  acc[key].total += Number(d.totalPagar) || 0;
                  return acc;
                }, {});
                const grupos = Object.values(porDecoradora);
                const totalGeneral = grupos.reduce((sum: number, g: any) => sum + g.total, 0);
                
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <StatCard label="Total pendiente" value={fmt(totalGeneral)} icon={<Palette size={20} />} color="red" />
                      <StatCard label="Decoradoras" value={grupos.length} icon={<FileText size={20} />} color="blue" />
                    </div>
                    <div className="card">
                      <h2 className="mb-4">Pagos pendientes por decoradora</h2>
                      <div className="space-y-4">
                        {grupos.map((grupo: any) => (
                          <div key={grupo.decoradora?.id || grupo.decoraciones[0]?.decoradoraId} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                              <div>
                                <p className="font-semibold text-sm">{grupo.decoradora?.nombre}</p>
                                <p className="text-xs text-gray-500">{grupo.decoraciones.length} decoración(es)</p>
                              </div>
                              <p className="font-bold text-orange-600 text-lg">{fmt(grupo.total)}</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {grupo.decoraciones.map((d: any) => (
                                <div key={d.id} className="flex justify-between items-center px-4 py-2 text-sm">
                                  <div className="flex flex-col">
                                    <span className="text-gray-700">{d.producto?.nombre}</span>
                                    <span className="text-xs text-gray-400">Pedido: {d.pedido?.codigo}</span>
                                  </div>
                                  <p className="font-medium text-gray-900">{fmt(d.totalPagar)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {grupos.length === 0 && (
                          <p className="text-center text-gray-500 py-8">No hay pagos pendientes</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
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
