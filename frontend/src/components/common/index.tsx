// ─── Spinner ──────────────────────────────────────────────
export function Spinner({
  size = 'md',
  className = '',
  ...props
}: {
  size?: 'sm' | 'md' | 'lg';
} & React.HTMLAttributes<HTMLDivElement>) {

  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${s} ${className}`}
      {...props}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────
export function EmptyState({ message = 'No hay datos', action }: { message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

// ─── Badge de estado pedido ───────────────────────────────
const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE:      'bg-yellow-100 text-yellow-800',
  EN_CORTE:       'bg-blue-100 text-blue-800',
  EN_DECORACION:  'bg-purple-100 text-purple-800',
  LISTO:          'bg-green-100 text-green-800',
  DESPACHADO:     'bg-gray-100 text-gray-800',
  CANCELADO:      'bg-red-100 text-red-800',
};
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', EN_CORTE: 'En corte',
  EN_DECORACION: 'Decorando', LISTO: 'Listo',
  DESPACHADO: 'Despachado', CANCELADO: 'Cancelado',
};
export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`badge ${ESTADO_STYLES[estado] ?? 'bg-gray-100 text-gray-700'}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

// ─── Tabla genérica ───────────────────────────────────────
interface Column<T> { key: string; header: string; render?: (row: T) => React.ReactNode; }
export function Table<T extends { id: string }>({
  columns, data, onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="table-header">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
            >
              {columns.map((c) => (
                <td key={c.key} className="table-cell">
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Paginación ───────────────────────────────────────────
export function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
        >Anterior</button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
        >Siguiente</button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
export function Modal({
  title, open, onClose, children, size = 'md',
}: { title: string; open: boolean; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' }) {
  if (!open) return null;
  
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────
export function StatCard({
  label, value, icon, color = 'blue',
}: { label: string; value: string | number; icon: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
