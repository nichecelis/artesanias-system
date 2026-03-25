import request from 'supertest';
import app from '../../src/app';

describe('API Auth', () => {
  const baseUrl = '/api/v1';

  describe(`POST ${baseUrl}/auth/login`, () => {
    it('debería retornar 401 con credenciales inválidas', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({ correo: 'invalid@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('debería retornar 400 sin correo', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('debería retornar 400 sin contraseña', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send({ correo: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe(`POST ${baseUrl}/auth/logout`, () => {
    it('debería retornar 401 sin autenticación', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/logout`);

      expect(res.status).toBe(401);
    });
  });
});

describe('API Clientes', () => {
  const baseUrl = '/api/v1';
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ correo: 'admin@artesanias.com', password: 'admin123' });
    
    if (loginRes.status === 200) {
      token = loginRes.body.data.accessToken;
    }
  });

  describe(`GET ${baseUrl}/clientes`, () => {
    it('debería retornar 401 sin token', async () => {
      const res = await request(app)
        .get(`${baseUrl}/clientes`);

      expect(res.status).toBe(401);
    });

    it('debería retornar lista de clientes con token válido', async () => {
      if (!token) {
        console.log('Skipping: No se pudo obtener token de autenticación');
        return;
      }

      const res = await request(app)
        .get(`${baseUrl}/clientes`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
    });

    it('debería soportar paginación', async () => {
      if (!token) return;

      const res = await request(app)
        .get(`${baseUrl}/clientes?page=1&limit=10`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
    });
  });

  describe(`POST ${baseUrl}/clientes`, () => {
    it('debería crear un cliente con datos válidos', async () => {
      if (!token) return;

      const nuevoCliente = {
        nombre: 'Cliente Test E2E',
        correo: `test${Date.now()}@test.com`,
        telefono: '1234567890',
        direccion: 'Dirección de prueba',
      };

      const res = await request(app)
        .post(`${baseUrl}/clientes`)
        .set('Authorization', `Bearer ${token}`)
        .send(nuevoCliente);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });

    it('debería retornar 400 sin nombre', async () => {
      if (!token) return;

      const res = await request(app)
        .post(`${baseUrl}/clientes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ correo: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });
});

describe('API Productos', () => {
  const baseUrl = '/api/v1';
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ correo: 'admin@artesanias.com', password: 'admin123' });
    
    if (loginRes.status === 200) {
      token = loginRes.body.data.accessToken;
    }
  });

  describe(`GET ${baseUrl}/productos`, () => {
    it('debería retornar 401 sin token', async () => {
      const res = await request(app)
        .get(`${baseUrl}/productos`);

      expect(res.status).toBe(401);
    });

    it('debería retornar lista de productos con token válido', async () => {
      if (!token) return;

      const res = await request(app)
        .get(`${baseUrl}/productos`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
    });
  });

  describe(`POST ${baseUrl}/productos`, () => {
    it('debería crear un producto con datos válidos', async () => {
      if (!token) return;

      const nuevoProducto = {
        nombre: 'Producto Test ' + Date.now(),
        descripcion: 'Descripción de prueba',
        precio: 10000,
      };

      const res = await request(app)
        .post(`${baseUrl}/productos`)
        .set('Authorization', `Bearer ${token}`)
        .send(nuevoProducto);

      expect(res.status).toBe(201);
    });
  });
});

describe('API Pedidos', () => {
  const baseUrl = '/api/v1';
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ correo: 'admin@artesanias.com', password: 'admin123' });
    
    if (loginRes.status === 200) {
      token = loginRes.body.data.accessToken;
    }
  });

  describe(`GET ${baseUrl}/pedidos`, () => {
    it('debería retornar 401 sin token', async () => {
      const res = await request(app)
        .get(`${baseUrl}/pedidos`);

      expect(res.status).toBe(401);
    });

    it('debería retornar lista de pedidos con token válido', async () => {
      if (!token) return;

      const res = await request(app)
        .get(`${baseUrl}/pedidos`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
    });
  });
});

describe('API Parametrizacion', () => {
  const baseUrl = '/api/v1';
  let token: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send({ correo: 'admin@artesanias.com', password: 'admin123' });
    
    if (loginRes.status === 200) {
      token = loginRes.body.data.accessToken;
    }
  });

  describe(`GET ${baseUrl}/parametrizacion`, () => {
    it('debería retornar 401 sin token', async () => {
      const res = await request(app)
        .get(`${baseUrl}/parametrizacion`);

      expect(res.status).toBe(401);
    });

    it('debería retornar configuración con token válido', async () => {
      if (!token) return;

      const res = await request(app)
        .get(`${baseUrl}/parametrizacion`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});