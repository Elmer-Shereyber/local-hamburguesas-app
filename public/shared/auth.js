import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { 
    doc, getDoc, getDocFromServer, getDocs, setDoc, deleteDoc, collection, query, where, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Dominio interno para cajera y cocina (HU-10 CA05, HU-13 CA03)
export const INTERNAL_DOMAIN = '@burger.local';
let cierreEnCurso = false;

/**
 * Determina el rol del usuario basado en su email y sesión activa
 */
export function getUserRole(email) {
    if (!email) return null;
    if (!email.toLowerCase().endsWith(INTERNAL_DOMAIN)) return 'admin';
    const cached = sessionStorage.getItem('currentUserRole');
    if (cached) return cached;
    if (email.toLowerCase().startsWith('cajera')) return 'cajera';
    if (email.toLowerCase().startsWith('cocina')) return 'cocina';
    return null;
}

/**
 * Inicia sesión en Firebase Auth (HU-13)
 * @param {string} identifier (correo para admin, nombre de usuario para cajera y cocina)
 * @param {string} password 
 */
export async function login(identifier, password) {
    const rawInput = (identifier || '').trim();
    if (!rawInput || !password) {
        throw new Error("Credenciales inválidas.");
    }

    let email = rawInput;
    let isAdmin = false;
    let usuarioLimpio = '';

    if (rawInput.includes('@') && !rawInput.toLowerCase().endsWith(INTERNAL_DOMAIN)) {
        // Administrador con correo electrónico real (HU-13 CA02)
        isAdmin = true;
        email = rawInput;
    } else {
        // Cajera o Cocina (HU-10 CA05, HU-13 CA03, CA05)
        // Permite ingresar tanto el usuario solo ("cajera23") como con el dominio interno ("cajera23@burger.local")
        usuarioLimpio = rawInput.toLowerCase().replace(INTERNAL_DOMAIN, '');
        email = `${usuarioLimpio}${INTERNAL_DOMAIN}`;
    }

    // 1. Iniciar sesión en Firebase Authentication PRIMERO (HU-13 CA02, CA03)
    // Esto autentica la conexión ante Firebase; las reglas de seguridad de Firestore requieren request.auth != null
    let userCredential;
    try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (authError) {
        console.warn("Error en autenticación Firebase Auth:", authError.code || authError.message);
        throw new Error("Credenciales inválidas."); // Mensaje genérico según HU-13 CA04
    }

    // 2. Determinar el rol y validar vigencia de la cuenta operativa en Firestore (HU-13 CA05)
    let role = 'admin';
    if (!isAdmin) {
        try {
            // Como el usuario ya está autenticado, la consulta a Firestore se ejecuta con permisos válidos
            const q = query(collection(db, 'usuarios'), where('usuarioLower', '==', usuarioLimpio));
            const snap = await getDocs(q);

            if (snap.empty) {
                // Cuenta no creada o eliminada por el administrador -> cierre forzado y error (HU-13 CA04, CA05)
                await signOut(auth);
                throw new Error("Credenciales inválidas.");
            }

            const userDoc = snap.docs[0].data();
            role = userDoc.rol; // 'cajera' o 'cocina'
        } catch (e) {
            if (e.message === "Credenciales inválidas.") {
                await signOut(auth);
                throw e;
            }
            console.error("Error al validar cuenta en Firestore tras login:", e);
            // Fallback en caso de latencia de red si Auth fue exitoso
            role = usuarioLimpio.startsWith('cocina') ? 'cocina' : 'cajera';
        }
    }

    // CA09: una sola sesión activa por cuenta. Un nuevo acceso reemplaza el
    // token registrado y el listener del dispositivo anterior lo desconecta.
    const tokenSesion = crypto.randomUUID();
    await setDoc(doc(db, 'sesiones', userCredential.user.uid), {
        token: tokenSesion,
        email: userCredential.user.email,
        actualizadoEn: Date.now()
    });
    sessionStorage.setItem('sessionToken', tokenSesion);
    sessionStorage.setItem('currentUserRole', role);
    sessionStorage.setItem('currentUsername', usuarioLimpio || identifier.split('@')[0]);
    return { user: userCredential.user, role };
}

/**
 * Cierra la sesión activa (HU-14)
 */
export async function logout() {
    try {
        cierreEnCurso = true;
        const user = auth.currentUser;
        const tokenLocal = sessionStorage.getItem('sessionToken');
        if (user && tokenLocal) {
            const sesionRef = doc(db, 'sesiones', user.uid);
            const sesionSnap = await getDoc(sesionRef).catch(() => null);
            if (sesionSnap?.exists() && sesionSnap.data().token === tokenLocal) {
                await deleteDoc(sesionRef).catch(() => {});
            }
        }
        sessionStorage.clear();
        await signOut(auth);
        window.location.href = '../login/index.html';
    } catch (error) {
        console.error("Logout error:", error);
        sessionStorage.clear();
        window.location.href = '../login/index.html';
    }
}

/**
 * Guarda o protege rutas según el rol y valida cierre forzado de sesión (HU-10 CA07, HU-13 CA07)
 * @param {string|string[]} allowedRole (ej. 'cajera', 'cocina', 'admin')
 */
export function requireAuth(allowedRole) {
    // El botón debe responder desde que el DOM invoca requireAuth. Las
    // validaciones de token y Firestore son asíncronas y no deben retrasar la
    // posibilidad de cerrar sesión.
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // No autenticado
            window.location.href = '../login/index.html';
            return;
        }

        // Fuerza la renovación para detectar contraseñas restablecidas o
        // credenciales revocadas antes de permitir una pantalla protegida.
        try {
            await user.getIdToken(true);
        } catch {
            sessionStorage.clear();
            await signOut(auth).catch(() => {});
            window.location.href = '../login/index.html';
            return;
        }

        let currentRole = getUserRole(user.email);
        const tokenLocal = sessionStorage.getItem('sessionToken');
        const sesionRef = doc(db, 'sesiones', user.uid);

        if (!tokenLocal) {
            sessionStorage.clear();
            await signOut(auth);
            window.location.href = '../login/index.html';
            return;
        }

        // Confirmar primero contra el servidor. Al navegar rápidamente entre
        // pantallas, un listener puede emitir un snapshot vacío desde caché
        // antes de recibir el documento real y no debe cerrar una sesión válida.
        const sesionConfirmada = await getDocFromServer(sesionRef).catch(() => null);
        if (!sesionConfirmada?.exists() || sesionConfirmada.data().token !== tokenLocal) {
            sessionStorage.clear();
            await signOut(auth).catch(() => {});
            window.location.href = '../login/index.html';
            return;
        }

        onSnapshot(sesionRef, { includeMetadataChanges: true }, async (snap) => {
            if (snap.metadata.fromCache) return;
            if (!cierreEnCurso && (!snap.exists() || snap.data().token !== tokenLocal)) {
                sessionStorage.clear();
                await signOut(auth).catch(() => {});
                alert("Se inició sesión con esta cuenta en otro dispositivo. Esta sesión ha finalizado.");
                window.location.href = '../login/index.html';
            }
        });
        
        // Si no se dedujo el rol de inmediato pero es dominio interno, resolver desde Firestore
        if (user.email.toLowerCase().endsWith(INTERNAL_DOMAIN) && (!currentRole || currentRole === 'admin')) {
            try {
                const q = query(collection(db, 'usuarios'), where('email', '==', user.email.toLowerCase()));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    currentRole = snap.docs[0].data().rol;
                    sessionStorage.setItem('currentUserRole', currentRole);
                }
            } catch (err) {
                console.warn("Resolviendo rol operativo:", err);
            }
        }
        
        // HU-10 CA07: Si es cajera o cocina, validar inmediatamente que la cuenta siga activa en Firestore
        if (currentRole === 'cajera' || currentRole === 'cocina') {
            try {
                const uDocRef = doc(db, 'usuarios', currentRole);
                const uSnap = await getDoc(uDocRef);
                
                // Si el documento no existe o pertenece a otro usuario creado posteriormente
                if (!uSnap.exists() || (uSnap.data().email && uSnap.data().email.toLowerCase() !== user.email.toLowerCase())) {
                    // La cuenta fue eliminada o reemplazada por el administrador -> cierre forzado de sesión (HU-10 CA07)
                    sessionStorage.clear();
                    await signOut(auth);
                    alert("Tu cuenta ha sido eliminada por el Administrador. La sesión ha finalizado.");
                    window.location.href = '../login/index.html';
                    return;
                }

                // Suscripción en tiempo real: si el admin elimina o recrea la cuenta mientras está activa en pantalla
                onSnapshot(uDocRef, (snap) => {
                    if (!snap.exists() || (snap.data().email && snap.data().email.toLowerCase() !== user.email.toLowerCase())) {
                        sessionStorage.clear();
                        signOut(auth);
                        alert("Tu cuenta ha sido eliminada por el Administrador. La sesión ha finalizado.");
                        window.location.href = '../login/index.html';
                    }
                });

            } catch (err) {
                console.warn("Validando cuenta activa en Firestore:", err);
            }
        }

        // Mostrar identificador en UI si hay un contenedor
        const userSpan = document.getElementById('current-user');
        if (userSpan) {
            const cachedName = sessionStorage.getItem('currentUsername');
            userSpan.textContent = cachedName || user.email.split('@')[0];
        }

        // Si la ruta requiere un rol específico y no coincide, redirigir
        if (allowedRole) {
            const allowed = Array.isArray(allowedRole) ? allowedRole.includes(currentRole) : currentRole === allowedRole;
            if (!allowed) {
                redirectToRoleHome(currentRole);
            }
        }
    });
}

/**
 * Redirige al usuario a su pantalla principal
 */
export function redirectToRoleHome(role) {
    if (role === 'cajera') {
        window.location.href = '../cajera/registrar-pedido.html';
    } else if (role === 'cocina') {
        window.location.href = '../cocina/pedidos.html';
    } else if (role === 'admin') {
        window.location.href = '../admin/index.html';
    }
}

