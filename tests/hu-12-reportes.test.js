import { describe, expect, it } from 'vitest';
import { calcularResumenVentas, rangoFechasValido, resumenMotivos } from '../public/shared/admin-rules.js';

const pedidos = [
  { total: 30, modalidadPago: 'Efectivo', productos: [{ id: 'p1', nombre: 'Hamburguesa', cantidad: 2, precio: 15 }] },
  { total: 20, modalidadPago: 'Híbrido', pagoHibridoYape: 10, pagoHibridoPlin: 10, productos: [{ id: 'p2', nombre: 'Papas', cantidad: 2, precio: 10 }] },
  { total: 0, modalidadPago: 'Sin costo (S/ 0.00)', esReposicion: true, productos: [{ id: 'p1', nombre: 'Hamburguesa', cantidad: 1, precio: 15 }] }
];

describe('HU-12 Consultar ganancias e incidencias', () => {
  it('CP-HU12-01 | CA01 valida rangos cronológicos', () => {
    expect(rangoFechasValido('2026-11-01', '2026-11-27')).toBe(true);
    expect(rangoFechasValido('2026-11-27', '2026-11-01')).toBe(false);
  });

  it('CP-HU12-02 | CA04 y CA05 calcula ventas y modalidades, excluyendo el costo de reposición', () => {
    const resumen = calcularResumenVentas(pedidos);
    expect(resumen.ventasBrutas).toBe(50);
    expect(resumen.pagos).toMatchObject({ Efectivo: 30, Yape: 10, Plin: 10, Transferencia: 0 });
  });

  it('CP-HU12-03 | CA06 y CA07 agrupa productos y resta reembolsos procesados', () => {
    const devoluciones = [{ estado: 'Procesada', monto: 15, fechaProcesado: '2026-11-27T12:00:00Z' }];
    const resumen = calcularResumenVentas(pedidos, devoluciones, '2026-11-27', '2026-11-27');
    expect(resumen.neto).toBe(35);
    expect(resumen.productos.find((p) => p.id === 'p1')).toMatchObject({ cantidad: 3, monto: 45 });
  });

  it('CP-HU12-04 | CA11 resume la cantidad de incidencias por motivo', () => {
    expect(resumenMotivos([{ motivo: 'Producto incorrecto' }, { motivo: 'Producto incorrecto' }, { motivo: 'Otro' }])).toEqual({ 'Producto incorrecto': 2, Otro: 1 });
  });
});
