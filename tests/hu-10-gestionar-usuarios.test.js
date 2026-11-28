import { describe, expect, it } from 'vitest';
import {
  emailOperativo,
  passwordOperativaValida,
  puedeCrearRol,
  usuarioOperativoValido
} from '../public/shared/admin-rules.js';
import { puedeRecuperarPassword } from '../public/shared/auth-rules.js';

describe('HU-10 Gestionar usuarios', () => {
  it('CP-HU10-01 | CA01 permite como máximo una cuenta por rol', () => {
    expect(puedeCrearRol([], 'cajera')).toBe(true);
    expect(puedeCrearRol([{ rol: 'cajera' }], 'cajera')).toBe(false);
    expect(puedeCrearRol([], 'admin')).toBe(false);
  });

  it('CP-HU10-02 | CA03 acepta usuarios de 4 a 20 caracteres alfanuméricos', () => {
    expect(usuarioOperativoValido('caja')).toBe(true);
    expect(usuarioOperativoValido('a'.repeat(20))).toBe(true);
  });

  it('CP-HU10-03 | CA03 rechaza longitud, espacios y caracteres especiales', () => {
    expect(usuarioOperativoValido('abc')).toBe(false);
    expect(usuarioOperativoValido('usuario con espacio')).toBe(false);
    expect(usuarioOperativoValido('usuario!')).toBe(false);
  });

  it('CP-HU10-04 | CA03 exige contraseña mínima de seis caracteres', () => {
    expect(passwordOperativaValida('123456')).toBe(true);
    expect(passwordOperativaValida('12345')).toBe(false);
  });

  it('CP-HU10-05 | CA05 genera el correo corporativo', () => {
    expect(emailOperativo('Cajera1')).toBe('cajera1@burger.local');
  });

  it('CP-HU10-06 | CA09 rechaza recuperación propia para usuario operativo', () => {
    expect(puedeRecuperarPassword('cocina1')).toBe(false);
  });
});
