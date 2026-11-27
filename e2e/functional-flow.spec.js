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

  test('reposición completa: caja registra, cocina prioriza y caja entrega sin costo', async ({ browser }) => {
    const cajeraContext = await browser.newContext();
    const cocinaContext = await browser.newContext();
    const cajera = await cajeraContext.newPage();
    const cocina = await cocinaContext.newPage();

    await iniciarSesion(cajera, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');
    await cajera.goto('/cajera/consultar-pedidos.html');
    const pedidoOriginal = cajera.locator('#pedidos-tbody tr', { hasText: 'B001-000001' });
    await expect(pedidoOriginal).toContainText('Entregado', { timeout: 20000 });
    await pedidoOriginal.locator('.btn-abrir-repo').click();

    const producto = cajera.locator('#repo-productos-container .repo-item', { hasText: 'Hamburguesa Clásica' });
    await producto.locator('.repo-check').check();
    await cajera.locator('#repo-motivo').selectOption('Error en la preparación');
    await expect(cajera.locator('#btn-confirmar-repo')).toBeEnabled();
    cajera.once('dialog', (dialog) => dialog.accept());
    await cajera.locator('#btn-confirmar-repo').click();
    await expect(cajera.locator('#modal-reposicion')).toBeHidden({ timeout: 20000 });
    await expect(pedidoOriginal).toContainText('Con reposición');

    await iniciarSesion(cocina, 'cocina01', 'Cocina123!', '/cocina/pedidos.html');
    const reposicionCocina = cocina.locator('#pedidos-container .order-card', { hasText: 'REPOSICIÓN' });
    await expect(reposicionCocina).toContainText('Hamburguesa Clásica', { timeout: 20000 });
    await reposicionCocina.getByRole('button', { name: 'Iniciar preparación' }).click();
    await reposicionCocina.getByRole('button', { name: 'Listo' }).click();
    await expect(reposicionCocina).toContainText('Listo');

    const filaReposicion = cajera.locator('#pedidos-tbody tr', { hasText: 'Reposición de #B001-000001' });
    await expect(filaReposicion).toContainText('S/ 0.00', { timeout: 20000 });
    await expect(filaReposicion).toContainText('Listo');
    await filaReposicion.getByRole('button', { name: /Entregar/ }).click();
    await expect(filaReposicion).toContainText('Entregado');
    await expect(filaReposicion.locator('.btn-abrir-repo')).toHaveCount(0);
    await expect(filaReposicion.locator('.btn-abrir-dev')).toBeVisible();

    await cajeraContext.close();
    await cocinaContext.close();
  });

  test('devolución de reposición: caja solicita y administración reembolsa con nota de crédito', async ({ browser }) => {
    const cajeraContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const cajera = await cajeraContext.newPage();
    const admin = await adminContext.newPage();

    await iniciarSesion(cajera, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');
    await cajera.goto('/cajera/consultar-pedidos.html');
    const filaReposicion = cajera.locator('#pedidos-tbody tr', { hasText: 'Reposición de #B001-000001' });
    await expect(filaReposicion).toContainText('Entregado', { timeout: 20000 });
    await filaReposicion.locator('.btn-abrir-dev').click();

    const producto = cajera.locator('#dev-productos-container .dev-item', { hasText: 'Hamburguesa Clásica' });
    await producto.locator('.dev-check').check();
    await expect(cajera.locator('#dev-monto-calculado')).toHaveText('S/ 15.00');
    await cajera.locator('#dev-motivo').selectOption('Producto en mal estado');
    await cajera.locator('#dev-modalidad').selectOption('Yape');
    await cajera.locator('#dev-telefono-billetera').fill('987654321');
    await cajera.locator('#dev-titular-billetera').fill('Cliente Prueba');
    await cajera.locator('#dev-cliente-nombre').fill('Cliente Prueba');
    await cajera.locator('#dev-cliente-telefono').fill('987654321');
    await expect(cajera.locator('#btn-confirmar-dev')).toBeEnabled();
    cajera.once('dialog', (dialog) => dialog.accept());
    await cajera.locator('#btn-confirmar-dev').click();
    await expect(cajera.locator('#modal-devolucion')).toBeHidden({ timeout: 20000 });
    await expect(filaReposicion).toContainText('Devolución solicitada');

    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/devoluciones.html');
    const solicitud = admin.locator('#devoluciones-tbody tr', { hasText: 'Cliente Prueba' });
    await expect(solicitud).toContainText('S/ 15.00', { timeout: 20000 });
    await solicitud.locator('.btn-abrir-procesar').click();
    await expect(admin.locator('#procesar-monto')).toHaveText('S/ 15.00');
    await admin.locator('#input-archivo-comprobante').setInputFiles({
      name: 'voucher-prueba.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% comprobante E2E\n%%EOF')
    });
    await expect(admin.locator('#preview-filename')).toHaveText('voucher-prueba.pdf');
    await expect(admin.locator('#btn-confirmar-procesar')).toBeEnabled();

    admin.once('dialog', (dialog) => dialog.accept());
    const notaPromise = admin.waitForEvent('popup');
    await admin.locator('#btn-confirmar-procesar').click();
    const nota = await notaPromise;
    await expect(nota).toHaveURL(/\/admin\/nota-credito\.html\?id=.+/, { timeout: 20000 });
    await expect(nota.locator('#nc-content')).toBeVisible({ timeout: 20000 });
    await expect(nota.locator('#nc-numero-serie')).toContainText('BC01');
    await expect(nota.locator('#nc-meta-tipo-nota')).toContainText('06 - DEVOLUCIÓN TOTAL');
    await expect(nota.locator('#nc-modifica-numero')).toHaveText('B001-000001');
    await expect(nota.locator('#nc-items-tbody')).toContainText('Hamburguesa Clásica');
    await expect(nota.locator('#nc-total-importe')).toContainText('15.00');

    await admin.bringToFront();
    await admin.locator('#tab-btn-procesadas').click();
    const procesada = admin.locator('#devoluciones-tbody tr', { hasText: 'Cliente Prueba' });
    await expect(procesada).toContainText('S/ 15.00');
    await expect(procesada.locator('.btn-ver-comprobante')).toBeVisible();

    await nota.close();
    await cajeraContext.close();
    await adminContext.close();
  });
});
