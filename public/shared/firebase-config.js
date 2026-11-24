import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Configuración de Firebase proporcionada
export const firebaseConfig = {
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
