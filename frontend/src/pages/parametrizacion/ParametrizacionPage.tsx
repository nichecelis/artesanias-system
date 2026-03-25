import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parametrizacionService } from '../../services';
import { useToastStore } from '../../store/toast.store';

export function ParametrizacionPage() {
  const qc = useQueryClient();
  const toast = useToastStore();
  const [form, setForm] = useState({ nombre: '', nit: '', direccion: '', telefono: '', logo: '' });
  const [previewLogo, setPreviewLogo] = useState('');

  const { data } = useQuery({
    queryKey: ['parametrizacion'],
    queryFn: () => parametrizacionService.obtener().then(r => r.data.data),
  });

  useState(() => {
    if (data) {
      setForm({ nombre: data.nombre || '', nit: data.nit || '', direccion: data.direccion || '', telefono: data.telefono || '', logo: data.logo || '' });
      if (data.logo) setPreviewLogo(data.logo);
    }
  });

  const actualizar = useMutation({
    mutationFn: (d: typeof form) => parametrizacionService.actualizar(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parametrizacion'] });
      toast.addToast('Configuración guardada', 'success');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
        setForm(f => ({ ...f, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuración de Empresa</h1>
      
      <form onSubmit={(e) => { e.preventDefault(); actualizar.mutate(form); }} className="space-y-4">
        <div>
          <label className="label">Nombre de la Empresa</label>
          <input
            className="input"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre de la empresa"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">NIT</label>
            <input
              className="input"
              value={form.nit}
              onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
              placeholder="NIT"
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              placeholder="Teléfono"
            />
          </div>
        </div>

        <div>
          <label className="label">Dirección</label>
          <input
            className="input"
            value={form.direccion}
            onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
            placeholder="Dirección"
          />
        </div>

        <div>
          <label className="label">Logo</label>
          {previewLogo ? (
            <div className="mb-2">
              <img src={previewLogo} alt="Logo" className="h-24 object-contain border rounded p-2" />
              <button type="button" onClick={() => { setPreviewLogo(''); setForm(f => ({ ...f, logo: '' })); }} className="text-red-500 text-sm">
                Eliminar
              </button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={handleLogoChange} className="input" />
          )}
        </div>

        <button type="submit" disabled={actualizar.isPending} className="btn-primary">
          {actualizar.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}