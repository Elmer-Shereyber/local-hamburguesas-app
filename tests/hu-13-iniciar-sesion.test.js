import { describe, expect, it } from 'vitest';
import {
  mensajeErrorLogin,
  normalizarIdentificador,
  rolPermitido,
  rutaInicialRol,
  sesionSigueVigente
} from '../public/shared/auth-rules.js';

describe('HU-13 Iniciar sesión', () => {
  it('CP-HU13-01 | CA02 conserva el correo válido del administrador', () => {
    expect(normalizarIdentificador('ADMIN@empresa.pe')).toMatchObject({ valido: true, email: 'admin@empresa.pe', esAdmin: true });
  });

  it('CP-HU13-02 | CA03 normaliza usuario operativo al dominio corporativo', () => {
    expect(normalizarIdentificador('Cajera01')).toMatchObject({ valido: true, email: 'cajera01@burger.local', esAdmin: false });
    expect(normalizarIdentificador('cajera01@burger.local').valido).toBe(true);
  });

  it('CP-HU13-03 | CA04 rechaza identificador vacío o inválido', () => {
    expect(normalizarIdentificador('').valido).toBe(false);
    expect(normalizarIdentificador('abc').valido).toBe(false);
  });

  it('CP-HU13-04 | CA04 y CA05 usan un mensaje genérico', () => {
    expect(mensajeErrorLogin()).toBe('Credenciales inválidas.');
  });

  it('CP-HU13-05 | CA06 redirige cada rol a su pantalla', () => {
    expect(rutaInicialRol('admin')).toBe('../admin/index.html');
    expect(rutaInicialRol('cajera')).toBe('../cajera/registrar-pedido.html');
    expect(rutaInicialRol('cocina')).toBe('../cocina/pedidos.html');
  });

  it('CP-HU13-06 | CA07 restringe funciones por rol', () => {
    expect(rolPermitido('cajera', 'cajera')).toBe(true);
    expect(rolPermitido('cajera', 'admin')).toBe(false);
  });

  it('CP-HU13-07 | CA08 mantiene una sesión activa con token coincidente', () => {
    expect(sesionSigueVigente({ tokenSesionActual: 'abc', tokenSesionRegistrado: 'abc', cuentaActiva: true })).toBe(true);
  });

  it('CP-HU13-08 | CA09 invalida la sesión anterior cuando cambia el token', () => {
    expect(sesionSigueVigente({ tokenSesionActual: 'anterior', tokenSesionRegistrado: 'nuevo', cuentaActiva: true })).toBe(false);
  });
});
