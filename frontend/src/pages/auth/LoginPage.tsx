import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services';
import { useAuthStore } from '../../store/auth.store';
import { Spinner } from '../../components/common';
import { Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  correo:   z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});
type Form = z.infer<typeof schema>;


export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Form) => {
  setError('');
  try {
    console.log('🔐 Intentando login...');
    const { data } = await authService.login(values.correo, values.password);
    
    console.log('✅ Login exitoso, datos recibidos:', data.data);
    
    const { accessToken, refreshToken, usuario } = data.data;
    setAuth(accessToken, refreshToken, usuario);
    
    console.log('💾 Token guardado en store');
    navigate('/dashboard');
  } catch (err: any) {
    console.error('❌ Error login:', err);
    setError(err.response?.data?.message ?? 'Error al iniciar sesión');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Artesanías SaaS</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestión</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                {...register('correo')}
                type="email"
                className="input"
                placeholder="admin@artesanias.com"
                autoComplete="email"
              />
              {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5">
              {isSubmitting ? <Spinner size="sm" /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
