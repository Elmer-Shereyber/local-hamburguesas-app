import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { connectFirestoreEmulator, getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { connectAuthEmulator, getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const hostLocal = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
export const usingFirebaseEmulators = hostLocal;

// Configuración de Firebase proporcionada
export const firebaseConfig = hostLocal
  ? {
      apiKey: 'demo-key',
      authDomain: 'demo-burger-local.firebaseapp.com',
      projectId: 'demo-burger-local',
      storageBucket: 'demo-burger-local.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:demo'
    }
  : {
      apiKey: "AIzaSyAhUq6tpG5egKTqLvdbraWW_dU9EYO555Q",
      authDomain: "local-hamburguesas.firebaseapp.com",
      projectId: "local-hamburguesas",
      storageBucket: "local-hamburguesas.firebasestorage.app",
      messagingSenderId: "964714406443",
      appId: "1:964714406443:web:8c1394c0675f6e4249806e"
    };

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

if (hostLocal) {
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
