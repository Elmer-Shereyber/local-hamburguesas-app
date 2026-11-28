export const ROLES_OPERATIVOS = Object.freeze(['cajera', 'cocina']);

export function usuarioOperativoValido(usuario) {
  return /^[a-zA-Z0-9]{4,20}$/.test(String(usuario ?? ''));
}

export function passwordOperativaValida(password) {
  return typeof password === 'string' && password.length >= 6;
}

export function emailOperativo(usuario) {
  if (!usuarioOperativoValido(usuario)) throw new Error('Usuario inválido.');
  return `${usuario.toLowerCase()}@burger.local`;
}

export function puedeCrearRol(usuarios, rol) {
  return ROLES_OPERATIVOS.includes(rol) && !usuarios.some((u) => u.rol === rol);
}

export function normalizarNombreProducto(nombre) {
  return String(nombre ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validarProducto({ nombre, precio, tipo, id }, existentes = []) {
  const errores = [];
  const limpio = normalizarNombreProducto(nombre);
  if (!limpio) errores.push('NOMBRE_OBLIGATORIO');
  if (!Number.isFinite(Number(precio)) || Number(precio) <= 0) errores.push('PRECIO_INVALIDO');
  if (!['Con preparación', 'Servicio inmediato'].includes(tipo)) errores.push('TIPO_INVALIDO');
  if (existentes.some((p) => p.id !== id && normalizarNombreProducto(p.nombre) === limpio)) errores.push('NOMBRE_DUPLICADO');
  return { valido: errores.length === 0, errores };
}

export function rangoFechasValido(inicio, fin) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(fin ?? '')) return false;
  return new Date(`${inicio}T00:00:00`) <= new Date(`${fin}T23:59:59.999`);
}

export function calcularResumenVentas(pedidos, devoluciones = [], inicio, fin) {
  if (inicio && fin && !rangoFechasValido(inicio, fin)) throw new Error('Rango inválido.');
  const pagos = { Efectivo: 0, Yape: 0, Plin: 0, Transferencia: 0 };
  let ventasBrutas = 0;
  const productos = new Map();

  for (const p of pedidos) {
    const total = Number(p.total) || 0;
    ventasBrutas += total;
    if (p.modalidadPago === 'Híbrido') {
      pagos.Efectivo += Number(p.pagoHibridoEfectivo) || 0;
      pagos.Yape += Number(p.pagoHibridoYape) || 0;
      pagos.Plin += Number(p.pagoHibridoPlin) || 0;
      pagos.Transferencia += Number(p.pagoHibridoTransferencia) || 0;
    } else if (pagos[p.modalidadPago] !== undefined) pagos[p.modalidadPago] += total;
    // Las reposiciones sin costo son incidencias, no ventas por producto.
    // CA04 y CA06: no incrementan ni el monto ni la cantidad vendida.
    if (p.esReposicion && total === 0) continue;
    for (const item of p.productos || []) {
      if (!item.id) continue;
      const actual = productos.get(item.id) || { id: item.id, nombre: item.nombre, cantidad: 0, monto: 0 };
      actual.cantidad += Number(item.cantidad) || 0;
      actual.monto += (Number(item.cantidad) || 0) * (Number(item.precio) || 0);
      productos.set(item.id, actual);
    }
  }

  const desde = inicio ? new Date(`${inicio}T00:00:00`).getTime() : -Infinity;
  const hasta = fin ? new Date(`${fin}T23:59:59.999`).getTime() : Infinity;
  const reembolsos = devoluciones
    .filter((d) => d.estado === 'Procesada' && d.fechaProcesado)
    .filter((d) => { const f = d.fechaProcesado?.toDate ? d.fechaProcesado.toDate() : new Date(d.fechaProcesado); return f.getTime() >= desde && f.getTime() <= hasta; })
    .reduce((s, d) => s + (Number(d.monto) || 0), 0);

  return {
    ventasBrutas: Number(ventasBrutas.toFixed(2)),
    reembolsos: Number(reembolsos.toFixed(2)),
    neto: Number((ventasBrutas - reembolsos).toFixed(2)),
    pagos: Object.fromEntries(Object.entries(pagos).map(([k, v]) => [k, Number(v.toFixed(2))])),
    productos: [...productos.values()].map((p) => ({ ...p, monto: Number(p.monto.toFixed(2)) }))
  };
}

export function resumenMotivos(incidencias) {
  return incidencias.reduce((acc, i) => { const motivo = i.motivo || 'Sin motivo'; acc[motivo] = (acc[motivo] || 0) + 1; return acc; }, {});
}
