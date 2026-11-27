import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-burger-local';

async function esperar(url, intentos = 60) {
  for (let intento = 0; intento < intentos; intento += 1) {
    try {
      const respuesta = await fetch(url);
      if (respuesta.ok || respuesta.status < 500) return;
    } catch {
      // El emulador todavía está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`El emulador no respondió: ${url}`);
}

export default async function prepararE2E() {
  await esperar(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/config`);
  await esperar(`http://127.0.0.1:8085/emulator/v1/projects/${PROJECT_ID}:ruleCoverage.html`);

  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });

  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, `e2e-seed-${Date.now()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  for (const [email, password] of [
    ['admin@empresa.pe', 'Admin123!'],
    ['cajera01@burger.local', 'Cajera123!'],
    ['cocina01@burger.local', 'Cocina123!']
  ]) {
    await createUserWithEmailAndPassword(auth, email, password);
    await signOut(auth);
  }
  await deleteApp(app);

  const entorno = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8085 }
  });
  await entorno.clearFirestore();
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usuarios', 'cajera'), {
      usuario: 'cajera01', usuarioLower: 'cajera01', rol: 'cajera', email: 'cajera01@burger.local'
    });
    await setDoc(doc(db, 'usuarios', 'cocina'), {
      usuario: 'cocina01', usuarioLower: 'cocina01', rol: 'cocina', email: 'cocina01@burger.local'
    });
    await setDoc(doc(db, 'configuracion', 'negocio'), {
      ruc: '20123456789',
      razonSocial: 'BURGER LOCAL DEMO SAC',
      domicilioFiscal: 'Trujillo, La Libertad',
      serieBoleta: 'B001',
      serieFactura: 'F001',
      correlativoBoleta: 0,
      correlativoFactura: 0,
      correlativoNotaCreditoBoleta: 0,
      correlativoNotaCreditoFactura: 0
    });
    await setDoc(doc(db, 'productos', 'hamburguesa-clasica'), {
      nombre: 'Hamburguesa Clásica', precio: 15, tipo: 'Con preparación', disponible: true
    });
    await setDoc(doc(db, 'productos', 'gaseosa-personal'), {
      nombre: 'Gaseosa Personal', precio: 5, tipo: 'Servicio inmediato', disponible: true
    });
  });
  await entorno.cleanup();
}
