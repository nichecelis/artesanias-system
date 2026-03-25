import { EmpleadosService } from '../../src/services/empleados.service';

describe('EmpleadosService', () => {
  let service: EmpleadosService;

  beforeEach(() => {
    service = new EmpleadosService();
  });

  describe('listar', () => {
    it('debería listar empleados con paginación', async () => {
      const result = await service.listar({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });
  });

  describe('obtenerPorId', () => {
    it('debería obtener un empleado por su ID', async () => {
      const empleados = await service.listar({ page: 1, limit: 1 });
      
      if (empleados.items.length > 0) {
        const empleado = await service.obtenerPorId(empleados.items[0].id);
        expect(empleado).toBeDefined();
      }
    });
  });
});