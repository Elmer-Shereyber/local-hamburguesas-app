import { describe, expect, it } from 'vitest';
import {
  alternarDisponibilidad, avanzarProducto, iniciarPreparacionGeneral,
  ordenarColaCocina, pedidoVisibleEnCocina, puedeIniciarPreparacionGeneral,
  siguienteEstadoProducto
} from '../public/shared/cocina-rules.js';

describe('HU-07 - Disponibilidad', () => {
  it('alterna disponibilidad sin mutar el producto', () => {
    const original = { id: 'p1', disponible: true };
    const nuevo = alternarDisponibilidad(original);
    expect(nuevo.disponible).toBe(false);
    expect(original.disponible).toBe(true);
  });
});

describe('HU-08 - Cola de cocina', () => {
  it.each([['Pendiente', true], ['En preparación', true], ['Listo', true], ['Entregado', false]])('visibilidad de %s', (estado, visible) => {
    expect(pedidoVisibleEnCocina({ estadoGeneral: estado })).toBe(visible);
  });
  it('prioriza en preparación, reposiciones y pendientes', () => {
    const pedidos = [
      { id: 'normal', estadoGeneral: 'Pendiente', fechaRegistro: '2026-01-01T10:00:00' },
      { id: 'repo', estadoGeneral: 'Pendiente', esReposicion: true, fechaRegistro: '2026-01-01T11:00:00' },
      { id: 'curso', estadoGeneral: 'En preparación', fechaTomado: '2026-01-01T12:00:00' },
      { id: 'entregado', estadoGeneral: 'Entregado' }
    ];
    expect(ordenarColaCocina(pedidos).map((p) => p.id)).toEqual(['curso', 'repo', 'normal']);
  });
});

describe('HU-09 - Estados de productos', () => {
  it('respeta ciclo de producto con preparación', () => {
    expect(siguienteEstadoProducto({ tipo: 'Con preparación', estado: 'Pendiente' })).toBe('En preparación');
    expect(siguienteEstadoProducto({ tipo: 'Con preparación', estado: 'En preparación' })).toBe('Listo');
    expect(siguienteEstadoProducto({ tipo: 'Con preparación', estado: 'Listo' })).toBeNull();
  });
  it('servicio inmediato pasa directo a listo', () => {
    expect(avanzarProducto({ tipo: 'Servicio inmediato', estado: 'Pendiente' }).estado).toBe('Listo');
  });
  it('no retrocede ni avanza un producto listo', () => {
    expect(() => avanzarProducto({ tipo: 'Con preparación', estado: 'Listo' })).toThrow();
  });
  it('habilita acción general solo cuando todos los preparados están pendientes', () => {
    expect(puedeIniciarPreparacionGeneral([{ tipo: 'Con preparación', estado: 'Pendiente' }, { tipo: 'Servicio inmediato', estado: 'Pendiente' }])).toBe(true);
    expect(puedeIniciarPreparacionGeneral([{ tipo: 'Con preparación', estado: 'En preparación' }])).toBe(false);
  });
  it('inicia preparados sin afectar servicios inmediatos', () => {
    const r = iniciarPreparacionGeneral([{ tipo: 'Con preparación', estado: 'Pendiente' }, { tipo: 'Servicio inmediato', estado: 'Pendiente' }]);
    expect(r.productos.map((p) => p.estado)).toEqual(['En preparación', 'Pendiente']);
    expect(r.estadoGeneral).toBe('En preparación');
  });
});
