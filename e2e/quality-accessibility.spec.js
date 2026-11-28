import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const rutas = [
  '/login/index.html',
  '/cajera/registrar-pedido.html',
  '/cajera/emitir-comprobante.html',
  '/cajera/consultar-pedidos.html',
  '/cocina/pedidos.html',
  '/cocina/disponibilidad.html',
  '/admin/index.html',
  '/admin/usuarios.html',
  '/admin/productos.html',
  '/admin/devoluciones.html',
  '/admin/reportes.html'
];

function resumir(violaciones) {
  return violaciones.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    elementos: nodes.map((node) => node.target.join(' '))
  }));
}

test.describe('Accesibilidad automática WCAG 2.1 A/AA', () => {
  for (const ruta of rutas) {
    test(`${ruta} no presenta violaciones serias o críticas`, async ({ page }) => {
      await page.route('http://127.0.0.1:4173/**/*.js', (route) => route.abort());
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });

      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const bloqueantes = resultado.violations.filter(({ impact }) =>
        impact === 'serious' || impact === 'critical'
      );

      expect(bloqueantes, JSON.stringify(resumir(bloqueantes), null, 2)).toEqual([]);
    });
  }
});
