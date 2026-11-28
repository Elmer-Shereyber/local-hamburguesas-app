import { expect, test } from '@playwright/test';

async function iniciarSesion(page, identificador, password, rutaEsperada) {
  await page.goto('/login/index.html');
  await page.locator('#identifier').fill(identificador);
  await page.locator('#password').fill(password);
  await page.locator('#login-form [type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${rutaEsperada.replaceAll('/', '\\/')}(?:\\?.*)?$`), {
    timeout: 20000
  });
  await expect(page.locator('html')).toHaveAttribute('data-auth-ready', 'true', { timeout: 20000 });
}

test.describe.serial('Concurrencia y consistencia con Firebase Emulator', () => {
  test('doce emisiones simultáneas generan correlativos únicos y consecutivos', async ({ page }) => {
    await iniciarSesion(page, 'admin@empresa.pe', 'Admin123!', '/admin/index.html');

    const resultado = await page.evaluate(async () => {
      const { getConfiguracion, incrementCorrelativo } = await import('../shared/db.js');
      const correlativos = await Promise.all(
        Array.from({ length: 12 }, () => incrementCorrelativo('Boleta'))
      );
      const configuracion = await getConfiguracion();
      return { correlativos, correlativoFinal: configuracion.correlativoBoleta };
    });

    expect([...resultado.correlativos].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, indice) => indice + 1)
    );
    expect(new Set(resultado.correlativos).size).toBe(12);
    expect(resultado.correlativoFinal).toBe(12);
  });

  test('dos reposiciones simultáneas dejan una sola incidencia completa', async ({ page }) => {
    await iniciarSesion(page, 'cajera01', 'Cajera123!', '/cajera/registrar-pedido.html');

    const resultado = await page.evaluate(async () => {
      const { getPedidoById, registrarPedido, registrarReposicion } = await import('../shared/db.js');
      const producto = {
        id: 'hamburguesa-clasica',
        nombre: 'Hamburguesa Clásica',
        precio: 15,
        tipo: 'Con preparación',
        cantidad: 1,
        estado: 'Entregado'
      };
      const pedidoBase = {
        codigo: '#CONC-01',
        comprobante: 'B001-CONC01',
        tipoComprobante: 'Boleta',
        productos: [producto],
        total: 15,
        modalidadPago: 'Efectivo',
        estadoGeneral: 'Entregado',
        tieneReposicion: false,
        tieneDevolucion: false
      };
      const pedidoId = await registrarPedido({ ...pedidoBase });
      const pedidoOriginal = { id: pedidoId, ...pedidoBase };
      const solicitud = {
        pedidoOriginal,
        productosReemplazo: [{ ...producto, estado: 'Pendiente' }],
        productosOriginalesAfectados: [{ id: producto.id, cantidad: 1 }],
        motivo: 'Producto en mal estado',
        observacion: 'Prueba concurrente',
        diferenciaTotal: 0,
        modalidadPago: 'Sin costo',
        datosHibrido: {}
      };

      const intentos = await Promise.allSettled([
        registrarReposicion(solicitud),
        registrarReposicion(solicitud)
      ]);
      const exitosos = intentos.filter((intento) => intento.status === 'fulfilled');
      const rechazados = intentos.filter((intento) => intento.status === 'rejected');
      const originalActualizado = await getPedidoById(pedidoId);
      const reposicion = exitosos.length === 1
        ? await getPedidoById(exitosos[0].value)
        : null;

      return {
        exitosos: exitosos.length,
        rechazados: rechazados.length,
        tieneReposicion: originalActualizado.tieneReposicion,
        reposicionesIds: originalActualizado.reposicionesIds || [],
        unidadesRepuestas: originalActualizado.productos?.[0]?.unidadesRepuestas || 0,
        reposicionOrigenId: reposicion?.pedidoOrigenId,
        reposicionEsReposicion: reposicion?.esReposicion
      };
    });

    expect(resultado).toMatchObject({
      exitosos: 1,
      rechazados: 1,
      tieneReposicion: true,
      unidadesRepuestas: 1,
      reposicionEsReposicion: true
    });
    expect(resultado.reposicionesIds).toHaveLength(1);
    expect(resultado.reposicionOrigenId).toBeTruthy();
  });
});
