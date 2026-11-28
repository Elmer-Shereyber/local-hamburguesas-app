// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

function pagina(ruta) {
  const html = readFileSync(resolve(process.cwd(), 'public', ruta), 'utf8');
  return new JSDOM(html).window.document;
}

function existe(documento, selector) {
  expect(documento.querySelector(selector), `Falta ${selector}`).not.toBeNull();
}

describe('Contratos DOM de las 15 HU', () => {
  it('HU-01 presenta catálogo, carrito, detalle de 300 caracteres y cinco modalidades', () => {
    const doc = pagina('cajera/registrar-pedido.html');
    existe(doc, '#productos-grid');
    existe(doc, '#carrito-container');
    expect(doc.querySelector('#detalle-pedido').maxLength).toBe(300);
    const modalidades = [...doc.querySelector('#modalidad-pago').options].map((o) => o.value).filter(Boolean);
    expect(modalidades).toEqual(['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Híbrido']);
    expect(doc.querySelectorAll('.hibrido-input')).toHaveLength(4);
    expect(doc.querySelector('#btn-registrar').disabled).toBe(true);
  });

  it('HU-02 ofrece una sola elección de comprobante y datos bloqueados del cliente', () => {
    const doc = pagina('cajera/emitir-comprobante.html');
    expect(doc.querySelectorAll('input[name="tipo-comprobante"]')).toHaveLength(2);
    expect(doc.querySelector('#dni-cliente').maxLength).toBe(8);
    expect(doc.querySelector('#ruc-cliente').maxLength).toBe(11);
    expect(doc.querySelector('#nombre-cliente').disabled || doc.querySelector('#nombre-cliente').readOnly).toBe(true);
    expect(doc.querySelector('#razon-social').disabled || doc.querySelector('#razon-social').readOnly).toBe(true);
    expect(doc.querySelector('#domicilio-fiscal').disabled || doc.querySelector('#domicilio-fiscal').readOnly).toBe(true);
    expect(doc.querySelector('#btn-emitir').disabled).toBe(true);
  });

  it('HU-03 permite buscar, ver detalle y contiene acciones separadas de incidencia', () => {
    const doc = pagina('cajera/consultar-pedidos.html');
    existe(doc, '#buscar-comprobante');
    existe(doc, '#modal-detalle');
    existe(doc, '#modal-reposicion');
    existe(doc, '#modal-devolucion');
    existe(doc, '#pedidos-tbody');
    existe(doc, '#pedidos-mobile-list');
  });

  it('HU-04 limita observación de reposición y exige motivo', () => {
    const doc = pagina('cajera/consultar-pedidos.html');
    expect(doc.querySelector('#repo-observacion').maxLength).toBe(250);
    expect(doc.querySelector('#repo-motivo').required).toBe(true);
    expect(doc.querySelector('#form-reposicion')).not.toBeNull();
    expect(doc.querySelector('#modal-reposicion').textContent).toContain('mismo producto');
  });

  it('HU-05 limita los datos de devolución según la modalidad', () => {
    const doc = pagina('cajera/consultar-pedidos.html');
    expect(doc.querySelector('#dev-observacion').maxLength).toBe(250);
    expect(doc.querySelector('#dev-telefono-billetera').maxLength).toBe(9);
    expect(doc.querySelector('#dev-numero-cuenta').maxLength).toBe(20);
    expect(doc.querySelector('#dev-cliente-telefono').maxLength).toBe(9);
    expect(doc.querySelectorAll('input[name="dev-tipo-cuenta"]')).toHaveLength(2);
  });

  it('HU-06 exige archivo PDF o imagen para procesar devolución', () => {
    const doc = pagina('admin/devoluciones.html');
    const archivo = doc.querySelector('#input-archivo-comprobante');
    expect(archivo.required).toBe(true);
    expect(archivo.accept).toBe('image/*,application/pdf');
    existe(doc, '#tab-btn-pendientes');
    existe(doc, '#tab-btn-procesadas');
    existe(doc, '#btn-confirmar-procesar');
  });

  it('HU-07 muestra tabla completa de disponibilidad a cocina', () => {
    const doc = pagina('cocina/disponibilidad.html');
    existe(doc, '#productos-table');
    existe(doc, '#productos-tbody');
    existe(doc, '#btn-logout');
  });

  it('HU-08 reserva un contenedor para la cola KDS', () => {
    const doc = pagina('cocina/pedidos.html');
    existe(doc, '#pedidos-container');
    existe(doc, '#loading-msg');
    existe(doc, 'meta[name="viewport"]');
  });

  it('HU-09 carga el controlador de estados como módulo', () => {
    const doc = pagina('cocina/pedidos.html');
    const modulo = [...doc.querySelectorAll('script[type="module"]')].find((s) => s.getAttribute('src') === 'pedidos.js');
    expect(modulo).toBeDefined();
  });

  it('HU-10 separa las cuentas de cajera y cocina y limita el usuario a 20 caracteres', () => {
    const doc = pagina('admin/usuarios.html');
    existe(doc, '#card-rol-cajera');
    existe(doc, '#card-rol-cocina');
    expect(doc.querySelector('#crear-usuario-nombre').maxLength).toBe(20);
    expect(doc.querySelector('#crear-usuario-password').type).toBe('password');
    expect(doc.querySelector('#crear-rol').type).toBe('hidden');
  });

  it('HU-11 mantiene el tipo fuera del formulario de edición', () => {
    const doc = pagina('admin/productos.html');
    expect(doc.querySelectorAll('input[name="crear-tipo"]')).toHaveLength(2);
    expect(doc.querySelectorAll('input[name="editar-tipo"]')).toHaveLength(0);
    existe(doc, '#editar-tipo-badge');
    expect(doc.querySelector('#crear-precio').type).toBe('number');
    expect(doc.querySelector('#editar-id').type).toBe('hidden');
  });

  it('HU-12 contiene filtro, pestañas, arqueo e incidencias', () => {
    const doc = pagina('admin/reportes.html');
    expect(doc.querySelector('#fecha-inicio').type).toBe('date');
    expect(doc.querySelector('#fecha-fin').type).toBe('date');
    existe(doc, '#tab-btn-ganancias');
    existe(doc, '#tab-btn-incidencias');
    existe(doc, '#kpi-ventas-totales');
    existe(doc, '#kpi-devoluciones');
    existe(doc, '#kpi-monto-neto');
    existe(doc, '#motivos-lista-container');
  });

  it('HU-13 no solicita rol y usa identificador y contraseña', () => {
    const doc = pagina('login/index.html');
    existe(doc, '#identifier');
    expect(doc.querySelector('#password').type).toBe('password');
    expect(doc.querySelectorAll('select[name="rol"], input[name="rol"]')).toHaveLength(0);
    expect(doc.querySelector('#login-form').querySelector('[type="submit"]')).not.toBeNull();
  });

  it('HU-14 expone cerrar sesión en todas las pantallas protegidas principales', () => {
    const protegidas = [
      'cajera/registrar-pedido.html', 'cajera/consultar-pedidos.html',
      'cocina/pedidos.html', 'cocina/disponibilidad.html',
      'admin/index.html', 'admin/usuarios.html', 'admin/productos.html',
      'admin/devoluciones.html', 'admin/reportes.html'
    ];
    for (const ruta of protegidas) existe(pagina(ruta), '#btn-logout');
  });

  it('HU-15 incluye recuperación por correo y vista de confirmación neutra', () => {
    const doc = pagina('login/index.html');
    existe(doc, '#link-forgot-password');
    expect(doc.querySelector('#reset-email').type).toBe('email');
    existe(doc, '#reset-success-view');
    expect(doc.querySelector('#reset-msg').textContent.toLowerCase()).toContain('si el correo');
  });

  it('todas las páginas operativas declaran viewport adaptable', () => {
    const rutas = [
      'login/index.html', 'cajera/registrar-pedido.html', 'cajera/emitir-comprobante.html',
      'cajera/consultar-pedidos.html', 'cocina/pedidos.html', 'cocina/disponibilidad.html',
      'admin/index.html', 'admin/usuarios.html', 'admin/productos.html',
      'admin/devoluciones.html', 'admin/reportes.html'
    ];
    for (const ruta of rutas) {
      const viewport = pagina(ruta).querySelector('meta[name="viewport"]');
      expect(viewport?.content).toContain('width=device-width');
    }
  });
});
