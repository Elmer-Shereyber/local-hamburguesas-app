export const INTERNAL_DOMAIN = '@burger.local';
export const ROLES = Object.freeze(['admin', 'cajera', 'cocina']);

export function normalizarIdentificador(identifier) {
  const valor = String(identifier ?? '').trim().toLowerCase();
  if (!valor) return { valido: false, email: '', esAdmin: false, usuario: '' };
  const esAdmin = valor.includes('@') && !valor.endsWith(INTERNAL_DOMAIN);
  if (esAdmin) return { valido: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor), email: valor, esAdmin: true, usuario: valor.split('@')[0] };
  const usuario = valor.replace(new RegExp(`${INTERNAL_DOMAIN.replace('.', '\\.')}?$`), '');
  const valido = /^[a-z0-9]{4,20}$/.test(usuario);
  return { valido, email: valido ? `${usuario}${INTERNAL_DOMAIN}` : '', esAdmin: false, usuario };
}

export function rolPermitido(rol, permitido) {
  if (!ROLES.includes(rol)) return false;
  return Array.isArray(permitido) ? permitido.includes(rol) : rol === permitido;
}

export function rutaInicialRol(rol) {
  return ({ admin: '../admin/index.html', cajera: '../cajera/registrar-pedido.html', cocina: '../cocina/pedidos.html' })[rol] ?? '../login/index.html';
}

export function puedeRecuperarPassword(identifier) {
  const normalizado = normalizarIdentificador(identifier);
  return normalizado.valido && normalizado.esAdmin;
}

export function sesionSigueVigente({ tokenSesionActual, tokenSesionRegistrado, cuentaActiva = true } = {}) {
  return cuentaActiva === true && Boolean(tokenSesionActual) && tokenSesionActual === tokenSesionRegistrado;
}

export function mensajeErrorLogin() {
  return 'Credenciales inválidas.';
}
