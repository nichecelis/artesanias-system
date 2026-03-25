import { test, expect } from '@playwright/test';

test.describe('Login Exitoso', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('login con credenciales válidas debería redirigir al dashboard', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Entrar")');
    
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
  });

  test('después de login debería mostrar el nombre del usuario', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Entrar")');
    
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Administrador')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  });

  test('debería mostrar el título del Dashboard', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener navegación sidebar', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('text=Pedidos')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
  });

  test('debería poder navegar a Pedidos', async ({ page }) => {
    await page.click('text=Pedidos');
    await page.waitForURL(/.*pedidos/, { timeout: 10000 });
  });

  test('debería poder navegar a Clientes', async ({ page }) => {
    await page.click('text=Clientes');
    await page.waitForURL(/.*clientes/, { timeout: 10000 });
  });

  test('debería poder navegar a Productos', async ({ page }) => {
    await page.click('text=Productos');
    await page.waitForURL(/.*productos/, { timeout: 10000 });
  });

  test('debería poder navegar a Configuración', async ({ page }) => {
    await page.click('text=Configuración');
    await page.waitForURL(/.*parametrizacion/, { timeout: 10000 });
  });

  test('debería poder cerrar sesión', async ({ page }) => {
    await page.click('text=Cerrar sesión');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    expect(page.url()).toContain('login');
  });
});

test.describe('Páginas sin acceso', () => {
  test('usuarios solo visible para ADMINISTRADOR', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    
    await expect(page.locator('text=Usuarios')).toBeVisible();
  });

  test('debería redirigir rutas desconocidas', async ({ page }) => {
    await page.goto('/ruta-inexistente-12345');
    await expect(page.locator('text=404')).toBeVisible();
  });
});