import { normalizarTipo } from './utils.js';
import { calcularEstadoPedido } from './consulta-pedidos-rules.js';

export const ESTADOS_VISIBLES_COCINA = Object.freeze(['Pendiente', 'En preparación', 'Listo']);

export function alternarDisponibilidad(producto) {
  if (!producto || typeof producto.disponible !== 'boolean') throw new Error('Producto inválido.');
  return { ...producto, disponible: !producto.disponible };
}

export function pedidoVisibleEnCocina(pedido) {
  return ESTADOS_VISIBLES_COCINA.includes(pedido?.estadoGeneral);
}

function millis(fecha) {
  if (fecha?.toMillis) return fecha.toMillis();
  if (fecha?.toDate) return fecha.toDate().getTime();
  return new Date(fecha ?? 0).getTime();
}

export function ordenarColaCocina(pedidos) {
  const grupo = (p) => {
    if (p.estadoGeneral === 'En preparación') return 1;
    if (p.estadoGeneral === 'Pendiente' && p.esReposicion) return 2;
    if (p.estadoGeneral === 'Pendiente') return 3;
    if (p.estadoGeneral === 'Listo') return 4;
    return 5;
  };
  return pedidos.filter(pedidoVisibleEnCocina).sort((a, b) => grupo(a) - grupo(b) || millis(a.fechaTomado || a.fechaRegistro) - millis(b.fechaTomado || b.fechaRegistro));
}

export function siguienteEstadoProducto(producto) {
  const tipo = normalizarTipo(producto?.tipo);
  if (producto?.estado === 'Listo') return null;
  if (tipo === 'Servicio inmediato') return producto?.estado === 'Pendiente' ? 'Listo' : null;
  if (producto?.estado === 'Pendiente') return 'En preparación';
  if (producto?.estado === 'En preparación') return 'Listo';
  return null;
}

export function avanzarProducto(producto) {
  const siguiente = siguienteEstadoProducto(producto);
  if (!siguiente) throw new Error('El producto no puede avanzar.');
  return { ...producto, estado: siguiente };
}

export function puedeIniciarPreparacionGeneral(productos) {
  const preparados = productos.filter((p) => normalizarTipo(p.tipo) === 'Con preparación');
  return preparados.length > 0 && preparados.every((p) => p.estado === 'Pendiente');
}

export function iniciarPreparacionGeneral(productos) {
  if (!puedeIniciarPreparacionGeneral(productos)) throw new Error('No se puede iniciar en bloque.');
  const nuevosProductos = productos.map((p) => normalizarTipo(p.tipo) === 'Con preparación' ? { ...p, estado: 'En preparación' } : { ...p });
  return { productos: nuevosProductos, estadoGeneral: calcularEstadoPedido(nuevosProductos) };
}
