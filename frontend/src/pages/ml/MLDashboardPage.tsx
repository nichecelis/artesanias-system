import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Brain, Package, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { reportesService } from '../../services';
import { LoadingScreen, Spinner } from '../../components/common';

const fmt = (n: number) => `$${Number(n ?? 0).toLocaleString('es-CO')}`;

const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function TrendIcon({ tendencia }: { tendencia: string }) {
  if (tendencia === 'subiendo') return <TrendingUp className="text-green-500" size={20} />;
  if (tendencia === 'bajando') return <TrendingDown className="text-red-500" size={20} />;
  return <Minus className="text-gray-400" size={20} />;
}

export default function MLDashboardPage() {
  const [meses, setMeses] = useState(3);

  const { data: prediccion, isLoading: loadingPrediccion, refetch: refetchPrediccion } = useQuery({
    queryKey: ['prediccion-ventas', meses],
    queryFn: () => reportesService.prediccionVentas(meses).then(r => r.data.data),
  });

  const { data: productosPred, isLoading: loadingProductos, refetch: refetchProductos } = useQuery({
    queryKey: ['prediccion-productos', meses],
    queryFn: () => reportesService.prediccionProductos(meses).then(r => r.data.data),
  });

  if (loadingPrediccion || loadingProductos) return <LoadingScreen />;

  const metricas = prediccion?.metricas || {};
  const historico = prediccion?.datosHistoricos || [];
  const predicciones = prediccion?.predicciones || [];
  const productos = productosPred || [];

  const ensemblePredictions = predicciones.filter((p: any) => p.metodo === 'Promedio Ensemble');

  const maxHistorico = Math.max(...historico.map((h: any) => h.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Brain className="text-purple-500" size={28} />
            Predicciones con ML
          </h1>
          <p className="text-gray-500 text-sm">Análisis predictivo basado en series temporales</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={meses}
            onChange={e => setMeses(Number(e.target.value))}
            className="input w-32"
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
          <button onClick={() => { refetchPrediccion(); refetchProductos(); }}
            className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tendencia</p>
              <p className="text-xl font-bold capitalize flex items-center gap-2">
                {metricas.tendencia}
                <TrendIcon tendencia={metricas.tendencia} />
              </p>
            </div>
            <BarChart3 className="text-purple-400" size={32} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cambio</p>
              <p className="text-xl font-bold">
                {metricas.cambioPorcentual > 0 ? '+' : ''}{metricas.cambioPorcentual}%
              </p>
            </div>
            <Calendar className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Promedio Ventas</p>
              <p className="text-xl font-bold">{fmt(metricas.promedioVentas)}</p>
            </div>
            <TrendingUp className="text-green-400" size={32} />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estacionalidad</p>
              <p className="text-xl font-bold">{metricas.estacionalidad ? 'Sí' : 'No'}</p>
            </div>
            <Calendar className="text-orange-400" size={32} />
          </div>
        </div>
      </div>

      {/* Gráfico de barras histórico */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Ventas Históricas</h2>
        <div className="flex items-end gap-2 h-48">
          {historico.map((h: any, i: number) => {
            const [year, month] = h.mes.split('-');
            const height = maxHistorico > 0 ? (h.total / maxHistorico) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-purple-200 rounded-t transition-all hover:bg-purple-400"
                  style={{ height: `${Math.max(height, 5)}%` }} />
                <span className="text-xs text-gray-500">{mesesNombres[parseInt(month) - 1]}</span>
                <span className="text-xs font-medium">{fmt(h.total).replace('$', '')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predicciones */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Predicciones de Ventas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Período</th>
                <th className="pb-2">Ensemble</th>
                <th className="pb-2">Confianza</th>
                <th className="pb-2">Regresión Lineal</th>
                <th className="pb-2">Promedio Móvil</th>
                <th className="pb-2">Suavizado Exp.</th>
              </tr>
            </thead>
            <tbody>
              {ensemblePredictions.map((p: any, i: number) => {
                const lineales = predicciones.filter((x: any) => x.fecha === p.fecha && x.metodo === 'Regresión Lineal');
                const moviles = predicciones.filter((x: any) => x.fecha === p.fecha && x.metodo === 'Promedio Móvil');
                const suavizados = predicciones.filter((x: any) => x.fecha === p.fecha && x.metodo === 'Suavizado Exponencial');
                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{p.fecha}</td>
                    <td className="py-2 text-green-600 font-semibold">{fmt(p.prediccion)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.confianza >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.confianza}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{lineales[0] ? fmt(lineales[0].prediccion) : '—'}</td>
                    <td className="py-2 text-gray-600">{moviles[0] ? fmt(moviles[0].prediccion) : '—'}</td>
                    <td className="py-2 text-gray-600">{suavizados[0] ? fmt(suavizados[0].prediccion) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productos más vendidos predichos */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="text-purple-500" size={20} />
          Productos con Mayor Predicción de Ventas
        </h2>
        {productos.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay suficientes datos para predecir por producto.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {productos.slice(0, 9).map((p: any, i: number) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{p.nombre}</span>
                  <TrendIcon tendencia={p.tendencia} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Promedio:</span>
                    <span>{fmt(p.promedioMensual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Predicción:</span>
                    <span className="font-semibold text-purple-600">{fmt(p.prediccionProximoMes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confianza:</span>
                    <span className="text-xs">{p.confianza}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
