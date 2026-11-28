import { describe, expect, it } from 'vitest';
import {
  cantidadReclamoValida,
  motivoValido,
  puedeRegistrarIncidencia,
  puedeReponerProducto,
  unidadesReclamables
} from '../public/shared/incidencia-rules.js';

const producto = { id: 'p1', nombre: 'Hamburguesa', cantidad: 3, unidadesRepuestas: 1, unidadesDevueltas: 0 };

describe('HU-04 Registrar reposición', () => {
  it('CP-HU04-01 | CA01 exige pedido entregado', () => {
    expect(puedeRegistrarIncidencia({ estadoGeneral: 'Entregado' })).toBe(true);
    expect(puedeRegistrarIncidencia({ estadoGeneral: 'Listo' })).toBe(false);
  });

  it('CP-HU04-02 | CA01 descuenta unidades ya atendidas', () => {
    expect(unidadesReclamables(producto)).toBe(2);
    expect(cantidadReclamoValida(producto, 2)).toBe(true);
    expect(cantidadReclamoValida(producto, 3)).toBe(false);
  });

  it('CP-HU04-03 | CA02 valida motivo fijo y observación para Otro', () => {
    expect(motivoValido('Producto incorrecto')).toBe(true);
    expect(motivoValido('Otro', 'Faltó un ingrediente')).toBe(true);
    expect(motivoValido('Otro', 'Corto')).toBe(false);
  });

  it('CP-HU04-04 | CA02 limita la observación a 250 caracteres', () => {
    expect(motivoValido('Producto en mal estado', 'a'.repeat(250))).toBe(true);
    expect(motivoValido('Producto en mal estado', 'a'.repeat(251))).toBe(false);
  });

  it('CP-HU04-05 | CA03 permite únicamente el mismo producto disponible', () => {
    expect(puedeReponerProducto(producto, { id: 'p1', disponible: true })).toBe(true);
    expect(puedeReponerProducto(producto, { id: 'p2', nombre: 'Papas', disponible: true })).toBe(false);
  });

  it('CP-HU04-06 | CA04 rechaza el producto original no disponible', () => {
    expect(puedeReponerProducto(producto, { id: 'p1', disponible: false })).toBe(false);
  });

  it('CP-HU04-07 | CA01 rechaza una cantidad de reposición igual a cero', () => {
    expect(cantidadReclamoValida(producto, 1)).toBe(true);
    expect(cantidadReclamoValida(producto, 0)).toBe(false);
  });
});
