import { expect, test } from '@playwright/test';

async function iniciarSesion(page, identificador, password, rutaEsperada) {
  await page.goto('/login/index.html');
  await page.locator('#identifier').fill(identificador);
  await page.locator('#password').fill(password);
  await page.locator('#login-form [type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${rutaEsperada.replaceAll('/', '\\/')}(?:\\?.*)?$`), { timeout: 20000 });
  await expect(page.locator('html')).toHaveAttribute('data-auth-ready', 'true', { timeout: 20000 });
}

async function establecerBorrador(page, borrador) {
  await page.goto('/cajera/registrar-pedido.html');
  await page.evaluate((datos) => sessionStorage.setItem('pedidoBorrador', JSON.stringify(datos)), borrador);
  await page.goto('/cajera/emitir-comprobante.html');
}

function borradorHamburguesa({ cantidad = 1, modalidadPago = 'Efectivo', pagosHibridos = {} } = {}) {
  return {
    productos: [{
      id: 'hamburguesa-clasica', nombre: 'Hamburguesa Clásica', precio: 15,
      tipo: 'Con preparación', cantidad, estado: 'Pendiente'
    }],
    detalle: '',
    total: cantidad * 15,
    modalidadPago,
    pagoHibridoEfectivo: pagosHibridos.efectivo || 0,
    pagoHibridoYape: pagosHibridos.yape || 0,
    pagoHibridoPlin: pagosHibridos.plin || 0,
    pagoHibridoTransferencia: pagosHibridos.transferencia || 0
  };
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

    const filaReposicion = cajera.locator('#pedidos-tbody tr').filter({
      has: cajera.locator('.badge').filter({ hasText: /^REPOSICIÓN$/ })
    });
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
    const filaReposicion = cajera.locator('#pedidos-tbody tr').filter({
      has: cajera.locator('.badge').filter({ hasText: /^REPOSICIÓN$/ })
    });
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

  test('catálogo en tiempo real: administración gestiona y cocina cambia disponibilidad para caja', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const cocinaContext = await browser.newContext();
    const cajeraContext = await browser.newContext();
    const admin = await adminContext.newPage();
    const cocina = await cocinaContext.newPage();
    const cajera = await cajeraContext.newPage();

    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/productos.html');
    await expect(admin.locator('#stat-total')).toHaveText('2', { timeout: 20000 });

    await admin.locator('#btn-abrir-crear').click();
    await admin.locator('#crear-nombre').fill('Papas E2E');
    await admin.locator('#crear-precio').fill('7.50');
    await admin.locator('input[name="crear-tipo"][value="Servicio inmediato"]').check();
    await expect(admin.locator('#crear-nombre-feedback')).toContainText('Nombre disponible');
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.locator('#btn-submit-crear').click();

    let filaProducto = admin.locator('#productos-tbody tr', { hasText: 'Papas E2E' });
    await expect(filaProducto).toContainText('S/ 7.50', { timeout: 20000 });
    await expect(filaProducto).toContainText('Servicio inmediato');
    await expect(filaProducto).toContainText('Disponible');
    await expect(admin.locator('#stat-total')).toHaveText('3');

    await filaProducto.locator('.btn-editar').click();
    await admin.locator('#editar-nombre').fill('Papas E2E Grandes');
    await admin.locator('#editar-precio').fill('8.00');
    await expect(admin.locator('#editar-tipo-badge')).toContainText('Servicio inmediato');
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.locator('#btn-submit-editar').click();
    filaProducto = admin.locator('#productos-tbody tr', { hasText: 'Papas E2E Grandes' });
    await expect(filaProducto).toContainText('S/ 8.00', { timeout: 20000 });

    await iniciarSesion(cocina, 'cocina01', 'Cocina123!', '/cocina/pedidos.html');
    await cocina.goto('/cocina/disponibilidad.html');
    const filaCocina = cocina.locator('#productos-tbody tr', { hasText: 'Papas E2E Grandes' });
    await expect(filaCocina).toContainText('Disponible', { timeout: 20000 });

    await iniciarSesion(cajera, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');
    const tarjetaCaja = cajera.locator('#productos-grid .product-card', { hasText: 'Papas E2E Grandes' });
    await expect(tarjetaCaja).toBeVisible({ timeout: 20000 });
    await expect(tarjetaCaja).not.toHaveClass(/disabled/);

    await filaCocina.getByRole('button', { name: 'Marcar No Disponible' }).click();
    await expect(filaCocina).toContainText('No disponible');
    await expect(tarjetaCaja).toHaveClass(/disabled/, { timeout: 20000 });
    await expect(tarjetaCaja).toContainText('No disponible');
    await expect(filaProducto).toContainText('No disponible');

    await filaCocina.getByRole('button', { name: 'Marcar Disponible' }).click();
    await expect(filaCocina).toContainText('Disponible');
    await expect(tarjetaCaja).not.toHaveClass(/disabled/, { timeout: 20000 });

    await filaProducto.locator('.btn-eliminar').click();
    await expect(admin.locator('#eliminar-nombre-display')).toHaveText('Papas E2E Grandes');
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.locator('#btn-confirmar-eliminar').click();
    await expect(filaProducto).toHaveCount(0, { timeout: 20000 });
    await expect(filaCocina).toHaveCount(0, { timeout: 20000 });
    await expect(tarjetaCaja).toHaveCount(0, { timeout: 20000 });
    await expect(admin.locator('#stat-total')).toHaveText('2');

    await adminContext.close();
    await cocinaContext.close();
    await cajeraContext.close();
  });

  test('reportes administrativos: reconcilia venta, devolución, neto e incidencias del día', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();

    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/reportes.html');

    await expect(admin.locator('#kpi-ventas-totales')).toHaveText('S/ 15.00', { timeout: 20000 });
    await expect(admin.locator('#kpi-devoluciones')).toHaveText('S/ 15.00');
    await expect(admin.locator('#kpi-devoluciones-conteo')).toContainText('1 reembolsos realizados');
    await expect(admin.locator('#kpi-monto-neto')).toHaveText('S/ 0.00');
    await expect(admin.locator('#kpi-total-pedidos')).toHaveText('2');
    await expect(admin.locator('#pay-efectivo-detail')).toContainText('Bruto: S/ 15.00');
    await expect(admin.locator('#lista-pedidos-incidencias')).toContainText('B001-000001');
    await expect(admin.locator('#lista-pedidos-incidencias')).toContainText('Hamburguesa Clásica');

    await admin.locator('#tab-btn-incidencias').click();
    await expect(admin.locator('#panel-incidencias')).toBeVisible();
    await expect(admin.locator('#conteo-reposiciones')).toContainText('1 reposiciones');
    await expect(admin.locator('#conteo-devoluciones')).toContainText('1 devoluciones');
    await expect(admin.locator('#reposiciones-tbody')).toContainText('Hamburguesa Clásica');
    await expect(admin.locator('#motivos-lista-container')).toContainText('Producto en mal estado');

    await admin.locator('#devoluciones-reporte-tbody .btn-ver-voucher').click();
    await expect(admin.locator('#modal-visor')).toBeVisible();
    await expect(admin.locator('#visor-meta')).toContainText('S/ 15.00');
    await expect(admin.locator('#visor-content iframe')).toBeVisible();
    await expect(admin.locator('#btn-descargar-voucher')).toHaveAttribute('download', 'voucher-prueba.pdf');

    await adminContext.close();
  });

  test('usuarios operativos: elimina con cierre forzado y crea una cuenta sin guardar contraseña', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const cajeraContext = await browser.newContext();
    const admin = await adminContext.newPage();
    const cajera = await cajeraContext.newPage();

    await iniciarSesion(cajera, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');
    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/usuarios.html');
    await expect(admin.locator('#stat-activas')).toHaveText('2 / 2', { timeout: 20000 });

    await admin.locator('#acciones-cajera .btn-abrir-eliminar').click();
    await expect(admin.locator('#eliminar-usuario-txt')).toHaveText('@cajera01');
    await admin.locator('#eliminar-password').fill('Cajera123!');
    cajera.once('dialog', (dialog) => dialog.accept());
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.locator('#btn-confirmar-eliminar').click();

    await expect(admin.locator('#stat-activas')).toHaveText('1 / 2', { timeout: 20000 });
    await expect(cajera).toHaveURL(/\/login\/index\.html$/, { timeout: 20000 });
    await cajera.locator('#identifier').fill('cajera01');
    await cajera.locator('#password').fill('Cajera123!');
    await cajera.locator('#login-form [type="submit"]').click();
    await expect(cajera.locator('#error-msg')).toHaveText('Credenciales inválidas.');

    await admin.locator('#acciones-cajera .btn-crear-rol-directo').click();
    await admin.locator('#crear-usuario-nombre').fill('cajerae2e');
    await admin.locator('#crear-usuario-password').fill('CajaE2E123!');
    await expect(admin.locator('#hint-usuario-status')).toContainText('disponible', { timeout: 20000 });
    await expect(admin.locator('#btn-confirmar-crear')).toBeEnabled();
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.locator('#btn-confirmar-crear').click();

    await expect(admin.locator('#stat-activas')).toHaveText('2 / 2', { timeout: 20000 });
    await expect(admin.locator('#usuarios-tbody')).toContainText('@cajerae2e');
    const tokenAdmin = await admin.evaluate(async () => {
      const { auth } = await import('../shared/firebase-config.js');
      return auth.currentUser.getIdToken();
    });
    const documento = await admin.request.get(
      'http://127.0.0.1:8085/v1/projects/demo-burger-local/databases/(default)/documents/usuarios/cajera',
      { headers: { Authorization: `Bearer ${tokenAdmin}` } }
    );
    expect(documento.ok()).toBe(true);
    const datosDocumento = await documento.json();
    expect(datosDocumento.fields).not.toHaveProperty('password');

    await iniciarSesion(cajera, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');
    await expect(cajera.locator('#current-user')).toHaveText('cajerae2e');

    await admin.goto('/admin/reportes.html');
    await expect(admin.locator('#lista-pedidos-incidencias')).toContainText('B001-000001', { timeout: 20000 });

    await adminContext.close();
    await cajeraContext.close();
  });

  test('sesión única: un segundo acceso expulsa al dispositivo anterior', async ({ browser }) => {
    const primerContexto = await browser.newContext();
    const segundoContexto = await browser.newContext();
    const primeraSesion = await primerContexto.newPage();
    const segundaSesion = await segundoContexto.newPage();

    await iniciarSesion(primeraSesion, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');
    primeraSesion.once('dialog', (dialog) => dialog.accept());
    await iniciarSesion(segundaSesion, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');

    await expect(primeraSesion).toHaveURL(/\/login\/index\.html$/, { timeout: 20000 });
    await expect(segundaSesion).toHaveURL(/\/cajera\/registrar-pedido\.html$/);

    await primerContexto.close();
    await segundoContexto.close();
  });

  test('modalidades de pago: simples e híbrida exacta se validan en la interfaz', async ({ browser }) => {
    const contexto = await browser.newContext();
    const cajera = await contexto.newPage();
    await iniciarSesion(cajera, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');

    const producto = cajera.locator('#productos-grid .product-card', { hasText: 'Hamburguesa Clásica' });
    await expect(producto).toBeVisible({ timeout: 20000 });
    await producto.click();

    for (const modalidad of ['Efectivo', 'Yape', 'Plin', 'Transferencia']) {
      await cajera.locator('#modalidad-pago').selectOption(modalidad);
      await expect(cajera.locator('#btn-registrar')).toBeEnabled();
    }

    await cajera.locator('#modalidad-pago').selectOption('Híbrido');
    await cajera.locator('#hibrido-efectivo').fill('5');
    await cajera.locator('#hibrido-yape').fill('5');
    await expect(cajera.locator('#btn-registrar')).toBeDisabled();
    await expect(cajera.locator('#hibrido-feedback')).toContainText('Falta ingresar: S/ 5.00');
    await cajera.locator('#hibrido-yape').fill('10');
    await expect(cajera.locator('#hibrido-feedback')).toContainText('Monto exacto cubierto');
    await expect(cajera.locator('#btn-registrar')).toBeEnabled();

    await contexto.close();
  });

  test('comprobantes: boleta con DNI y factura con RUC usan proveedor simulado', async ({ browser }) => {
    const contexto = await browser.newContext();
    await contexto.addInitScript(() => { window.print = () => {}; });
    const cajera = await contexto.newPage();
    await cajera.route('https://script.google.com/**', async (route) => {
      const url = new URL(route.request().url());
      const tipo = url.searchParams.get('tipo');
      const numero = url.searchParams.get('numero');
      if (tipo === 'dni') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          nombres: 'ANA', apellidoPaterno: 'PEREZ', apellidoMaterno: 'LOPEZ'
        }) });
      } else if (numero === '20111111111') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          razonSocial: 'EMPRESA INACTIVA SAC', direccion: 'TRUJILLO', estado: 'BAJA', condicion: 'HABIDO'
        }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          razonSocial: 'EMPRESA E2E SAC', direccion: 'AV. PRUEBAS 123', estado: 'ACTIVO', condicion: 'HABIDO'
        }) });
      }
    });

    await iniciarSesion(cajera, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');
    await establecerBorrador(cajera, borradorHamburguesa({ modalidadPago: 'Yape' }));
    await cajera.locator('#tipo-boleta').selectOption('con-dni');
    await cajera.locator('#dni-cliente').fill('12345678');
    await cajera.locator('#btn-buscar-dni').click();
    await expect(cajera.locator('#nombre-cliente')).toHaveValue('ANA PEREZ LOPEZ');
    await cajera.locator('#btn-emitir').click();
    await expect(cajera).toHaveURL(/\/cajera\/comprobante\.html\?id=.+/, { timeout: 20000 });
    await expect(cajera.locator('#ticket-content')).toContainText('ANA PEREZ LOPEZ');
    await expect(cajera.locator('#ticket-content')).toContainText('12345678');

    await establecerBorrador(cajera, borradorHamburguesa({ modalidadPago: 'Transferencia' }));
    await cajera.locator('input[name="tipo-comprobante"][value="Factura"]').check();
    await cajera.locator('#ruc-cliente').fill('20111111111');
    cajera.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('BAJA');
      await dialog.accept();
    });
    await cajera.locator('#btn-buscar-ruc').click();
    await expect(cajera.locator('#btn-emitir')).toBeDisabled();

    await cajera.locator('#ruc-cliente').fill('20123456789');
    await cajera.locator('#btn-buscar-ruc').click();
    await expect(cajera.locator('#razon-social')).toHaveValue('EMPRESA E2E SAC');
    await expect(cajera.locator('#domicilio-fiscal')).toHaveValue('AV. PRUEBAS 123');
    await cajera.locator('#btn-emitir').click();
    await expect(cajera.locator('#ticket-content')).toContainText('F001-000001', { timeout: 20000 });
    await expect(cajera.locator('#ticket-content')).toContainText('EMPRESA E2E SAC');

    await contexto.close();
  });

  test('boleta mayor a S/ 700 obliga a identificar al cliente', async ({ browser }) => {
    const contexto = await browser.newContext();
    const cajera = await contexto.newPage();
    await iniciarSesion(cajera, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');
    const borrador = borradorHamburguesa({ cantidad: 10 });
    borrador.productos[0].precio = 75;
    borrador.total = 750;
    await establecerBorrador(cajera, borrador);

    await expect(cajera.locator('#tipo-boleta option[value="simple"]')).toBeDisabled();
    await expect(cajera.locator('#tipo-boleta')).toHaveValue('con-dni');
    await expect(cajera.locator('#btn-emitir')).toBeDisabled();
    await contexto.close();
  });

  test('devolución parcial por transferencia genera nota tipo 07 y valida el voucher', async ({ browser }) => {
    const cajeraContext = await browser.newContext();
    const adminContext = await browser.newContext();
    await cajeraContext.addInitScript(() => { window.print = () => {}; });
    const cajera = await cajeraContext.newPage();
    const admin = await adminContext.newPage();

    await iniciarSesion(cajera, 'cajerae2e', 'CajaE2E123!', '/cajera/registrar-pedido.html');
    await establecerBorrador(cajera, borradorHamburguesa({ cantidad: 2, modalidadPago: 'Plin' }));
    await cajera.locator('#tipo-boleta').selectOption('simple');
    await cajera.locator('#btn-emitir').click();
    await expect(cajera).toHaveURL(/\/cajera\/comprobante\.html\?id=.+/, { timeout: 20000 });
    const pedidoId = new URL(cajera.url()).searchParams.get('id');
    const textoTicket = await cajera.locator('#ticket-content').innerText();
    const comprobante = textoTicket.match(/B001-\d{6}/)?.[0];
    expect(comprobante).toBeTruthy();

    await cajera.evaluate(async (id) => {
      const { db } = await import('../shared/firebase-config.js');
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js');
      await updateDoc(doc(db, 'pedidos', id), { estadoGeneral: 'Entregado' });
    }, pedidoId);

    await cajera.goto('/cajera/consultar-pedidos.html');
    const fila = cajera.locator('#pedidos-tbody tr').filter({
      has: cajera.locator(`button[data-id="${pedidoId}"]`)
    });
    await expect(fila).toContainText('Entregado', { timeout: 20000 });
    await fila.locator('.btn-abrir-dev').click();
    const item = cajera.locator('#dev-productos-container .dev-item', { hasText: 'Hamburguesa Clásica' });
    await item.locator('.dev-check').check();
    await expect(cajera.locator('#dev-monto-calculado')).toHaveText('S/ 15.00');
    await cajera.locator('#dev-motivo').selectOption('Producto incorrecto');

    await cajera.locator('#dev-modalidad').selectOption('Plin');
    await cajera.locator('#dev-telefono-billetera').fill('987654322');
    await cajera.locator('#dev-titular-billetera').fill('Cliente Parcial');
    await cajera.locator('#dev-cliente-nombre').fill('Cliente Parcial');
    await cajera.locator('#dev-cliente-telefono').fill('987654322');
    await expect(cajera.locator('#btn-confirmar-dev')).toBeEnabled();

    await cajera.locator('#dev-modalidad').selectOption('Transferencia');
    await cajera.locator('#dev-numero-cuenta').fill('1234567890');
    await cajera.locator('#dev-titular-transferencia').fill('Cliente Parcial');
    await expect(cajera.locator('#btn-confirmar-dev')).toBeEnabled();
    cajera.once('dialog', (dialog) => dialog.accept());
    await cajera.locator('#btn-confirmar-dev').click();
    await expect(cajera.locator('#modal-devolucion')).toBeHidden({ timeout: 20000 });

    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/devoluciones.html');
    const solicitud = admin.locator('#devoluciones-tbody tr', { hasText: 'Cliente Parcial' });
    await expect(solicitud).toContainText('S/ 15.00', { timeout: 20000 });
    await solicitud.locator('.btn-abrir-procesar').click();
    await expect(admin.locator('#btn-confirmar-procesar')).toBeDisabled();

    admin.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('800 KB');
      await dialog.accept();
    });
    await admin.locator('#input-archivo-comprobante').setInputFiles({
      name: 'voucher-grande.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(801 * 1024)
    });
    await expect(admin.locator('#btn-confirmar-procesar')).toBeDisabled();
    await admin.locator('#input-archivo-comprobante').setInputFiles({
      name: 'voucher-parcial.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF')
    });
    await expect(admin.locator('#btn-confirmar-procesar')).toBeEnabled();

    admin.once('dialog', (dialog) => dialog.accept());
    const notaPromise = admin.waitForEvent('popup');
    await admin.locator('#btn-confirmar-procesar').click();
    const nota = await notaPromise;
    await expect(nota.locator('#nc-content')).toBeVisible({ timeout: 20000 });
    await expect(nota.locator('#nc-meta-tipo-nota')).toContainText('07 - DEVOLUCIÓN POR ÍTEM');
    await expect(nota.locator('#nc-modifica-numero')).toHaveText(comprobante);
    await expect(nota.locator('#nc-total-importe')).toHaveText('15.00');

    await nota.close();
    await cajeraContext.close();
    await adminContext.close();
  });

  test('reportes valida rangos rápidos y rechaza fechas invertidas', async ({ browser }) => {
    const contexto = await browser.newContext();
    const admin = await contexto.newPage();
    await iniciarSesion(admin, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await admin.goto('/admin/reportes.html');
    await expect(admin.locator('#btn-aplicar-filtro')).toBeEnabled({ timeout: 20000 });

    await admin.locator('#btn-rango-7dias').click();
    await expect(admin.locator('#btn-aplicar-filtro')).toHaveText('🔍 Consultar');
    const rango7 = await admin.locator('#fecha-inicio, #fecha-fin').evaluateAll((inputs) => inputs.map((i) => i.value));
    expect(rango7[0] <= rango7[1]).toBe(true);

    await admin.locator('#btn-rango-mes').click();
    await expect(admin.locator('#btn-aplicar-filtro')).toHaveText('🔍 Consultar');
    await admin.locator('#fecha-inicio').fill('2026-11-28');
    await admin.locator('#fecha-fin').fill('2026-11-27');
    admin.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('inicio no puede ser posterior');
      await dialog.accept();
    });
    await admin.locator('#btn-aplicar-filtro').click();

    await contexto.close();
  });

  test('recuperación completa: cambia la clave y revoca la sesión administrativa anterior', async ({ browser }) => {
    const sesionAnteriorContext = await browser.newContext();
    const recuperacionContext = await browser.newContext();
    const sesionAnterior = await sesionAnteriorContext.newPage();
    const recuperacion = await recuperacionContext.newPage();

    await iniciarSesion(sesionAnterior, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');
    await recuperacion.goto('/login/index.html');
    await recuperacion.locator('#identifier').fill('admin@empresa.pe');
    await recuperacion.locator('#link-forgot-password').click();
    await recuperacion.locator('#reset-form').evaluate((form) => form.requestSubmit());
    await expect(recuperacion.locator('#reset-success-view')).toBeVisible();

    const codigosResponse = await recuperacion.request.get(
      'http://127.0.0.1:9099/emulator/v1/projects/demo-burger-local/oobCodes'
    );
    const codigos = await codigosResponse.json();
    const codigo = [...codigos.oobCodes].reverse().find((item) =>
      item.email === 'admin@empresa.pe' && item.requestType === 'PASSWORD_RESET'
    );
    expect(codigo?.oobCode).toBeTruthy();
    const cambio = await recuperacion.request.post(
      'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=demo-key',
      { data: { oobCode: codigo.oobCode, newPassword: 'AdminNueva123!' } }
    );
    expect(cambio.ok()).toBe(true);

    await sesionAnterior.reload();
    await expect(sesionAnterior).toHaveURL(/\/login\/index\.html$/, { timeout: 20000 });
    await recuperacion.goto('/login/index.html');
    await recuperacion.locator('#identifier').fill('admin@empresa.pe');
    await recuperacion.locator('#password').fill('Admin123!');
    await recuperacion.locator('#login-form [type="submit"]').click();
    await expect(recuperacion.locator('#error-msg')).toHaveText('Credenciales inválidas.');
    await iniciarSesion(recuperacion, 'admin@empresa.pe', 'AdminNueva123!', '/admin/index.html');

    await sesionAnteriorContext.close();
    await recuperacionContext.close();
  });
});
