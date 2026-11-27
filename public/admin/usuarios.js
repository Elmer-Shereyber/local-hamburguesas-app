import { requireAuth } from '../shared/auth.js';
import { 
    onUsuariosOperativos, 
    crearCuentaOperativa, 
    eliminarCuentaOperativa, 
    validarDisponibilidadUsuario 
} from '../shared/db.js';
import { INTERNAL_DOMAIN } from '../shared/auth.js';
import { formatDateTime, showAlert } from '../shared/utils.js';

// Restringir acceso exclusivamente a Administrador
requireAuth('admin');

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos de la interfaz
    const statActivas = document.getElementById('stat-activas');
    const statDisponibles = document.getElementById('stat-disponibles');

    // Cards destacadas de roles
    const cardRolCajera = document.getElementById('card-rol-cajera');
    const badgeEstadoCajera = document.getElementById('badge-estado-cajera');
    const infoCajeraBody = document.getElementById('info-cajera-body');
    const accionesCajera = document.getElementById('acciones-cajera');

    const cardRolCocina = document.getElementById('card-rol-cocina');
    const badgeEstadoCocina = document.getElementById('badge-estado-cocina');
    const infoCocinaBody = document.getElementById('info-cocina-body');
    const accionesCocina = document.getElementById('acciones-cocina');

    // Tabla y lista mobile
    const tbody = document.getElementById('usuarios-tbody');
    const mobileList = document.getElementById('usuarios-mobile-list');

    // Modal Crear Usuario
    const modalCrear = document.getElementById('modal-crear-usuario');
    const modalCrearTitulo = document.getElementById('modal-crear-titulo');
    const modalRolDisplay = document.getElementById('modal-rol-display');
    const modalRolIcono = document.getElementById('modal-rol-icono');
    const modalRolNombre = document.getElementById('modal-rol-nombre');
    const inputRol = document.getElementById('crear-rol');
    const btnCerrarModalCrear = document.getElementById('btn-cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    const formCrear = document.getElementById('form-crear-usuario');
    const inputUsuario = document.getElementById('crear-usuario-nombre');
    const hintFormato = document.getElementById('hint-usuario-formato');
    const hintStatus = document.getElementById('hint-usuario-status');
    const previewCorreo = document.getElementById('preview-correo');
    const inputPassword = document.getElementById('crear-usuario-password');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const hintPasswordStatus = document.getElementById('hint-password-status');
    const btnConfirmarCrear = document.getElementById('btn-confirmar-crear');

    // Modal Eliminar Usuario
    const modalEliminar = document.getElementById('modal-eliminar-usuario');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    const eliminarRolTxt = document.getElementById('eliminar-rol-txt');
    const eliminarUsuarioTxt = document.getElementById('eliminar-usuario-txt');
    const eliminarPassword = document.getElementById('eliminar-password');

    // Estado local
    let cuentasActuales = [];
    let rolAEliminar = null;
    let cuentaAEliminar = null;
    let debounceTimer = null;
    let usuarioValido = false;
    let passwordValida = false;

    // -------------------------------------------------------------
    // SUSCRIPCIÓN EN TIEMPO REAL A USUARIOS OPERATIVOS (HU-10)
    // -------------------------------------------------------------
    onUsuariosOperativos((usuarios) => {
        cuentasActuales = usuarios;
        renderVistaCuentas(usuarios);
    });

    // -------------------------------------------------------------
    // RENDERIZADO GENERAL DE LA VISTA
    // -------------------------------------------------------------
    function renderVistaCuentas(usuarios) {
        const cuentaCajera = usuarios.find(u => u.rol === 'cajera');
        const cuentaCocina = usuarios.find(u => u.rol === 'cocina');
        const totalActivas = usuarios.length;
        const totalDisponibles = Math.max(0, 2 - totalActivas);

        // Actualizar KPIs de control (CA01)
        statActivas.textContent = `${totalActivas} / 2`;
        statDisponibles.textContent = `${totalDisponibles}`;

        // 1. RENDERIZAR CARD CAJERA
        if (cuentaCajera) {
            cardRolCajera.className = 'role-overview-card activa';
            badgeEstadoCajera.innerHTML = `<span class="badge" style="background:#10B981; color:#fff; font-size:0.75rem;">● Activa</span>`;
            
            const fechaAlta = cuentaCajera.fechaCreacion?.toDate ? formatDateTime(cuentaCajera.fechaCreacion.toDate()) : 'Reciente';
            infoCajeraBody.innerHTML = `
                <div>• <strong>Nombre de Usuario:</strong> <span style="font-family:monospace; font-size:1.05rem; font-weight:800; color:#1E3A8A;">@${cuentaCajera.usuario}</span></div>
                <div>• <strong>Identificador de Login:</strong> <span style="font-family:monospace; color:#475569;">${cuentaCajera.email || cuentaCajera.usuario + INTERNAL_DOMAIN}</span></div>
                <div>• <strong>Fecha de Alta:</strong> <span style="color:#64748B;">${fechaAlta}</span></div>
                <div style="margin-top:0.35rem; color:#059669; font-size:0.8rem; font-weight:600;">✓ Habilitada para registro de pedidos y caja</div>
            `;
            accionesCajera.innerHTML = `
                <button type="button" class="btn btn-sm btn-abrir-eliminar" data-rol="cajera" data-usuario="${cuentaCajera.usuario}"
                        style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700; width:100%; padding:0.45rem;">
                    🗑️ Eliminar Cuenta de Cajera
                </button>
            `;
        } else {
            cardRolCajera.className = 'role-overview-card vacia';
            badgeEstadoCajera.innerHTML = `<span class="badge" style="background:#CBD5E1; color:#334155; font-size:0.75rem;">No Creada</span>`;
            infoCajeraBody.innerHTML = `
                <p style="color:var(--text-muted); font-size:0.85rem; margin:0.25rem 0 0.5rem 0; line-height:1.4;">
                    No existe una cuenta activa para este rol. El personal no puede iniciar sesión en la pantalla de pedidos hasta que se cree su cuenta.
                </p>
                <div style="color:#D97706; font-size:0.8rem; font-weight:600;">⚠️ Rol disponible para ser creado (CA02)</div>
            `;
            accionesCajera.innerHTML = `
                <button type="button" class="btn btn-primary btn-sm btn-crear-rol-directo" data-rol="cajera"
                        style="width:100%; font-weight:700; padding:0.45rem;">
                    ➕ Crear Cuenta de Cajera
                </button>
            `;
        }

        // 2. RENDERIZAR CARD COCINA
        if (cuentaCocina) {
            cardRolCocina.className = 'role-overview-card activa';
            badgeEstadoCocina.innerHTML = `<span class="badge" style="background:#10B981; color:#fff; font-size:0.75rem;">● Activa</span>`;
            
            const fechaAlta = cuentaCocina.fechaCreacion?.toDate ? formatDateTime(cuentaCocina.fechaCreacion.toDate()) : 'Reciente';
            infoCocinaBody.innerHTML = `
                <div>• <strong>Nombre de Usuario:</strong> <span style="font-family:monospace; font-size:1.05rem; font-weight:800; color:#92400E;">@${cuentaCocina.usuario}</span></div>
                <div>• <strong>Identificador de Login:</strong> <span style="font-family:monospace; color:#475569;">${cuentaCocina.email || cuentaCocina.usuario + INTERNAL_DOMAIN}</span></div>
                <div>• <strong>Fecha de Alta:</strong> <span style="color:#64748B;">${fechaAlta}</span></div>
                <div style="margin-top:0.35rem; color:#059669; font-size:0.8rem; font-weight:600;">✓ Habilitada para preparación y cocina</div>
            `;
            accionesCocina.innerHTML = `
                <button type="button" class="btn btn-sm btn-abrir-eliminar" data-rol="cocina" data-usuario="${cuentaCocina.usuario}"
                        style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700; width:100%; padding:0.45rem;">
                    🗑️ Eliminar Cuenta de Cocina
                </button>
            `;
        } else {
            cardRolCocina.className = 'role-overview-card vacia';
            badgeEstadoCocina.innerHTML = `<span class="badge" style="background:#CBD5E1; color:#334155; font-size:0.75rem;">No Creada</span>`;
            infoCocinaBody.innerHTML = `
                <p style="color:var(--text-muted); font-size:0.85rem; margin:0.25rem 0 0.5rem 0; line-height:1.4;">
                    No existe una cuenta activa para este rol. El personal no puede iniciar sesión en la pantalla de cocina hasta que se cree su cuenta.
                </p>
                <div style="color:#D97706; font-size:0.8rem; font-weight:600;">⚠️ Rol disponible para ser creado (CA02)</div>
            `;
            accionesCocina.innerHTML = `
                <button type="button" class="btn btn-primary btn-sm btn-crear-rol-directo" data-rol="cocina"
                        style="width:100%; font-weight:700; padding:0.45rem;">
                    ➕ Crear Cuenta de Cocina
                </button>
            `;
        }

        // 3. RENDERIZAR TABLA DETALLADA
        tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                        No hay cuentas operativas creadas actualmente. Usa el botón "Nueva Cuenta Operativa" para registrar a Cajera o Cocina.
                    </td>
                </tr>
            `;
            if (mobileList) {
                mobileList.innerHTML = `
                    <div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.9rem;">
                        No hay cuentas operativas creadas.
                    </div>
                `;
            }
        } else {
            usuarios.forEach(u => {
                const tr = document.createElement('tr');
                const fechaStr = u.fechaCreacion?.toDate ? formatDateTime(u.fechaCreacion.toDate()) : 'Reciente';
                const rolLabel = u.rol === 'cajera' ? '💳 Cajera' : '👨‍🍳 Cocina';
                const rolColor = u.rol === 'cajera' ? '#1E3A8A' : '#92400E';

                tr.innerHTML = `
                    <td>
                        <strong style="color:${rolColor}; font-size:0.95rem;">${rolLabel}</strong>
                    </td>
                    <td>
                        <span style="font-family:monospace; font-weight:800; font-size:0.98rem; color:#0F172A;">@${u.usuario}</span>
                    </td>
                    <td>
                        <span style="font-family:monospace; color:#475569; font-size:0.88rem;">${u.email || u.usuario + INTERNAL_DOMAIN}</span>
                    </td>
                    <td style="font-size:0.85rem; color:var(--text-muted);">${fechaStr}</td>
                    <td style="text-align:center;">
                        <span class="badge" style="background:#10B981; color:#fff; font-size:0.72rem;">Activa</span>
                    </td>
                    <td style="text-align:right;">
                        <button type="button" class="btn btn-sm btn-abrir-eliminar" data-rol="${u.rol}" data-usuario="${u.usuario}"
                                style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; padding:0.3rem 0.65rem; font-size:0.8rem; font-weight:700;">
                            🗑️ Eliminar
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Tarjetas móvil
                if (mobileList) {
                    const cardMob = document.createElement('div');
                    cardMob.className = 'usuario-card-mobile';
                    cardMob.innerHTML = `
                        <div class="d-flex justify-between align-center">
                            <strong style="color:${rolColor}; font-size:1rem;">${rolLabel}</strong>
                            <span class="badge" style="background:#10B981; color:#fff; font-size:0.72rem;">Activa</span>
                        </div>
                        <div style="font-size:0.85rem; color:#334155; line-height:1.5;">
                            <div><strong>Usuario:</strong> <span style="font-family:monospace; font-weight:800;">@${u.usuario}</span></div>
                            <div><strong>Login:</strong> <span style="font-family:monospace; color:#64748B;">${u.email || u.usuario + INTERNAL_DOMAIN}</span></div>
                            <div><strong>Alta:</strong> <span style="color:#64748B;">${fechaStr}</span></div>
                        </div>
                        <div style="border-top:1px dashed var(--border-color); padding-top:0.5rem; text-align:right;">
                            <button type="button" class="btn btn-sm btn-abrir-eliminar" data-rol="${u.rol}" data-usuario="${u.usuario}"
                                    style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700; width:100%;">
                                🗑️ Eliminar Cuenta
                            </button>
                        </div>
                    `;
                    mobileList.appendChild(cardMob);
                }
            });
        }

        // Asignar listeners a botones de acción
        document.querySelectorAll('.btn-crear-rol-directo').forEach(btn => {
            btn.addEventListener('click', () => {
                const rol = btn.getAttribute('data-rol');
                abrirModalCrear(rol);
            });
        });

        document.querySelectorAll('.btn-abrir-eliminar').forEach(btn => {
            btn.addEventListener('click', () => {
                const rol = btn.getAttribute('data-rol');
                const usuario = btn.getAttribute('data-usuario');
                abrirModalEliminar(rol, usuario);
            });
        });
    }

    // -------------------------------------------------------------
    // MODAL DE CREACIÓN DE CUENTA (CA01, CA02, CA03, CA04, CA05)
    // -------------------------------------------------------------
    btnCerrarModalCrear.addEventListener('click', () => modalCrear.style.display = 'none');
    btnCancelarCrear.addEventListener('click', () => modalCrear.style.display = 'none');

    function abrirModalCrear(rolTarget) {
        const rolNorm = (rolTarget || 'cajera').toLowerCase();

        // Configurar título, icono y visualización del rol fijo según el botón presionado
        if (rolNorm === 'cajera') {
            modalCrearTitulo.textContent = '➕ Crear Cuenta de Cajera';
            modalRolIcono.textContent = '💳';
            modalRolNombre.textContent = 'Cajera (Toma de pedidos y cobros)';
            modalRolDisplay.style.background = '#EFF6FF';
            modalRolDisplay.style.borderColor = '#BFDBFE';
            modalRolDisplay.style.color = '#1E40AF';
            inputRol.value = 'cajera';
        } else {
            modalCrearTitulo.textContent = '➕ Crear Cuenta de Cocina';
            modalRolIcono.textContent = '👨‍🍳';
            modalRolNombre.textContent = 'Área de Cocina (Visualización y preparación de comandas)';
            modalRolDisplay.style.background = '#FEF3C7';
            modalRolDisplay.style.borderColor = '#FDE68A';
            modalRolDisplay.style.color = '#92400E';
            inputRol.value = 'cocina';
        }

        // Resetear campos y validaciones
        inputUsuario.value = '';
        inputPassword.value = '';
        previewCorreo.textContent = `@burger.local`;
        
        hintStatus.style.display = 'none';
        hintStatus.textContent = '';
        hintFormato.style.display = 'block';

        hintPasswordStatus.textContent = 'Mínimo 6 caracteres (números, letras o caracteres).';
        hintPasswordStatus.className = 'validation-hint muted';

        usuarioValido = false;
        passwordValida = false;
        btnConfirmarCrear.disabled = true;

        modalCrear.style.display = 'flex';
        inputUsuario.focus();
    }

    // CA03, CA04, CA05: Validación de formato y unicidad en tiempo real del usuario
    inputUsuario.addEventListener('input', (e) => {
        // Sanitizar activamente: solo letras y números, máximo 20 caracteres (CA03)
        const limpio = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        e.target.value = limpio;

        // Actualizar previsualización de correo interno (CA05)
        previewCorreo.textContent = limpio ? `${limpio.toLowerCase()}${INTERNAL_DOMAIN}` : `@burger.local`;

        clearTimeout(debounceTimer);
        usuarioValido = false;
        actualizarBotonCrear();

        if (limpio.length === 0) {
            hintStatus.style.display = 'none';
            hintFormato.style.display = 'block';
            return;
        }

        if (limpio.length < 4) {
            hintFormato.style.display = 'none';
            hintStatus.style.display = 'block';
            hintStatus.className = 'validation-hint error';
            hintStatus.textContent = `❌ Requiere entre 4 y 20 caracteres (ingresados: ${limpio.length}).`;
            return;
        }

        // CA04: Verificar unicidad en tiempo real entre las cuentas activas
        const existeEnLocales = cuentasActuales.some(u => (u.usuarioLower || '').toLowerCase() === limpio.toLowerCase());
        if (existeEnLocales) {
            hintFormato.style.display = 'none';
            hintStatus.style.display = 'block';
            hintStatus.className = 'validation-hint error';
            hintStatus.textContent = `❌ El usuario "${limpio}" ya está en uso por otra cuenta activa.`;
            return;
        }

        hintStatus.style.display = 'block';
        hintStatus.className = 'validation-hint muted';
        hintStatus.textContent = 'Comprobando disponibilidad...';

        // Verificación remota con debounce (CA04)
        debounceTimer = setTimeout(async () => {
            try {
                const disponible = await validarDisponibilidadUsuario(limpio);
                if (disponible) {
                    hintStatus.className = 'validation-hint success';
                    hintStatus.textContent = `✓ Nombre de usuario "${limpio}" disponible.`;
                    usuarioValido = true;
                } else {
                    hintStatus.className = 'validation-hint error';
                    hintStatus.textContent = `❌ El usuario "${limpio}" ya está siendo utilizado por otra cuenta activa.`;
                    usuarioValido = false;
                }
            } catch (err) {
                console.warn("Validando disponibilidad:", err);
                // Si la validación local fue exitosa
                hintStatus.className = 'validation-hint success';
                hintStatus.textContent = `✓ Formato válido.`;
                usuarioValido = true;
            }
            actualizarBotonCrear();
        }, 300);
    });

    // CA03: Validación en tiempo real de la contraseña (mínimo 6 caracteres)
    inputPassword.addEventListener('input', (e) => {
        const pass = e.target.value.trim();
        if (pass.length === 0) {
            hintPasswordStatus.className = 'validation-hint muted';
            hintPasswordStatus.textContent = 'Mínimo 6 caracteres (números, letras o caracteres).';
            passwordValida = false;
        } else if (pass.length < 6) {
            hintPasswordStatus.className = 'validation-hint error';
            hintPasswordStatus.textContent = `❌ Contraseña muy corta (mínimo 6 caracteres, ingresados: ${pass.length}).`;
            passwordValida = false;
        } else {
            hintPasswordStatus.className = 'validation-hint success';
            hintPasswordStatus.textContent = `✓ Longitud de contraseña correcta (${pass.length} caracteres).`;
            passwordValida = true;
        }
        actualizarBotonCrear();
    });

    // Alternar visibilidad de contraseña
    btnTogglePassword.addEventListener('click', () => {
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnTogglePassword.textContent = '🔒';
        } else {
            inputPassword.type = 'password';
            btnTogglePassword.textContent = '👁️';
        }
    });

    function actualizarBotonCrear() {
        btnConfirmarCrear.disabled = !(usuarioValido && passwordValida);
    }

    // Envío del formulario de creación (CA01, CA03, CA04, CA05)
    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!usuarioValido || !passwordValida) return;

        const rol = inputRol.value;
        const usuario = inputUsuario.value.trim();
        const password = inputPassword.value.trim();

        btnConfirmarCrear.disabled = true;
        btnConfirmarCrear.textContent = 'Creando cuenta...';

        try {
            await crearCuentaOperativa({ rol, usuario, password });
            
            const rolNom = rol === 'cajera' ? 'Cajera' : 'Cocina';
            showAlert(`✅ Cuenta de ${rolNom} creada con éxito.\n\nEl usuario "@${usuario}" ya puede iniciar sesión en el sistema usando su nombre de usuario y la contraseña configurada.`);
            modalCrear.style.display = 'none';

        } catch (error) {
            console.error("Error al crear cuenta operativa:", error);
            showAlert(error.message || "Ocurrió un error al crear la cuenta operativa.");
        } finally {
            btnConfirmarCrear.disabled = false;
            btnConfirmarCrear.textContent = 'Crear Cuenta';
        }
    });

    // -------------------------------------------------------------
    // MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (CA06, CA07, CA08)
    // -------------------------------------------------------------
    function abrirModalEliminar(rol, usuario) {
        rolAEliminar = rol;
        cuentaAEliminar = usuario;
        
        eliminarRolTxt.textContent = rol === 'cajera' ? 'Cajera' : 'Cocina';
        eliminarUsuarioTxt.textContent = `@${usuario}`;
        eliminarPassword.value = '';

        modalEliminar.style.display = 'flex';
    }

    btnCancelarEliminar.addEventListener('click', () => {
        modalEliminar.style.display = 'none';
        rolAEliminar = null;
        cuentaAEliminar = null;
    });

    btnConfirmarEliminar.addEventListener('click', async () => {
        if (!rolAEliminar) return;

        btnConfirmarEliminar.disabled = true;
        btnConfirmarEliminar.textContent = 'Eliminando...';

        try {
            const rolNom = rolAEliminar === 'cajera' ? 'Cajera' : 'Cocina';
            const usuarioNom = cuentaAEliminar;

            await eliminarCuentaOperativa(rolAEliminar, eliminarPassword.value);

            showAlert(`🗑️ Cuenta de ${rolNom} (@${usuarioNom}) eliminada.\n\n• El rol ha quedado inmediatamente libre para crear una nueva cuenta.\n• Si el personal tenía una sesión abierta, será cerrada en su próxima acción.\n• Los pedidos e incidencias previas se conservan intactos en el historial.`);
            modalEliminar.style.display = 'none';

        } catch (error) {
            console.error("Error al eliminar cuenta operativa:", error);
            showAlert(error.message || "Ocurrió un error al eliminar la cuenta operativa.");
        } finally {
            btnConfirmarEliminar.disabled = false;
            btnConfirmarEliminar.textContent = 'Sí, Eliminar Cuenta';
            rolAEliminar = null;
            cuentaAEliminar = null;
        }
    });

});
