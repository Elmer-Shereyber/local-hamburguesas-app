import { describe, expect, it } from 'vitest';
import {
  clasificarNotaCredito,
  validarProcesamientoDevolucion
} from '../public/shared/incidencia-rules.js';

const destino = { telefono: '987654321', titular: 'Cliente' };

describe('HU-06 Procesar devolución', () => {
  it('CP-HU06-01 | CA03 acepta comprobante adjunto y destino válido', () => {
    const resultado = validarProcesamientoDevolucion({ estado: 'Solicitada', comprobanteArchivo: 'voucher.pdf', modalidad: 'Yape', destino });
    expect(resultado).toEqual({ valido: true, errores: [] });
  });

  it('CP-HU06-02 | CA04 rechaza procesamiento sin comprobante', () => {
    const resultado = validarProcesamientoDevolucion({ estado: 'Solicitada', modalidad: 'Yape', destino });
    expect(resultado.errores).toContain('COMPROBANTE_OBLIGATORIO');
  });

  it('CP-HU06-03 | CA07 valida el destino corregido', () => {
    const resultado = validarProcesamientoDevolucion({ estado: 'Solicitada', comprobanteArchivo: 'voucher.png', modalidad: 'Transferencia', destino: { cuenta: '123', titular: 'Cliente' } });
    expect(resultado.errores).toContain('DESTINO_INVALIDO');
  });

  it('CP-HU06-04 | CA10 impide reprocesar una devolución', () => {
    const resultado = validarProcesamientoDevolucion({ estado: 'Procesada', comprobanteArchivo: 'voucher.pdf', modalidad: 'Yape', destino });
    expect(resultado.errores).toContain('YA_PROCESADA');
  });

  it('CP-HU06-05 | CA11 clasifica devolución total con código 06', () => {
    expect(clasificarNotaCredito(30, 30)).toMatchObject({ codigo: '06', esTotal: true });
  });

  it('CP-HU06-06 | CA11 clasifica devolución parcial con código 07', () => {
    expect(clasificarNotaCredito(30, 15)).toMatchObject({ codigo: '07', esTotal: false });
  });
});
