import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar la página de login', async ({ page }) => {
    await expect(page.locator('text=Iniciar sesión')).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar el título de la aplicación', async ({ page }) => {
    await expect(page.locator('text=Artesanías SaaS')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener campo de correo electrónico', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('debería tener campo de contraseña', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
  });

  test('debería tener botón de entrar', async ({ page }) => {
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible({ timeout: 5000 });
  });

  test('debería validar que el campo correo sea requerido', async ({ page }) => {
    await page.click('button:has-text("Entrar")');
    await expect(page.locator('text=Correo inválido')).toBeVisible({ timeout: 5000 });
  });

  test('debería validar que la contraseña sea requerida', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.click('button:has-text("Entrar")');
    await expect(page.locator('text=Contraseña requerida')).toBeVisible({ timeout: 5000 });
  });

  test('debería iniciar sesión con credenciales válidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 20000 });
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navegación sin autenticación', () => {
  test('debería redirigir dashboard al login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('debería redirigir pedidos al login', async ({ page }) => {
    await page.goto(`${BASE_URL}/pedidos`);
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });
});

test.describe('Dashboard autenticado', () => {
  test('debería mostrar sidebar con navegación después de login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 20000 });
    
    await expect(page.locator('aside')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Pedidos')).toBeVisible({ timeout: 5000 });
  });

  test('debería navegar a Configuración', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 20000 });
    
    await page.click('text=Configuración');
    await page.waitForURL(/.*parametrizacion/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Configuración de Empresa' })).toBeVisible({ timeout: 10000 });
  });

  test('debería cerrar sesión', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@artesanias.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/.*dashboard/, { timeout: 20000 });
    
    await page.click('text=Cerrar sesión');
    await page.waitForURL(/.*login/, { timeout: 15000 });
  });
});