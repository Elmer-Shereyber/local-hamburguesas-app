import { describe, expect, it } from 'vitest';
import {
  accionesIncidenciaPermitidas,
  calcularEstadoPedido,
  esDelDia,
  filtrarPedidos,
  indicadorIncidencia,
  pedidosRecientes,
  puedeConfirmarEntrega
} from '../public/shared/consulta-pedidos-rules.js';

describe('HU-03 Consultar pedidos', () => {
  it('CP-HU03-01 | CA01 devuelve como máximo los diez pedidos más recientes', () => {
    const pedidos = Array.from({ length: 12 }, (_, i) => ({ id: i, fechaRegistro: new Date(2026, 0, 1, 0, i) }));
    expect(pedidosRecientes(pedidos)).toHaveLength(10);
    expect(pedidosRecientes(pedidos)[0].id).toBe(11);
  });

  it('CP-HU03-02 | CA02 filtra por comprobante o código', () => {
    const pedidos = [{ codigo: '#A01', comprobante: 'B001-000001' }, { codigo: '#A02', comprobante: 'F001-000002' }];
    expect(filtrarPedidos(pedidos, 'F001')).toEqual([pedidos[1]]);
    expect(filtrarPedidos(pedidos, '#A01')).toEqual([pedidos[0]]);
  });

  it('CP-HU03-03 | CA03 distingue pedidos del día actual', () => {
    const hoy = new Date(2026, 10, 27, 12);
    expect(esDelDia(new Date(2026, 10, 27, 8), hoy)).toBe(true);
    expect(esDelDia(new Date(2026, 10, 26, 23), hoy)).toBe(false);
  });

  it('CP-HU03-04 | CA05 calcula los estados generales', () => {
    expect(calcularEstadoPedido([{ estado: 'Pendiente' }])).toBe('Pendiente');
    expect(calcularEstadoPedido([{ estado: 'En preparación' }, { estado: 'Pendiente' }])).toBe('En preparación');
    expect(calcularEstadoPedido([{ estado: 'Listo' }, { estado: 'Listo' }])).toBe('Listo');
  });

  it('CP-HU03-05 | CA06 y CA08 solo permiten entregar un pedido listo', () => {
    expect(puedeConfirmarEntrega({ estadoGeneral: 'Listo' })).toBe(true);
    expect(puedeConfirmarEntrega({ estadoGeneral: 'En preparación' })).toBe(false);
  });

  it('CP-HU03-06 | CA10 prioriza el indicador de devolución procesada', () => {
    expect(indicadorIncidencia({ estadoDevolucion: 'Procesada', tieneReposicion: true })).toBe('Devolución procesada');
    expect(indicadorIncidencia({ tieneReposicion: true })).toBe('Con reposición');
  });

  it('CP-HU03-07 | CA11 solo habilita incidencias en pedidos entregados', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Listo' })).toEqual([]);
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado' })).toEqual(['reposicion', 'devolucion']);
  });

  it('CP-HU03-08 | CA11 impide una segunda reposición', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', esReposicion: true })).toEqual(['devolucion']);
  });

  it('CP-HU03-09 | CA12 conserva el estado entregado al mostrar una incidencia', () => {
    const pedido = { estadoGeneral: 'Entregado', tieneReposicion: true };
    expect(indicadorIncidencia(pedido)).toBe('Con reposición');
    expect(pedido.estadoGeneral).toBe('Entregado');
  });

  it('CP-HU03-10 | CA15 cierra las acciones después de una solución inicial', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', tieneDevolucion: true })).toEqual([]);
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', tieneReposicion: true })).toEqual([]);
  });
});
