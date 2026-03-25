import { DecoradorasService } from '../../src/services/decoradoras.service';

describe('DecoradorasService', () => {
  let service: DecoradorasService;

  beforeEach(() => {
    service = new DecoradorasService();
  });

  describe('listar', () => {
    it('debería listar decoradoras con paginación', async () => {
      const result = await service.listar({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });
  });

  describe('obtenerPorId', () => {
    it('debería obtener una decoradora por su ID', async () => {
      const decoradoras = await service.listar({ page: 1, limit: 1 });
      
      if (decoradoras.items.length > 0) {
        const decoradora = await service.obtenerPorId(decoradoras.items[0].id);
        expect(decoradora).toBeDefined();
      }
    });
  });
});