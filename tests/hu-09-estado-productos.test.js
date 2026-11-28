import { describe, expect, it } from 'vitest';
import {
  avanzarProducto,
  iniciarPreparacionGeneral,
  puedeIniciarPreparacionGeneral,
  siguienteEstadoProducto
} from '../public/shared/cocina-rules.js';

describe('HU-09 Actualizar estado de productos', () => {
  it('CP-HU09-01 | CA01 aplica ciclo completo a productos con preparación', () => {
    const producto = { tipo: 'Con preparación', estado: 'Pendiente' };
    expect(siguienteEstadoProducto(producto)).toBe('En preparación');
    expect(siguienteEstadoProducto({ ...producto, estado: 'En preparación' })).toBe('Listo');
  });

  it('CP-HU09-02 | CA01 envía servicios inmediatos directamente a Listo', () => {
    expect(siguienteEstadoProducto({ tipo: 'Servicio inmediato', estado: 'Pendiente' })).toBe('Listo');
  });

  it('CP-HU09-03 | CA02 impide saltar o retroceder estados', () => {
    expect(siguienteEstadoProducto({ tipo: 'Con preparación', estado: 'Listo' })).toBeNull();
    expect(() => avanzarProducto({ tipo: 'Con preparación', estado: 'Listo' })).toThrow('no puede avanzar');
  });

  it('CP-HU09-04 | CA04 habilita acción general solo al inicio', () => {
    expect(puedeIniciarPreparacionGeneral([{ tipo: 'Con preparación', estado: 'Pendiente' }])).toBe(true);
    expect(puedeIniciarPreparacionGeneral([{ tipo: 'Con preparación', estado: 'En preparación' }])).toBe(false);
  });

  it('CP-HU09-05 | CA04 inicia preparados sin afectar servicios inmediatos', () => {
    const resultado = iniciarPreparacionGeneral([
      { id: 'p1', tipo: 'Con preparación', estado: 'Pendiente' },
      { id: 'p2', tipo: 'Servicio inmediato', estado: 'Pendiente' }
    ]);
    expect(resultado.productos.map((p) => p.estado)).toEqual(['En preparación', 'Pendiente']);
    expect(resultado.estadoGeneral).toBe('En preparación');
  });

  it('CP-HU09-06 | CA09 mantiene un producto listo sin retroceso', () => {
    expect(siguienteEstadoProducto({ tipo: 'Servicio inmediato', estado: 'Listo' })).toBeNull();
  });
});
