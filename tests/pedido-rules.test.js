import { describe, expect, it } from 'vitest';

import {
  MAX_CARACTERES_DETALLE,
  MODALIDADES_PAGO,
  calcularTotalPedido,
  contarMediosHibridosUsados,
  crearBorradorPedido,
  crearSnapshotProductos,
  esCantidadValida,
  esDetalleValido,
  esModalidadPagoValida,
  esPagoHibridoValido,
  esProductoDisponible,
  sumarPagoHibrido,
  validarBorradorPedido
} from '../public/shared/pedido-rules.js';

function crearProducto(cambios = {}) {
  return {
    id: 'prod-01',
    nombre: 'Hamburguesa clásica',
    precio: 15,
    tipo: 'Con preparación',
    disponible: true,
    ...cambios
  };
}

function crearItemCarrito(cambios = {}) {
  return {
    producto: crearProducto(),
    cantidad: 1,
    ...cambios
  };
}

describe('HU-01 - Registrar pedido', () => {
  describe('CA01 - Disponibilidad de productos', () => {
    it('permite seleccionar un producto disponible', () => {
      expect(
        esProductoDisponible(crearProducto({ disponible: true }))
      ).toBe(true);
    });

    it('rechaza un producto no disponible', () => {
      expect(
        esProductoDisponible(crearProducto({ disponible: false }))
      ).toBe(false);
    });

    it('rechaza un producto inexistente', () => {
      expect(esProductoDisponible(null)).toBe(false);
    });
  });

  describe('CA02 y CA03 - Productos y cantidades', () => {
    it.each([1, 5, 10])(
      'acepta la cantidad válida %s',
      (cantidad) => {
        expect(esCantidadValida(cantidad)).toBe(true);
      }
    );

    it.each([0, 11, -1, 1.5, '1', null, undefined])(
      'rechaza la cantidad inválida %s',
      (cantidad) => {
        expect(esCantidadValida(cantidad)).toBe(false);
      }
    );

    it('rechaza un pedido sin productos', () => {
      const resultado = validarBorradorPedido({
        productos: [],
        modalidadPago: 'Efectivo'
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toContain('SIN_PRODUCTOS');
    });

    it('rechaza un producto con cantidad superior a 10', () => {
      const resultado = validarBorradorPedido({
        productos: [
          crearItemCarrito({ cantidad: 11 })
        ],
        modalidadPago: 'Efectivo'
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toContain('CANTIDAD_INVALIDA_0');
    });
  });

  describe('CA04 - Detalle opcional de máximo 300 caracteres', () => {
    it('acepta un detalle vacío', () => {
      expect(esDetalleValido('')).toBe(true);
    });

    it('acepta que el detalle no sea enviado', () => {
      expect(esDetalleValido(undefined)).toBe(true);
    });

    it('acepta un detalle con exactamente 300 caracteres', () => {
      const detalle = 'a'.repeat(MAX_CARACTERES_DETALLE);

      expect(detalle).toHaveLength(300);
      expect(esDetalleValido(detalle)).toBe(true);
    });

    it('rechaza un detalle con 301 caracteres', () => {
      const detalle = 'a'.repeat(MAX_CARACTERES_DETALLE + 1);

      expect(detalle).toHaveLength(301);
      expect(esDetalleValido(detalle)).toBe(false);
    });

    it('rechaza un detalle que no sea texto', () => {
      expect(esDetalleValido(123)).toBe(false);
    });
  });

  describe('CA05 - Cálculo automático del total', () => {
    it('calcula el total de un producto', () => {
      const productos = [
        {
          precio: 15,
          cantidad: 2
        }
      ];

      expect(calcularTotalPedido(productos)).toBe(30);
    });

    it('calcula el total de varios productos', () => {
      const productos = [
        {
          precio: 15,
          cantidad: 2
        },
        {
          precio: 4.5,
          cantidad: 1
        }
      ];

      expect(calcularTotalPedido(productos)).toBe(34.5);
    });

    it('acepta la estructura utilizada por el carrito', () => {
      const carrito = [
        crearItemCarrito({
          producto: crearProducto({ precio: 18.5 }),
          cantidad: 2
        })
      ];

      expect(calcularTotalPedido(carrito)).toBe(37);
    });

    it('redondea el total a dos decimales', () => {
      const productos = [
        {
          precio: 10.999,
          cantidad: 1
        }
      ];

      expect(calcularTotalPedido(productos)).toBe(11);
    });

    it('rechaza precios iguales o menores que cero', () => {
      expect(() => {
        calcularTotalPedido([
          {
            precio: 0,
            cantidad: 1
          }
        ]);
      }).toThrow('precio positivo');
    });

    it('rechaza cantidades inválidas al calcular', () => {
      expect(() => {
        calcularTotalPedido([
          {
            precio: 15,
            cantidad: 11
          }
        ]);
      }).toThrow('entero entre 1 y 10');
    });
  });

  describe('CA06 - Modalidades de pago', () => {
    it.each(MODALIDADES_PAGO)(
      'acepta la modalidad %s',
      (modalidad) => {
        expect(esModalidadPagoValida(modalidad)).toBe(true);
      }
    );

    it.each([
      '',
      'Tarjeta',
      'Bitcoin',
      'efectivo',
      null,
      undefined
    ])(
      'rechaza la modalidad no permitida %s',
      (modalidad) => {
        expect(esModalidadPagoValida(modalidad)).toBe(false);
      }
    );
  });

  describe('CA07 - Pago híbrido', () => {
    it('suma los montos de todos los medios', () => {
      const pagos = {
        efectivo: 10,
        yape: 5,
        plin: 2.5,
        transferencia: 7.5
      };

      expect(sumarPagoHibrido(pagos)).toBe(25);
    });

    it('considera como cero los medios no utilizados', () => {
      const pagos = {
        efectivo: 10,
        yape: 5
      };

      expect(sumarPagoHibrido(pagos)).toBe(15);
    });

    it('rechaza montos negativos', () => {
      expect(() => {
        sumarPagoHibrido({
          efectivo: -1,
          yape: 16
        });
      }).toThrow('igual o mayor que cero');
    });

    it('rechaza montos que no sean numéricos', () => {
      expect(() => {
        sumarPagoHibrido({
          efectivo: '10',
          yape: 5
        });
      }).toThrow('igual o mayor que cero');
    });

    it('cuenta únicamente medios con monto positivo', () => {
      const pagos = {
        efectivo: 10,
        yape: 5,
        plin: 0,
        transferencia: 0
      };

      expect(contarMediosHibridosUsados(pagos)).toBe(2);
    });

    it('acepta dos medios cuya suma coincide con el total', () => {
      const pagos = {
        efectivo: 10,
        yape: 5
      };

      expect(esPagoHibridoValido(15, pagos)).toBe(true);
    });

    it('acepta montos decimales exactos en céntimos', () => {
      const pagos = {
        efectivo: 0.1,
        yape: 0.2
      };

      expect(esPagoHibridoValido(0.3, pagos)).toBe(true);
    });

    it('rechaza usar un solo medio como pago híbrido', () => {
      const pagos = {
        efectivo: 15
      };

      expect(esPagoHibridoValido(15, pagos)).toBe(false);
    });

    it('rechaza una suma inferior al total', () => {
      const pagos = {
        efectivo: 5,
        yape: 5
      };

      expect(esPagoHibridoValido(15, pagos)).toBe(false);
    });

    it('rechaza una suma superior al total', () => {
      const pagos = {
        efectivo: 10,
        yape: 10
      };

      expect(esPagoHibridoValido(15, pagos)).toBe(false);
    });

    it('rechaza un total igual a cero', () => {
      expect(
        esPagoHibridoValido(0, {
          efectivo: 0,
          yape: 0
        })
      ).toBe(false);
    });
  });

  describe('CA09 - Validación integral', () => {
    it('acepta un pedido completo con pago simple', () => {
      const resultado = validarBorradorPedido({
        productos: [crearItemCarrito()],
        detalle: '',
        modalidadPago: 'Efectivo'
      });

      expect(resultado).toEqual({
        valido: true,
        errores: []
      });
    });

    it('acepta un pedido completo con pago híbrido', () => {
      const resultado = validarBorradorPedido({
        productos: [crearItemCarrito()],
        detalle: 'Sin mayonesa',
        modalidadPago: 'Híbrido',
        pagosHibridos: {
          efectivo: 10,
          yape: 5
        }
      });

      expect(resultado).toEqual({
        valido: true,
        errores: []
      });
    });

    it('rechaza un producto no disponible', () => {
      const resultado = validarBorradorPedido({
        productos: [
          crearItemCarrito({
            producto: crearProducto({ disponible: false })
          })
        ],
        modalidadPago: 'Efectivo'
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toContain(
        'PRODUCTO_NO_DISPONIBLE_0'
      );
    });

    it('rechaza una modalidad desconocida', () => {
      const resultado = validarBorradorPedido({
        productos: [crearItemCarrito()],
        modalidadPago: 'Tarjeta'
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toContain('MODALIDAD_INVALIDA');
    });

    it('puede reportar varios errores simultáneamente', () => {
      const resultado = validarBorradorPedido({
        productos: [
          crearItemCarrito({
            producto: crearProducto({ disponible: false }),
            cantidad: 11
          })
        ],
        detalle: 'a'.repeat(301),
        modalidadPago: 'Tarjeta'
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toEqual(
        expect.arrayContaining([
          'PRODUCTO_NO_DISPONIBLE_0',
          'CANTIDAD_INVALIDA_0',
          'DETALLE_INVALIDO',
          'MODALIDAD_INVALIDA'
        ])
      );
    });
  });

  describe('CA10 - Creación del borrador', () => {
    it('crea un snapshot sin modificar el carrito original', () => {
      const carrito = [
        crearItemCarrito({
          cantidad: 2
        })
      ];

      const snapshot = crearSnapshotProductos(carrito);

      expect(snapshot).toEqual([
        {
          id: 'prod-01',
          nombre: 'Hamburguesa clásica',
          precio: 15,
          tipo: 'Con preparación',
          cantidad: 2,
          estado: 'Pendiente'
        }
      ]);

      expect(snapshot).not.toBe(carrito);
      expect(snapshot[0]).not.toBe(carrito[0]);
      expect(carrito[0].producto.disponible).toBe(true);
    });

    it('crea un borrador completo para sessionStorage', () => {
      const borrador = crearBorradorPedido({
        carrito: [
          crearItemCarrito({
            cantidad: 2
          })
        ],
        detalle: '  Sin cebolla  ',
        modalidadPago: 'Híbrido',
        pagosHibridos: {
          efectivo: 20,
          yape: 10
        }
      });

      expect(borrador).toEqual({
        productos: [
          {
            id: 'prod-01',
            nombre: 'Hamburguesa clásica',
            precio: 15,
            tipo: 'Con preparación',
            cantidad: 2,
            estado: 'Pendiente'
          }
        ],
        total: 30,
        detalle: 'Sin cebolla',
        modalidadPago: 'Híbrido',
        pagoHibridoEfectivo: 20,
        pagoHibridoYape: 10,
        pagoHibridoPlin: 0,
        pagoHibridoTransferencia: 0,
        estadoGeneral: 'Pendiente'
      });
    });

    it('no permite crear un borrador inválido', () => {
      expect(() => {
        crearBorradorPedido({
          carrito: [],
          detalle: '',
          modalidadPago: ''
        });
      }).toThrow('Borrador inválido');
    });
  });
});
