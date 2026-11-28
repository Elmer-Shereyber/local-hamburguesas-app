import { describe, expect, it } from 'vitest';
import { ordenarColaCocina, pedidoVisibleEnCocina } from '../public/shared/cocina-rules.js';

describe('HU-08 Visualizar pedidos en cocina', () => {
  it('CP-HU08-01 | CA01 muestra pendientes, en preparación y listos, no entregados', () => {
    expect(pedidoVisibleEnCocina({ estadoGeneral: 'Pendiente' })).toBe(true);
    expect(pedidoVisibleEnCocina({ estadoGeneral: 'En preparación' })).toBe(true);
    expect(pedidoVisibleEnCocina({ estadoGeneral: 'Listo' })).toBe(true);
    expect(pedidoVisibleEnCocina({ estadoGeneral: 'Entregado' })).toBe(false);
  });

  it('CP-HU08-02 | CA03 prioriza en preparación, reposición y pendiente', () => {
    const pedidos = [
      { id: 'normal', estadoGeneral: 'Pendiente', fechaRegistro: '2026-11-27T10:00:00Z' },
      { id: 'repo', estadoGeneral: 'Pendiente', esReposicion: true, fechaRegistro: '2026-11-27T11:00:00Z' },
      { id: 'curso', estadoGeneral: 'En preparación', fechaTomado: '2026-11-27T12:00:00Z' }
    ];
    expect(ordenarColaCocina(pedidos).map((p) => p.id)).toEqual(['curso', 'repo', 'normal']);
  });

  it('CP-HU08-03 | CA04 conserva el orden de los pedidos en preparación', () => {
    const pedidos = [
      { id: 'segundo', estadoGeneral: 'En preparación', fechaTomado: '2026-11-27T11:00:00Z' },
      { id: 'primero', estadoGeneral: 'En preparación', fechaTomado: '2026-11-27T10:00:00Z' },
      { id: 'repo', estadoGeneral: 'Pendiente', esReposicion: true, fechaRegistro: '2026-11-27T09:00:00Z' }
    ];
    expect(ordenarColaCocina(pedidos).map((p) => p.id)).toEqual(['primero', 'segundo', 'repo']);
  });
});
