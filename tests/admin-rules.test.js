import { describe, expect, it } from 'vitest';
import {
  calcularResumenVentas, emailOperativo, normalizarNombreProducto,
  passwordOperativaValida, puedeCrearRol, rangoFechasValido,
  resumenMotivos, usuarioOperativoValido, validarProducto
} from '../public/shared/admin-rules.js';

describe('HU-10 - Gestionar usuarios', () => {
  it.each([['abcd', true], ['Usuario20Caracteres', true], ['abc', false], ['usuario con espacio', false], ['usuario!', false]])('valida usuario %s', (valor, esperado) => {
    expect(usuarioOperativoValido(valor)).toBe(esperado);
  });
  it('exige contraseña mínima de seis caracteres', () => {
    expect(passwordOperativaValida('12345')).toBe(false);
    expect(passwordOperativaValida('123456')).toBe(true);
  });
  it('genera correo corporativo', () => expect(emailOperativo('Cajera1')).toBe('cajera1@burger.local'));
  it('permite como máximo una cuenta por rol', () => {
    expect(puedeCrearRol([{ rol: 'cajera' }], 'cajera')).toBe(false);
    expect(puedeCrearRol([{ rol: 'cajera' }], 'cocina')).toBe(true);
    expect(puedeCrearRol([], 'admin')).toBe(false);
  });
});

describe('HU-11 - Gestionar productos', () => {
  it('normaliza mayúsculas y espacios repetidos', () => expect(normalizarNombreProducto('  Hamburguesa   Royal ')).toBe('hamburguesa royal'));
  it('detecta duplicados normalizados', () => {
    const r = validarProducto({ nombre: ' hamburguesa   royal ', precio: 15, tipo: 'Con preparación' }, [{ id: '1', nombre: 'Hamburguesa Royal' }]);
    expect(r.errores).toContain('NOMBRE_DUPLICADO');
  });
  it('rechaza precio no positivo y tipo desconocido', () => {
    const r = validarProducto({ nombre: 'Producto', precio: 0, tipo: 'Otro' });
    expect(r.errores).toEqual(expect.arrayContaining(['PRECIO_INVALIDO', 'TIPO_INVALIDO']));
  });
  it('permite editar el mismo producto sin duplicarlo consigo mismo', () => {
    expect(validarProducto({ id: '1', nombre: 'Hamburguesa', precio: 16, tipo: 'Con preparación' }, [{ id: '1', nombre: 'Hamburguesa' }]).valido).toBe(true);
  });
});

describe('HU-12 - Reportes', () => {
  it('valida rangos de fechas', () => {
    expect(rangoFechasValido('2026-01-01', '2026-01-31')).toBe(true);
    expect(rangoFechasValido('2026-02-01', '2026-01-31')).toBe(false);
  });
  it('calcula ventas, pagos, productos, devoluciones y neto', () => {
    const pedidos = [
      { total: 20, modalidadPago: 'Efectivo', productos: [{ id: 'p1', nombre: 'Burger', cantidad: 1, precio: 20 }] },
      { total: 10, modalidadPago: 'Híbrido', pagoHibridoYape: 4, pagoHibridoPlin: 6, productos: [{ id: 'p1', nombre: 'Burger', cantidad: 1, precio: 10 }] }
    ];
    const devoluciones = [{ estado: 'Procesada', monto: 5, fechaProcesado: '2026-01-10T10:00:00' }];
    const r = calcularResumenVentas(pedidos, devoluciones, '2026-01-01', '2026-01-31');
    expect(r).toMatchObject({ ventasBrutas: 30, reembolsos: 5, neto: 25, pagos: { Efectivo: 20, Yape: 4, Plin: 6, Transferencia: 0 } });
    expect(r.productos[0]).toMatchObject({ id: 'p1', cantidad: 2, monto: 30 });
  });
  it('cuenta incidencias por motivo', () => {
    expect(resumenMotivos([{ motivo: 'Error' }, { motivo: 'Error' }, { motivo: 'Otro' }])).toEqual({ Error: 2, Otro: 1 });
  });
});
