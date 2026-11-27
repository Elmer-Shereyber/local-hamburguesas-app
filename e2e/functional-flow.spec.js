import { expect, test } from '@playwright/test';

async function iniciarSesion(page, identificador, password, rutaEsperada) {
  await page.goto('/login/index.html');
  await page.locator('#identifier').fill(identificador);
  await page.locator('#password').fill(password);
  await page.locator('#login-form [type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${rutaEsperada.replaceAll('/', '\\/')}(?:\\?.*)?$`), { timeout: 20000 });
}

test.describe.serial('E2E funcional autenticado con Firebase Emulator', () => {
  test('administrador inicia sesión, recupera contraseña y cierra sesión', async ({ browser }) => {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();

    await iniciarSesion(page, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await expect(page.locator('h1')).toContainText('Administrador');
    await page.locator('#btn-logout').click();
    await expect(page).toHaveURL(/\/login\/index\.html$/);

    await page.locator('#identifier').fill('admin@empresa.pe');
    await expect(page.locator('#forgot-password-container')).toBeVisible();
    await page.locator('#link-forgot-password').click();
    await expect(page.locator('#reset-email')).toHaveValue('admin@empresa.pe');
    await page.locator('#reset-form').evaluate((form) => form.requestSubmit());
    await expect(page.locator('#reset-success-view')).toBeVisible();
    await expect(page.locator('#reset-msg')).toContainText('Si el correo');

    await contexto.close();
  });

  test('rechaza credenciales incorrectas con un mensaje genérico', async ({ page }) => {
    await page.goto('/login/index.html');
    await page.locator('#identifier').fill('cajera01');
    await page.locator('#password').fill('incorrecta');
    await page.locator('#login-form [type="submit"]').click();
    await expect(page.locator('#error-msg')).toHaveText('Credenciales inválidas.');
    await expect(page).toHaveURL(/\/login\/index\.html$/);
  });

  test('cajera no puede abrir una ruta administrativa', async ({ browser }) => {
    const contexto = await browser.newContext();
    const page = await contexto.newPage();
    await iniciarSesion(page, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');

    await page.goto('/admin/index.html');
    await expect(page).toHaveURL(/\/cajera\/registrar-pedido\.html$/, { timeout: 20000 });
    await contexto.close();
  });

  test('pedido completo: caja registra, cocina prepara y caja entrega', async ({ browser }) => {
    const cajeraContext = await browser.newContext();
    const cocinaContext = await browser.newContext();
    await cajeraContext.addInitScript(() => { window.print = () => {}; });
    const cajera = await cajeraContext.newPage();
    const cocina = await cocinaContext.newPage();

    await iniciarSesion(cajera, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');
    const hamburguesa = cajera.locator('#productos-grid .product-card', { hasText: 'Hamburguesa Clásica' });
    await expect(hamburguesa).toBeVisible({ timeout: 20000 });
    await hamburguesa.click();
    await cajera.locator('#modalidad-pago').selectOption('Efectivo');
    await expect(cajera.locator('#total-monto')).toHaveText('S/ 15.00');
    await expect(cajera.locator('#btn-registrar')).toBeEnabled();
    await cajera.locator('#btn-registrar').click();

    await expect(cajera).toHaveURL(/\/cajera\/emitir-comprobante\.html$/);
    await cajera.locator('#tipo-boleta').selectOption('simple');
    await expect(cajera.locator('#btn-emitir')).toBeEnabled();
    await cajera.locator('#btn-emitir').click();
    await expect(cajera).toHaveURL(/\/cajera\/comprobante\.html\?id=.+/, { timeout: 20000 });
    await expect(cajera.locator('#ticket-content')).toContainText('B001-000001');
    await expect(cajera.locator('#ticket-content')).toContainText('Hamburguesa Clásica');

    await iniciarSesion(cocina, 'cocina01', 'Cocina123!', '/cocina/pedidos.html');
    const pedidoCocina = cocina.locator('#pedidos-container .order-card', { hasText: 'Hamburguesa Clásica' });
    await expect(pedidoCocina).toBeVisible({ timeout: 20000 });
    await pedidoCocina.getByRole('button', { name: 'Iniciar preparación' }).click();
    await expect(pedidoCocina).toContainText('En preparación');
    await pedidoCocina.getByRole('button', { name: 'Listo' }).click();
    await expect(pedidoCocina).toContainText('Listo');

    await cajera.goto('/cajera/consultar-pedidos.html');
    const fila = cajera.locator('#pedidos-tbody tr', { hasText: 'B001-000001' });
    await expect(fila).toContainText('Listo', { timeout: 20000 });
    await fila.getByRole('button', { name: /Entregar/ }).click();
    await expect(fila).toContainText('Entregado');

    await expect(pedidoCocina).toHaveCount(0, { timeout: 20000 });
    await cajeraContext.close();
    await cocinaContext.close();
  });
});
