import { describe, expect, it } from 'vitest';
import { normalizarNombreProducto, validarProducto } from '../public/shared/admin-rules.js';

describe('HU-11 Gestionar productos', () => {
  it('CP-HU11-01 | CA01 acepta nombre, precio positivo y tipo permitido', () => {
    expect(validarProducto({ nombre: 'Hamburguesa', precio: 15, tipo: 'Con preparación' })).toEqual({ valido: true, errores: [] });
  });

  it('CP-HU11-02 | CA01 rechaza precio no positivo y tipo desconocido', () => {
    const resultado = validarProducto({ nombre: 'Hamburguesa', precio: 0, tipo: 'Otro' });
    expect(resultado.errores).toEqual(expect.arrayContaining(['PRECIO_INVALIDO', 'TIPO_INVALIDO']));
  });

  it('CP-HU11-03 | CA02 detecta nombres duplicados sin distinguir espacios o mayúsculas', () => {
    const existentes = [{ id: 'p1', nombre: 'Hamburguesa Royal' }];
    const resultado = validarProducto({ nombre: '  hamburguesa   ROYAL ', precio: 20, tipo: 'Con preparación' }, existentes);
    expect(resultado.errores).toContain('NOMBRE_DUPLICADO');
    expect(normalizarNombreProducto('  Hamburguesa   Royal ')).toBe('hamburguesa royal');
  });

  it('CP-HU11-04 | CA04 permite editar el mismo producto', () => {
    const existentes = [{ id: 'p1', nombre: 'Hamburguesa' }];
    expect(validarProducto({ id: 'p1', nombre: 'Hamburguesa', precio: 16, tipo: 'Con preparación' }, existentes).valido).toBe(true);
  });

  it('CP-HU11-05 | CA05 solo admite los dos tipos definidos', () => {
    expect(validarProducto({ nombre: 'Gaseosa', precio: 5, tipo: 'Servicio inmediato' }).valido).toBe(true);
    expect(validarProducto({ nombre: 'Gaseosa', precio: 5, tipo: 'Inventario' }).valido).toBe(false);
  });
});
