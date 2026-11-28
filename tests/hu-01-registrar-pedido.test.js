import { describe, expect, it } from 'vitest';
import {
  calcularTotalPedido,
  crearBorradorPedido,
  esCantidadValida,
  esDetalleValido,
  esModalidadPagoValida,
  esPagoHibridoValido,
  esProductoDisponible,
  validarBorradorPedido
} from '../public/shared/pedido-rules.js';

const producto = { id: 'p1', nombre: 'Hamburguesa', precio: 15, tipo: 'Con preparación', disponible: true };
const item = (cantidad = 1, datos = producto) => ({ producto: datos, cantidad });

describe('HU-01 Registrar pedido', () => {
  it('CP-HU01-01 | CA01 permite disponibles y rechaza no disponibles', () => {
    expect(esProductoDisponible(producto)).toBe(true);
    expect(esProductoDisponible({ ...producto, disponible: false })).toBe(false);
  });

  it('CP-HU01-02 | CA02 rechaza un pedido sin productos', () => {
    expect(validarBorradorPedido({ productos: [], modalidadPago: 'Efectivo' }).errores).toContain('SIN_PRODUCTOS');
  });

  it('CP-HU01-03 | CA03 acepta cantidades 1 y 10, pero rechaza 0 y 11', () => {
    expect(esCantidadValida(1)).toBe(true);
    expect(esCantidadValida(10)).toBe(true);
    expect(esCantidadValida(0)).toBe(false);
    expect(esCantidadValida(11)).toBe(false);
  });

  it('CP-HU01-04 | CA04 acepta detalle opcional hasta 300 caracteres', () => {
    expect(esDetalleValido('')).toBe(true);
    expect(esDetalleValido('a'.repeat(300))).toBe(true);
    expect(esDetalleValido('a'.repeat(301))).toBe(false);
  });

  it('CP-HU01-05 | CA05 calcula precio por cantidad y redondea', () => {
    expect(calcularTotalPedido([item(2), item(1, { ...producto, id: 'p2', precio: 4.505 })])).toBe(34.51);
  });

  it('CP-HU01-06 | CA06 acepta solo las cinco modalidades definidas', () => {
    for (const modalidad of ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Híbrido']) {
      expect(esModalidadPagoValida(modalidad)).toBe(true);
    }
    expect(esModalidadPagoValida('Tarjeta')).toBe(false);
  });

  it('CP-HU01-07 | CA07 exige dos medios y suma híbrida exacta', () => {
    expect(esPagoHibridoValido(15, { efectivo: 10, yape: 5 })).toBe(true);
    expect(esPagoHibridoValido(15, { efectivo: 15 })).toBe(false);
    expect(esPagoHibridoValido(15, { efectivo: 10, yape: 4 })).toBe(false);
  });

  it('CP-HU01-08 | CA08 registra la modalidad declarada sin verificación externa', () => {
    const borrador = crearBorradorPedido({ carrito: [item()], modalidadPago: 'Yape' });
    expect(borrador.modalidadPago).toBe('Yape');
  });

  it('CP-HU01-09 | CA09 rechaza campos obligatorios incompletos', () => {
    const resultado = validarBorradorPedido({ productos: [item()], modalidadPago: '' });
    expect(resultado.valido).toBe(false);
    expect(resultado.errores).toContain('MODALIDAD_INVALIDA');
  });

  it('CP-HU01-10 | CA10 crea el borrador con total, pago y estado inicial', () => {
    const borrador = crearBorradorPedido({ carrito: [item(2)], detalle: 'Sin cebolla', modalidadPago: 'Efectivo' });
    expect(borrador).toMatchObject({ total: 30, modalidadPago: 'Efectivo', estadoGeneral: 'Pendiente' });
    expect(borrador.productos[0]).toMatchObject({ id: 'p1', cantidad: 2, estado: 'Pendiente' });
  });
});
