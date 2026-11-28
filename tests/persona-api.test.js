import { describe, expect, it, vi } from 'vitest';
import { consultarPersona } from '../public/shared/persona-api.js';

function respuesta(datos, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(datos) };
}

describe('Integración controlada de la API DNI/RUC', () => {
  it('rechaza DNI y RUC con formato inválido sin llamar a la red', async () => {
    const fetchImpl = vi.fn();
    await expect(consultarPersona('dni', '123', { fetchImpl })).rejects.toThrow('8 dígitos');
    await expect(consultarPersona('ruc', '201', { fetchImpl })).rejects.toThrow('11 dígitos');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('normaliza el nombre devuelto para un DNI válido', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta({
      nombres: 'ANA MARÍA', apellidoPaterno: 'PÉREZ', apellidoMaterno: 'RÍOS'
    }));
    await expect(consultarPersona('dni', '12345678', { fetchImpl, apiUrl: 'https://api.test' })).resolves.toEqual({
      documento: '12345678', nombre: 'ANA MARÍA PÉREZ RÍOS'
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.test?tipo=dni&numero=12345678');
  });

  it('acepta únicamente una empresa activa y habida', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta({
      razonSocial: 'BURGER LOCAL SAC', direccion: 'Trujillo', estado: 'ACTIVO', condicion: 'HABIDO'
    }));
    await expect(consultarPersona('ruc', '20123456789', { fetchImpl })).resolves.toMatchObject({
      ruc: '20123456789', razonSocial: 'BURGER LOCAL SAC', estado: 'ACTIVO', condicion: 'HABIDO'
    });
  });

  it('rechaza empresa inactiva o no habida', async () => {
    const inactiva = vi.fn().mockResolvedValue(respuesta({ razonSocial: 'X', estado: 'BAJA', condicion: 'HABIDO' }));
    const noHabida = vi.fn().mockResolvedValue(respuesta({ razonSocial: 'X', estado: 'ACTIVO', condicion: 'NO HABIDO' }));
    await expect(consultarPersona('ruc', '20123456789', { fetchImpl: inactiva })).rejects.toThrow('BAJA');
    await expect(consultarPersona('ruc', '20123456789', { fetchImpl: noHabida })).rejects.toThrow('NO HABIDO');
  });

  it('convierte errores HTTP y de red en mensajes controlados', async () => {
    await expect(consultarPersona('dni', '12345678', {
      fetchImpl: vi.fn().mockResolvedValue(respuesta({}, false))
    })).rejects.toThrow('Error de conexión');
    await expect(consultarPersona('ruc', '20123456789', {
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline'))
    })).rejects.toThrow('Error de conexión');
  });

  it('no inventa personas o empresas cuando el proveedor no devuelve datos', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respuesta({}));
    await expect(consultarPersona('dni', '12345678', { fetchImpl })).rejects.toThrow('DNI no encontrado');
    await expect(consultarPersona('ruc', '20123456789', { fetchImpl })).rejects.toThrow('RUC no encontrado');
  });
});
