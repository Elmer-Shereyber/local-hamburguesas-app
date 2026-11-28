import { describe, expect, it } from 'vitest';
import {
  calcularDesgloseFactura,
  crearDatosCliente,
  empresaAptaParaFactura,
  esDniValido,
  esRucValido,
  esTipoComprobanteValido,
  generarNumeroComprobante,
  puedeEmitirBoletaSimple,
  validarEmision
} from '../public/shared/comprobante-rules.js';

describe('HU-02 Emitir comprobante de pago', () => {
  it('CP-HU02-01 | CA03 acepta exactamente boleta o factura', () => {
    expect(esTipoComprobanteValido('Boleta')).toBe(true);
    expect(esTipoComprobanteValido('Factura')).toBe(true);
    expect(esTipoComprobanteValido('Ticket')).toBe(false);
  });

  it('CP-HU02-02 | CA04 valida las dos variantes de boleta', () => {
    expect(validarEmision({ total: 15, tipoComprobante: 'Boleta', tipoBoleta: 'simple' }).valido).toBe(true);
    expect(validarEmision({ total: 15, tipoComprobante: 'Boleta', tipoBoleta: 'con-dni', dni: '12345678', nombre: 'Ana' }).valido).toBe(true);
  });

  it('CP-HU02-03 | CA05 y CA06 aplican el límite exacto de S/ 700', () => {
    expect(puedeEmitirBoletaSimple(700)).toBe(true);
    expect(puedeEmitirBoletaSimple(700.01)).toBe(false);
  });

  it('CP-HU02-04 | CA07 acepta DNI de ocho dígitos y rechaza formatos inválidos', () => {
    expect(esDniValido('12345678')).toBe(true);
    expect(esDniValido('1234567')).toBe(false);
    expect(esDniValido('1234567A')).toBe(false);
  });

  it('CP-HU02-05 | CA07 exige DNI y nombre validados', () => {
    const resultado = validarEmision({ total: 20, tipoComprobante: 'Boleta', tipoBoleta: 'con-dni', dni: '123', nombre: '' });
    expect(resultado.errores).toEqual(expect.arrayContaining(['DNI_INVALIDO', 'NOMBRE_NO_VALIDADO']));
  });

  it('CP-HU02-06 | CA05 crea una boleta simple sin datos del cliente', () => {
    expect(crearDatosCliente({ total: 20, tipoComprobante: 'Boleta', tipoBoleta: 'simple' })).toBeNull();
  });

  it('CP-HU02-07 | CA09 acepta RUC de once dígitos y empresa activa y habida', () => {
    expect(esRucValido('20123456789')).toBe(true);
    expect(esRucValido('2012345678')).toBe(false);
    expect(empresaAptaParaFactura({ estado: 'ACTIVO', condicion: 'HABIDO' })).toBe(true);
    expect(empresaAptaParaFactura({ estado: 'BAJA', condicion: 'HABIDO' })).toBe(false);
  });

  it('CP-HU02-08 | CA09 exige datos completos del comprador', () => {
    const resultado = validarEmision({ total: 118, tipoComprobante: 'Factura', ruc: '20123456789', razonSocial: '', domicilioFiscal: '' });
    expect(resultado.errores).toEqual(expect.arrayContaining(['RAZON_SOCIAL_NO_VALIDADA', 'DOMICILIO_NO_VALIDADO']));
  });

  it('CP-HU02-09 | CA10 calcula valor de venta e IGV del 18 por ciento', () => {
    expect(calcularDesgloseFactura(118)).toEqual({ valorVenta: 100, igv: 18, total: 118 });
  });

  it('CP-HU02-10 | CA12 genera serie y correlativo automático', () => {
    expect(generarNumeroComprobante('B001', 25)).toBe('B001-000025');
  });
});
