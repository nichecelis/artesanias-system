import { prisma } from '../config/database';

interface SalesData {
  fecha: Date;
  total: number;
}

interface PredictionResult {
  fecha: string;
  prediccion: number;
  metodo: string;
  confianza: number;
}

interface ForecastMetrics {
  tendencia: 'subiendo' | 'bajando' | 'estable';
  cambioPorcentual: number;
  promedioVentas: number;
  estacionalidad: boolean;
}

export class SalesForecastService {

  async getHistoricalSales(months: number = 12): Promise<SalesData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    const facturas = await prisma.factura.findMany({
      where: {
        fecha: { gte: startDate },
      },
      select: {
        fecha: true,
        total: true,
      },
      orderBy: { fecha: 'asc' },
    });

    return facturas.map(f => ({
      fecha: f.fecha,
      total: Number(f.total),
    }));
  }

  async getMonthlyAggregation(months: number = 12): Promise<{ mes: string; total: number }[]> {
    const data = await this.getHistoricalSales(months);
    const monthlyMap = new Map<string, number>();

    for (const sale of data) {
      const mes = `${sale.fecha.getFullYear()}-${String(sale.fecha.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(mes, (monthlyMap.get(mes) || 0) + sale.total);
    }

    return Array.from(monthlyMap.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  movingAverage(data: number[], window: number = 3): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(data[i]);
      } else {
        const avg = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window;
        result.push(Math.round(avg));
      }
    }
    return result;
  }

  exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
      result.push(Math.round(smoothed));
    }
    return result;
  }

  linearRegression(data: number[]): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  detectSeasonality(data: number[]): boolean {
    if (data.length < 6) return false;
    
    const quarterlyAvg: number[] = [];
    for (let q = 0; q < 4; q++) {
      const quarterData = data.slice(q * 3, q * 3 + 3);
      if (quarterData.length > 0) {
        quarterlyAvg.push(quarterData.reduce((a, b) => a + b, 0) / quarterData.length);
      }
    }

    const mean = quarterlyAvg.reduce((a, b) => a + b, 0) / quarterlyAvg.length;
    const variance = quarterlyAvg.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / quarterlyAvg.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean > 0.15;
  }

  async predict(monthsToForecast: number = 3): Promise<{
    predicciones: PredictionResult[];
    metricas: ForecastMetrics;
    datosHistoricos: { mes: string; total: number }[];
  }> {
    const monthlyData = await this.getMonthlyAggregation(12);
    const values = monthlyData.map(d => d.total);

    if (values.length < 3) {
      return {
        predicciones: [],
        metricas: { tendencia: 'estable', cambioPorcentual: 0, promedioVentas: 0, estacionalidad: false },
        datosHistoricos: monthlyData,
      };
    }

    const maForecast = this.movingAverage(values, 3);
    const esForecast = this.exponentialSmoothing(values, 0.3);
    const { slope, intercept } = this.linearRegression(values);

    const predicciones: PredictionResult[] = [];
    const lastIndex = values.length - 1;

    for (let i = 1; i <= monthsToForecast; i++) {
      const futureIndex = lastIndex + i;
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() + i);
      const mesStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      const linearPred = Math.round(slope * futureIndex + intercept);
      const maPred = maForecast[lastIndex];
      const esPred = esForecast[lastIndex];

      const avgPrediction = Math.round((linearPred + maPred + esPred) / 3);

      const confianza = Math.min(0.95, 0.5 + (0.1 * (values.length - i)));

      predicciones.push(
        { fecha: mesStr, prediccion: Math.max(0, linearPred), metodo: 'Regresión Lineal', confianza: Math.round(confianza * 100) },
        { fecha: mesStr, prediccion: Math.max(0, maPred), metodo: 'Promedio Móvil', confianza: Math.round(confianza * 90) },
        { fecha: mesStr, prediccion: Math.max(0, esPred), metodo: 'Suavizado Exponencial', confianza: Math.round(confianza * 85) },
        { fecha: mesStr, prediccion: Math.max(0, avgPrediction), metodo: 'Promedio Ensemble', confianza: Math.round(confianza * 95) },
      );
    }

    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const cambioPorcentual = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    let tendencia: 'subiendo' | 'bajando' | 'estable' = 'estable';
    if (cambioPorcentual > 10) tendencia = 'subiendo';
    else if (cambioPorcentual < -10) tendencia = 'bajando';

    return {
      predicciones,
      metricas: {
        tendencia,
        cambioPorcentual: Math.round(cambioPorcentual * 100) / 100,
        promedioVentas: Math.round(recentAvg),
        estacionalidad: this.detectSeasonality(values),
      },
      datosHistoricos: monthlyData,
    };
  }

  async predictByProduct(monthsToForecast: number = 3): Promise<any[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const productos = await prisma.producto.findMany({
      where: { estado: 'ACTIVO' },
      select: { id: true, nombre: true },
    });

    const predictions = [];

    for (const producto of productos) {
      const items = await prisma.facturaItem.findMany({
        where: {
          pedidoProducto: { productoId: producto.id },
          factura: { fecha: { gte: sixMonthsAgo } },
        },
        include: { factura: { select: { fecha: true } } },
      });

      if (items.length === 0) continue;

      const monthlySales = new Map<string, number>();
      for (const item of items) {
        const mes = `${item.factura.fecha.getFullYear()}-${String(item.factura.fecha.getMonth() + 1).padStart(2, '0')}`;
        monthlySales.set(mes, (monthlySales.get(mes) || 0) + Number(item.total));
      }

      const values = Array.from(monthlySales.values());
      if (values.length < 2) continue;

      const { slope, intercept } = this.linearRegression(values);
      const lastIndex = values.length - 1;
      const forecast = Math.max(0, Math.round(slope * (lastIndex + monthsToForecast) + intercept));

      const avgSales = values.reduce((a, b) => a + b, 0) / values.length;

      predictions.push({
        productoId: producto.id,
        nombre: producto.nombre,
        promedioMensual: Math.round(avgSales),
        prediccionProximoMes: forecast,
        tendencia: slope > avgSales * 0.1 ? 'subiendo' : slope < -avgSales * 0.1 ? 'bajando' : 'estable',
        confianza: Math.min(90, 50 + values.length * 5),
      });
    }

    return predictions.sort((a, b) => b.prediccionProximoMes - a.prediccionProximoMes);
  }
}

export const salesForecastService = new SalesForecastService();
