export const MIN_CANTIDAD_PRODUCTO = 1;
export const MAX_CANTIDAD_PRODUCTO = 10;
export const MAX_CARACTERES_DETALLE = 50;

export const MODALIDADES_PAGO = Object.freeze([
  'Efectivo',
  'Yape',
  'Plin',
  'Transferencia',
  'Híbrido'
]);

export const MEDIOS_PAGO_HIBRIDO = Object.freeze([
  'efectivo',
  'yape',
  'plin',
  'transferencia'
]);

/**
 * CA01: determina si un producto puede ser seleccionado.
 */
export function esProductoDisponible(producto) {
  return producto?.disponible === true;
}

/**
 * CA03: comprueba que la cantidad sea un entero entre 1 y 10.
 */
export function esCantidadValida(cantidad) {
  return (
    Number.isInteger(cantidad) &&
    cantidad >= MIN_CANTIDAD_PRODUCTO &&
    cantidad <= MAX_CANTIDAD_PRODUCTO
  );
}

/**
 * CA04: el detalle es opcional y admite como máximo 50 caracteres.
 */
export function esDetalleValido(detalle) {
  if (detalle === undefined || detalle === null) {
    return true;
  }

  return (
    typeof detalle === 'string' &&
    detalle.length <= MAX_CARACTERES_DETALLE
  );
}

/**
 * CA05: calcula precio × cantidad para todos los productos.
 *
 * Admite tanto productos directos:
 * { precio: 15, cantidad: 2 }
 *
 * como elementos del carrito:
 * { producto: { precio: 15 }, cantidad: 2 }
 */
export function calcularTotalPedido(productos) {
  if (!Array.isArray(productos)) {
    throw new TypeError('Los productos deben enviarse en un arreglo.');
  }

  const total = productos.reduce((acumulado, item) => {
    const precio = item?.producto?.precio ?? item?.precio;
    const cantidad = item?.cantidad;

    if (
      typeof precio !== 'number' ||
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      throw new RangeError('Cada producto debe tener un precio positivo.');
    }

    if (!esCantidadValida(cantidad)) {
      throw new RangeError('Cada cantidad debe ser un entero entre 1 y 10.');
    }

    return acumulado + precio * cantidad;
  }, 0);

  return Number(total.toFixed(2));
}

/**
 * CA06: comprueba que la modalidad pertenezca a la lista permitida.
 */
export function esModalidadPagoValida(modalidadPago) {
  return MODALIDADES_PAGO.includes(modalidadPago);
}

/**
 * CA07: suma los cuatro posibles medios de un pago híbrido.
 */
export function sumarPagoHibrido(pagos = {}) {
  return Number(
    MEDIOS_PAGO_HIBRIDO.reduce((total, medio) => {
      const monto = pagos[medio] ?? 0;

      if (
        typeof monto !== 'number' ||
        !Number.isFinite(monto) ||
        monto < 0
      ) {
        throw new RangeError(
          `El monto de ${medio} debe ser un número igual o mayor que cero.`
        );
      }

      return total + monto;
    }, 0).toFixed(2)
  );
}

/**
 * Cuenta cuántos medios tienen un monto superior a cero.
 */
export function contarMediosHibridosUsados(pagos = {}) {
  return MEDIOS_PAGO_HIBRIDO.filter((medio) => {
    const monto = pagos[medio] ?? 0;

    return (
      typeof monto === 'number' &&
      Number.isFinite(monto) &&
      monto > 0
    );
  }).length;
}

/**
 * CA07: el pago híbrido debe:
 * - utilizar al menos dos medios;
 * - no contener montos negativos o inválidos;
 * - sumar exactamente el total del pedido.
 */
export function esPagoHibridoValido(totalPedido, pagos = {}) {
  if (
    typeof totalPedido !== 'number' ||
    !Number.isFinite(totalPedido) ||
    totalPedido <= 0
  ) {
    return false;
  }

  try {
    const suma = sumarPagoHibrido(pagos);
    const mediosUsados = contarMediosHibridosUsados(pagos);

    const totalCentimos = Math.round(totalPedido * 100);
    const sumaCentimos = Math.round(suma * 100);

    return mediosUsados >= 2 && sumaCentimos === totalCentimos;
  } catch {
    return false;
  }
}

/**
 * CA02, CA03, CA04, CA06, CA07 y CA09:
 * valida conjuntamente los datos antes de crear el borrador.
 */
export function validarBorradorPedido({
  productos = [],
  detalle = '',
  modalidadPago = '',
  pagosHibridos = {}
} = {}) {
  const errores = [];

  if (!Array.isArray(productos) || productos.length === 0) {
    errores.push('SIN_PRODUCTOS');
  } else {
    productos.forEach((item, indice) => {
      const producto = item?.producto ?? item;

      if (!esProductoDisponible(producto)) {
        errores.push(`PRODUCTO_NO_DISPONIBLE_${indice}`);
      }

      if (!esCantidadValida(item?.cantidad)) {
        errores.push(`CANTIDAD_INVALIDA_${indice}`);
      }
    });
  }

  if (!esDetalleValido(detalle)) {
    errores.push('DETALLE_INVALIDO');
  }

  if (!esModalidadPagoValida(modalidadPago)) {
    errores.push('MODALIDAD_INVALIDA');
  }

  if (modalidadPago === 'Híbrido') {
    let totalPedido = 0;

    try {
      totalPedido = calcularTotalPedido(productos);
    } catch {
      errores.push('TOTAL_INVALIDO');
    }

    if (
      totalPedido > 0 &&
      !esPagoHibridoValido(totalPedido, pagosHibridos)
    ) {
      errores.push('PAGO_HIBRIDO_INVALIDO');
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Crea una copia de los productos para el pedido.
 * No modifica el carrito original.
 */
export function crearSnapshotProductos(carrito) {
  if (!Array.isArray(carrito) || carrito.length === 0) {
    throw new Error('El carrito debe contener al menos un producto.');
  }

  return carrito.map((item, indice) => {
    const producto = item?.producto;

    if (!esProductoDisponible(producto)) {
      throw new Error(`El producto de la posición ${indice} no está disponible.`);
    }

    if (!esCantidadValida(item?.cantidad)) {
      throw new Error(`La cantidad de la posición ${indice} no es válida.`);
    }

    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      tipo: producto.tipo,
      cantidad: item.cantidad,
      estado: 'Pendiente'
    };
  });
}

/**
 * CA10: crea el borrador que se almacenará en sessionStorage.
 * Esta función no escribe en Firebase.
 */
export function crearBorradorPedido({
  carrito,
  detalle = '',
  modalidadPago,
  pagosHibridos = {}
}) {
  const validacion = validarBorradorPedido({
    productos: carrito,
    detalle,
    modalidadPago,
    pagosHibridos
  });

  if (!validacion.valido) {
    throw new Error(
      `Borrador inválido: ${validacion.errores.join(', ')}`
    );
  }

  const productos = crearSnapshotProductos(carrito);
  const total = calcularTotalPedido(carrito);

  return {
    productos,
    total,
    detalle: detalle.trim(),
    modalidadPago,
    pagoHibridoEfectivo:
      modalidadPago === 'Híbrido' ? pagosHibridos.efectivo ?? 0 : 0,
    pagoHibridoYape:
      modalidadPago === 'Híbrido' ? pagosHibridos.yape ?? 0 : 0,
    pagoHibridoPlin:
      modalidadPago === 'Híbrido' ? pagosHibridos.plin ?? 0 : 0,
    pagoHibridoTransferencia:
      modalidadPago === 'Híbrido'
        ? pagosHibridos.transferencia ?? 0
        : 0,
    estadoGeneral: 'Pendiente'
  };
}