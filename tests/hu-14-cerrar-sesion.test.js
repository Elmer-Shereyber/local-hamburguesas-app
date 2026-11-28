import { describe, expect, it } from 'vitest';
import { sesionSigueVigente } from '../public/shared/auth-rules.js';

describe('HU-14 Cerrar sesión', () => {
  it('CP-HU14-01 | CA02 y CA04 una sesión sin token deja de ser válida', () => {
    expect(sesionSigueVigente({ tokenSesionActual: '', tokenSesionRegistrado: 'abc' })).toBe(false);
  });

  it('CP-HU14-02 | CA05 el cierre de una cuenta no invalida otra sesión', () => {
    const sesionCajera = sesionSigueVigente({ tokenSesionActual: '', tokenSesionRegistrado: 'caja' });
    const sesionCocina = sesionSigueVigente({ tokenSesionActual: 'cocina', tokenSesionRegistrado: 'cocina' });
    expect(sesionCajera).toBe(false);
    expect(sesionCocina).toBe(true);
  });
});
