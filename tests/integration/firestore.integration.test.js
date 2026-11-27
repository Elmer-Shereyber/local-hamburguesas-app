import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const PROJECT_ID = 'demo-burger-local';
let entorno;

function contexto(uid, email) {
  return entorno.authenticatedContext(uid, { email });
}

async function sembrarBase() {
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usuarios', 'cajera'), {
      usuario: 'cajera01', usuarioLower: 'cajera01', rol: 'cajera', email: 'cajera01@burger.local'
    });
    await setDoc(doc(db, 'usuarios', 'cocina'), {
      usuario: 'cocina01', usuarioLower: 'cocina01', rol: 'cocina', email: 'cocina01@burger.local'
    });
    await setDoc(doc(db, 'configuracion', 'negocio'), {
      serieBoleta: 'B001', correlativoBoleta: 0
    });
    await setDoc(doc(db, 'productos', 'hamburguesa'), {
      nombre: 'Hamburguesa', precio: 15, tipo: 'Con preparación', disponible: true
    });
  });
}

beforeAll(async () => {
  entorno = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: readFileSync(resolve(process.cwd(), 'firestore.test.rules'), 'utf8')
    }
  });
});

afterEach(async () => {
  await entorno.clearFirestore();
});

afterAll(async () => {
  await entorno?.cleanup();
});

describe('Integración Firestore de roles y flujos críticos', () => {
  it('rechaza lecturas sin autenticación', async () => {
    await sembrarBase();
    const db = entorno.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'productos', 'hamburguesa')));
  });

  it('permite que cualquier cuenta autenticada consulte productos', async () => {
    await sembrarBase();
    const db = contexto('cajera-uid', 'cajera01@burger.local').firestore();
    const producto = await assertSucceeds(getDoc(doc(db, 'productos', 'hamburguesa')));
    expect(producto.data().nombre).toBe('Hamburguesa');
  });

  it('permite al administrador crear productos y bloquea a la cajera', async () => {
    await sembrarBase();
    const adminDb = contexto('admin-uid', 'admin@empresa.pe').firestore();
    const cajeraDb = contexto('cajera-uid', 'cajera01@burger.local').firestore();

    await assertSucceeds(setDoc(doc(adminDb, 'productos', 'papas'), {
      nombre: 'Papas', precio: 8, tipo: 'Con preparación', disponible: true
    }));
    await assertFails(setDoc(doc(cajeraDb, 'productos', 'gaseosa'), {
      nombre: 'Gaseosa', precio: 5, tipo: 'Servicio inmediato', disponible: true
    }));
  });

  it('cocina solo puede cambiar disponibilidad del catálogo', async () => {
    await sembrarBase();
    const db = contexto('cocina-uid', 'cocina01@burger.local').firestore();
    const referencia = doc(db, 'productos', 'hamburguesa');

    await assertSucceeds(updateDoc(referencia, { disponible: false }));
    await assertFails(updateDoc(referencia, { precio: 1 }));
  });

  it('cajera registra pedidos y cocina avanza sus estados sin poder eliminarlos', async () => {
    await sembrarBase();
    const cajeraDb = contexto('cajera-uid', 'cajera01@burger.local').firestore();
    const cocinaDb = contexto('cocina-uid', 'cocina01@burger.local').firestore();
    const pedido = doc(cajeraDb, 'pedidos', 'pedido-001');

    await assertSucceeds(setDoc(pedido, {
      codigo: '#001', estadoGeneral: 'Pendiente', productos: [{ id: 'hamburguesa', estado: 'Pendiente' }]
    }));
    await assertSucceeds(updateDoc(doc(cocinaDb, 'pedidos', 'pedido-001'), {
      estadoGeneral: 'En preparación', productos: [{ id: 'hamburguesa', estado: 'En preparación' }]
    }));
  });

  it('cocina no puede crear pedidos ni solicitudes de devolución', async () => {
    await sembrarBase();
    const db = contexto('cocina-uid', 'cocina01@burger.local').firestore();
    await assertFails(addDoc(collection(db, 'pedidos'), { estadoGeneral: 'Pendiente' }));
    await assertFails(addDoc(collection(db, 'devoluciones'), { estado: 'Solicitada', monto: 10 }));
  });

  it('cajera solicita devolución y solo administración puede procesarla', async () => {
    await sembrarBase();
    const cajeraDb = contexto('cajera-uid', 'cajera01@burger.local').firestore();
    const adminDb = contexto('admin-uid', 'admin@empresa.pe').firestore();
    const referencia = doc(cajeraDb, 'devoluciones', 'dev-001');

    await assertSucceeds(setDoc(referencia, { estado: 'Solicitada', monto: 15 }));
    await assertFails(updateDoc(referencia, { estado: 'Procesada' }));
    await assertSucceeds(updateDoc(doc(adminDb, 'devoluciones', 'dev-001'), {
      estado: 'Procesada', comprobanteNombre: 'voucher.pdf'
    }));
  });

  it('administración cierra la devolución en el pedido sin poder alterar la venta', async () => {
    await sembrarBase();
    await entorno.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'pedidos', 'pedido-dev-001'), {
        estadoGeneral: 'Entregado', total: 15, estadoDevolucion: 'Solicitada'
      });
    });

    const adminDb = contexto('admin-uid', 'admin@empresa.pe').firestore();
    await assertSucceeds(updateDoc(doc(adminDb, 'pedidos', 'pedido-dev-001'), {
      estadoDevolucion: 'Procesada', notaCreditoNumero: 'BC01-00000001'
    }));
    await assertFails(updateDoc(doc(adminDb, 'pedidos', 'pedido-dev-001'), { total: 0 }));
  });

  it('solo administración modifica cuentas operativas', async () => {
    await sembrarBase();
    const adminDb = contexto('admin-uid', 'admin@empresa.pe').firestore();
    const cocinaDb = contexto('cocina-uid', 'cocina01@burger.local').firestore();

    await assertSucceeds(setDoc(doc(adminDb, 'usuarios', 'cajera'), {
      usuario: 'nueva01', rol: 'cajera', email: 'nueva01@burger.local'
    }));
    await assertFails(updateDoc(doc(cocinaDb, 'usuarios', 'cocina'), { usuario: 'intruso' }));
  });

  it('cada usuario solo puede administrar su propio token de sesión', async () => {
    await sembrarBase();
    const cajeraDb = contexto('cajera-uid', 'cajera01@burger.local').firestore();
    const cocinaDb = contexto('cocina-uid', 'cocina01@burger.local').firestore();

    await assertSucceeds(setDoc(doc(cajeraDb, 'sesiones', 'cajera-uid'), { token: 'sesion-a' }));
    await assertFails(setDoc(doc(cocinaDb, 'sesiones', 'cajera-uid'), { token: 'intruso' }));
    await assertFails(getDoc(doc(cocinaDb, 'sesiones', 'cajera-uid')));
  });

  it('propaga en tiempo real un cambio de pedido entre cajera y cocina', async () => {
    await sembrarBase();
    await entorno.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'pedidos', 'pedido-tiempo-real'), {
        estadoGeneral: 'Pendiente', productos: [{ estado: 'Pendiente' }]
      });
    });

    const cocinaDb = contexto('cocina-uid', 'cocina01@burger.local').firestore();
    const cajeraDb = contexto('cajera-uid', 'cajera01@burger.local').firestore();

    const recibido = new Promise((resolvePromise, reject) => {
      const temporizador = setTimeout(() => reject(new Error('No llegó la actualización en tiempo real.')), 5000);
      const cancelar = onSnapshot(doc(cocinaDb, 'pedidos', 'pedido-tiempo-real'), (snapshot) => {
        if (snapshot.data()?.estadoGeneral === 'Entregado') {
          clearTimeout(temporizador);
          cancelar();
          resolvePromise(snapshot.data());
        }
      }, reject);
    });

    await updateDoc(doc(cajeraDb, 'pedidos', 'pedido-tiempo-real'), { estadoGeneral: 'Entregado' });
    await expect(recibido).resolves.toMatchObject({ estadoGeneral: 'Entregado' });
  });
});
