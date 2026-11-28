import { describe, expect, it } from 'vitest';
import {
  calcularMontoDevolucion, cantidadReclamoValida, clasificarNotaCredito,
  cciValido, cuentaBancariaValida, motivoValido, puedeRegistrarIncidencia,
  puedeReponerProducto, telefonoPeruanoValido, unidadesReclamables,
  validarDestinoDevolucion, validarProcesamientoDevolucion, validarSolicitudDevolucion
} from '../public/shared/incidencia-rules.js';

describe('HU-04 - Registrar reposición', () => {
  it('solo permite incidencias sobre pedidos entregados', () => {
    expect(puedeRegistrarIncidencia({ estadoGeneral: 'Entregado' })).toBe(true);
    expect(puedeRegistrarIncidencia({ estadoGeneral: 'Listo' })).toBe(false);
  });
  it('resta unidades ya repuestas y devueltas', () => {
    expect(unidadesReclamables({ cantidad: 5, unidadesRepuestas: 2, unidadesDevueltas: 1 })).toBe(2);
  });
  it.each([[1, true], [2, true], [0, false], [3, false]])('valida cantidad reclamable %s', (cantidad, esperado) => {
    expect(cantidadReclamoValida({ cantidad: 2 }, cantidad)).toBe(esperado);
  });
  it('exige diez caracteres cuando el motivo es Otro', () => {
    expect(motivoValido('Otro', '123456789')).toBe(false);
    expect(motivoValido('Otro', '1234567890')).toBe(true);
  });
  it('limita observación a 250 caracteres', () => {
    expect(motivoValido('Producto incorrecto', 'a'.repeat(250))).toBe(true);
    expect(motivoValido('Producto incorrecto', 'a'.repeat(251))).toBe(false);
  });
  it('solo repone el mismo producto si está disponible', () => {
    const pedido = { id: 'p1', nombre: 'Hamburguesa', cantidad: 1 };
    expect(puedeReponerProducto(pedido, { id: 'p1', disponible: true })).toBe(true);
    expect(puedeReponerProducto(pedido, { id: 'p2', disponible: true })).toBe(false);
    expect(puedeReponerProducto(pedido, { id: 'p1', disponible: false })).toBe(false);
  });
});

describe('HU-05 - Solicitar devolución', () => {
  it('calcula el monto no editable de la devolución', () => {
    expect(calcularMontoDevolucion([{ precio: 15, cantidad: 2 }, { precio: 4.5, cantidad: 1 }])).toBe(34.5);
  });
  it.each([['987654321', true], ['887654321', false], ['98765432', false], ['98765432A', false]])('valida teléfono %s', (valor, esperado) => {
    expect(telefonoPeruanoValido(valor)).toBe(esperado);
  });
  it.each([['1234567890', true], ['1'.repeat(20), true], ['123456789', false], ['1'.repeat(21), false]])('valida cuenta %s', (valor, esperado) => {
    expect(cuentaBancariaValida(valor)).toBe(esperado);
  });
  it('valida CCI de exactamente veinte dígitos', () => {
    expect(cciValido('1'.repeat(20))).toBe(true);
    expect(cciValido('1'.repeat(19))).toBe(false);
  });
  it('valida billetera y transferencia', () => {
    expect(validarDestinoDevolucion({ modalidad: 'Yape', telefono: '987654321', titular: 'Juan Pérez' })).toBe(true);
    expect(validarDestinoDevolucion({ modalidad: 'Transferencia', cuenta: '1'.repeat(20), titular: 'Juan Pérez' })).toBe(true);
    expect(validarDestinoDevolucion({ modalidad: 'Efectivo', titular: 'Juan Pérez' })).toBe(false);
  });
  it('reporta todos los campos inválidos de una solicitud', () => {
    const r = validarSolicitudDevolucion({ pedido: { estadoGeneral: 'Pendiente' }, productos: [], motivo: '', modalidad: 'Efectivo', destino: {}, contacto: {} });
    expect(r.errores).toEqual(expect.arrayContaining(['PEDIDO_NO_ENTREGADO', 'SIN_PRODUCTOS', 'MOTIVO_INVALIDO', 'DESTINO_INVALIDO', 'CONTACTO_INVALIDO']));
  });
});

describe('HU-06 - Procesar devolución', () => {
  it('exige comprobante y no permite reprocesar', () => {
    const r = validarProcesamientoDevolucion({ estado: 'Procesada', comprobanteArchivo: null, modalidad: 'Yape', destino: { telefono: '987654321', titular: 'Juan Pérez' } });
    expect(r.errores).toEqual(expect.arrayContaining(['YA_PROCESADA', 'COMPROBANTE_OBLIGATORIO']));
  });
  it('clasifica devolución total con código 06', () => {
    expect(clasificarNotaCredito(100, 100)).toEqual({ codigo: '06', descripcion: 'DEVOLUCIÓN TOTAL', esTotal: true });
  });
  it('clasifica devolución parcial con código 07', () => {
    expect(clasificarNotaCredito(100, 40)).toEqual({ codigo: '07', descripcion: 'DEVOLUCIÓN POR ÍTEM', esTotal: false });
  });
});
