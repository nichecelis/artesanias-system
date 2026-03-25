import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('debería mostrar la página de login', async ({ page }) => {
    await expect(page.locator('text=Iniciar sesión')).toBeVisible({ timeout: 15000 });
  });

  test('debería mostrar el título de la aplicación', async ({ page }) => {
    await expect(page.locator('text=Artesanías SaaS')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener campo de correo electrónico', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener campo de contraseña', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('debería tener botón de entrar', async ({ page }) => {
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar error con correo inválido', async ({ page }) => {
    await page.fill('input[type="email"]', 'correo-invalido');
    await page.click('button:has-text("Entrar")');
    await expect(page.locator('text=Correo inválido')).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar error sin contraseña', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.click('button:has-text("Entrar")');
    await expect(page.locator('text=Contraseña requerida')).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar/ocultar contraseña', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    await page.click('button:has([data-testid="eye-icon"])');
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});

test.describe('Navegación - Sin autenticarse', () => {
  test('debería redirigir al login al acceder a dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('debería redirigir al login al acceder a pedidos', async ({ page }) => {
    await page.goto('/pedidos');
    await expect(page).toHaveURL(/.*login/);
  });

  test('debería redirigir al login al acceder a clientes', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page).toHaveURL(/.*login/);
  });
});