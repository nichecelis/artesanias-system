import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Package, UserCog,
  Palette, ClipboardList, UserCheck, FileText, Banknote,
  LogOut, Menu, X, ChevronRight, Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/pedidos',      label: 'Pedidos',       icon: ShoppingBag },
  { to: '/despachos',    label: 'Despachos',     icon: Truck },
  { to: '/clientes',     label: 'Clientes',      icon: Users },
  { to: '/productos',    label: 'Productos',     icon: Package },
  { to: '/decoradoras',  label: 'Decoradoras',   icon: Palette },
  { to: '/decoraciones', label: 'Decoraciones',  icon: ClipboardList },
  { to: '/prestamos',    label: 'Préstamos',      icon: Banknote },
  { to: '/grupos',       label: 'Grupos/Elites',  icon: Users },
  { to: '/facturas',     label: 'Facturas',       icon: FileText },
  { to: '/nomina',       label: 'Nómina',        icon: FileText },
  { to: '/usuarios',     label: 'Usuarios',       icon: UserCog },
  { to: '/empleados',    label: 'Empleados',     icon: UserCheck },
  { to: '/reportes',     label: 'Reportes',      icon: FileText },
];

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${open ? 'w-64' : 'w-16'} flex flex-col bg-gray-900 text-white transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">A</div>
          {open && <span className="font-semibold text-sm">Artesanías SaaS</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-700 p-4">
          {open && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{usuario?.rol?.toLowerCase()}</p>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors w-full">
            <LogOut size={16} />
            {open && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute left-0 top-4 z-10 ml-[248px] bg-gray-900 text-gray-400 hover:text-white p-1 rounded-r transition-all duration-200"
        style={{ marginLeft: open ? '252px' : '60px' }}
      >
        {open ? <X size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
