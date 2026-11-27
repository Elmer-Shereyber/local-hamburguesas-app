export const PERSONA_API_URL = 'https://script.google.com/macros/s/AKfycbz1qSEiKXX0mCb0gobd0luul4NoOE5IrpodghW02DVQMUfelDj4rOEWpZRD6kALugi8/exec';

export async function consultarPersona(tipo, numero, { fetchImpl = globalThis.fetch, apiUrl = PERSONA_API_URL } = {}) {
  const valor = String(numero ?? '').trim();
  if (tipo === 'dni' && !/^\d{8}$/.test(valor)) throw new Error('Ingrese un DNI válido de 8 dígitos.');
  if (tipo === 'ruc' && !/^\d{11}$/.test(valor)) throw new Error('Ingrese un RUC válido de 11 dígitos.');
  if (!['dni', 'ruc'].includes(tipo)) throw new Error('Tipo de consulta inválido.');
  if (typeof fetchImpl !== 'function') throw new Error('Servicio de consulta no disponible.');

  let respuesta;
  try {
    respuesta = await fetchImpl(`${apiUrl}?tipo=${tipo}&numero=${valor}`);
  } catch {
    throw new Error(`Error de conexión al consultar ${tipo.toUpperCase()}.`);
  }
  if (!respuesta?.ok) throw new Error(`Error de conexión al consultar ${tipo.toUpperCase()}.`);

  const datos = await respuesta.json();
  if (datos.error || datos.message) throw new Error(datos.error || datos.message);

  if (tipo === 'dni') {
    if (!datos.nombres) throw new Error('DNI no encontrado.');
    return {
      documento: valor,
      nombre: `${datos.nombres} ${datos.apellidoPaterno || ''} ${datos.apellidoMaterno || ''}`.replace(/\s+/g, ' ').trim()
    };
  }

  if (!datos.razonSocial) throw new Error('RUC no encontrado.');
  if (datos.estado !== 'ACTIVO') throw new Error(`La empresa se encuentra en estado: ${datos.estado}. No se puede emitir factura.`);
  if (datos.condicion !== 'HABIDO') throw new Error(`La empresa tiene condición: ${datos.condicion}. No se puede emitir factura.`);
  return {
    ruc: valor,
    razonSocial: datos.razonSocial,
    direccion: datos.direccion || 'Sin dirección registrada',
    estado: datos.estado,
    condicion: datos.condicion
  };
}
