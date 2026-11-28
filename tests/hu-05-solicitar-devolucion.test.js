import { describe, expect, it } from 'vitest';
import {
  calcularMontoDevolucion,
  cantidadReclamoValida,
  cciValido,
  cuentaBancariaValida,
  telefonoPeruanoValido,
  validarDestinoDevolucion,
  validarSolicitudDevolucion
} from '../public/shared/incidencia-rules.js';

const pedido = { estadoGeneral: 'Entregado' };
const productos = [{ id: 'p1', cantidad: 1 }];
const contacto = { nombre: 'Cliente Prueba', telefono: '987654321' };

describe('HU-05 Solicitar devolución', () => {
  it('CP-HU05-01 | CA01 limita la cantidad a las unidades reclamables', () => {
    const producto = { cantidad: 2, unidadesRepuestas: 1, unidadesDevueltas: 0 };
    expect(cantidadReclamoValida(producto, 1)).toBe(true);
    expect(cantidadReclamoValida(producto, 2)).toBe(false);
  });

  it('CP-HU05-02 | CA03 calcula automáticamente el monto', () => {
    expect(calcularMontoDevolucion([{ precio: 15, cantidad: 2 }, { precio: 5, cantidad: 1 }])).toBe(35);
  });

  it('CP-HU05-03 | CA04 rechaza modalidades distintas de Yape, Plin o Transferencia', () => {
    expect(validarDestinoDevolucion({ modalidad: 'Efectivo', titular: 'Cliente', telefono: '987654321' })).toBe(false);
  });

  it('CP-HU05-04 | CA05 valida teléfono de billetera', () => {
    expect(telefonoPeruanoValido('987654321')).toBe(true);
    expect(telefonoPeruanoValido('887654321')).toBe(false);
    expect(validarDestinoDevolucion({ modalidad: 'Yape', telefono: '987654321', titular: 'Cliente' })).toBe(true);
  });

  it('CP-HU05-05 | CA05 valida cuenta o CCI para transferencia', () => {
    expect(cuentaBancariaValida('1234567890')).toBe(true);
    expect(cciValido('1'.repeat(20))).toBe(true);
    expect(validarDestinoDevolucion({ modalidad: 'Transferencia', cuenta: '123', titular: 'Cliente' })).toBe(false);
  });

  it('CP-HU05-06 | CA06 exige datos de contacto completos', () => {
    const resultado = validarSolicitudDevolucion({ pedido, productos, motivo: 'Producto incorrecto', modalidad: 'Yape', destino: { telefono: '987654321', titular: 'Cliente' }, contacto: { nombre: '', telefono: '123' } });
    expect(resultado.errores).toContain('CONTACTO_INVALIDO');
  });

  it('CP-HU05-07 | CA07 acepta una solicitud completa', () => {
    const resultado = validarSolicitudDevolucion({ pedido, productos, motivo: 'Producto incorrecto', modalidad: 'Yape', destino: { telefono: '987654321', titular: 'Cliente' }, contacto });
    expect(resultado).toEqual({ valido: true, errores: [] });
  });
});
