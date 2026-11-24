import { requireAuth } from '../shared/auth.js';
import { onDevoluciones, procesarDevolucion } from '../shared/db.js';
import { formatCurrency, formatDateTime, showAlert } from '../shared/utils.js';

// Restringir módulo exclusivamente al Administrador (HU-06 CA09)
requireAuth('admin');

document.addEventListener('DOMContentLoaded', () => {
    // Elementos de la lista y pestañas
    const tabBtnPendientes = document.getElementById('tab-btn-pendientes');
    const tabBtnProcesadas = document.getElementById('tab-btn-procesadas');
    const badgeCountPendientes = document.getElementById('badge-count-pendientes');
    const badgeCountProcesadas = document.getElementById('badge-count-procesadas');
    const inputBuscar = document.getElementById('buscar-devolucion');
    const loadingMsg = document.getElementById('loading-msg');
    const noResultsMsg = document.getElementById('no-results-msg');
    const tableWrapper = document.getElementById('table-wrapper');
    const tbody = document.getElementById('devoluciones-tbody');
    const mobileList = document.getElementById('devoluciones-mobile-list');

    // Modales
    const modalDetalle = document.getElementById('modal-detalle');
    const btnCerrarModalDetalle = document.getElementById('btn-cerrar-modal-detalle');
    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle');
    const btnAccionDesdeDetalle = document.getElementById('btn-accion-desde-detalle');
    const btnNcDesdeDetalle = document.getElementById('btn-nc-desde-detalle');
    const detalleBody = document.getElementById('detalle-body');

    const modalProcesar = document.getElementById('modal-procesar');
    const btnCerrarModalProcesar = document.getElementById('btn-cerrar-modal-procesar');
    const btnCancelarProcesar = document.getElementById('btn-cancelar-procesar');
    const formProcesar = document.getElementById('form-procesar-devolucion');
    const procesarMonto = document.getElementById('procesar-monto');
    const procesarDatosBancarios = document.getElementById('procesar-datos-bancarios');
    const procesarModalidadReal = document.getElementById('procesar-modalidad-real');
    const modalidadCambioAviso = document.getElementById('modalidad-cambio-aviso');
    const modalidadSolicitadaTxt = document.getElementById('modalidad-solicitada-txt');
    const modalidadNuevaTxt = document.getElementById('modalidad-nueva-txt');
    const badgeDatosEditados = document.getElementById('badge-datos-editados');

    const procesarCamposBilletera = document.getElementById('procesar-campos-billetera');
    const procesarTelefonoBilletera = document.getElementById('procesar-telefono-billetera');
    const procesarTitularBilletera = document.getElementById('procesar-titular-billetera');
    const procesarLblBilletera = document.getElementById('procesar-lbl-billetera');
    const procesarLblTitularBilletera = document.getElementById('procesar-lbl-titular-billetera');
    const errorTelefonoBilletera = document.getElementById('error-telefono-billetera');
    const errorTitularBilletera = document.getElementById('error-titular-billetera');

    const procesarCamposTransferencia = document.getElementById('procesar-campos-transferencia');
    const procesarCuentaBancaria = document.getElementById('procesar-cuenta-bancaria');
    const procesarTitularTransferencia = document.getElementById('procesar-titular-transferencia');
    const procesarLblCuentaBancaria = document.getElementById('procesar-lbl-cuenta-bancaria');
    const errorCuentaBancaria = document.getElementById('error-cuenta-bancaria');
    const errorTitularTransferencia = document.getElementById('error-titular-transferencia');
    const inputArchivoComprobante = document.getElementById('input-archivo-comprobante');
    const dropzoneComprobante = document.getElementById('dropzone-comprobante');
    const uploadPreviewBox = document.getElementById('upload-preview-box');
    const previewImg = document.getElementById('preview-img');
    const previewPdfIcon = document.getElementById('preview-pdf-icon');
    const previewFilename = document.getElementById('preview-filename');
    const previewFilesize = document.getElementById('preview-filesize');
    const btnRemoverArchivo = document.getElementById('btn-remover-archivo');
    const btnConfirmarProcesar = document.getElementById('btn-confirmar-procesar');

    const modalVisor = document.getElementById('modal-visor');
    const btnCerrarModalVisor = document.getElementById('btn-cerrar-modal-visor');
    const btnCerrarVisor = document.getElementById('btn-cerrar-visor');
    const visorMeta = document.getElementById('visor-meta');
    const visorContent = document.getElementById('visor-content');
    const btnDescargarComprobante = document.getElementById('btn-descargar-comprobante');

    let todasDevoluciones = [];
    let pestanaActiva = 'pendientes'; // 'pendientes' | 'procesadas'
    let devolucionSeleccionada = null;
    let comprobanteProcesado = null; // { dataUrl, nombre, tipo }

    // Helper para limpiar códigos de pedidos
    function limpiarCodigo(codigo) {
        if (!codigo) return '';
        return String(codigo).replace(/^#+/, '').trim();
    }

    // Suscripción en tiempo real a las solicitudes de devolución
    onDevoluciones((devoluciones) => {
        todasDevoluciones = devoluciones;
        renderListas();
    });

    // Eventos de Pestañas
    tabBtnPendientes.addEventListener('click', () => {
        pestanaActiva = 'pendientes';
        tabBtnPendientes.classList.add('active');
        tabBtnProcesadas.classList.remove('active');
        renderListas();
    });

    tabBtnProcesadas.addEventListener('click', () => {
        pestanaActiva = 'procesadas';
        tabBtnProcesadas.classList.add('active');
        tabBtnPendientes.classList.remove('active');
        renderListas();
    });

    inputBuscar.addEventListener('input', renderListas);

    function renderListas() {
        loadingMsg.style.display = 'none';
        tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';

        // Separar solicitudes pendientes y procesadas
        const pendientes = todasDevoluciones
            .filter(d => d.estado === 'Solicitada')
            // CA01: Ordenadas de la más antigua a la más reciente (ascendente)
            .sort((a, b) => {
                const fa = a.fechaSolicitud?.toDate ? a.fechaSolicitud.toDate().getTime() : 0;
                const fb = b.fechaSolicitud?.toDate ? b.fechaSolicitud.toDate().getTime() : 0;
                return fa - fb;
            });

        const procesadas = todasDevoluciones
            .filter(d => d.estado === 'Procesada')
            // Historial ordenado de la más reciente a la más antigua (descendente)
            .sort((a, b) => {
                const fa = a.fechaProcesado?.toDate ? a.fechaProcesado.toDate().getTime() : 0;
                const fb = b.fechaProcesado?.toDate ? b.fechaProcesado.toDate().getTime() : 0;
                return fb - fa;
            });

        badgeCountPendientes.textContent = pendientes.length;
        badgeCountProcesadas.textContent = procesadas.length;

        // Lista según la pestaña activa
        const listaActiva = pestanaActiva === 'pendientes' ? pendientes : procesadas;
        const termino = inputBuscar.value.trim().toLowerCase();

        // Filtrado por buscador
        const filtradas = listaActiva.filter(d => {
            if (!termino) return true;
            const termLimpio = termino.replace(/^#+/, '');
            const cod = limpiarCodigo(d.pedidoCodigo).toLowerCase();
            const cliente = (d.datosContacto?.nombre || '').toLowerCase();
            const titular = (d.datosModalidad?.titular || '').toLowerCase();
            const tel = (d.datosModalidad?.telefono || d.datosContacto?.telefono || '').toLowerCase();
            const cta = (d.datosModalidad?.cuentaBancaria || '').toLowerCase();

            return cod.includes(termLimpio) || cliente.includes(termino) || titular.includes(termino) || tel.includes(termino) || cta.includes(termino);
        });

        if (filtradas.length === 0) {
            tableWrapper.style.display = 'none';
            if (mobileList) mobileList.style.display = 'none';
            noResultsMsg.style.display = 'block';
            return;
        }

        tableWrapper.style.display = '';
        if (mobileList) mobileList.style.display = '';
        noResultsMsg.style.display = 'none';

        filtradas.forEach(d => {
            const codLimpio = limpiarCodigo(d.pedidoCodigo);
            const fechaStr = formatDateTime(d.fechaSolicitud?.toDate());

            // Badges de modalidad de pago (considerando modalidad real efectiva si fue procesada)
            const modEfectiva = (d.estado === 'Procesada' && d.modalidadReal) ? d.modalidadReal : d.modalidad;
            const huboCambioMod = d.estado === 'Procesada' && d.modalidadReal && d.modalidadReal !== d.modalidad;

            let modalidadBadge = '';
            if (modEfectiva === 'Yape') {
                modalidadBadge = '<span class="badge" style="background:#702382; font-size:0.75rem;">Yape</span>';
            } else if (modEfectiva === 'Plin') {
                modalidadBadge = '<span class="badge" style="background:#00BFA5; font-size:0.75rem;">Plin</span>';
            } else {
                modalidadBadge = '<span class="badge" style="background:#2563EB; font-size:0.75rem;">Transferencia</span>';
            }

            if (huboCambioMod) {
                modalidadBadge += `<div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem;">(Sol: ${d.modalidad})</div>`;
            }

            // Datos de destino para el depósito
            const datosMod = d.datosModalidadReal || d.datosModalidad || {};
            let datosDestinoHtml = '';
            if (modEfectiva === 'Yape' || modEfectiva === 'Plin') {
                datosDestinoHtml = `
                    <div style="font-size:0.88rem;">
                        <strong>📱 ${datosMod.telefono || 'S/N'}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Titular: ${datosMod.titular || 'N/A'}</div>
                        ${d.datosModificadosPorAdmin ? '<span class="badge" style="background:#FEF3C7; color:#92400E; font-size:0.65rem; margin-top:0.2rem;">✏️ Corregido por Admin</span>' : ''}
                    </div>
                `;
            } else {
                const tipo = datosMod.tipoCuenta === 'cci' ? 'CCI' : 'Cta';
                datosDestinoHtml = `
                    <div style="font-size:0.88rem;">
                        <strong>🏦 ${tipo}: ${datosMod.cuentaBancaria || 'S/N'}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Titular: ${datosMod.titular || 'N/A'}</div>
                        ${d.datosModificadosPorAdmin ? '<span class="badge" style="background:#FEF3C7; color:#92400E; font-size:0.65rem; margin-top:0.2rem;">✏️ Corregido por Admin</span>' : ''}
                    </div>
                `;
            }

            // Botones de acción
            let botonesAccion = `
                <div class="pedido-actions-group">
                    <button class="btn btn-secondary btn-sm btn-ver-detalle" data-id="${d.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Ver detalle completo de la solicitud">
                        👁️ Detalle
                    </button>
            `;

            if (d.estado === 'Solicitada') {
                botonesAccion += `
                    <button class="btn btn-primary btn-sm btn-abrir-procesar" data-id="${d.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Registrar reembolso y adjuntar comprobante">
                        💸 Reembolsar
                    </button>
                `;
            } else {
                botonesAccion += `
                    <button class="btn btn-success btn-sm btn-ver-comprobante" data-id="${d.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Ver comprobante de la transferencia realizada">
                        🖼️ Voucher
                    </button>
                    <a href="nota-credito.html?id=${d.id}" target="_blank" class="btn btn-sm" style="background:#0284C7; color:#fff; text-decoration:none; padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center;" title="Ver y descargar Nota de Crédito Electrónica SUNAT">
                        📄 Nota Crédito
                    </a>
                `;
            }
            botonesAccion += `</div>`;

            // 1. RENDERIZAR EN TABLA DESKTOP
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-size:0.85rem; color:var(--text-muted);">${fechaStr}</td>
                <td>
                    <strong style="font-family:monospace; font-size:0.95rem;">#${codLimpio}</strong>
                    ${d.esDevolucionDeReposicion ? '<br><span class="badge" style="background:var(--primary-color); font-size:0.65rem;">Dev. Reposición</span>' : ''}
                </td>
                <td style="font-size:0.88rem;">
                    <strong>${d.datosContacto?.nombre || 'Cliente'}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Cel: ${d.datosContacto?.telefono || 'N/A'}</div>
                </td>
                <td>${modalidadBadge}</td>
                <td>${datosDestinoHtml}</td>
                <td style="font-weight:700; color:#1E3A8A; font-size:1rem;">${formatCurrency(d.monto)}</td>
                <td style="text-align:right;">${botonesAccion}</td>
            `;
            tbody.appendChild(tr);

            // 2. RENDERIZAR EN CARDS MÓVIL
            if (mobileList) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'devolucion-card-mobile';
                cardDiv.innerHTML = `
                    <div class="d-flex justify-between align-center" style="border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                        <div>
                            <strong style="font-family:monospace; font-size:0.95rem;">Pedido #${codLimpio}</strong>
                            ${d.esDevolucionDeReposicion ? ' <span class="badge" style="background:var(--primary-color); font-size:0.65rem;">Reposición</span>' : ''}
                        </div>
                        <div>${modalidadBadge}</div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.85rem;">
                        <div>
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">MONTO A REEMBOLSAR</span>
                            <strong style="color:#1E3A8A; font-size:1.05rem;">${formatCurrency(d.monto)}</strong>
                        </div>
                        <div>
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">SOLICITADO</span>
                            <span>${fechaStr}</span>
                        </div>
                        <div style="grid-column: span 2;">
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">DESTINO DEL REEMBOLSO</span>
                            ${datosDestinoHtml}
                        </div>
                    </div>
                    <div style="border-top:1px dashed var(--border-color); padding-top:0.6rem;">
                        ${botonesAccion}
                    </div>
                `;
                mobileList.appendChild(cardDiv);
            }
        });

        // Eventos a los botones de acción
        document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const d = todasDevoluciones.find(x => x.id === id);
                if (d) abrirModalDetalle(d);
            });
        });

        document.querySelectorAll('.btn-abrir-procesar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const d = todasDevoluciones.find(x => x.id === id);
                if (d) abrirModalProcesar(d);
            });
        });

        document.querySelectorAll('.btn-ver-comprobante').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const d = todasDevoluciones.find(x => x.id === id);
                if (d) abrirModalVisor(d);
            });
        });
    }

    // -------------------------------------------------------------
    // MODAL DETALLE (CA02, CA07)
    // -------------------------------------------------------------
    function abrirModalDetalle(devolucion) {
        devolucionSeleccionada = devolucion;
        const codLimpio = limpiarCodigo(devolucion.pedidoCodigo);
        
        let estadoBadge = devolucion.estado === 'Procesada' 
            ? '<span class="badge" style="background:var(--success-color);">Procesada</span>' 
            : '<span class="badge" style="background:#F59E0B;">Solicitada (Pendiente)</span>';

        let html = `
            <div style="margin-bottom:1rem; font-size:0.9rem; line-height:1.6;">
                <strong>Pedido:</strong> #${codLimpio} ${devolucion.esDevolucionDeReposicion ? '(Devolución de Reposición)' : ''}<br>
                <strong>Fecha Solicitud:</strong> ${formatDateTime(devolucion.fechaSolicitud?.toDate())}<br>
                <strong>Estado:</strong> ${estadoBadge}<br>
                <strong>Motivo del Reclamo:</strong> <span style="color:#DC2626; font-weight:600;">${devolucion.motivo}</span>
                ${devolucion.observacion ? `<br><div style="margin-top:0.35rem; word-break:break-word; overflow-wrap:anywhere;"><strong>Observación:</strong> <em>${devolucion.observacion}</em></div>` : ''}
            </div>

            <div style="background:#F8FAFC; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:1rem;">
                <strong style="font-size:0.85rem; color:var(--text-main); display:block; margin-bottom:0.4rem;">Productos Afectados:</strong>
                <table style="font-size:0.85rem; width:100%;">
                    <thead>
                        <tr style="border-bottom:1px solid var(--border-color);">
                            <th style="text-align:left;">Cant</th>
                            <th style="text-align:left;">Producto</th>
                            <th style="text-align:right;">P.U.</th>
                            <th style="text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(devolucion.productos || []).map(p => `
                            <tr>
                                <td>${p.cantidad}</td>
                                <td>${p.nombre}</td>
                                <td style="text-align:right;">${formatCurrency(p.precio)}</td>
                                <td style="text-align:right; font-weight:600;">${formatCurrency(p.cantidad * p.precio)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="d-flex justify-between align-center" style="margin-top:0.6rem; border-top:1px dashed var(--border-color); padding-top:0.5rem; font-weight:bold;">
                    <span>Monto Total a Reembolsar:</span>
                    <span style="font-size:1.15rem; color:#1E3A8A;">${formatCurrency(devolucion.monto)}</span>
                </div>
            </div>

            <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:var(--radius-md); padding:0.75rem; margin-bottom:1rem; font-size:0.88rem; line-height:1.6;">
                <div class="d-flex justify-between align-center flex-wrap" style="margin-bottom:0.35rem;">
                    <strong style="color:#1E40AF;">
                        Datos para el Reembolso (${devolucion.modalidadReal || devolucion.modalidad}):
                    </strong>
                    ${devolucion.datosModificadosPorAdmin ? '<span class="badge" style="background:#F59E0B; font-size:0.7rem;">✏️ Corregido por Admin</span>' : ''}
                </div>
                ${(devolucion.modalidadReal || devolucion.modalidad) === 'Transferencia' ? `
                    • <strong>Tipo de Cuenta:</strong> ${devolucion.datosModalidad?.tipoCuenta === 'cci' ? 'CCI (Interbancaria)' : 'Cuenta Corriente / Ahorros'}<br>
                    • <strong>N° de Cuenta / CCI:</strong> <span style="font-family:monospace; font-weight:bold; font-size:0.95rem;">${devolucion.datosModalidad?.cuentaBancaria || 'N/A'}</span><br>
                    • <strong>Titular:</strong> ${devolucion.datosModalidad?.titular || 'N/A'}
                ` : `
                    • <strong>Número de Celular:</strong> <span style="font-family:monospace; font-weight:bold; font-size:1rem;">${devolucion.datosModalidad?.telefono || 'N/A'}</span><br>
                    • <strong>Titular de ${(devolucion.modalidadReal || devolucion.modalidad)}:</strong> ${devolucion.datosModalidad?.titular || 'N/A'}
                `}
                ${devolucion.datosModificadosPorAdmin && devolucion.datosModalidadOriginal ? `
                    <div style="margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed #BFDBFE; font-size:0.8rem; color:#64748B;">
                        <strong>Datos originales registrados en caja:</strong> Canal: ${devolucion.modalidadOriginal || devolucion.modalidad} | Destino: ${devolucion.datosModalidadOriginal.telefono || devolucion.datosModalidadOriginal.cuentaBancaria || 'N/A'} (${devolucion.datosModalidadOriginal.titular || 'N/A'})
                    </div>
                ` : ''}
            </div>

            <div style="background:#F8FAFC; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:0.5rem; font-size:0.88rem; line-height:1.6;">
                <strong style="color:var(--text-main); display:block; margin-bottom:0.25rem;">Contacto del Cliente que reclamó:</strong>
                • <strong>Nombre:</strong> ${devolucion.datosContacto?.nombre || 'N/A'}<br>
                • <strong>Teléfono de contacto:</strong> ${devolucion.datosContacto?.telefono || 'N/A'}
            </div>
        `;

        if (devolucion.estado === 'Procesada') {
            html += `
                <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:var(--radius-md); padding:0.75rem; margin-top:0.75rem; font-size:0.85rem; color:#065F46; line-height:1.5;">
                    ✅ <strong>Reembolso Procesado</strong> el ${formatDateTime(devolucion.fechaProcesado?.toDate())}<br>
                    📄 <strong>Nota de Crédito:</strong> <span style="font-family:monospace; font-weight:bold; color:#0F172A;">${devolucion.numeroNotaCredito || 'Generada'}</span>
                </div>
            `;
            btnAccionDesdeDetalle.textContent = '🖼️ Ver Voucher';
            btnAccionDesdeDetalle.className = 'btn btn-success';
            btnAccionDesdeDetalle.style.display = 'block';
            btnAccionDesdeDetalle.onclick = () => {
                modalDetalle.style.display = 'none';
                abrirModalVisor(devolucion);
            };

            if (btnNcDesdeDetalle) {
                btnNcDesdeDetalle.style.display = 'block';
                btnNcDesdeDetalle.onclick = () => {
                    window.open(`nota-credito.html?id=${devolucion.id}`, '_blank');
                };
            }
        } else {
            if (btnNcDesdeDetalle) {
                btnNcDesdeDetalle.style.display = 'none';
            }
            btnAccionDesdeDetalle.textContent = '💸 Procesar Reembolso';
            btnAccionDesdeDetalle.className = 'btn btn-primary';
            btnAccionDesdeDetalle.style.display = 'block';
            btnAccionDesdeDetalle.onclick = () => {
                modalDetalle.style.display = 'none';
                abrirModalProcesar(devolucion);
            };
        }

        detalleBody.innerHTML = html;
        modalDetalle.style.display = 'flex';
    }

    btnCerrarModalDetalle.addEventListener('click', () => modalDetalle.style.display = 'none');
    btnCerrarDetalle.addEventListener('click', () => modalDetalle.style.display = 'none');

    // -------------------------------------------------------------
    // MODAL PROCESAR REEMBOLSO (CA03, CA04, CA05, CA06 y Validación de Destino)
    // -------------------------------------------------------------
    function actualizarCamposDestinoModal() {
        if (!procesarModalidadReal) return;
        const mod = procesarModalidadReal.value;
        if (modalidadNuevaTxt) modalidadNuevaTxt.textContent = mod;

        if (mod === 'Yape' || mod === 'Plin') {
            if (procesarCamposBilletera) procesarCamposBilletera.style.display = 'block';
            if (procesarCamposTransferencia) procesarCamposTransferencia.style.display = 'none';
            if (procesarLblBilletera) procesarLblBilletera.textContent = mod;
            if (procesarLblTitularBilletera) procesarLblTitularBilletera.textContent = mod;
        } else {
            if (procesarCamposBilletera) procesarCamposBilletera.style.display = 'none';
            if (procesarCamposTransferencia) procesarCamposTransferencia.style.display = 'block';
            const tipo = document.querySelector('input[name="procesar-tipo-cuenta"]:checked')?.value || 'cuenta';
            if (procesarLblCuentaBancaria) {
                procesarLblCuentaBancaria.textContent = tipo === 'cci' 
                    ? 'N° de CCI Interbancario * (20 dígitos):' 
                    : 'N° de Cuenta Bancaria * (10 a 20 dígitos):';
            }
        }
    }

    function validarFormularioProcesar() {
        if (!devolucionSeleccionada) return false;
        const mod = procesarModalidadReal ? procesarModalidadReal.value : devolucionSeleccionada.modalidad;
        let destinoValido = true;
        let datosHanCambiado = false;

        const origMod = devolucionSeleccionada.modalidad;
        const origDatos = devolucionSeleccionada.datosModalidad || {};

        if (mod !== origMod) {
            datosHanCambiado = true;
        }

        if (mod === 'Yape' || mod === 'Plin') {
            const tel = (procesarTelefonoBilletera ? procesarTelefonoBilletera.value : '').trim();
            const tit = (procesarTitularBilletera ? procesarTitularBilletera.value : '').trim();

            const telValido = tel.length === 9 && tel.startsWith('9');
            const titValido = tit.length >= 3;

            if (errorTelefonoBilletera) {
                errorTelefonoBilletera.style.display = (tel.length > 0 && !telValido) ? 'block' : 'none';
            }
            if (errorTitularBilletera) {
                errorTitularBilletera.style.display = (tit.length > 0 && !titValido) ? 'block' : 'none';
            }

            if (!telValido || !titValido) {
                destinoValido = false;
            }

            if (tel !== (origDatos.telefono || '') || tit !== (origDatos.titular || '')) {
                datosHanCambiado = true;
            }

        } else if (mod === 'Transferencia') {
            const tipo = document.querySelector('input[name="procesar-tipo-cuenta"]:checked')?.value || 'cuenta';
            const cta = (procesarCuentaBancaria ? procesarCuentaBancaria.value : '').trim();
            const tit = (procesarTitularTransferencia ? procesarTitularTransferencia.value : '').trim();

            let ctaValida = false;
            if (tipo === 'cci') {
                ctaValida = cta.length === 20;
            } else {
                ctaValida = cta.length >= 10 && cta.length <= 20;
            }
            const titValido = tit.length >= 3;

            if (errorCuentaBancaria) {
                errorCuentaBancaria.style.display = (cta.length > 0 && !ctaValida) ? 'block' : 'none';
            }
            if (errorTitularTransferencia) {
                errorTitularTransferencia.style.display = (tit.length > 0 && !titValido) ? 'block' : 'none';
            }

            if (!ctaValida || !titValido) {
                destinoValido = false;
            }

            if (cta !== (origDatos.cuentaBancaria || '') || tit !== (origDatos.titular || '') || tipo !== (origDatos.tipoCuenta || 'cuenta')) {
                datosHanCambiado = true;
            }
        }

        if (badgeDatosEditados) {
            badgeDatosEditados.style.display = datosHanCambiado ? 'inline-block' : 'none';
        }

        const completo = destinoValido && !!comprobanteProcesado;
        if (btnConfirmarProcesar) {
            btnConfirmarProcesar.disabled = !completo;
        }

        return destinoValido;
    }

    function abrirModalProcesar(devolucion) {
        devolucionSeleccionada = devolucion;
        comprobanteProcesado = null;

        procesarMonto.textContent = formatCurrency(devolucion.monto);
        
        let datosBancariosHtml = `<strong>Canal registrado en caja:</strong> ${devolucion.modalidad}<br>`;
        if (devolucion.modalidad === 'Transferencia') {
            const tipo = devolucion.datosModalidad?.tipoCuenta === 'cci' ? 'CCI' : 'N° Cuenta';
            datosBancariosHtml += `<strong>${tipo}:</strong> ${devolucion.datosModalidad?.cuentaBancaria || 'N/A'}<br>
                                   <strong>Titular:</strong> ${devolucion.datosModalidad?.titular || 'N/A'}`;
        } else {
            datosBancariosHtml += `<strong>Celular ${devolucion.modalidad}:</strong> ${devolucion.datosModalidad?.telefono || 'N/A'}<br>
                                   <strong>Titular:</strong> ${devolucion.datosModalidad?.titular || 'N/A'}`;
        }
        procesarDatosBancarios.innerHTML = datosBancariosHtml;

        // Configurar selector de modalidad real
        if (procesarModalidadReal) {
            procesarModalidadReal.value = devolucion.modalidad || 'Transferencia';
        }
        if (modalidadSolicitadaTxt) {
            modalidadSolicitadaTxt.textContent = devolucion.modalidad || 'N/A';
        }
        if (modalidadNuevaTxt && procesarModalidadReal) {
            modalidadNuevaTxt.textContent = procesarModalidadReal.value;
        }
        if (modalidadCambioAviso) modalidadCambioAviso.style.display = 'none';

        // Pre-cargar datos de destino desde la solicitud original
        const datosMod = devolucion.datosModalidad || {};
        if (procesarTelefonoBilletera) {
            procesarTelefonoBilletera.value = datosMod.telefono || '';
        }
        if (procesarTitularBilletera) {
            procesarTitularBilletera.value = datosMod.titular || devolucion.datosContacto?.nombre || '';
        }

        if (procesarCuentaBancaria) {
            procesarCuentaBancaria.value = datosMod.cuentaBancaria || '';
        }
        if (procesarTitularTransferencia) {
            procesarTitularTransferencia.value = datosMod.titular || devolucion.datosContacto?.nombre || '';
        }

        const tipoCtaRadio = document.querySelector(`input[name="procesar-tipo-cuenta"][value="${datosMod.tipoCuenta === 'cci' ? 'cci' : 'cuenta'}"]`);
        if (tipoCtaRadio) tipoCtaRadio.checked = true;

        if (errorTelefonoBilletera) errorTelefonoBilletera.style.display = 'none';
        if (errorTitularBilletera) errorTitularBilletera.style.display = 'none';
        if (errorCuentaBancaria) errorCuentaBancaria.style.display = 'none';
        if (errorTitularTransferencia) errorTitularTransferencia.style.display = 'none';
        if (badgeDatosEditados) badgeDatosEditados.style.display = 'none';

        // Resetear input de archivo y dropzone
        inputArchivoComprobante.value = '';
        dropzoneComprobante.style.display = 'block';
        uploadPreviewBox.style.display = 'none';
        btnConfirmarProcesar.disabled = true;

        actualizarCamposDestinoModal();
        validarFormularioProcesar();

        modalProcesar.style.display = 'flex';
    }

    if (procesarModalidadReal) {
        procesarModalidadReal.addEventListener('change', () => {
            if (!devolucionSeleccionada) return;
            const modOriginal = devolucionSeleccionada.modalidad;
            const modNueva = procesarModalidadReal.value;

            if (modNueva !== modOriginal) {
                if (modalidadCambioAviso) modalidadCambioAviso.style.display = 'block';
            } else {
                if (modalidadCambioAviso) modalidadCambioAviso.style.display = 'none';
            }

            actualizarCamposDestinoModal();
            validarFormularioProcesar();
        });
    }

    // Validación y sanitización en tiempo real de caracteres
    if (procesarTelefonoBilletera) {
        procesarTelefonoBilletera.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
            validarFormularioProcesar();
        });
    }

    if (procesarTitularBilletera) {
        procesarTitularBilletera.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]/g, '');
            validarFormularioProcesar();
        });
    }

    if (procesarCuentaBancaria) {
        procesarCuentaBancaria.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 20);
            validarFormularioProcesar();
        });
    }

    if (procesarTitularTransferencia) {
        procesarTitularTransferencia.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.]/g, '');
            validarFormularioProcesar();
        });
    }

    document.querySelectorAll('input[name="procesar-tipo-cuenta"]').forEach(r => {
        r.addEventListener('change', () => {
            actualizarCamposDestinoModal();
            validarFormularioProcesar();
        });
    });

    btnCerrarModalProcesar.addEventListener('click', () => modalProcesar.style.display = 'none');
    btnCancelarProcesar.addEventListener('click', () => modalProcesar.style.display = 'none');

    // Drag and drop para comprobante
    dropzoneComprobante.addEventListener('click', () => inputArchivoComprobante.click());
    dropzoneComprobante.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneComprobante.classList.add('dragover');
    });
    dropzoneComprobante.addEventListener('dragleave', () => dropzoneComprobante.classList.remove('dragover'));
    dropzoneComprobante.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneComprobante.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            manejarArchivoSeleccionado(e.dataTransfer.files[0]);
        }
    });

    inputArchivoComprobante.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            manejarArchivoSeleccionado(e.target.files[0]);
        }
    });

    btnRemoverArchivo.addEventListener('click', () => {
        inputArchivoComprobante.value = '';
        comprobanteProcesado = null;
        dropzoneComprobante.style.display = 'block';
        uploadPreviewBox.style.display = 'none';
        btnConfirmarProcesar.disabled = true;
    });

    // Procesamiento y compresión en Base64 (0 costo, almacenamiento seguro en Firestore)
    async function manejarArchivoSeleccionado(file) {
        try {
            btnConfirmarProcesar.disabled = true;
            btnConfirmarProcesar.textContent = 'Procesando archivo...';

            const resultado = await comprimirYCodificarArchivo(file);
            comprobanteProcesado = resultado;

            // Mostrar vista previa
            previewFilename.textContent = file.name;
            const tamanoKb = (resultado.dataUrl.length * 0.75 / 1024).toFixed(1);
            previewFilesize.textContent = `${tamanoKb} KB`;

            if (resultado.tipo.startsWith('image/')) {
                previewImg.src = resultado.dataUrl;
                previewImg.style.display = 'block';
                previewPdfIcon.style.display = 'none';
            } else {
                previewImg.style.display = 'none';
                previewPdfIcon.style.display = 'block';
            }

            dropzoneComprobante.style.display = 'none';
            uploadPreviewBox.style.display = 'flex';
            validarFormularioProcesar();
            btnConfirmarProcesar.textContent = '✅ Registrar Reembolso';

        } catch (error) {
            console.error("Error al procesar archivo:", error);
            showAlert(error.message || "Error al procesar el archivo seleccionado.");
            inputArchivoComprobante.value = '';
            comprobanteProcesado = null;
            btnConfirmarProcesar.disabled = true;
            btnConfirmarProcesar.textContent = '✅ Registrar Reembolso';
        }
    }

    function comprimirYCodificarArchivo(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error("No se seleccionó ningún archivo."));

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 1200; // Redimensionar a max 1200px para nitidez perfecta y mínimo peso

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Calidad JPEG 0.8 (aprox 40-80 KB)
                        const base64 = canvas.toDataURL('image/jpeg', 0.8);
                        resolve({
                            dataUrl: base64,
                            nombre: file.name,
                            tipo: 'image/jpeg'
                        });
                    };
                    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo."));
                reader.readAsDataURL(file);

            } else if (file.type === 'application/pdf') {
                if (file.size > 800 * 1024) {
                    return reject(new Error("El archivo PDF supera el límite de 800 KB."));
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        dataUrl: e.target.result,
                        nombre: file.name,
                        tipo: 'application/pdf'
                    });
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo PDF."));
                reader.readAsDataURL(file);
            } else {
                reject(new Error("Formato no compatible. Por favor sube una imagen (JPG, PNG) o PDF."));
            }
        });
    }

    // Envío del formulario de procesamiento (CA03, CA04, CA06)
    formProcesar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!devolucionSeleccionada || !comprobanteProcesado) {
            showAlert("Debe adjuntar el comprobante de la transacción obligatoriamente.");
            return;
        }

        if (!validarFormularioProcesar()) {
            showAlert("Por favor verifique que los datos de la cuenta o celular ingresados sean válidos según el canal seleccionado.");
            return;
        }

        btnConfirmarProcesar.disabled = true;
        btnConfirmarProcesar.textContent = 'Registrando reembolso...';

        try {
            const devId = devolucionSeleccionada.id;
            const modalidadReal = procesarModalidadReal ? procesarModalidadReal.value : devolucionSeleccionada.modalidad;
            
            let datosDestinoReal = {};
            let destinoReal = '';

            if (modalidadReal === 'Yape' || modalidadReal === 'Plin') {
                const tel = (procesarTelefonoBilletera ? procesarTelefonoBilletera.value : '').trim();
                const tit = (procesarTitularBilletera ? procesarTitularBilletera.value : '').trim();
                datosDestinoReal = {
                    telefono: tel,
                    titular: tit
                };
                destinoReal = `Cel: ${tel} - Titular: ${tit}`;
            } else if (modalidadReal === 'Transferencia') {
                const tipo = document.querySelector('input[name="procesar-tipo-cuenta"]:checked')?.value || 'cuenta';
                const cta = (procesarCuentaBancaria ? procesarCuentaBancaria.value : '').trim();
                const tit = (procesarTitularTransferencia ? procesarTitularTransferencia.value : '').trim();
                datosDestinoReal = {
                    tipoCuenta: tipo,
                    cuentaBancaria: cta,
                    titular: tit
                };
                destinoReal = `${tipo === 'cci' ? 'CCI' : 'Cta'}: ${cta} - Titular: ${tit}`;
            }

            const res = await procesarDevolucion(devId, {
                comprobanteArchivo: comprobanteProcesado.dataUrl,
                comprobanteNombre: comprobanteProcesado.nombre,
                comprobanteTipo: comprobanteProcesado.tipo,
                modalidadReal,
                destinoReal,
                datosDestinoReal
            });

            showAlert(`✅ Devolución de ${formatCurrency(devolucionSeleccionada.monto)} procesada con éxito.\n\nSe ha generado la Nota de Crédito Electrónica SUNAT N° ${res.numeroNotaCredito}.\nSe abrirá automáticamente para su visualización o descarga en PDF.`);
            modalProcesar.style.display = 'none';
            window.open(`nota-credito.html?id=${devId}`, '_blank');

        } catch (error) {
            console.error("Error al procesar devolución:", error);
            showAlert("Ocurrió un error al procesar la devolución.");
        } finally {
            btnConfirmarProcesar.disabled = false;
            btnConfirmarProcesar.textContent = '✅ Registrar Reembolso';
        }
    });

    // -------------------------------------------------------------
    // MODAL VISOR DE COMPROBANTE ALMACENADO
    // -------------------------------------------------------------
    function abrirModalVisor(devolucion) {
        const codLimpio = limpiarCodigo(devolucion.pedidoCodigo);
        const modTxt = devolucion.modalidadReal && devolucion.modalidadReal !== devolucion.modalidad
            ? `${devolucion.modalidadReal} (Solicitado: ${devolucion.modalidad})`
            : devolucion.modalidad;

        visorMeta.innerHTML = `
            <strong>Pedido:</strong> #${codLimpio} &nbsp;|&nbsp;
            <strong>Monto Reembolsado:</strong> ${formatCurrency(devolucion.monto)} &nbsp;|&nbsp;
            <strong>Canal:</strong> ${modTxt} &nbsp;|&nbsp;
            <strong>Fecha Procesado:</strong> ${formatDateTime(devolucion.fechaProcesado?.toDate())}
        `;

        if (!devolucion.comprobanteArchivo) {
            visorContent.innerHTML = '<p style="color:var(--text-muted); padding:2rem;">No se encontró archivo adjunto para esta devolución.</p>';
            btnDescargarComprobante.style.display = 'none';
        } else {
            btnDescargarComprobante.style.display = 'inline-block';
            btnDescargarComprobante.href = devolucion.comprobanteArchivo;
            btnDescargarComprobante.download = devolucion.comprobanteNombre || `comprobante-pedido-${codLimpio}`;

            if (devolucion.comprobanteTipo === 'application/pdf') {
                visorContent.innerHTML = `
                    <iframe src="${devolucion.comprobanteArchivo}" style="width:100%; height:450px; border:none; border-radius:4px;"></iframe>
                `;
            } else {
                visorContent.innerHTML = `
                    <img src="${devolucion.comprobanteArchivo}" alt="Comprobante de Reembolso" style="max-width:100%; max-height:480px; object-fit:contain; border-radius:6px; box-shadow:var(--shadow-sm);">
                `;
            }
        }

        modalVisor.style.display = 'flex';
    }

    btnCerrarModalVisor.addEventListener('click', () => modalVisor.style.display = 'none');
    btnCerrarVisor.addEventListener('click', () => modalVisor.style.display = 'none');
});

