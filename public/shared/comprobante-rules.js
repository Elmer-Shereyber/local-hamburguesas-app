export const LIMITE_BOLETA_SIMPLE = 700;
export const TASA_IGV = 0.18;
export const TIPOS_COMPROBANTE = Object.freeze(['Boleta', 'Factura']);

export function esTipoComprobanteValido(tipo) {
  return TIPOS_COMPROBANTE.includes(tipo);
}

export function puedeEmitirBoletaSimple(total) {
  return Number.isFinite(total) && total > 0 && total <= LIMITE_BOLETA_SIMPLE;
}

export function esDniValido(dni) {
  return /^\d{8}$/.test(String(dni ?? ''));
}

export function esRucValido(ruc) {
  return /^\d{11}$/.test(String(ruc ?? ''));
}

export function empresaAptaParaFactura({ estado, condicion } = {}) {
  return estado === 'ACTIVO' && condicion === 'HABIDO';
}

export function calcularDesgloseFactura(total) {
  if (!Number.isFinite(total) || total <= 0) throw new RangeError('El total debe ser positivo.');
  const valorVenta = Number((total / (1 + TASA_IGV)).toFixed(2));
  const igv = Number((total - valorVenta).toFixed(2));
  return { valorVenta, igv, total: Number(total.toFixed(2)) };
}

export function generarNumeroComprobante(serie, correlativo, longitud = 6) {
  if (!/^[A-Z0-9]+$/i.test(String(serie ?? ''))) throw new Error('Serie inválida.');
  if (!Number.isInteger(correlativo) || correlativo <= 0) throw new Error('Correlativo inválido.');
  return `${serie}-${String(correlativo).padStart(longitud, '0')}`;
}

export function validarEmision({ total, tipoComprobante, tipoBoleta, dni, nombre, ruc, razonSocial, domicilioFiscal } = {}) {
  const errores = [];
  if (!Number.isFinite(total) || total <= 0) errores.push('TOTAL_INVALIDO');
  if (!esTipoComprobanteValido(tipoComprobante)) errores.push('TIPO_INVALIDO');

  if (tipoComprobante === 'Boleta') {
    if (!['simple', 'con-dni'].includes(tipoBoleta)) errores.push('TIPO_BOLETA_INVALIDO');
    if (tipoBoleta === 'simple' && !puedeEmitirBoletaSimple(total)) errores.push('BOLETA_SIMPLE_NO_PERMITIDA');
    if (tipoBoleta === 'con-dni') {
      if (!esDniValido(dni)) errores.push('DNI_INVALIDO');
      if (!String(nombre ?? '').trim()) errores.push('NOMBRE_NO_VALIDADO');
    }
  }

  if (tipoComprobante === 'Factura') {
    if (!esRucValido(ruc)) errores.push('RUC_INVALIDO');
    if (!String(razonSocial ?? '').trim()) errores.push('RAZON_SOCIAL_NO_VALIDADA');
    if (!String(domicilioFiscal ?? '').trim()) errores.push('DOMICILIO_NO_VALIDADO');
  }
  return { valido: errores.length === 0, errores };
}

export function crearDatosCliente(datos) {
  const validacion = validarEmision(datos);
  if (!validacion.valido) throw new Error(`Emisión inválida: ${validacion.errores.join(', ')}`);
  if (datos.tipoComprobante === 'Boleta' && datos.tipoBoleta === 'simple') return null;
  if (datos.tipoComprobante === 'Boleta') return { documento: String(datos.dni), nombre: datos.nombre.trim() };
  return { ruc: String(datos.ruc), razonSocial: datos.razonSocial.trim(), direccion: datos.domicilioFiscal.trim() };
}
