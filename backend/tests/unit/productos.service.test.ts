import { ProductosService } from '../../src/services/productos.service';

describe('ProductosService', () => {
  let service: ProductosService;

  beforeEach(() => {
    service = new ProductosService();
  });

  describe('listar', () => {
    it('debería listar productos con paginación', async () => {
      const result = await service.listar({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });
  });

  describe('obtenerPorId', () => {
    it('debería obtener un producto por su ID', async () => {
      const productos = await service.listar({ page: 1, limit: 1 });
      
      if (productos.items.length > 0) {
        const producto = await service.obtenerPorId(productos.items[0].id);
        expect(producto).toBeDefined();
      }
    });
  });
});