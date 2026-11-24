import { requireAuth } from '../shared/auth.js';
import { 
    onPedidosDelDia, 
    confirmarEntregaPedido, 
    getProductos, 
    onProductosChange,
    registrarReposicion, 
    solicitarDevolucion 
} from '../shared/db.js';
import { formatCurrency, formatDateTime, getBadgeClass, showAlert } from '../shared/utils.js';

requireAuth('cajera');

document.addEventListener('DOMContentLoaded', () => {
    const tableWrapper = document.getElementById('table-wrapper');
    const table = document.getElementById('pedidos-table');
    const tbody = document.getElementById('pedidos-tbody');
    const mobileList = document.getElementById('pedidos-mobile-list');
    const loadingMsg = document.getElementById('loading-msg');
    const noResultsMsg = document.getElementById('no-results-msg');
    const inputBuscar = document.getElementById('buscar-comprobante');

    // Modales
    const modalDetalle = document.getElementById('modal-detalle');
    const modalContent = document.getElementById('modal-content');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');

    // Modal Reposición
    const modalReposicion = document.getElementById('modal-reposicion');
    const btnCerrarRepo = document.getElementById('btn-cerrar-repo');
    const btnCancelarRepo = document.getElementById('btn-cancelar-repo');
    const formReposicion = document.getElementById('form-reposicion');
    const repoProductosContainer = document.getElementById('repo-productos-container');
    const repoMotivo = document.getElementById('repo-motivo');
    const repoObservacion = document.getElementById('repo-observacion');
    const repoObsCounter = document.getElementById('repo-obs-counter');
    const repoObsReq = document.getElementById('repo-obs-req');
    const btnConfirmarRepo = document.getElementById('btn-confirmar-repo');

    // Modal Devolución
    const modalDevolucion = document.getElementById('modal-devolucion');
    const btnCerrarDev = document.getElementById('btn-cerrar-dev');
    const btnCancelarDev = document.getElementById('btn-cancelar-dev');
    const formDevolucion = document.getElementById('form-devolucion');
    const devProductosContainer = document.getElementById('dev-productos-container');
    const devMontoCalculado = document.getElementById('dev-monto-calculado');
    const devMotivo = document.getElementById('dev-motivo');
    const devObservacion = document.getElementById('dev-observacion');
    const devObsCounter = document.getElementById('dev-obs-counter');
    const devObsReq = document.getElementById('dev-obs-req');
    const devModalidad = document.getElementById('dev-modalidad');
    const devCamposBilletera = document.getElementById('dev-campos-billetera');
    const devCamposTransferencia = document.getElementById('dev-campos-transferencia');
    const devTelefonoBilletera = document.getElementById('dev-telefono-billetera');
    const devTitularBilletera = document.getElementById('dev-titular-billetera');
    const devNumeroCuenta = document.getElementById('dev-numero-cuenta');
    const devTitularTransferencia = document.getElementById('dev-titular-transferencia');
    const devClienteNombre = document.getElementById('dev-cliente-nombre');
    const devClienteNombreHint = document.getElementById('dev-cliente-nombre-hint');
    const devClienteTelefono = document.getElementById('dev-cliente-telefono');
    const btnConfirmarDev = document.getElementById('btn-confirmar-dev');

    let pedidosActuales = [];
    let pedidoActivo = null;
    let catalogoActual = [];

    // Helper para limpiar códigos y evitar dobles almohadillas (##2ROZ)
    function limpiarCodigo(codigo) {
        if (!codigo) return '';
        return String(codigo).replace(/^#+/, '').trim();
    }

    function formatearCodigoMostrar(codigo) {
        const limpio = limpiarCodigo(codigo);
        return limpio ? `#${limpio}` : 'S/N';
    }

    // Suscripción a pedidos del día en tiempo real
    onPedidosDelDia((pedidos) => {
        pedidosActuales = pedidos;
        renderTable();
    });

    // Suscripción en tiempo real al catálogo de productos para disponibilidad (HU-04 CA03)
    onProductosChange((productos) => {
        catalogoActual = productos;
        if (modalReposicion.style.display === 'flex' && pedidoActivo) {
            actualizarOpcionesReposicionEnTiempoReal();
        }
    });

    // Obtener catálogo inicial
    getProductos().then(prods => {
        catalogoActual = prods;
    }).catch(err => {
        console.error("Error al cargar productos:", err);
    });

    inputBuscar.addEventListener('input', renderTable);

    function renderTable() {
        loadingMsg.style.display = 'none';
        tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';

        const termino = inputBuscar.value.trim().toLowerCase();
        
        const filtrados = pedidosActuales.filter(p => {
            if (!termino) return true;
            const codLimpio = limpiarCodigo(p.codigo).toLowerCase();
            const comp = (p.comprobante || '').toLowerCase();
            const termLimpio = termino.replace(/^#+/, '');
            return comp.includes(termino) || codLimpio.includes(termLimpio);
        });

        // Limitar a los 10 más recientes por defecto si no hay término de búsqueda
        const top10 = termino ? filtrados : filtrados.slice(0, 10);

        if (top10.length === 0) {
            if (tableWrapper) tableWrapper.style.display = 'none';
            if (mobileList) mobileList.style.display = 'none';
            noResultsMsg.style.display = 'block';
            return;
        }

        if (tableWrapper) tableWrapper.style.display = '';
        if (mobileList) mobileList.style.display = '';
        noResultsMsg.style.display = 'none';

        top10.forEach(pedido => {
            const badgeClass = getBadgeClass(pedido.estadoGeneral);
            const codigoDisplay = formatearCodigoMostrar(pedido.codigo);
            
            // Construir botones de acción según las nuevas reglas de negocio
            let btnHtml = `
                <button class="btn btn-secondary btn-sm ver-detalle" data-id="${pedido.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Ver detalle del pedido">
                    👁️ Detalle
                </button>
            `;
            
            if (pedido.estadoGeneral === 'Listo') {
                btnHtml += `
                    <button class="btn btn-success btn-sm confirmar-entrega" data-id="${pedido.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Confirmar entrega al cliente">
                        ✅ Entregar
                    </button>
                `;
            } else if (pedido.estadoGeneral === 'Entregado') {
                if (pedido.esReposicion) {
                    // Regla: No se puede hacer reposición a una reposición.
                    // Si el cliente no está satisfecho con la reposición, solo se puede solicitar Devolución cerrando el caso.
                    if (!pedido.tieneDevolucion) {
                        btnHtml += `
                            <button class="btn btn-sm btn-abrir-dev" data-id="${pedido.id}" style="background:#4F46E5; color:#fff; padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Solicitar devolución por insatisfacción con la reposición">
                                💵 Devolución
                            </button>
                        `;
                    }
                } else {
                    // Pedido original: Solo una de las dos (O Reposición en una sola vez o Devolución cerrando caso).
                    if (!pedido.tieneReposicion && !pedido.tieneDevolucion) {
                        btnHtml += `
                            <button class="btn btn-sm btn-abrir-repo" data-id="${pedido.id}" style="background:#8B5CF6; color:#fff; padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Registrar reposición por producto (única vez)">
                                🔄 Reposición
                            </button>
                            <button class="btn btn-sm btn-abrir-dev" data-id="${pedido.id}" style="background:#4F46E5; color:#fff; padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Solicitar devolución de dinero">
                                💵 Devolución
                            </button>
                        `;
                    }
                }
            }
            
            btnHtml += `
                <button class="btn btn-primary btn-sm btn-imprimir" data-id="${pedido.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Imprimir ticket o comprobante">
                    🖨️ Imprimir
                </button>
            `;

            // Indicadores y etiquetas
            let codigoColHtml = '';
            if (pedido.esReposicion) {
                const codOrigenLimpio = limpiarCodigo(pedido.pedidoOrigenCodigo || pedido.codigo);
                let extraBadges = '';
                if (pedido.tieneDevolucion) {
                    const devTxt = pedido.estadoDevolucion === 'Procesada' ? 'Devolución procesada (Caso cerrado)' : 'Devolución solicitada';
                    const devBg = pedido.estadoDevolucion === 'Procesada' ? 'var(--success-color)' : '#F59E0B';
                    extraBadges += `<span class="badge" style="background:${devBg}; font-size:0.68rem; margin-top:0.25rem;">${devTxt}</span>`;
                }
                codigoColHtml = `
                    <div style="line-height:1.3;">
                        <span style="font-weight:700; color:var(--text-main); font-size:0.92rem;">Reposición de #${codOrigenLimpio}</span>
                        <div style="margin-top:0.25rem; display:flex; flex-direction:column; gap:0.15rem; align-items:flex-start;">
                            <span class="badge" style="background:var(--primary-color); font-size:0.68rem; font-weight:700;">REPOSICIÓN</span>
                            ${extraBadges}
                        </div>
                    </div>
                `;
            } else {
                let extraBadges = '';
                if (pedido.tieneReposicion) {
                    extraBadges += `<span class="badge" style="background:#8B5CF6; font-size:0.68rem; margin-top:0.25rem;">Con reposición</span> `;
                }
                if (pedido.tieneDevolucion) {
                    if (pedido.estadoDevolucion === 'Procesada') {
                        extraBadges += `<span class="badge" style="background:var(--success-color); font-size:0.68rem; margin-top:0.25rem;">Devolución procesada (Caso cerrado)</span> `;
                    } else {
                        extraBadges += `<span class="badge" style="background:#F59E0B; font-size:0.68rem; margin-top:0.25rem;">Devolución solicitada</span> `;
                    }
                }

                codigoColHtml = `
                    <div>
                        <strong style="font-size:0.95rem; font-family:monospace; color:var(--text-main);">${codigoDisplay}</strong>
                        ${extraBadges ? `<div style="display:flex; flex-direction:column; gap:0.15rem; align-items:flex-start;">${extraBadges}</div>` : ''}
                    </div>
                `;
            }

            // 1. RENDERIZAR EN TABLA DESKTOP
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${codigoColHtml}</td>
                <td><span style="font-family:monospace; font-weight:600; color:#334155;">${pedido.comprobante || 'N/A'}</span></td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${formatDateTime(pedido.fechaRegistro?.toDate())}</td>
                <td style="font-weight:700; color:var(--text-main);">${formatCurrency(pedido.total)}</td>
                <td><span class="badge ${badgeClass}">${pedido.estadoGeneral}</span></td>
                <td style="text-align:right;">
                    <div class="pedido-actions-group">
                        ${btnHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);

            // 2. RENDERIZAR EN CARDS MÓVILES RESPONSIVAS
            if (mobileList) {
                const cardDiv = document.createElement('div');
                cardDiv.className = `pedido-mobile-card ${pedido.esReposicion ? 'es-repo' : ''}`;
                cardDiv.innerHTML = `
                    <div class="d-flex justify-between align-center" style="border-bottom:1px solid var(--border-color); padding-bottom:0.6rem;">
                        <div>${codigoColHtml}</div>
                        <div><span class="badge ${badgeClass}" style="font-size:0.82rem;">${pedido.estadoGeneral}</span></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.85rem;">
                        <div>
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">COMPROBANTE</span>
                            <strong style="font-family:monospace;">${pedido.comprobante || 'N/A'}</strong>
                        </div>
                        <div>
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">TOTAL</span>
                            <strong style="color:var(--primary-color); font-size:0.95rem;">${formatCurrency(pedido.total)}</strong>
                        </div>
                        <div style="grid-column: span 2;">
                            <span style="color:var(--text-muted); font-size:0.75rem; display:block;">FECHA Y HORA</span>
                            <span>${formatDateTime(pedido.fechaRegistro?.toDate())}</span>
                        </div>
                    </div>
                    <div class="pedido-actions-group" style="justify-content:stretch; border-top:1px dashed var(--border-color); padding-top:0.6rem;">
                        ${btnHtml}
                    </div>
                `;
                mobileList.appendChild(cardDiv);
            }
        });

        // Asignación de eventos a todos los botones (tabla y móvil)
        document.querySelectorAll('.ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const p = pedidosActuales.find(x => x.id === id);
                if (p) mostrarDetalle(p);
            });
        });

        document.querySelectorAll('.confirmar-entrega').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                btn.disabled = true;
                btn.textContent = 'Entregando...';
                try {
                    await confirmarEntregaPedido(id);
                } catch (err) {
                    showAlert("Error al confirmar entrega.");
                    btn.disabled = false;
                    btn.textContent = 'Entregar';
                }
            });
        });

        document.querySelectorAll('.btn-abrir-repo').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const p = pedidosActuales.find(x => x.id === id);
                if (p) abrirModalReposicion(p);
            });
        });

        document.querySelectorAll('.btn-abrir-dev').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const p = pedidosActuales.find(x => x.id === id);
                if (p) abrirModalDevolucion(p);
            });
        });

        document.querySelectorAll('.btn-imprimir').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.open(`comprobante.html?id=${id}`, '_blank');
            });
        });
    }

    // Modal Detalle
    function mostrarDetalle(pedido) {
        let estadoBadge = `<span class="badge ${getBadgeClass(pedido.estadoGeneral)}">${pedido.estadoGeneral}</span>`;
        if (pedido.tieneReposicion) {
            estadoBadge += ` <span class="badge" style="background:#8B5CF6;">Con reposición</span>`;
        }
        if (pedido.tieneDevolucion) {
            const bg = pedido.estadoDevolucion === 'Procesada' ? 'var(--success-color)' : '#F59E0B';
            estadoBadge += ` <span class="badge" style="background:${bg};">Devolución ${pedido.estadoDevolucion}</span>`;
        }

        const codigoDisplay = formatearCodigoMostrar(pedido.codigo);

        // Reglas de disponibilidad de botones dentro del modal detalle
        const puedeRepo = pedido.estadoGeneral === 'Entregado' && !pedido.esReposicion && !pedido.tieneReposicion && !pedido.tieneDevolucion;
        const puedeDev = (pedido.estadoGeneral === 'Entregado' && !pedido.esReposicion && !pedido.tieneReposicion && !pedido.tieneDevolucion) ||
                         (pedido.estadoGeneral === 'Entregado' && pedido.esReposicion && !pedido.tieneDevolucion);

        let html = `
            <div style="margin-bottom:1rem; font-size:0.9rem; line-height:1.6;">
                <strong>Código:</strong> ${codigoDisplay}<br>
                <strong>Comprobante:</strong> ${pedido.comprobante || 'N/A'}<br>
                <strong>Fecha/Hora:</strong> ${formatDateTime(pedido.fechaRegistro?.toDate())}<br>
                <strong>Modalidad de Pago:</strong> ${pedido.modalidadPago || 'N/A'}<br>
                <strong>Estado:</strong> ${estadoBadge}
                ${pedido.detalle ? `<br><div style="margin-top:0.35rem; word-break:break-word; overflow-wrap:anywhere;"><strong>Detalle:</strong> <em>${pedido.detalle}</em></div>` : ''}
                ${pedido.observacionReposicion ? `<br><div style="margin-top:0.35rem; word-break:break-word; overflow-wrap:anywhere;"><strong>Obs. Reposición:</strong> <em>${pedido.observacionReposicion}</em></div>` : ''}
            </div>
            
            <table style="font-size:0.88rem; margin-bottom:1rem; width:100%;">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Reclamos</th>
                    </tr>
                </thead>
                <tbody>
                    ${(pedido.productos || []).map(p => {
                        const rep = p.unidadesRepuestas || 0;
                        const dev = p.unidadesDevueltas || 0;
                        let reclamoText = 'Ninguno';
                        if (rep > 0 || dev > 0) {
                            const partes = [];
                            if (rep > 0) partes.push(`${rep} repuesta(s)`);
                            if (dev > 0) partes.push(`${dev} devuelta(s)`);
                            reclamoText = `<span style="color:#DC2626; font-weight:600;">${partes.join(', ')}</span>`;
                        }
                        return `
                            <tr>
                                <td>${p.nombre}</td>
                                <td>${p.cantidad}</td>
                                <td>${formatCurrency(p.precio)}</td>
                                <td>${p.estado}</td>
                                <td>${reclamoText}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="d-flex justify-between align-center" style="font-weight:bold; font-size:1.15rem; margin-bottom:1rem; border-top:1px solid var(--border-color); padding-top:0.5rem;">
                <span>Total:</span>
                <span>${formatCurrency(pedido.total)}</span>
            </div>

            <div class="d-flex gap-1 justify-between flex-wrap">
                <button class="btn btn-primary" style="flex:1; min-width:120px;" onclick="window.open('comprobante.html?id=${pedido.id}', '_blank')">🖨️ Imprimir</button>
                ${puedeRepo ? `
                    <button id="btn-modal-repo" class="btn" style="flex:1; min-width:120px; background:#8B5CF6; color:#fff;">🔄 Reposición</button>
                ` : ''}
                ${puedeDev ? `
                    <button id="btn-modal-dev" class="btn" style="flex:1; min-width:120px; background:#4F46E5; color:#fff;">💵 Devolución</button>
                ` : ''}
            </div>
        `;
        modalContent.innerHTML = html;

        if (puedeRepo) {
            const btnRepo = document.getElementById('btn-modal-repo');
            if (btnRepo) {
                btnRepo.addEventListener('click', () => {
                    modalDetalle.style.display = 'none';
                    abrirModalReposicion(pedido);
                });
            }
        }

        if (puedeDev) {
            const btnDev = document.getElementById('btn-modal-dev');
            if (btnDev) {
                btnDev.addEventListener('click', () => {
                    modalDetalle.style.display = 'none';
                    abrirModalDevolucion(pedido);
                });
            }
        }

        modalDetalle.style.display = 'flex';
    }

    btnCerrarModal.addEventListener('click', () => {
        modalDetalle.style.display = 'none';
    });

    // -------------------------------------------------------------
    // SANITIZACIÓN DE TECLADO PARA INPUTS DE CANTIDAD
    // -------------------------------------------------------------
    function configurarInputCantidad(input, maxDisp) {
        input.addEventListener('keydown', (e) => {
            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                e.preventDefault();
            }
        });

        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val !== '') {
                let num = parseInt(val, 10);
                if (num < 1) num = 1;
                if (num > maxDisp) num = maxDisp;
                e.target.value = num;
            }
        });

        input.addEventListener('blur', (e) => {
            if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                e.target.value = 1;
            }
        });
    }

    // -------------------------------------------------------------
    // RESTRICCIÓN Y VALIDACIÓN DE CELULARES (9 DÍGITOS, INICIA CON 9)
    // -------------------------------------------------------------
    function configurarInputCelularPeruano(input) {
        input.addEventListener('keydown', (e) => {
            // Teclas de control permitidas
            if (['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) {
                return;
            }
            // Bloquear cualquier tecla que no sea un dígito
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
                return;
            }
            // Si el cursor está en la primera posición, la tecla DEBE ser 9
            if (input.selectionStart === 0 && e.key !== '9') {
                e.preventDefault();
            }
        });

        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            // Si no empieza con 9, limpiar dígitos iniciales que no sean 9
            if (val.length > 0 && val[0] !== '9') {
                val = val.replace(/^[^9]*/, '');
            }
            e.target.value = val.slice(0, 9);
            validarFormularioDevolucion();
        });
    }

    configurarInputCelularPeruano(devTelefonoBilletera);
    configurarInputCelularPeruano(devClienteTelefono);

    // Limitar longitud en el nombre del cliente (máx 50 caracteres)
    devClienteNombre.addEventListener('input', (e) => {
        if (e.target.value.length > 50) {
            e.target.value = e.target.value.slice(0, 50);
        }
        validarFormularioDevolucion();
    });

    devTitularBilletera.addEventListener('input', (e) => {
        if (e.target.value.length > 50) {
            e.target.value = e.target.value.slice(0, 50);
        }
        validarFormularioDevolucion();
    });

    devTitularTransferencia.addEventListener('input', (e) => {
        if (e.target.value.length > 50) {
            e.target.value = e.target.value.slice(0, 50);
        }
        validarFormularioDevolucion();
    });

    // -------------------------------------------------------------
    // HU-04: REGISTRAR REPOSICIÓN (Mismo producto estricto, sin costo)
    // -------------------------------------------------------------
    async function abrirModalReposicion(pedido) {
        pedidoActivo = pedido;
        const codigoLimpio = limpiarCodigo(pedido.codigo);
        document.getElementById('repo-title').textContent = `Registrar Reposición - Pedido #${codigoLimpio}`;
        
        try {
            catalogoActual = await getProductos();
        } catch (e) {
            console.error("Error al obtener catálogo:", e);
        }

        repoProductosContainer.innerHTML = '';
        repoMotivo.value = '';
        repoObservacion.value = '';
        repoObsCounter.textContent = '0';
        repoObsReq.textContent = '(Opcional, máx 250 car.)';
        repoObsReq.style.color = 'var(--text-muted)';
        btnConfirmarRepo.disabled = true;

        let hayProductosDisponiblesParaReclamar = false;

        (pedido.productos || []).forEach((prod, index) => {
            const repuestas = prod.unidadesRepuestas || 0;
            const devueltas = prod.unidadesDevueltas || 0;
            const disponibleReclamo = prod.cantidad - repuestas - devueltas;

            if (disponibleReclamo <= 0) {
                const itemDiv = document.createElement('div');
                itemDiv.style.padding = '0.5rem';
                itemDiv.style.borderBottom = '1px solid var(--border-color)';
                itemDiv.style.opacity = '0.6';
                itemDiv.innerHTML = `
                    <div style="font-size:0.85rem;">
                        <strong>${prod.nombre}</strong> (${prod.cantidad} comprados) — <em>Ya reclamado totalmente (${repuestas} repuestas, ${devueltas} devueltas)</em>
                    </div>
                `;
                repoProductosContainer.appendChild(itemDiv);
                return;
            }

            hayProductosDisponiblesParaReclamar = true;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'repo-item';
            itemDiv.dataset.index = index;
            itemDiv.dataset.originalId = prod.id;
            itemDiv.dataset.originalPrecio = prod.precio;
            itemDiv.dataset.originalNombre = prod.nombre;
            itemDiv.dataset.originalTipo = prod.tipo || '';
            itemDiv.dataset.disponibleReclamo = disponibleReclamo;
            itemDiv.style.padding = '0.75rem';
            itemDiv.style.borderBottom = '1px solid var(--border-color)';
            itemDiv.style.background = '#fff';
            itemDiv.style.borderRadius = 'var(--radius-md)';
            itemDiv.style.marginBottom = '0.5rem';

            itemDiv.innerHTML = `
                <div class="d-flex justify-between align-center">
                    <label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-weight:600; font-size:0.9rem;" class="repo-check-label">
                        <input type="checkbox" class="repo-check" data-idx="${index}">
                        <span class="repo-item-title">${prod.nombre} (${formatCurrency(prod.precio)})</span>
                    </label>
                    <span style="font-size:0.8rem; color:var(--text-muted);">
                        Disponibles: <strong class="repo-disp-max">${disponibleReclamo}</strong> de ${prod.cantidad}
                    </span>
                </div>

                <div class="repo-status-feedback" style="margin-top:0.35rem; font-size:0.82rem;"></div>

                <div class="repo-item-controls" style="display:none; margin-top:0.6rem; padding-top:0.6rem; border-top:1px dashed var(--border-color);">
                    <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                        <label style="font-size:0.82rem; font-weight:600;">Cant. a reponer:</label>
                        <input type="number" class="repo-cantidad" min="1" max="${disponibleReclamo}" value="1" style="width:75px; padding:0.35rem 0.5rem; font-size:0.9rem; text-align:center;">
                        <span style="font-size:0.82rem; color:#059669; font-weight:600;">✓ Mismo producto (${prod.nombre}) - S/ 0.00 adicional</span>
                    </div>
                </div>
            `;
            repoProductosContainer.appendChild(itemDiv);

            const cantInput = itemDiv.querySelector('.repo-cantidad');
            configurarInputCantidad(cantInput, disponibleReclamo);
        });

        if (!hayProductosDisponiblesParaReclamar) {
            repoProductosContainer.innerHTML = '<p style="color:#DC2626; font-size:0.9rem; text-align:center; padding:1rem;">Todos los productos de este pedido ya cuentan con reposición o devolución registrada.</p>';
        }

        actualizarOpcionesReposicionEnTiempoReal();

        repoProductosContainer.querySelectorAll('.repo-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const itemDiv = e.target.closest('.repo-item');
                const controls = itemDiv.querySelector('.repo-item-controls');
                if (e.target.checked) {
                    controls.style.display = 'block';
                } else {
                    controls.style.display = 'none';
                }
                validarFormularioReposicion();
            });
        });

        repoProductosContainer.querySelectorAll('.repo-cantidad').forEach(inp => {
            inp.addEventListener('input', () => {
                validarFormularioReposicion();
            });
        });

        modalReposicion.style.display = 'flex';
    }

    // Actualización dinámica en tiempo real de reposición (Solo el mismo producto si está disponible en cocina)
    function actualizarOpcionesReposicionEnTiempoReal() {
        const items = repoProductosContainer.querySelectorAll('.repo-item');
        if (items.length === 0) return;

        let totalDisponiblesCocina = 0;

        items.forEach(item => {
            const origId = item.dataset.originalId;
            const origNombre = item.dataset.originalNombre;
            const chk = item.querySelector('.repo-check');
            const controls = item.querySelector('.repo-item-controls');
            const feedback = item.querySelector('.repo-status-feedback');
            const label = item.querySelector('.repo-check-label');

            // Verificar si el producto original está disponible en cocina
            const prodCatalogo = catalogoActual.find(c => c.id === origId || c.nombre?.trim().toLowerCase() === origNombre?.trim().toLowerCase());
            const originalDisponible = prodCatalogo ? prodCatalogo.disponible !== false : true;

            if (!originalDisponible) {
                // Deshabilitar y advertir
                chk.checked = false;
                chk.disabled = true;
                if (label) {
                    label.style.opacity = '0.6';
                    label.style.cursor = 'not-allowed';
                }
                if (controls) controls.style.display = 'none';
                if (feedback) {
                    feedback.innerHTML = `
                        <div style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; padding:0.4rem 0.6rem; border-radius:4px; margin-top:0.35rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                            <span>⚠️ <strong>No disponible en cocina:</strong> No se puede reponer este producto.</span>
                            <button type="button" class="btn btn-sm btn-cambiar-a-dev" style="background:#DC2626; color:#fff; font-size:0.75rem; padding:0.2rem 0.5rem;">
                                Solicitar Devolución
                            </button>
                        </div>
                    `;
                    const btnDev = feedback.querySelector('.btn-cambiar-a-dev');
                    if (btnDev) {
                        btnDev.addEventListener('click', () => {
                            modalReposicion.style.display = 'none';
                            if (pedidoActivo) abrirModalDevolucion(pedidoActivo);
                        });
                    }
                }
            } else {
                totalDisponiblesCocina++;
                chk.disabled = false;
                if (label) {
                    label.style.opacity = '1';
                    label.style.cursor = 'pointer';
                }
                if (feedback) feedback.innerHTML = '';
            }
        });

        // Alerta superior si ningún producto del pedido se puede reponer porque cocina los marcó no disponibles
        let alertContainer = document.getElementById('repo-alerta-global-nodisp');
        if (totalDisponiblesCocina === 0) {
            if (!alertContainer) {
                alertContainer = document.createElement('div');
                alertContainer.id = 'repo-alerta-global-nodisp';
                alertContainer.style.background = '#FEF2F2';
                alertContainer.style.border = '1px solid #F87171';
                alertContainer.style.color = '#991B1B';
                alertContainer.style.padding = '0.75rem';
                alertContainer.style.borderRadius = 'var(--radius-md)';
                alertContainer.style.marginBottom = '0.75rem';
                alertContainer.style.fontSize = '0.85rem';
                alertContainer.innerHTML = `
                    <strong>⚠️ Ningún producto disponible en cocina:</strong>
                    Los productos reclamables figuran como "No disponibles" en el área de cocina. Según las reglas de negocio, solo se pueden reponer los mismos productos. Debe registrarse una <strong>Devolución de Dinero</strong>.
                    <div style="margin-top:0.5rem;">
                        <button type="button" id="btn-alerta-repo-a-dev" class="btn btn-sm" style="background:#4F46E5; color:#fff; font-size:0.8rem; padding:0.35rem 0.75rem;">
                            Ir a Solicitar Devolución
                        </button>
                    </div>
                `;
                repoProductosContainer.parentNode.insertBefore(alertContainer, repoProductosContainer);
                document.getElementById('btn-alerta-repo-a-dev')?.addEventListener('click', () => {
                    modalReposicion.style.display = 'none';
                    if (pedidoActivo) abrirModalDevolucion(pedidoActivo);
                });
            } else {
                alertContainer.style.display = 'block';
            }
        } else if (alertContainer) {
            alertContainer.style.display = 'none';
        }

        validarFormularioReposicion();
    }

    function validarFormularioReposicion() {
        let esValido = true;
        let haySeleccionados = false;

        const items = repoProductosContainer.querySelectorAll('.repo-item');
        items.forEach(item => {
            const chk = item.querySelector('.repo-check');
            if (chk && chk.checked) {
                haySeleccionados = true;
                const cant = parseInt(item.querySelector('.repo-cantidad')?.value) || 0;
                const max = parseInt(item.querySelector('.repo-disp-max')?.textContent) || 0;

                if (cant <= 0 || cant > max) esValido = false;
            }
        });

        if (!haySeleccionados) esValido = false;

        if (!repoMotivo.value) esValido = false;

        if (repoMotivo.value === 'Otro') {
            repoObsReq.textContent = '(Obligatorio, mín 10 car.)';
            repoObsReq.style.color = '#DC2626';
            if (repoObservacion.value.trim().length < 10) {
                esValido = false;
            }
        } else {
            repoObsReq.textContent = '(Opcional, máx 250 car.)';
            repoObsReq.style.color = 'var(--text-muted)';
        }

        btnConfirmarRepo.disabled = !esValido;
    }

    repoMotivo.addEventListener('change', validarFormularioReposicion);
    repoObservacion.addEventListener('input', () => {
        repoObsCounter.textContent = repoObservacion.value.length;
        validarFormularioReposicion();
    });

    btnCerrarRepo.addEventListener('click', () => modalReposicion.style.display = 'none');
    btnCancelarRepo.addEventListener('click', () => modalReposicion.style.display = 'none');

    // Confirmar y Enviar Reposición (Mismo producto estricto, sin costo)
    formReposicion.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnConfirmarRepo.disabled = true;
        btnConfirmarRepo.textContent = 'Enviando a cocina...';

        try {
            const productosReemplazo = [];
            const productosOriginalesAfectados = [];

            repoProductosContainer.querySelectorAll('.repo-item').forEach(item => {
                const chk = item.querySelector('.repo-check');
                if (chk && chk.checked) {
                    const cant = parseInt(item.querySelector('.repo-cantidad').value, 10);
                    const origId = item.dataset.originalId;
                    const origNombre = item.dataset.originalNombre;
                    const origPrecio = parseFloat(item.dataset.originalPrecio) || 0;
                    const origTipo = item.dataset.originalTipo || '';

                    productosOriginalesAfectados.push({
                        id: origId,
                        nombre: origNombre,
                        cantidad: cant
                    });

                    // Regla de negocio estricta: Mismo producto exactamente
                    productosReemplazo.push({
                        id: origId,
                        nombre: origNombre,
                        precio: origPrecio,
                        tipo: origTipo,
                        cantidad: cant
                    });
                }
            });

            await registrarReposicion({
                pedidoOriginal: pedidoActivo,
                productosReemplazo,
                productosOriginalesAfectados,
                motivo: repoMotivo.value,
                observacion: repoObservacion.value.trim(),
                diferenciaTotal: 0,
                modalidadPago: 'Sin costo (Reposición)'
            });

            showAlert("✅ Pedido de reposición generado con éxito. Se envió a cocina con alta prioridad.");
            modalReposicion.style.display = 'none';

        } catch (error) {
            console.error("Error al registrar reposición:", error);
            showAlert("Ocurrió un error al registrar la reposición.");
        } finally {
            btnConfirmarRepo.disabled = false;
            btnConfirmarRepo.textContent = 'Enviar Reposición a Cocina';
        }
    });

    // -------------------------------------------------------------
    // HU-05: SOLICITAR DEVOLUCIÓN
    // -------------------------------------------------------------
    function abrirModalDevolucion(pedido) {
        pedidoActivo = pedido;
        const codigoLimpio = limpiarCodigo(pedido.codigo);
        document.getElementById('dev-title').textContent = `Solicitar Devolución - Pedido #${codigoLimpio}`;

        devProductosContainer.innerHTML = '';
        devMontoCalculado.textContent = 'S/ 0.00';
        devMontoCalculado.dataset.monto = '0';
        devMotivo.value = '';
        devObservacion.value = '';
        devObsCounter.textContent = '0';
        devObsReq.textContent = '(Opcional, máx 250 car.)';
        devObsReq.style.color = 'var(--text-muted)';
        devModalidad.value = '';
        devCamposBilletera.style.display = 'none';
        devCamposTransferencia.style.display = 'none';
        devTelefonoBilletera.value = '';
        devTitularBilletera.value = '';
        devNumeroCuenta.value = '';
        devTitularTransferencia.value = '';

        // Autocompletar nombre del cliente si el comprobante tuvo DNI o Factura (Bloqueado y no editable)
        let nombreAutocompletado = '';
        let esBloqueado = false;
        let tipoOrigen = '';

        if (pedido.datosCliente) {
            if (pedido.tipoComprobante === 'Factura' && (pedido.datosCliente.razonSocial || pedido.datosCliente.nombre)) {
                nombreAutocompletado = pedido.datosCliente.razonSocial || pedido.datosCliente.nombre;
                esBloqueado = true;
                tipoOrigen = 'Factura';
            } else if (pedido.datosCliente.nombre && pedido.datosCliente.nombre.toUpperCase() !== 'PÚBLICO GENERAL' && (pedido.datosCliente.documento || pedido.datosCliente.numeroDocumento)) {
                nombreAutocompletado = pedido.datosCliente.nombre;
                esBloqueado = true;
                tipoOrigen = 'Boleta con DNI';
            }
        }

        devClienteNombre.value = nombreAutocompletado;

        if (esBloqueado) {
            devClienteNombre.readOnly = true;
            devClienteNombre.style.backgroundColor = '#F1F5F9';
            devClienteNombre.style.cursor = 'not-allowed';
            devClienteNombre.style.borderColor = '#94A3B8';
            devClienteNombre.title = `Bloqueado: Tomado de la ${tipoOrigen}`;
            if (devClienteNombreHint) {
                devClienteNombreHint.style.display = 'inline-block';
                devClienteNombreHint.style.color = '#1E40AF';
                devClienteNombreHint.style.fontWeight = '600';
                devClienteNombreHint.innerHTML = `🔒 Autocompletado desde ${tipoOrigen} (No editable)`;
            }
        } else {
            devClienteNombre.readOnly = false;
            devClienteNombre.style.backgroundColor = '#FFFFFF';
            devClienteNombre.style.cursor = 'text';
            devClienteNombre.style.borderColor = '';
            devClienteNombre.title = '';
            if (devClienteNombreHint) {
                devClienteNombreHint.style.display = 'none';
            }
        }

        devClienteTelefono.value = '';
        btnConfirmarDev.disabled = true;

        let hayDisponibles = false;

        (pedido.productos || []).forEach((prod, index) => {
            const repuestas = prod.unidadesRepuestas || 0;
            const devueltas = prod.unidadesDevueltas || 0;
            const disponibleReclamo = prod.cantidad - repuestas - devueltas;

            if (disponibleReclamo <= 0) {
                const itemDiv = document.createElement('div');
                itemDiv.style.padding = '0.5rem';
                itemDiv.style.borderBottom = '1px solid var(--border-color)';
                itemDiv.style.opacity = '0.6';
                itemDiv.innerHTML = `
                    <div style="font-size:0.85rem;">
                        <strong>${prod.nombre}</strong> (${prod.cantidad} comprados) — <em>Ya reclamado totalmente (${repuestas} repuestas, ${devueltas} devueltas)</em>
                    </div>
                `;
                devProductosContainer.appendChild(itemDiv);
                return;
            }

            hayDisponibles = true;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'dev-item';
            itemDiv.dataset.index = index;
            itemDiv.dataset.id = prod.id;
            itemDiv.dataset.precio = prod.precio;
            itemDiv.dataset.nombre = prod.nombre;
            itemDiv.style.padding = '0.65rem';
            itemDiv.style.borderBottom = '1px solid var(--border-color)';
            itemDiv.style.background = '#fff';
            itemDiv.style.borderRadius = 'var(--radius-md)';
            itemDiv.style.marginBottom = '0.4rem';

            itemDiv.innerHTML = `
                <div class="d-flex justify-between align-center">
                    <label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-weight:600; font-size:0.9rem;">
                        <input type="checkbox" class="dev-check" data-idx="${index}">
                        ${prod.nombre} (${formatCurrency(prod.precio)})
                    </label>
                    <span style="font-size:0.8rem; color:var(--text-muted);">
                        Disponibles: <strong class="dev-disp-max">${disponibleReclamo}</strong>
                    </span>
                </div>
                <div class="dev-item-controls" style="display:none; margin-top:0.5rem; padding-top:0.5rem; border-top:1px dashed var(--border-color);">
                    <div style="display:flex; gap:1rem; align-items:center;">
                        <label style="font-size:0.82rem; font-weight:600;">Cant. a devolver:</label>
                        <input type="number" class="dev-cantidad" min="1" max="${disponibleReclamo}" value="1" style="width:75px; padding:0.35rem 0.5rem; font-size:0.9rem; text-align:center;">
                    </div>
                </div>
            `;
            devProductosContainer.appendChild(itemDiv);

            const cantInput = itemDiv.querySelector('.dev-cantidad');
            configurarInputCantidad(cantInput, disponibleReclamo);
        });

        if (!hayDisponibles) {
            devProductosContainer.innerHTML = '<p style="color:#DC2626; font-size:0.9rem; text-align:center; padding:1rem;">Todos los productos de este pedido ya cuentan con reposición o devolución registrada.</p>';
        }

        devProductosContainer.querySelectorAll('.dev-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const itemDiv = e.target.closest('.dev-item');
                const controls = itemDiv.querySelector('.dev-item-controls');
                if (e.target.checked) controls.style.display = 'block';
                else controls.style.display = 'none';
                calcularMontoDevolucion();
                validarFormularioDevolucion();
            });
        });

        devProductosContainer.querySelectorAll('.dev-cantidad').forEach(inp => {
            inp.addEventListener('input', () => {
                calcularMontoDevolucion();
                validarFormularioDevolucion();
            });
        });

        modalDevolucion.style.display = 'flex';
    }

    function calcularMontoDevolucion() {
        let total = 0;
        devProductosContainer.querySelectorAll('.dev-item').forEach(item => {
            const chk = item.querySelector('.dev-check');
            if (chk && chk.checked) {
                const cant = parseInt(item.querySelector('.dev-cantidad')?.value) || 0;
                const precio = parseFloat(item.dataset.precio) || 0;
                total += cant * precio;
            }
        });

        devMontoCalculado.textContent = formatCurrency(total);
        devMontoCalculado.dataset.monto = total.toFixed(2);
        return total;
    }

    devModalidad.addEventListener('change', () => {
        const val = devModalidad.value;
        if (val === 'Yape' || val === 'Plin') {
            devCamposBilletera.style.display = 'block';
            devCamposTransferencia.style.display = 'none';
        } else if (val === 'Transferencia') {
            devCamposBilletera.style.display = 'none';
            devCamposTransferencia.style.display = 'block';
        } else {
            devCamposBilletera.style.display = 'none';
            devCamposTransferencia.style.display = 'none';
        }
        validarFormularioDevolucion();
    });

    devNumeroCuenta.addEventListener('input', (e) => {
        const tipo = document.querySelector('input[name="dev-tipo-cuenta"]:checked')?.value;
        const maxLen = tipo === 'cci' ? 20 : 20;
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, maxLen);
        validarFormularioDevolucion();
    });

    devMotivo.addEventListener('change', validarFormularioDevolucion);
    devObservacion.addEventListener('input', () => {
        devObsCounter.textContent = devObservacion.value.length;
        validarFormularioDevolucion();
    });

    btnCerrarDev.addEventListener('click', () => modalDevolucion.style.display = 'none');
    btnCancelarDev.addEventListener('click', () => modalDevolucion.style.display = 'none');

    function validarFormularioDevolucion() {
        let esValido = true;
        let haySeleccionados = false;

        devProductosContainer.querySelectorAll('.dev-item').forEach(item => {
            const chk = item.querySelector('.dev-check');
            if (chk && chk.checked) {
                haySeleccionados = true;
                const cant = parseInt(item.querySelector('.dev-cantidad')?.value) || 0;
                const max = parseInt(item.querySelector('.dev-disp-max')?.textContent) || 0;
                if (cant <= 0 || cant > max) esValido = false;
            }
        });

        if (!haySeleccionados) esValido = false;

        const monto = parseFloat(devMontoCalculado.dataset.monto || 0);
        if (monto <= 0) esValido = false;

        // Motivo obligatorio
        if (!devMotivo.value) esValido = false;

        // Si es "Otro", observación obligatoria >= 10 caracteres
        if (devMotivo.value === 'Otro') {
            devObsReq.textContent = '(Obligatorio, mín 10 car.)';
            devObsReq.style.color = '#DC2626';
            if (devObservacion.value.trim().length < 10) esValido = false;
        } else {
            devObsReq.textContent = '(Opcional, máx 250 car.)';
            devObsReq.style.color = 'var(--text-muted)';
        }

        // Modalidad y datos bancarios
        const mod = devModalidad.value;
        if (!mod) {
            esValido = false;
        } else if (mod === 'Yape' || mod === 'Plin') {
            const telBilletera = devTelefonoBilletera.value.trim();
            // Debe tener 9 dígitos y empezar con 9
            if (telBilletera.length !== 9 || !telBilletera.startsWith('9')) esValido = false;
            if (!devTitularBilletera.value.trim() || devTitularBilletera.value.trim().length < 3) esValido = false;
        } else if (mod === 'Transferencia') {
            const tipoCuenta = document.querySelector('input[name="dev-tipo-cuenta"]:checked')?.value;
            const numCuenta = devNumeroCuenta.value.trim();
            if (tipoCuenta === 'cci') {
                if (numCuenta.length !== 20) esValido = false;
            } else {
                if (numCuenta.length < 10 || numCuenta.length > 20) esValido = false;
            }
            if (!devTitularTransferencia.value.trim() || devTitularTransferencia.value.trim().length < 3) esValido = false;
        }

        // Datos del cliente de contacto
        const nomCli = devClienteNombre.value.trim();
        const telCli = devClienteTelefono.value.trim();
        if (!nomCli || nomCli.length < 3 || nomCli.length > 50) esValido = false;
        // Celular de contacto debe tener 9 dígitos y empezar con 9
        if (telCli.length !== 9 || !telCli.startsWith('9')) esValido = false;

        btnConfirmarDev.disabled = !esValido;
    }

    // Confirmar Devolución
    formDevolucion.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnConfirmarDev.disabled = true;
        btnConfirmarDev.textContent = 'Registrando solicitud...';

        try {
            const productosAfectados = [];
            devProductosContainer.querySelectorAll('.dev-item').forEach(item => {
                const chk = item.querySelector('.dev-check');
                if (chk && chk.checked) {
                    const cant = parseInt(item.querySelector('.dev-cantidad').value, 10);
                    productosAfectados.push({
                        id: item.dataset.id,
                        nombre: item.dataset.nombre,
                        precio: parseFloat(item.dataset.precio),
                        cantidad: cant
                    });
                }
            });

            const montoTotal = parseFloat(devMontoCalculado.dataset.monto);
            const mod = devModalidad.value;

            let datosModalidad = {};
            if (mod === 'Yape' || mod === 'Plin') {
                datosModalidad = {
                    telefono: devTelefonoBilletera.value.trim(),
                    titular: devTitularBilletera.value.trim()
                };
            } else {
                const tipoCuenta = document.querySelector('input[name="dev-tipo-cuenta"]:checked').value;
                datosModalidad = {
                    tipoCuenta,
                    cuentaBancaria: devNumeroCuenta.value.trim(),
                    titular: devTitularTransferencia.value.trim()
                };
            }

            const datosContacto = {
                nombre: devClienteNombre.value.trim(),
                telefono: devClienteTelefono.value.trim()
            };

            await solicitarDevolucion({
                pedidoOriginal: pedidoActivo,
                productosAfectados,
                motivo: devMotivo.value,
                observacion: devObservacion.value.trim(),
                montoTotal,
                modalidad: mod,
                datosModalidad,
                datosContacto
            });

            showAlert(`✅ Solicitud de devolución registrada por ${formatCurrency(montoTotal)}. El Administrador podrá procesar el reembolso.`);
            modalDevolucion.style.display = 'none';

        } catch (error) {
            console.error("Error al solicitar devolución:", error);
            showAlert("Ocurrió un error al registrar la solicitud de devolución.");
        } finally {
            btnConfirmarDev.disabled = false;
            btnConfirmarDev.textContent = 'Registrar Solicitud';
        }
    });
});
