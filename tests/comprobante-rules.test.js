import { describe, expect, it } from 'vitest';
import {
  calcularDesgloseFactura, crearDatosCliente, empresaAptaParaFactura,
  esDniValido, esRucValido, generarNumeroComprobante,
  puedeEmitirBoletaSimple, validarEmision
} from '../public/shared/comprobante-rules.js';

describe('HU-02 - Emitir comprobante', () => {
  it.each([[699.99, true], [700, true], [700.01, false], [0, false]])('límite de boleta simple %s', (total, esperado) => {
    expect(puedeEmitirBoletaSimple(total)).toBe(esperado);
  });

  it.each([['12345678', true], ['1234567', false], ['1234567A', false], ['', false]])('valida DNI %s', (dni, esperado) => {
    expect(esDniValido(dni)).toBe(esperado);
  });

  it.each([['20123456789', true], ['2012345678', false], ['2012345678A', false]])('valida RUC %s', (ruc, esperado) => {
    expect(esRucValido(ruc)).toBe(esperado);
  });

  it('exige empresa activa y habida', () => {
    expect(empresaAptaParaFactura({ estado: 'ACTIVO', condicion: 'HABIDO' })).toBe(true);
    expect(empresaAptaParaFactura({ estado: 'BAJA', condicion: 'HABIDO' })).toBe(false);
    expect(empresaAptaParaFactura({ estado: 'ACTIVO', condicion: 'NO HABIDO' })).toBe(false);
  });

  it('desglosa correctamente IGV incluido', () => {
    expect(calcularDesgloseFactura(118)).toEqual({ valorVenta: 100, igv: 18, total: 118 });
  });

  it('genera serie y correlativo', () => {
    expect(generarNumeroComprobante('B001', 25)).toBe('B001-000025');
  });

  it('acepta boleta simple hasta S/ 700', () => {
    expect(validarEmision({ total: 700, tipoComprobante: 'Boleta', tipoBoleta: 'simple' })).toEqual({ valido: true, errores: [] });
  });

  it('rechaza boleta simple por encima de S/ 700', () => {
    expect(validarEmision({ total: 700.01, tipoComprobante: 'Boleta', tipoBoleta: 'simple' }).errores).toContain('BOLETA_SIMPLE_NO_PERMITIDA');
  });

  it('exige DNI validado y nombre para boleta con DNI', () => {
    const r = validarEmision({ total: 50, tipoComprobante: 'Boleta', tipoBoleta: 'con-dni', dni: '123', nombre: '' });
    expect(r.errores).toEqual(expect.arrayContaining(['DNI_INVALIDO', 'NOMBRE_NO_VALIDADO']));
  });

  it('exige datos completos para factura', () => {
    const r = validarEmision({ total: 118, tipoComprobante: 'Factura', ruc: '20123456789', razonSocial: '', domicilioFiscal: '' });
    expect(r.errores).toEqual(expect.arrayContaining(['RAZON_SOCIAL_NO_VALIDADA', 'DOMICILIO_NO_VALIDADO']));
  });

  it('crea cliente nulo para boleta simple', () => {
    expect(crearDatosCliente({ total: 20, tipoComprobante: 'Boleta', tipoBoleta: 'simple' })).toBeNull();
  });

  it('crea datos normalizados para factura', () => {
    expect(crearDatosCliente({ total: 118, tipoComprobante: 'Factura', ruc: '20123456789', razonSocial: ' Empresa SAC ', domicilioFiscal: ' Av. Uno ' })).toEqual({ ruc: '20123456789', razonSocial: 'Empresa SAC', direccion: 'Av. Uno' });
  });
});
