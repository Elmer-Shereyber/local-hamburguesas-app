import { expect, test } from '@playwright/test';

const paginas = [
  ['/login/index.html', '#login-form', /Iniciar Sesión/],
  ['/cajera/registrar-pedido.html', '#productos-grid', /Registrar Pedido/],
  ['/cajera/emitir-comprobante.html', '#btn-emitir', /Emitir Comprobante/],
  ['/cajera/consultar-pedidos.html', '#pedidos-table', /Consultar Pedidos/],
  ['/cocina/pedidos.html', '#pedidos-container', /Pedidos en Curso/],
  ['/cocina/disponibilidad.html', '#productos-table', /Disponibilidad/],
  ['/admin/index.html', 'nav', /Panel de Administración/],
  ['/admin/usuarios.html', '#card-rol-cajera', /Gestionar Usuarios/],
  ['/admin/productos.html', '#tabla-productos', /Gestionar Productos/],
  ['/admin/devoluciones.html', '#tabla-devoluciones', /Procesar Devoluciones/],
  ['/admin/reportes.html', '#panel-ganancias', /Ganancias e Incidencias/]
];

test.describe('E2E estático de rutas y estructura', () => {
  test.use({ javaScriptEnabled: false });

  for (const [ruta, selector, titulo] of paginas) {
    test(`${ruta} responde y conserva su estructura principal`, async ({ page }) => {
      const respuesta = await page.goto(ruta);
      expect(respuesta?.status()).toBe(200);
      await expect(page).toHaveTitle(titulo);
      await expect(page.locator(selector)).toHaveCount(1);
    });
  }

  for (const ancho of [375, 768, 1440]) {
    test(`las pantallas principales no desbordan el viewport de ${ancho}px`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      for (const ruta of ['/login/index.html', '/cajera/registrar-pedido.html', '/cocina/pedidos.html', '/admin/reportes.html']) {
        await page.goto(ruta);
        const medidas = await page.locator('html').evaluate((elemento) => ({
          scrollWidth: elemento.scrollWidth,
          clientWidth: elemento.clientWidth
        }));
        expect(medidas.scrollWidth, `${ruta} desborda a ${ancho}px`).toBeLessThanOrEqual(medidas.clientWidth + 1);
      }
    });
  }
});
