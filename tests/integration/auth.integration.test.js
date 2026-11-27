import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

const PROJECT_ID = 'demo-burger-local';
let app;
let auth;

async function limpiarUsuarios() {
  const respuesta = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE'
  });
  if (!respuesta.ok) throw new Error('No se pudo limpiar Auth Emulator.');
}

beforeEach(async () => {
  await limpiarUsuarios();
  app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, `auth-test-${crypto.randomUUID()}`);
  auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
});

afterEach(async () => {
  await signOut(auth).catch(() => {});
  await deleteApp(app);
});

describe('Integración con Firebase Authentication Emulator', () => {
  it('crea y autentica una cuenta administrativa', async () => {
    await createUserWithEmailAndPassword(auth, 'admin@empresa.pe', 'secreto123');
    await signOut(auth);
    const credencial = await signInWithEmailAndPassword(auth, 'admin@empresa.pe', 'secreto123');
    expect(credencial.user.email).toBe('admin@empresa.pe');
  });

  it('autentica cuentas operativas con el dominio corporativo', async () => {
    await createUserWithEmailAndPassword(auth, 'cajera01@burger.local', 'secreto123');
    expect(auth.currentUser.email).toBe('cajera01@burger.local');
  });

  it('rechaza una contraseña incorrecta', async () => {
    await createUserWithEmailAndPassword(auth, 'admin@empresa.pe', 'secreto123');
    await signOut(auth);
    const error = await signInWithEmailAndPassword(auth, 'admin@empresa.pe', 'incorrecta').catch((fallo) => fallo);
    expect(['auth/wrong-password', 'auth/invalid-credential']).toContain(error.code);
  });

  it('cierra la sesión activa', async () => {
    await createUserWithEmailAndPassword(auth, 'cocina01@burger.local', 'secreto123');
    expect(auth.currentUser).not.toBeNull();
    await signOut(auth);
    expect(auth.currentUser).toBeNull();
  });

  it('genera una solicitud de recuperación para el administrador', async () => {
    await createUserWithEmailAndPassword(auth, 'admin@empresa.pe', 'secreto123');
    await sendPasswordResetEmail(auth, 'admin@empresa.pe');
    const respuesta = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
    const datos = await respuesta.json();
    expect(datos.oobCodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'admin@empresa.pe', requestType: 'PASSWORD_RESET' })
    ]));
  });
});
