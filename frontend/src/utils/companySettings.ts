import { api } from '../services/api';

export const companySettings = {
  obtener: async () => {
    try {
      const res = await api.get('/parametrizacion');
      return res.data.data;
    } catch {
      return { nombre: 'Mi Empresa', nit: '', direccion: '', telefono: '', logo: '' };
    }
  },
};