import { ClientesService } from '../../src/services/clientes.service';

describe('ClientesService', () => {
  let service: ClientesService;

  beforeEach(() => {
    service = new ClientesService();
  });

  describe('listar', () => {
    it('debería listar clientes con paginación', async () => {
      const result = await service.listar({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('obtenerPorId', () => {
    it('debería obtener un cliente por su ID', async () => {
      const clientes = await service.listar({ page: 1, limit: 1 });
      
      if (clientes.items.length > 0) {
        const cliente = await service.obtenerPorId(clientes.items[0].id);
        expect(cliente).toBeDefined();
      }
    });
  });
});