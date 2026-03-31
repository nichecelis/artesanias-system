/**
 * API Test Suite for Artesanias System
 * Run: node api-tests.js
 * 
 * Prerequisites:
 * 1. Backend must be running on http://localhost:3001
 * 2. Database must be seeded with test data
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

let token = '';
let testResults = { passed: 0, failed: 0, errors: [] };

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 
    'Content-Type': 'application/json',
    'x-test-mode': 'true' // Skip rate limiter
  }
});

api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testResults.passed++;
  } else {
    console.log(`  ✗ ${message}`);
    testResults.failed++;
    testResults.errors.push(message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test(name, fn) {
  console.log(`\n${name}`);
  console.log('-'.repeat(name.length));
  try {
    await fn();
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    let errorMsg = error.message;
    if (data) {
      errorMsg = `Request failed with status ${status}: ${JSON.stringify(data)}`;
    }
    console.log(`  ✗ Error: ${errorMsg}`);
    testResults.failed++;
    testResults.errors.push(`${name}: ${errorMsg}`);
  }
  await sleep(1000);
}

async function runTests() {
  console.log('\n========================================');
  console.log('  ARTESANIAS API TEST SUITE');
  console.log('========================================');
  console.log(`\nBase URL: ${BASE_URL}`);

  // Wait for rate limiter to reset
  await sleep(3000);

  // ─────────────────────────────────────────────
  // AUTH TESTS
  // ─────────────────────────────────────────────
  await test('AUTH - Login', async () => {
    const res = await api.post('/auth/login', {
      correo: 'admin@artesanias.com',
      password: 'Admin123!'
    });
    assert(res.status === 200, 'Login returns 200');
    assert(res.data?.data?.accessToken, 'Response contains accessToken');
    token = res.data.data.accessToken;
    assert(token.length > 0, 'Token is not empty');
  });

  await test('AUTH - Get Current User', async () => {
    const res = await api.get('/auth/me');
    assert(res.status === 200, 'Get me returns 200');
    assert(res.data?.data?.correo || res.data?.correo, 'User has correo');
    assert(res.data?.data?.rol || res.data?.rol, 'User has rol');
  });

  await test('AUTH - Logout', async () => {
    const res = await api.post('/auth/logout');
    assert(res.status === 200, 'Logout returns 200');
    token = '';
  });

  // Wait for rate limiter to reset after logout
  await sleep(3000);

  // Re-login for subsequent tests
  const loginRes = await api.post('/auth/login', {
    correo: 'admin@artesanias.com',
    password: 'Admin123!'
  });
  token = loginRes.data.data.accessToken;

  // ─────────────────────────────────────────────
  // USUARIOS TESTS
  // ─────────────────────────────────────────────
  await test('USUARIOS - List', async () => {
    const res = await api.get('/usuarios');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
    if (res.data.data.length > 0) {
      assert(res.data.data[0]?.nombre, 'User has nombre');
    }
  });

  let createdUsuarioId = null;
  await test('USUARIOS - Create', async () => {
    const timestamp = Date.now();
    const res = await api.post('/usuarios', {
      nombre: `Test User ${timestamp}`,
      correo: `testuser${timestamp}@test.com`,
      password: 'Test123!',
      rol: 'PRODUCCION'
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created user has id');
    createdUsuarioId = res.data.data.id;
  });

  if (createdUsuarioId) {
    await test('USUARIOS - Get by ID', async () => {
      const res = await api.get(`/usuarios/${createdUsuarioId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdUsuarioId, 'Correct user returned');
    });

    await test('USUARIOS - Update', async () => {
      const res = await api.patch(`/usuarios/${createdUsuarioId}`, {
        nombre: 'Updated Name'
      });
      assert(res.status === 200, 'Update returns 200');
      assert(res.data?.data?.nombre === 'Updated Name', 'Name was updated');
    });
  }

  // ─────────────────────────────────────────────
  // CLIENTES TESTS
  // ─────────────────────────────────────────────
  await test('CLIENTES - List', async () => {
    const res = await api.get('/clientes');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  let createdClienteId = null;
  await test('CLIENTES - Create', async () => {
    const timestamp = Date.now();
    const res = await api.post('/clientes', {
      nombre: `Cliente Test ${timestamp}`,
      documento: `${timestamp}`.slice(-8),
      telefono: '3001234567',
      correo: `cliente${timestamp}@test.com`
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created cliente has id');
    createdClienteId = res.data.data.id;
  });

  if (createdClienteId) {
    await test('CLIENTES - Get by ID', async () => {
      const res = await api.get(`/clientes/${createdClienteId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdClienteId, 'Correct cliente returned');
    });

    await test('CLIENTES - Update', async () => {
      const res = await api.patch(`/clientes/${createdClienteId}`, {
        telefono: '3009876543'
      });
      assert(res.status === 200, 'Update returns 200');
    });
  }

  // ─────────────────────────────────────────────
  // PRODUCTOS TESTS
  // ─────────────────────────────────────────────
  await test('PRODUCTOS - List', async () => {
    const res = await api.get('/productos');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  let createdProductoId = null;
  await test('PRODUCTOS - Create', async () => {
    const timestamp = Date.now();
    const res = await api.post('/productos', {
      nombre: `Producto Test ${timestamp}`,
      descripcion: 'Descripción de prueba',
      precioVenta: 50000,
      precioDecoracion: 25000
    }).catch(e => {
      console.log('  [DEBUG] Error:', JSON.stringify(e.response?.data, null, 2));
      throw e;
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created producto has id');
    createdProductoId = res.data.data.id;
  });

  if (createdProductoId) {
    await test('PRODUCTOS - Get by ID', async () => {
      const res = await api.get(`/productos/${createdProductoId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdProductoId, 'Correct producto returned');
    });

    await test('PRODUCTOS - Update', async () => {
      const res = await api.patch(`/productos/${createdProductoId}`, {
        precio: 55000
      });
      assert(res.status === 200, 'Update returns 200');
    });
  }

  // ─────────────────────────────────────────────
  // EMPLEADOS TESTS
  // ─────────────────────────────────────────────
  await test('EMPLEADOS - List', async () => {
    const res = await api.get('/empleados');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  let createdEmpleadoId = null;
  await test('EMPLEADOS - Create', async () => {
    const timestamp = Date.now();
    const res = await api.post('/empleados', {
      nombre: `Empleado Test ${timestamp}`,
      documento: `${timestamp}`.slice(-8),
      telefono: '3001234567',
      salario: 1500000,
      cargo: 'Operario'
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created empleado has id');
    createdEmpleadoId = res.data.data.id;
  });

  if (createdEmpleadoId) {
    await test('EMPLEADOS - Get by ID', async () => {
      const res = await api.get(`/empleados/${createdEmpleadoId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdEmpleadoId, 'Correct empleado returned');
    });

    await test('EMPLEADOS - Update', async () => {
      const res = await api.patch(`/empleados/${createdEmpleadoId}`, {
        salario: 1600000
      });
      assert(res.status === 200, 'Update returns 200');
    });
  }

  // ─────────────────────────────────────────────
  // GRUPOS TESTS
  // ─────────────────────────────────────────────
  await test('GRUPOS - List', async () => {
    const res = await api.get('/grupos');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  let createdGrupoId = null;
  await test('GRUPOS - Create', async () => {
    const timestamp = Date.now();
    const res = await api.post('/grupos', {
      nombre: `Grupo Test ${timestamp}`,
      tipo: 'ELITE',
      porcentajeComision: 10
    }).catch(e => {
      console.log('  [DEBUG] Error:', JSON.stringify(e.response?.data, null, 2));
      throw e;
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created grupo has id');
    createdGrupoId = res.data.data.id;
  });

  if (createdGrupoId) {
    await test('GRUPOS - Get by ID', async () => {
      const res = await api.get(`/grupos/${createdGrupoId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdGrupoId, 'Correct grupo returned');
    });

    await test('GRUPOS - Update', async () => {
      const res = await api.patch(`/grupos/${createdGrupoId}`, {
        porcentajeComision: 15
      });
      assert(res.status === 200, 'Update returns 200');
    });
  }

  // ─────────────────────────────────────────────
  // DECORADORAS TESTS
  // ─────────────────────────────────────────────
  await test('DECORADORAS - List', async () => {
    const res = await api.get('/decoradoras');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  let createdDecoradoraId = null;
  await test('DECORADORAS - Create', async () => {
    const timestamp = Date.now();
    // Use created grupo ID, or get existing one
    let grupoIdToUse = createdGrupoId;
    if (!grupoIdToUse) {
      const gruposRes = await api.get('/grupos');
      if (gruposRes.data.data?.length > 0) {
        grupoIdToUse = gruposRes.data.data[0].id;
      }
    }
    
    const res = await api.post('/decoradoras', {
      nombre: `Decoradora Test ${timestamp}`,
      documento: `${timestamp}`.slice(-8),
      telefono: '3001234567',
      grupoId: grupoIdToUse
    }).catch(e => {
      console.log('  [DEBUG] Error:', JSON.stringify(e.response?.data, null, 2));
      throw e;
    });
    assert(res.status === 201, 'Create returns 201');
    assert(res.data?.data?.id, 'Created decoradora has id');
    createdDecoradoraId = res.data.data.id;
  });

  if (createdDecoradoraId) {
    await test('DECORADORAS - Get by ID', async () => {
      const res = await api.get(`/decoradoras/${createdDecoradoraId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdDecoradoraId, 'Correct decoradora returned');
    });

    await test('DECORADORAS - Update', async () => {
      const res = await api.patch(`/decoradoras/${createdDecoradoraId}`, {
        telefono: '3009876543'
      });
      assert(res.status === 200, 'Update returns 200');
    });
  }

  // ─────────────────────────────────────────────
  // PEDIDOS TESTS
  // ─────────────────────────────────────────────
  await test('PEDIDOS - List', async () => {
    const res = await api.get('/pedidos');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  await test('PEDIDOS - Get Stats', async () => {
    const res = await api.get('/pedidos/stats/resumen');
    assert(res.status === 200, 'Get stats returns 200');
  });

  let createdPedidoId = null;
  if (createdClienteId && createdProductoId) {
    await test('PEDIDOS - Create', async () => {
      const res = await api.post('/pedidos', {
        clienteId: createdClienteId,
        productos: [{
          productoId: createdProductoId,
          cantidadPedido: 5
        }]
      }).catch(e => {
        console.log('  [DEBUG] Error:', JSON.stringify(e.response?.data, null, 2));
        throw e;
      });
      assert(res.status === 201, 'Create returns 201');
      assert(res.data?.data?.id, 'Created pedido has id');
      createdPedidoId = res.data.data.id;
    });
  }

  if (createdPedidoId) {
    await test('PEDIDOS - Get by ID', async () => {
      const res = await api.get(`/pedidos/${createdPedidoId}`);
      assert(res.status === 200, 'Get returns 200');
      assert(res.data?.data?.id === createdPedidoId, 'Correct pedido returned');
    });
  }

  // ─────────────────────────────────────────────
  // NOMINA TESTS
  // ─────────────────────────────────────────────
  await test('NOMINA - List', async () => {
    const res = await api.get('/nomina');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  await test('NOMINA - Get Total Mes', async () => {
    const res = await api.get('/nomina/total-mes', {
      params: { mes: '2026-03' }
    });
    assert(res.status === 200, 'Get total returns 200');
  });

  if (createdEmpleadoId) {
    await test('NOMINA - Create', async () => {
      const res = await api.post('/nomina', {
        empleadoId: createdEmpleadoId,
        fecha: '2026-03-30',
        diasTrabajados: 30,
        horasExtras: 0,
        abonosPrestamo: 0
      }).catch(e => {
        console.log('  [DEBUG] NOMINA Error:', JSON.stringify(e.response?.data, null, 2));
        console.log('  [DEBUG] Status:', e.response?.status);
        throw e;
      });
      console.log('  [DEBUG] NOMINA Response status:', res.status);
      console.log('  [DEBUG] NOMINA Response:', JSON.stringify(res.data, null, 2));
      assert(res.status === 201, 'Create returns 201');
    });
  }

  // ─────────────────────────────────────────────
  // PRESTAMOS TESTS
  // ─────────────────────────────────────────────
  await test('PRESTAMOS - List', async () => {
    const res = await api.get('/prestamos');
    assert(res.status === 200, 'List returns 200');
  });

  // ─────────────────────────────────────────────
  // FACTURAS TESTS
  // ─────────────────────────────────────────────
  await test('FACTURAS - List', async () => {
    const res = await api.get('/facturas');
    assert(res.status === 200, 'List returns 200');
    assert(Array.isArray(res.data.data), 'Returns array');
  });

  // ─────────────────────────────────────────────
  // REPORTES TESTS
  // ─────────────────────────────────────────────
  await test('REPORTES - Ventas por Cliente', async () => {
    const res = await api.get('/reportes/ventas-por-cliente', {
      params: { desde: '2026-01-01', hasta: '2026-12-31' }
    });
    assert(res.status === 200, 'Get ventas returns 200');
    assert(res.data?.data !== undefined, 'Response has data');
  });

  await test('REPORTES - Pedidos Activos', async () => {
    const res = await api.get('/reportes/pedidos-activos');
    assert(res.status === 200, 'Get pedidos activos returns 200');
  });

  await test('REPORTES - Pagos Decoradoras', async () => {
    const res = await api.get('/reportes/pagos-decoradoras');
    assert(res.status === 200, 'Get pagos decoradoras returns 200');
  });

  await test('REPORTES - Nomina del Mes', async () => {
    const res = await api.get('/reportes/nomina-mes', {
      params: { mes: '2026-03' }
    });
    assert(res.status === 200, 'Get nomina returns 200');
    assert(res.data?.data?.nominas !== undefined, 'Response has nominas array');
  });

  // ─────────────────────────────────────────────
  // PARAMETRIZACION TESTS
  // ─────────────────────────────────────────────
  await test('PARAMETRIZACION - Get', async () => {
    const res = await api.get('/parametrizacion');
    assert(res.status === 200, 'Get returns 200');
    assert(res.data?.data?.nombre !== undefined, 'Response has empresa data');
  });

  await test('PARAMETRIZACION - Update', async () => {
    const res = await api.patch('/parametrizacion', {
      telefono: '3001234567'
    });
    assert(res.status === 200, 'Update returns 200');
  });

  // ─────────────────────────────────────────────
  // DESPACHOS TESTS
  // ─────────────────────────────────────────────
  await test('DESPACHOS - List', async () => {
    const res = await api.get('/despachos');
    console.log('  [DEBUG] Despachos response:', JSON.stringify(res.data, null, 2));
    assert(res.status === 200, 'List returns 200');
  });

  // ─────────────────────────────────────────────
  // ERROR HANDLING TESTS
  // ─────────────────────────────────────────────
  await test('ERROR - Invalid Login', async () => {
    try {
      await api.post('/auth/login', {
        correo: 'invalid@test.com',
        password: 'wrongpassword'
      });
      assert(false, 'Should throw error');
    } catch (error) {
      assert(error.response?.status === 401, 'Returns 401 for invalid credentials');
    }
  });

  await test('ERROR - Unauthorized Access', async () => {
    const tempToken = token;
    token = 'invalid-token';
    try {
      await api.get('/usuarios');
      assert(false, 'Should throw error');
    } catch (error) {
      assert(error.response?.status === 401, 'Returns 401 for invalid token');
    } finally {
      token = tempToken;
    }
  });

  // ─────────────────────────────────────────────
  // AUTH - LOGOUT (final)
  // ─────────────────────────────────────────────
  await test('AUTH - Logout (Final)', async () => {
    const res = await api.post('/auth/logout');
    assert(res.status === 200, 'Logout returns 200');
  });

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  TEST SUMMARY');
  console.log('========================================');
  console.log(`\nPassed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Total:  ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed tests:');
    testResults.errors.forEach(err => console.log(`  - ${err}`));
  }
  
  console.log('\n========================================\n');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
