import { Scissors, Palette, Truck } from 'lucide-react';

const steps = [
  { key: 'CORTE', label: 'Corte', icon: Scissors },
  { key: 'DECORACION', label: 'Decoración', icon: Palette },
  { key: 'DESPACHO', label: 'Despacho', icon: Truck },
];

export default function ProcesoProducto({ estado }: { estado: string }) {
  const getColor = (step: string) => {
    if (estado === 'FINALIZADO') return 'bg-green-500 text-white';

    if (step === 'CORTE' && estado !== 'PENDIENTE')
      return 'bg-blue-500 text-white';

    if (step === 'DECORACION' && (estado === 'DECORACION' || estado === 'DESPACHO'))
      return 'bg-purple-500 text-white';

    if (step === 'DESPACHO' && estado === 'DESPACHO')
      return 'bg-yellow-500 text-white';

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
