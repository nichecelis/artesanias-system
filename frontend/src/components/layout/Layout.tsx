import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Users, Package, UserCog,
  Palette, ClipboardList, UserCheck, FileText, Banknote,
  LogOut, Menu, X, ChevronRight, Truck, Settings,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services';
import type { Rol } from '../../types';

const NAV_CONFIG = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, roles: ['ADMINISTRADOR', 'PRODUCCION', 'CONTABILIDAD'] as Rol[] },
  { to: '/pedidos',     label: 'Pedidos',       icon: ShoppingBag,    roles: ['ADMINISTRADOR', 'PRODUCCION'] as Rol[] },
  { to: '/despachos',   label: 'Despachos',     icon: Truck,         roles: ['ADMINISTRADOR', 'PRODUCCION'] as Rol[] },
  { to: '/clientes',    label: 'Clientes',      icon: Users,         roles: ['ADMINISTRADOR'] as Rol[] },
  { to: '/productos',   label: 'Productos',      icon: Package,       roles: ['ADMINISTRADOR', 'PRODUCCION'] as Rol[] },
  { to: '/decoradoras', label: 'Decoradoras',    icon: Palette,       roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/decoraciones',label: 'Decoraciones',   icon: ClipboardList, roles: ['ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'] as Rol[] },
  { to: '/prestamos',   label: 'Préstamos',     icon: Banknote,      roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/grupos',      label: 'Grupos/Elites',  icon: Users,         roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/facturas',    label: 'Facturas',       icon: FileText,      roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/nomina',      label: 'Nómina',         icon: FileText,      roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/empleados',   label: 'Empleados',      icon: UserCheck,     roles: ['ADMINISTRADOR', 'CONTABILIDAD'] as Rol[] },
  { to: '/reportes',    label: 'Reportes',       icon: FileText,      roles: ['ADMINISTRADOR', 'CONTABILIDAD', 'PRODUCCION'] as Rol[] },
  { to: '/usuarios',    label: 'Usuarios',        icon: UserCog,       roles: ['ADMINISTRADOR'] as Rol[] },
  { to: '/parametrizacion', label: 'Configuración', icon: Settings,    roles: ['ADMINISTRADOR'] as Rol[] },
];

export default function Layout() {
  const [open, setOpen] = useState(true);
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  const userRole = usuario?.rol || '';

  const visibleNav = useMemo(() => {
    return NAV_CONFIG.filter(item => item.roles.includes(userRole as Rol));
  }, [userRole]);

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
          {visibleNav.map(({ to, label, icon: Icon }) => (
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
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="p-6 flex-1">
          <Outlet />
        </div>
        <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 bg-white shrink-0">
          © 2025 Adrian F. Celis Morales. Todos los derechos reservados.
        </footer>
      </main>
    </div>
  );
}
