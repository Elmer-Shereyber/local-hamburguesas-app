import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateOrderState, formatCurrency, formatDateTime, generateOrderCode,
  getBadgeClass, normalizarTipo, numeroALetras, showAlert
} from '../public/shared/utils.js';

afterEach(() => vi.restoreAllMocks());

describe('formatCurrency', () => {
  it('formatea un número entero con dos decimales', () => {
    const resultado = formatCurrency(15);

    expect(resultado).toBe('S/ 15.00');
  });

  it('formatea un decimal agregando el cero faltante', () => {
    const resultado = formatCurrency(18.5);

    expect(resultado).toBe('S/ 18.50');
  });
});

describe('formatDateTime', () => {
  it('devuelve vacío cuando no recibe fecha', () => expect(formatDateTime(null)).toBe(''));
  it('utiliza la configuración regional peruana', () => {
    const spy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('27/11/2026, 13:00');
    expect(formatDateTime('2026-11-27T13:00:00')).toBe('27/11/2026, 13:00');
    expect(spy).toHaveBeenCalledWith('es-PE', expect.objectContaining({ day: '2-digit', month: '2-digit', year: 'numeric' }));
  });
});

describe('generateOrderCode', () => {
  it('genera código con almohadilla y cuatro caracteres mayúsculos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    expect(generateOrderCode()).toMatch(/^#[A-Z0-9]{4}$/);
  });
});

describe('calculateOrderState', () => {
  it.each([
    [[], 'Pendiente'],
    [[{ estado: 'Pendiente' }], 'Pendiente'],
    [[{ estado: 'En preparación' }, { estado: 'Pendiente' }], 'En preparación'],
    [[{ estado: 'Listo' }, { estado: 'Pendiente' }], 'En preparación'],
    [[{ estado: 'Listo' }, { estado: 'Listo' }], 'Listo']
  ])('calcula estado para %j', (productos, esperado) => expect(calculateOrderState(productos)).toBe(esperado));
});

describe('showAlert', () => {
  it('delega el mensaje al alert del navegador', () => {
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);
    showAlert('Aviso');
    expect(alert).toHaveBeenCalledWith('Aviso');
    vi.unstubAllGlobals();
  });
});

describe('getBadgeClass', () => {
  it.each([
    ['Pendiente', 'pendiente'], ['En preparación', 'preparacion'],
    ['En preparacion', 'preparacion'], ['Listo', 'listo'],
    ['Entregado', 'entregado'], ['Desconocido', ''], [null, '']
  ])('mapea %s', (estado, clase) => expect(getBadgeClass(estado)).toBe(clase));
});

describe('numeroALetras', () => {
  it.each([
    [0, 'CERO Y 00/100 SOLES'],
    [9, 'NUEVE Y 00/100 SOLES'],
    [15, 'QUINCE Y 00/100 SOLES'],
    [21, 'VEINTE Y UN Y 00/100 SOLES'],
    [100, 'CIEN Y 00/100 SOLES'],
    [101, 'CIENTO UN Y 00/100 SOLES'],
    [1000, 'MIL Y 00/100 SOLES'],
    [1250.5, 'MIL DOSCIENTOS CINCUENTA Y 50/100 SOLES']
  ])('convierte %s', (numero, texto) => expect(numeroALetras(numero)).toBe(texto));
  it('marca montos fuera de rango', () => expect(numeroALetras(1000000)).toBe('MONTO FUERA DE RANGO Y 00/100 SOLES'));
});

describe('normalizarTipo', () => {
  it.each([
    ['Servicio inmediato', 'Servicio inmediato'],
    ['SERVICIO INMEDIATO', 'Servicio inmediato'],
    ['inmediato', 'Servicio inmediato'],
    ['Con preparación', 'Con preparación'],
    [undefined, 'Con preparación']
  ])('normaliza %s', (tipo, esperado) => expect(normalizarTipo(tipo)).toBe(esperado));
});
