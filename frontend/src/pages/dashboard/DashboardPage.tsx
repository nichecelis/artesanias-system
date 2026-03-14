import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Users, Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { pedidosService, reportesService } from '../../services';
import { StatCard, LoadingScreen } from '../../components/common';

const COLORES = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['pedidos-estadisticas'],
    queryFn: () => pedidosService.estadisticas().then((r) => r.data.data),
  });

  const { data: pagos, isLoading: loadingPagos } = useQuery({
    queryKey: ['pagos-decoradoras'],
    queryFn: () => reportesService.pagosDecoradores().then((r) => r.data.data),
  });

  if (loadingStats || loadingPagos) return <LoadingScreen />;

  const porEstado = stats?.porEstado ?? [];
  const totalPedidos = porEstado.reduce((a: number, e: any) => a + e._count.id, 0);
  const activos = porEstado
    .filter((e: any) => !['DESPACHADO', 'CANCELADO'].includes(e.estado))
    .reduce((a: number, e: any) => a + e._count.id, 0);

  const pieData = porEstado.map((e: any) => ({
    name: e.estado, value: e._count.id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total pedidos"    value={totalPedidos}              icon={<ShoppingBag size={20} />} color="blue" />
        <StatCard label="Pedidos activos"  value={activos}                   icon={<Clock size={20} />}       color="yellow" />
        <StatCard label="Este mes"         value={stats?.totalMes ?? 0}      icon={<TrendingUp size={20} />}  color="green" />
        <StatCard label="Pagos pendientes" value={pagos?.decoraciones?.length ?? 0} icon={<CheckCircle size={20} />} color="purple" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barras por estado */}
        <div className="card">
          <h2 className="mb-4">Pedidos por estado</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porEstado.map((e: any) => ({ estado: e.estado, cantidad: e._count.id }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie distribución */}
        <div className="card">
          <h2 className="mb-4">Distribución</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {pieData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pagos pendientes */}
      {pagos?.totalPendiente > 0 && (
        <div className="card border-l-4 border-l-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-orange-700">Pagos pendientes a decoradoras</h2>
              <p className="text-sm text-gray-500 mt-1">
                {pagos.decoraciones.length} decoraciones sin pagar
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">
                ${Number(pagos.totalPendiente).toLocaleString('es-CO')}
              </p>
              <p className="text-xs text-gray-400">Total a pagar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
