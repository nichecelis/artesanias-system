import { Scissors, Palette, Truck } from 'lucide-react';

const steps = [
  { key: 'EN_CORTE', label: 'Corte', icon: Scissors },
  { key: 'EN_DECORACION', label: 'Decoración', icon: Palette },
  { key: 'DESPACHADO', label: 'Despacho', icon: Truck },
];

const ESTADO_ORDER = ['PENDIENTE', 'EN_CORTE', 'EN_DECORACION', 'LISTO', 'DESPACHADO'];

export default function ProcesoProducto({ estado }: { estado: string }) {
  const currentIndex = ESTADO_ORDER.indexOf(estado);
  const isDespachado = estado === 'DESPACHADO' || estado === 'LISTO';

  const getColor = (step: string) => {
    if (isDespachado && step === 'DESPACHADO') return 'bg-green-500 text-white';
    
    if (step === 'EN_CORTE' && currentIndex >= 1) return 'bg-blue-500 text-white';
    if (step === 'EN_DECORACION' && currentIndex >= 2) return 'bg-purple-500 text-white';
    if (step === 'DESPACHADO' && currentIndex >= 4) return 'bg-yellow-500 text-white';

    return 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;

        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getColor(s.key)}`}>
              <Icon size={14} />
              {s.label}
            </div>

            {i < steps.length - 1 && (
              <div className="w-6 h-[2px] bg-gray-300"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
