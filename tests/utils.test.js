import { describe, expect, it } from 'vitest';
import { formatCurrency } from '../public/shared/utils.js';

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