import { describe, expect, it } from 'vitest';
import { alternarDisponibilidad } from '../public/shared/cocina-rules.js';

describe('HU-07 Gestionar disponibilidad de productos', () => {
  it('CP-HU07-01 | CA02 alterna de disponible a no disponible', () => {
    expect(alternarDisponibilidad({ id: 'p1', disponible: true })).toEqual({ id: 'p1', disponible: false });
  });

  it('CP-HU07-02 | CA02 cambia el estado sin modificar el objeto original', () => {
    const original = { id: 'p1', disponible: true };
    const actualizado = alternarDisponibilidad(original);
    expect(original.disponible).toBe(true);
    expect(actualizado).not.toBe(original);
  });
});
