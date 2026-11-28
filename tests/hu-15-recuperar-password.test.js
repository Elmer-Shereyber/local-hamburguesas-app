import { describe, expect, it } from 'vitest';
import { puedeRecuperarPassword } from '../public/shared/auth-rules.js';

describe('HU-15 Recuperar contraseña', () => {
  it('CP-HU15-01 | CA01 permite mostrar recuperación al correo del administrador', () => {
    expect(puedeRecuperarPassword('admin@empresa.pe')).toBe(true);
  });

  it('CP-HU15-02 | CA07 no permite recuperación a cajera ni cocina', () => {
    expect(puedeRecuperarPassword('cajera01')).toBe(false);
    expect(puedeRecuperarPassword('cocina01@burger.local')).toBe(false);
  });
});
