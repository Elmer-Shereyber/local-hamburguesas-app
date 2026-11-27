export function limpiarCodigo(codigo) {
  return String(codigo ?? '').replace(/^#+/, '').trim();
}

export function fechaAValor(fecha) {
  if (fecha?.toDate) return fecha.toDate();
  return fecha instanceof Date ? fecha : new Date(fecha);
}

export function esDelDia(fecha, referencia = new Date()) {
  const valor = fechaAValor(fecha);
  return !Number.isNaN(valor.getTime()) && valor.toDateString() === referencia.toDateString();
}

export function filtrarPedidos(pedidos, termino = '') {
  const buscado = termino.trim().toLowerCase();
  if (!buscado) return [...pedidos];
  const limpio = buscado.replace(/^#+/, '');
  return pedidos.filter((p) =>
    String(p.comprobante ?? '').toLowerCase().includes(buscado) ||
    limpiarCodigo(p.codigo).toLowerCase().includes(limpio)
  );
}

export function pedidosRecientes(pedidos, limite = 10) {
  return [...pedidos]
    .sort((a, b) => fechaAValor(b.fechaRegistro) - fechaAValor(a.fechaRegistro))
    .slice(0, limite);
}

export function calcularEstadoPedido(productos) {
  if (!Array.isArray(productos) || productos.length === 0) return 'Pendiente';
  if (productos.every((p) => p.estado === 'Listo')) return 'Listo';
  if (productos.some((p) => ['En preparación', 'Listo'].includes(p.estado))) return 'En preparación';
  return 'Pendiente';
}

export function puedeConfirmarEntrega(pedido) {
  return pedido?.estadoGeneral === 'Listo';
}

export function accionesIncidenciaPermitidas(pedido) {
  if (pedido?.estadoGeneral !== 'Entregado') return [];
  if (pedido.esReposicion) return pedido.tieneDevolucion ? [] : ['devolucion'];
  if (pedido.tieneReposicion || pedido.tieneDevolucion) return [];
  return ['reposicion', 'devolucion'];
}

export function indicadorIncidencia(pedido) {
  if (pedido?.estadoDevolucion === 'Procesada') return 'Devolución procesada';
  if (pedido?.tieneDevolucion) return 'Devolución solicitada';
  if (pedido?.tieneReposicion) return 'Con reposición';
  return null;
}
