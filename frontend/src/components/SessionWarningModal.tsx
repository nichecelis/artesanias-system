import { useSessionWarningStore } from '../hooks/useSessionTimeout';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { AlertTriangle } from 'lucide-react';

export function SessionWarningModal() {
  const { showWarning, timeLeft } = useSessionWarningStore();
  const { extendSession } = useSessionTimeout();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <AlertTriangle className="text-yellow-600" size={24}/>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Sesión por expirar</h2>
        </div>
        <p className="text-gray-600 mb-2">
          Tu sesión expira en:
        </p>
        <div className="text-4xl font-bold text-center text-yellow-600 mb-4">
          {timeLeft} segundos
        </div>
        <p className="text-sm text-gray-500 mb-6">
          ¿Deseas continuar trabajando?
        </p>
        <div className="flex gap-3">
          <button
            onClick={extendSession}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Continuar
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
