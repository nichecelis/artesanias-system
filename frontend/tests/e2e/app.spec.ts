import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
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
});

test.describe('Navegación sin autenticación', () => {
  test('debería redirigir dashboard al login', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/login|localhost:5173\/$/, { timeout: 10000 });
  });

  test('debería redirigir pedidos al login', async ({ page }) => {
    await page.goto('http://localhost:5173/pedidos');
    await expect(page).toHaveURL(/login|localhost:5173\/$/, { timeout: 10000 });
  });
});