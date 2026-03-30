import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { SessionWarningModal } from './components/SessionWarningModal';
import { ToastContainer } from './components/Toast';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PedidosPage from './pages/pedidos/PedidosPage';
import PedidoFormPage from './pages/pedidos/PedidoFormPage';
import DespachosPage from './pages/pedidos/DespachosPage';
import ClientesPage from './pages/clientes/ClientesPage';
import ProductosPage from './pages/productos/ProductosPage';
import DecoradorasPage from './pages/decoradoras/DecoradorasPage';
import DecoracionesPage from './pages/decoradoras/DecoracionesPage';
import GruposPage from './pages/decoradoras/GruposPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import PrestamosPage from './pages/prestamos/PrestamosPage';
import EmpleadosPage from './pages/nomina/EmpleadosPage';
import NominaPage from './pages/nomina/NominaPage';
import ReportesPage from './pages/reportes/ReportesPage';
import FacturasPage from './pages/facturas/FacturasPage';
import { ParametrizacionPage } from './pages/parametrizacion/ParametrizacionPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppContent() {
  useSessionTimeout();
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"       element={<DashboardPage />} />
          <Route path="pedidos"         element={<PedidosPage />} />
          <Route path="pedidos/nuevo"   element={<PedidoFormPage />} />
          <Route path="pedidos/:id"     element={<PedidoFormPage />} />
          <Route path="despachos"       element={<DespachosPage />} />
          <Route path="clientes"        element={<ClientesPage />} />
          <Route path="productos"       element={<ProductosPage />} />
          <Route path="decoradoras"     element={<DecoradorasPage />} />
          <Route path="decoraciones"    element={<DecoracionesPage />} />
          <Route path="grupos"          element={<GruposPage />} />
          <Route path="usuarios"        element={<UsuariosPage />} />
          <Route path="prestamos"       element={<PrestamosPage />} />
          <Route path="empleados"       element={<EmpleadosPage />} />
          <Route path="nomina"          element={<NominaPage />} />
          <Route path="facturas"        element={<FacturasPage />} />
          <Route path="reportes"        element={<ReportesPage />} />
          <Route path="parametrizacion" element={<ParametrizacionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SessionWarningModal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}
