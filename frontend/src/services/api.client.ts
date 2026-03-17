import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor REQUEST
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    
    console.group('📤 REQUEST');
    console.log('URL:', config.url);
    console.log('Método:', config.method?.toUpperCase());
    console.log('Token:', token ? `✅ ${token.substring(0, 20)}...` : '❌ No presente');
    console.groupEnd();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Header Authorization agregado');
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en REQUEST interceptor:', error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor RESPONSE
apiClient.interceptors.response.use(
  (response) => {
    console.group('📥 RESPONSE');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.group('❌ ERROR RESPONSE');
    console.log('Status:', error.response?.status);
    console.log('URL:', error.config?.url);
    console.log('Message:', error.response?.data?.message);
    console.groupEnd();

    // Si es 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Detectado 401, intentando renovar token...');

      try {
        const { refreshToken } = useAuthStore.getState();
        
        if (!refreshToken) {
          console.log('🔴 No hay refreshToken disponible');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        console.log('🔄 Enviando refreshToken al servidor...');
        
        const renewResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = renewResponse.data.data;
        
        console.log('✅ Token renovado correctamente');
        useAuthStore.getState().setToken(accessToken);
        
        if (newRefreshToken) {
          useAuthStore.getState().refreshToken = newRefreshToken;
        }

        // Reintentar petición original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log('🔁 Reintentando petición original con nuevo token...');
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Error al renovar token:', refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
