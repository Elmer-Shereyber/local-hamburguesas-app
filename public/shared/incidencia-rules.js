export const MOTIVOS_INCIDENCIA = Object.freeze(['Producto en mal estado', 'Error en la preparación', 'Producto incorrecto', 'Otro']);
export const MODALIDADES_DEVOLUCION = Object.freeze(['Yape', 'Plin', 'Transferencia']);

export function unidadesReclamables(producto) {
  return Math.max(0, Number(producto?.cantidad || 0) - Number(producto?.unidadesRepuestas || 0) - Number(producto?.unidadesDevueltas || 0));
}

export function motivoValido(motivo, observacion = '') {
  if (!MOTIVOS_INCIDENCIA.includes(motivo)) return false;
  if (observacion.length > 250) return false;
  return motivo !== 'Otro' || observacion.trim().length >= 10;
}

export function puedeRegistrarIncidencia(pedido) {
  return pedido?.estadoGeneral === 'Entregado';
}

export function puedeReponerProducto(productoPedido, productoCatalogo) {
  return unidadesReclamables(productoPedido) > 0 &&
    productoCatalogo?.disponible === true &&
    (productoCatalogo.id === productoPedido.id || productoCatalogo.nombre?.trim().toLowerCase() === productoPedido.nombre?.trim().toLowerCase());
}

export function cantidadReclamoValida(producto, cantidad) {
  return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= unidadesReclamables(producto);
}

export function calcularMontoDevolucion(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Debe seleccionar productos.');
  const total = items.reduce((suma, item) => {
    if (!Number.isFinite(item.precio) || !Number.isInteger(item.cantidad) || item.cantidad <= 0) throw new Error('Producto inválido.');
    return suma + item.precio * item.cantidad;
  }, 0);
  return Number(total.toFixed(2));
}

export function telefonoPeruanoValido(valor) {
  return /^9\d{8}$/.test(String(valor ?? ''));
}

export function cuentaBancariaValida(valor) {
  return /^\d{10,20}$/.test(String(valor ?? ''));
}

export function cciValido(valor) {
  return /^\d{20}$/.test(String(valor ?? ''));
}

export function nombreValido(valor, maximo = 50) {
  const texto = String(valor ?? '').trim();
  return texto.length >= 3 && texto.length <= maximo;
}

export function validarDestinoDevolucion({ modalidad, telefono, cuenta, titular } = {}) {
  if (!MODALIDADES_DEVOLUCION.includes(modalidad)) return false;
  if (!nombreValido(titular, 100)) return false;
  if (modalidad === 'Yape' || modalidad === 'Plin') return telefonoPeruanoValido(telefono);
  return cuentaBancariaValida(cuenta) || cciValido(cuenta);
}

export function validarSolicitudDevolucion({ pedido, productos, motivo, observacion = '', modalidad, destino, contacto } = {}) {
  const errores = [];
  if (!puedeRegistrarIncidencia(pedido)) errores.push('PEDIDO_NO_ENTREGADO');
  if (!Array.isArray(productos) || productos.length === 0) errores.push('SIN_PRODUCTOS');
  if (!motivoValido(motivo, observacion)) errores.push('MOTIVO_INVALIDO');
  if (!validarDestinoDevolucion({ modalidad, ...destino })) errores.push('DESTINO_INVALIDO');
  if (!nombreValido(contacto?.nombre) || !telefonoPeruanoValido(contacto?.telefono)) errores.push('CONTACTO_INVALIDO');
  return { valido: errores.length === 0, errores };
}

export function validarProcesamientoDevolucion({ estado, comprobanteArchivo, modalidad, destino } = {}) {
  const errores = [];
  if (estado === 'Procesada') errores.push('YA_PROCESADA');
  if (!comprobanteArchivo) errores.push('COMPROBANTE_OBLIGATORIO');
  if (!validarDestinoDevolucion({ modalidad, ...destino })) errores.push('DESTINO_INVALIDO');
  return { valido: errores.length === 0, errores };
}

export function clasificarNotaCredito(montoPedido, montoDevuelto) {
  const total = Number(montoPedido);
  const devolucion = Number(montoDevuelto);
  if (!(total > 0) || !(devolucion > 0) || devolucion > total + 0.049) throw new Error('Montos inválidos.');
  const totalCompleto = Math.abs(total - devolucion) < 0.05;
  return totalCompleto
    ? { codigo: '06', descripcion: 'DEVOLUCIÓN TOTAL', esTotal: true }
    : { codigo: '07', descripcion: 'DEVOLUCIÓN POR ÍTEM', esTotal: false };
}
