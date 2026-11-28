import { describe, expect, it } from 'vitest';
import {
  accionesIncidenciaPermitidas, calcularEstadoPedido, esDelDia,
  filtrarPedidos, indicadorIncidencia, limpiarCodigo,
  pedidosRecientes, puedeConfirmarEntrega
} from '../public/shared/consulta-pedidos-rules.js';

describe('HU-03 - Consultar pedidos', () => {
  it('limpia almohadillas repetidas', () => expect(limpiarCodigo('###A12')).toBe('A12'));

  it('filtra por comprobante y código', () => {
    const pedidos = [{ codigo: '#A1', comprobante: 'B001-000001' }, { codigo: '#B2', comprobante: 'F001-000002' }];
    expect(filtrarPedidos(pedidos, '000002')).toHaveLength(1);
    expect(filtrarPedidos(pedidos, '#A1')).toHaveLength(1);
    expect(filtrarPedidos(pedidos, 'sin-coincidencia')).toEqual([]);
  });

  it('devuelve como máximo los diez más recientes', () => {
    const pedidos = Array.from({ length: 12 }, (_, i) => ({ id: i, fechaRegistro: new Date(2026, 0, 1, 0, i) }));
    const resultado = pedidosRecientes(pedidos);
    expect(resultado).toHaveLength(10);
    expect(resultado[0].id).toBe(11);
  });

  it('distingue pedidos del día', () => {
    const hoy = new Date(2026, 10, 27, 10);
    expect(esDelDia(new Date(2026, 10, 27, 1), hoy)).toBe(true);
    expect(esDelDia(new Date(2026, 10, 26, 23), hoy)).toBe(false);
  });

  it.each([
    [[{ estado: 'Pendiente' }], 'Pendiente'],
    [[{ estado: 'Listo' }, { estado: 'Pendiente' }], 'En preparación'],
    [[{ estado: 'En preparación' }], 'En preparación'],
    [[{ estado: 'Listo' }, { estado: 'Listo' }], 'Listo']
  ])('calcula el estado general', (productos, esperado) => {
    expect(calcularEstadoPedido(productos)).toBe(esperado);
  });

  it('solo permite confirmar entrega de un pedido listo', () => {
    expect(puedeConfirmarEntrega({ estadoGeneral: 'Listo' })).toBe(true);
    expect(puedeConfirmarEntrega({ estadoGeneral: 'En preparación' })).toBe(false);
  });

  it('solo habilita incidencias para pedidos entregados', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Pendiente' })).toEqual([]);
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado' })).toEqual(['reposicion', 'devolucion']);
  });

  it('en una reposición entregada solo permite devolución', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', esReposicion: true })).toEqual(['devolucion']);
  });

  it('cierra incidencias después de registrar una solución', () => {
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', tieneReposicion: true })).toEqual([]);
    expect(accionesIncidenciaPermitidas({ estadoGeneral: 'Entregado', tieneDevolucion: true })).toEqual([]);
  });

  it('prioriza el indicador de devolución procesada', () => {
    expect(indicadorIncidencia({ tieneReposicion: true, tieneDevolucion: true, estadoDevolucion: 'Procesada' })).toBe('Devolución procesada');
  });
});
