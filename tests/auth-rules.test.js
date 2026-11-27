import { describe, expect, it } from 'vitest';
import {
  mensajeErrorLogin, normalizarIdentificador, puedeRecuperarPassword,
  rolPermitido, rutaInicialRol, sesionSigueVigente
} from '../public/shared/auth-rules.js';

describe('HU-13 - Iniciar sesión', () => {
  it('normaliza usuario operativo sin dominio', () => {
    expect(normalizarIdentificador(' Cajera23 ')).toEqual({ valido: true, email: 'cajera23@burger.local', esAdmin: false, usuario: 'cajera23' });
  });
  it('acepta usuario operativo con dominio', () => {
    expect(normalizarIdentificador('cocina26@burger.local')).toMatchObject({ valido: true, email: 'cocina26@burger.local', esAdmin: false });
  });
  it('reconoce correo real de administrador', () => {
    expect(normalizarIdentificador('admin@empresa.pe')).toMatchObject({ valido: true, esAdmin: true });
  });
  it('rechaza identificadores vacíos o inválidos', () => {
    expect(normalizarIdentificador('').valido).toBe(false);
    expect(normalizarIdentificador('ab').valido).toBe(false);
  });
  it('usa el mismo mensaje para cualquier credencial inválida', () => expect(mensajeErrorLogin()).toBe('Credenciales inválidas.'));
  it.each([['admin', '../admin/index.html'], ['cajera', '../cajera/registrar-pedido.html'], ['cocina', '../cocina/pedidos.html'], ['desconocido', '../login/index.html']])('redirige %s', (rol, ruta) => expect(rutaInicialRol(rol)).toBe(ruta));
  it('restringe acceso por rol', () => {
    expect(rolPermitido('cajera', 'cajera')).toBe(true);
    expect(rolPermitido('cajera', 'admin')).toBe(false);
    expect(rolPermitido('cocina', ['cocina', 'admin'])).toBe(true);
  });
  it('valida sesión única y cuenta activa', () => {
    expect(sesionSigueVigente({ tokenSesionActual: 'a', tokenSesionRegistrado: 'a' })).toBe(true);
    expect(sesionSigueVigente({ tokenSesionActual: 'a', tokenSesionRegistrado: 'b' })).toBe(false);
    expect(sesionSigueVigente({ tokenSesionActual: 'a', tokenSesionRegistrado: 'a', cuentaActiva: false })).toBe(false);
  });
});

describe('HU-14 - Cerrar sesión', () => {
  it('una sesión sin token deja de ser válida', () => expect(sesionSigueVigente({ tokenSesionActual: '', tokenSesionRegistrado: 'a' })).toBe(false));
});

describe('HU-15 - Recuperar contraseña', () => {
  it('solo permite recuperación al correo administrador', () => {
    expect(puedeRecuperarPassword('admin@empresa.pe')).toBe(true);
    expect(puedeRecuperarPassword('cajera23')).toBe(false);
    expect(puedeRecuperarPassword('cocina26@burger.local')).toBe(false);
  });
});
