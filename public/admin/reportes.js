import { requireAuth } from '../shared/auth.js';
import { 
    getPedidosRango, 
    getDevolucionesRango, 
    getProductos 
} from '../shared/db.js';
import { formatCurrency, formatDateTime, normalizarTipo, showAlert } from '../shared/utils.js';

// Restringir módulo exclusivamente al Administrador
requireAuth('admin');

document.addEventListener('DOMContentLoaded', async () => {
    // Filtros de fecha
    const formFiltro = document.getElementById('form-filtro-fechas');
    const inputFechaInicio = document.getElementById('fecha-inicio');
    const inputFechaFin = document.getElementById('fecha-fin');
    const btnHoy = document.getElementById('btn-rango-hoy');
    const btn7Dias = document.getElementById('btn-rango-7dias');
    const btnMes = document.getElementById('btn-rango-mes');
    const btnAplicarFiltro = document.getElementById('btn-aplicar-filtro');

    // Pestañas
    const tabBtnGanancias = document.getElementById('tab-btn-ganancias');
    const tabBtnIncidencias = document.getElementById('tab-btn-incidencias');
    const panelGanancias = document.getElementById('panel-ganancias');
    const panelIncidencias = document.getElementById('panel-incidencias');
    const loadingMsg = document.getElementById('loading-msg');

    // Elementos Pestaña Ganancias
    const kpiVentasTotales = document.getElementById('kpi-ventas-totales');
    const kpiDevoluciones = document.getElementById('kpi-devoluciones');
    const kpiDevolucionesConteo = document.getElementById('kpi-devoluciones-conteo');
    const kpiMontoNeto = document.getElementById('kpi-monto-neto');
    const kpiTotalPedidos = document.getElementById('kpi-total-pedidos');

    const payEfectivo = document.getElementById('pay-efectivo');
    const payYape = document.getElementById('pay-yape');
    const payPlin = document.getElementById('pay-plin');
    const payTransferencia = document.getElementById('pay-transferencia');
    const payEfectivoDetail = document.getElementById('pay-efectivo-detail');
    const payYapeDetail = document.getElementById('pay-yape-detail');
    const payPlinDetail = document.getElementById('pay-plin-detail');
    const payTransferenciaDetail = document.getElementById('pay-transferencia-detail');

    // Vista de Pedidos e Incidencias
    const vistaPedidosContainer = document.getElementById('vista-pedidos-container');
    const filtroPedidosReporte = document.getElementById('filtro-pedidos-reporte');
    const listaPedidosIncidencias = document.getElementById('lista-pedidos-incidencias');
    const sinPedidosReporteMsg = document.getElementById('sin-pedidos-reporte-msg');

    // Elementos Pestaña Incidencias
    const motivosTotalBadge = document.getElementById('motivos-total-badge');
    const motivosListaContainer = document.getElementById('motivos-lista-container');
    const conteoReposiciones = document.getElementById('conteo-reposiciones');
    const conteoDevoluciones = document.getElementById('conteo-devoluciones');
    const tbodyReposiciones = document.getElementById('reposiciones-tbody');
    const sinReposicionesMsg = document.getElementById('sin-reposiciones-msg');
    const tbodyDevoluciones = document.getElementById('devoluciones-reporte-tbody');
    const sinDevolucionesMsg = document.getElementById('sin-devoluciones-msg');

    // Modal Visor
    const modalVisor = document.getElementById('modal-visor');
    const btnCerrarModalVisor = document.getElementById('btn-cerrar-modal-visor');
    const btnCerrarVisor = document.getElementById('btn-cerrar-visor');
    const visorMeta = document.getElementById('visor-meta');
    const visorContent = document.getElementById('visor-content');
    const btnDescargarVoucher = document.getElementById('btn-descargar-voucher');

    let catalogoActual = [];
    let ultimosPedidos = [];
    let ultimosDevoluciones = [];

    // Helper formato fecha YYYY-MM-DD local
    function fechaALocalString(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Configuración de fechas iniciales: HOY por defecto (CA02)
    const hoy = new Date();
    inputFechaInicio.value = fechaALocalString(hoy);
    inputFechaFin.value = fechaALocalString(hoy);

    // Cargar catálogo para nombres actuales agrupados por ID (CA06, CA09)
    try {
        catalogoActual = await getProductos();
    } catch (e) {
        console.warn("No se pudo obtener catálogo de productos:", e);
    }

    // Botones de atajo de fechas
    btnHoy.addEventListener('click', () => {
        const d = new Date();
        inputFechaInicio.value = fechaALocalString(d);
        inputFechaFin.value = fechaALocalString(d);
        ejecutarConsulta();
    });

    btn7Dias.addEventListener('click', () => {
        const fin = new Date();
        const ini = new Date();
        ini.setDate(fin.getDate() - 6);
        inputFechaInicio.value = fechaALocalString(ini);
        inputFechaFin.value = fechaALocalString(fin);
        ejecutarConsulta();
    });

    btnMes.addEventListener('click', () => {
        const fin = new Date();
        const ini = new Date(fin.getFullYear(), fin.getMonth(), 1);
        inputFechaInicio.value = fechaALocalString(ini);
        inputFechaFin.value = fechaALocalString(fin);
        ejecutarConsulta();
    });

    // Eventos Pestañas (CA03)
    tabBtnGanancias.addEventListener('click', () => {
        tabBtnGanancias.classList.add('active');
        tabBtnIncidencias.classList.remove('active');
        panelGanancias.style.display = 'block';
        panelIncidencias.style.display = 'none';
    });

    tabBtnIncidencias.addEventListener('click', () => {
        tabBtnIncidencias.classList.add('active');
        tabBtnGanancias.classList.remove('active');
        panelIncidencias.style.display = 'block';
        panelGanancias.style.display = 'none';
    });

    if (filtroPedidosReporte) {
        filtroPedidosReporte.addEventListener('input', () => {
            renderListaPedidosFiltrados();
        });
    }

    // Formulario de filtro de fechas (CA01)
    formFiltro.addEventListener('submit', (e) => {
        e.preventDefault();
        ejecutarConsulta();
    });

    // Carga inicial
    ejecutarConsulta();

    async function ejecutarConsulta() {
        const fInicio = inputFechaInicio.value;
        const fFin = inputFechaFin.value;

        if (!fInicio || !fFin) {
            showAlert("Seleccione ambas fechas para consultar.");
            return;
        }

        if (fInicio > fFin) {
            showAlert("La fecha de inicio no puede ser posterior a la fecha final.");
            return;
        }

        btnAplicarFiltro.disabled = true;
        btnAplicarFiltro.textContent = 'Consultando...';
        loadingMsg.style.display = 'block';

        try {
            const [pedidos, devoluciones] = await Promise.all([
                getPedidosRango(fInicio, fFin),
                getDevolucionesRango(fInicio, fFin)
            ]);

            ultimosPedidos = pedidos;
            ultimosDevoluciones = devoluciones;

            renderPestanaGanancias(pedidos, devoluciones, fInicio, fFin);
            renderPestanaIncidencias(pedidos, devoluciones);

        } catch (error) {
            console.error("Error al consultar reportes:", error);
            showAlert("Ocurrió un error al obtener la información del rango seleccionado.");
        } finally {
            btnAplicarFiltro.disabled = false;
            btnAplicarFiltro.textContent = '🔍 Consultar';
            loadingMsg.style.display = 'none';
        }
    }

    // -------------------------------------------------------------
    // RENDER PESTAÑA GANANCIAS (CA04, CA05, CA06, CA07 y Mejoras Feedback)
    // -------------------------------------------------------------
    function renderPestanaGanancias(pedidos, devoluciones, fInicio, fFin) {
        // 1. Total Ventas Brutas (CA04): suma de todos los pedidos del rango
        let totalVentas = 0;
        let conteoPedidos = pedidos.length;

        // Desglose por modalidades (Bruto)
        let brutoEfectivo = 0;
        let brutoYape = 0;
        let brutoPlin = 0;
        let brutoTransferencia = 0;

        // Agrupación por producto (ID interno) (CA06, CA09)
        const ventasPorProductoMap = new Map();

        pedidos.forEach(p => {
            const montoPedido = parseFloat(p.total) || 0;
            totalVentas += montoPedido;

            // Desglose de pagos considerando modalidades simples e híbridas
            if (p.modalidadPago === 'Híbrido') {
                brutoEfectivo += parseFloat(p.pagoHibridoEfectivo) || 0;
                brutoYape += parseFloat(p.pagoHibridoYape) || 0;
                brutoPlin += parseFloat(p.pagoHibridoPlin) || 0;
                brutoTransferencia += parseFloat(p.pagoHibridoTransferencia) || 0;
            } else if (p.modalidadPago === 'Efectivo') {
                brutoEfectivo += montoPedido;
            } else if (p.modalidadPago === 'Yape') {
                brutoYape += montoPedido;
            } else if (p.modalidadPago === 'Plin') {
                brutoPlin += montoPedido;
            } else if (p.modalidadPago === 'Transferencia') {
                brutoTransferencia += montoPedido;
            }

            // Acumular ventas por producto (agrupado por ID interno)
            (p.productos || []).forEach(item => {
                const prodId = item.id;
                if (!prodId) return;

                const cant = parseInt(item.cantidad) || 0;
                const precio = parseFloat(item.precio) || 0;
                const subtotal = cant * precio;

                if (!ventasPorProductoMap.has(prodId)) {
                    const prodCat = catalogoActual.find(c => c.id === prodId);
                    ventasPorProductoMap.set(prodId, {
                        id: prodId,
                        nombre: prodCat ? prodCat.nombre : item.nombre,
                        tipo: prodCat ? normalizarTipo(prodCat.tipo) : normalizarTipo(item.tipo),
                        precioCatalogo: prodCat ? prodCat.precio : precio,
                        cantidadTotal: 0,
                        montoTotal: 0
                    });
                }

                const entry = ventasPorProductoMap.get(prodId);
                entry.cantidadTotal += cant;
                entry.montoTotal += subtotal;
            });
        });

        // 2. Total Devoluciones Procesadas cuya salida de dinero ocurrió efectivamente en el rango de fechas (CA07)
        const fIniMs = new Date(fInicio + 'T00:00:00').getTime();
        const fFinMs = new Date(fFin + 'T23:59:59.999').getTime();

        const devolucionesEfectivas = devoluciones.filter(d => {
            if (d.estado !== 'Procesada' || !d.fechaProcesado) return false;
            const tProc = d.fechaProcesado.toDate ? d.fechaProcesado.toDate().getTime() : new Date(d.fechaProcesado).getTime();
            return tProc >= fIniMs && tProc <= fFinMs;
        });

        const totalDevuelto = devolucionesEfectivas.reduce((acc, d) => acc + (parseFloat(d.monto) || 0), 0);

        // Desglose de devoluciones descontadas según la modalidad real ejecutada (Yape, Plin o Transferencia)
        let devEfectivo = 0, devYape = 0, devPlin = 0, devTransferencia = 0;
        devolucionesEfectivas.forEach(d => {
            const mod = d.modalidadReal || d.modalidad || 'Transferencia';
            const m = parseFloat(d.monto) || 0;
            if (mod === 'Yape') devYape += m;
            else if (mod === 'Plin') devPlin += m;
            else if (mod === 'Transferencia') devTransferencia += m;
        });

        // 3. Monto Neto (CA07): Ventas brutas menos reembolsos ejecutados en el rango
        const montoNeto = totalVentas - totalDevuelto;

        // Actualizar KPIs en UI
        kpiVentasTotales.textContent = formatCurrency(totalVentas);
        kpiDevoluciones.textContent = formatCurrency(totalDevuelto);
        kpiDevolucionesConteo.textContent = `${devolucionesEfectivas.length} reembolsos realizados`;
        kpiMontoNeto.textContent = formatCurrency(montoNeto);
        kpiTotalPedidos.textContent = conteoPedidos;

        // Actualizar Desglose Neto de Pagos y detalles de ingresos vs salidas
        const netoEfectivo = Math.max(0, brutoEfectivo - devEfectivo);
        const netoYape = Math.max(0, brutoYape - devYape);
        const netoPlin = Math.max(0, brutoPlin - devPlin);
        const netoTransferencia = Math.max(0, brutoTransferencia - devTransferencia);

        payEfectivo.textContent = formatCurrency(netoEfectivo);
        payYape.textContent = formatCurrency(netoYape);
        payPlin.textContent = formatCurrency(netoPlin);
        payTransferencia.textContent = formatCurrency(netoTransferencia);

        if (payEfectivoDetail) {
            payEfectivoDetail.innerHTML = devEfectivo > 0 
                ? `Bruto: ${formatCurrency(brutoEfectivo)} | <span style="color:#DC2626; font-weight:600;">-${formatCurrency(devEfectivo)}</span>`
                : `Bruto: ${formatCurrency(brutoEfectivo)}`;
        }
        if (payYapeDetail) {
            payYapeDetail.innerHTML = devYape > 0 
                ? `Bruto: ${formatCurrency(brutoYape)} | <span style="color:#DC2626; font-weight:600;">-${formatCurrency(devYape)}</span>`
                : `Bruto: ${formatCurrency(brutoYape)}`;
        }
        if (payPlinDetail) {
            payPlinDetail.innerHTML = devPlin > 0 
                ? `Bruto: ${formatCurrency(brutoPlin)} | <span style="color:#DC2626; font-weight:600;">-${formatCurrency(devPlin)}</span>`
                : `Bruto: ${formatCurrency(brutoPlin)}`;
        }
        if (payTransferenciaDetail) {
            payTransferenciaDetail.innerHTML = devTransferencia > 0 
                ? `Bruto: ${formatCurrency(brutoTransferencia)} | <span style="color:#DC2626; font-weight:600;">-${formatCurrency(devTransferencia)}</span>`
                : `Bruto: ${formatCurrency(brutoTransferencia)}`;
        }

        // Renderizar Detalle de Pedidos con Incidencias Anidadas
        renderListaPedidosConIncidencias(pedidos, devoluciones);
    }

    // -------------------------------------------------------------
    // RENDER DETALLE DE PEDIDOS E INCIDENCIAS ANIDADAS (Feedback admin)
    // -------------------------------------------------------------
    function renderListaPedidosConIncidencias(pedidos, devoluciones) {
        ultimosPedidos = pedidos;
        renderListaPedidosFiltrados();
    }

    function renderListaPedidosFiltrados() {
        if (!listaPedidosIncidencias) return;
        listaPedidosIncidencias.innerHTML = '';

        const termino = filtroPedidosReporte ? filtroPedidosReporte.value.trim().toLowerCase() : '';
        const termLimpio = termino.replace(/^#+/, '');

        // Separar pedidos normales y reposiciones
        const reposiciones = ultimosPedidos.filter(p => p.esReposicion === true);
        const pedidosBase = ultimosPedidos.filter(p => !p.esReposicion);

        const filtrados = pedidosBase.filter(p => {
            if (!termino) return true;
            const cod = String(p.codigo || p.id || '').toLowerCase();
            const cliente = (p.datosCliente?.nombre || p.datosCliente?.razonSocial || p.cliente || '').toLowerCase();
            const doc = (p.datosCliente?.documento || p.datosCliente?.ruc || '').toLowerCase();
            const comp = String(p.comprobante || '').toLowerCase();
            return cod.includes(termLimpio) || cliente.includes(termino) || doc.includes(termino) || comp.includes(termino);
        });

        if (filtrados.length === 0) {
            if (sinPedidosReporteMsg) sinPedidosReporteMsg.style.display = 'block';
            return;
        }
        if (sinPedidosReporteMsg) sinPedidosReporteMsg.style.display = 'none';

        filtrados.forEach(p => {
            const codLimpio = String(p.codigo || p.id).replace(/^#+/, '');
            const fechaStr = formatDateTime(p.fechaRegistro?.toDate ? p.fechaRegistro.toDate() : p.fechaRegistro);
            const tipoComp = p.tipoComprobante === 'Factura' ? 'Factura' : 'Boleta';
            const numComp = p.comprobante || `B001-${codLimpio}`;
            const clienteNom = p.datosCliente?.nombre || p.datosCliente?.razonSocial || p.cliente || 'Público General';
            const clienteDoc = p.datosCliente?.documento || p.datosCliente?.ruc;
            const clienteDocStr = clienteDoc ? ` (${p.tipoComprobante === 'Factura' ? 'RUC' : 'DNI'}: ${clienteDoc})` : '';

            // Estado del pedido
            let estadoBadge = '';
            if (p.estado === 'Entregado') {
                estadoBadge = '<span class="badge" style="background:var(--success-color); font-size:0.75rem;">Entregado</span>';
            } else if (p.estado === 'Cancelado') {
                estadoBadge = '<span class="badge" style="background:#DC2626; font-size:0.75rem;">Cancelado</span>';
            } else {
                estadoBadge = `<span class="badge" style="background:#3B82F6; font-size:0.75rem;">${p.estado || 'Atendido'}</span>`;
            }

            // Modalidad de pago
            let modBadge = '';
            if (p.modalidadPago === 'Yape') modBadge = '<span class="badge" style="background:#702382; font-size:0.75rem;">Yape</span>';
            else if (p.modalidadPago === 'Plin') modBadge = '<span class="badge" style="background:#00BFA5; font-size:0.75rem;">Plin</span>';
            else if (p.modalidadPago === 'Efectivo') modBadge = '<span class="badge" style="background:#16A34A; font-size:0.75rem;">Efectivo</span>';
            else if (p.modalidadPago === 'Híbrido') modBadge = '<span class="badge" style="background:#D97706; font-size:0.75rem;">Híbrido</span>';
            else modBadge = '<span class="badge" style="background:#2563EB; font-size:0.75rem;">Transferencia</span>';

            // Items del pedido
            const prodsHtml = (p.productos || []).map(item => `
                <span style="display:inline-block; background:#F1F5F9; border-radius:4px; padding:0.2rem 0.5rem; font-size:0.8rem; margin:0.15rem 0.25rem 0.15rem 0;">
                    <strong>${item.cantidad}x</strong> ${item.nombre} <small style="color:var(--text-muted);">(${formatCurrency(item.precio)})</small>
                </span>
            `).join('');

            // Buscar incidencias asociadas (reposiciones)
            const reposAsoc = reposiciones.filter(r => 
                r.pedidoOrigenId === p.id || 
                (r.pedidoOrigenCodigo && String(r.pedidoOrigenCodigo).replace(/^#+/, '') === codLimpio)
            );

            // Buscar incidencias asociadas (devoluciones)
            const devsAsoc = ultimosDevoluciones.filter(d => 
                d.pedidoId === p.id || 
                (d.pedidoCodigo && String(d.pedidoCodigo).replace(/^#+/, '') === codLimpio)
            );

            // Construir HTML de Reposiciones Anidadas
            let reposHtml = '';
            reposAsoc.forEach(r => {
                const codRepo = String(r.codigo || r.id).replace(/^#+/, '');
                const fRepoStr = formatDateTime(r.fechaRegistro?.toDate ? r.fechaRegistro.toDate() : r.fechaRegistro);
                const itemsRepoStr = (r.productos || []).map(x => `${x.cantidad}x ${x.nombre}`).join(', ');
                const dif = parseFloat(r.total) || 0;
                const difStr = dif > 0 ? formatCurrency(dif) : 'Sin costo adicional (S/ 0.00)';

                reposHtml += `
                    <div class="nested-incidencia-box nested-reposicion">
                        <div class="d-flex justify-between align-center flex-wrap gap-1">
                            <div>
                                <strong style="color:#6B21A8; font-size:0.9rem;">🔄 Reposición Realizada: #${codRepo}</strong>
                                <span class="badge" style="background:#8B5CF6; font-size:0.72rem; margin-left:0.35rem;">Cocina</span>
                            </div>
                            <span style="font-size:0.8rem; color:var(--text-muted);">${fRepoStr}</span>
                        </div>
                        <div style="font-size:0.85rem; color:#374151; margin-top:0.4rem; line-height:1.5;">
                            • <strong>Productos Repuestos:</strong> ${itemsRepoStr}<br>
                            • <strong>Motivo de Incidencia:</strong> <span style="color:#DC2626; font-weight:600;">${r.motivoReposicion || 'No especificado'}</span>
                            ${r.observacionReposicion ? ` <em>(Obs: "${r.observacionReposicion}")</em>` : ''}<br>
                            • <strong>Diferencia Cobrada:</strong> <span style="font-weight:700;">${difStr}</span>
                        </div>
                        <div class="d-flex gap-1 mt-1 flex-wrap">
                            <a href="../cajera/comprobante.html?id=${r.id}" target="_blank" class="btn btn-sm" style="background:#7C3AED; color:#fff; text-decoration:none; padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600;">
                                📄 Ticket de Reposición
                            </a>
                        </div>
                    </div>
                `;
            });

            // Construir HTML de Devoluciones Anidadas
            let devsHtml = '';
            devsAsoc.forEach(d => {
                const esProc = d.estado === 'Procesada';
                const fSolStr = formatDateTime(d.fechaSolicitud?.toDate ? d.fechaSolicitud.toDate() : d.fechaSolicitud);
                const fProcStr = d.fechaProcesado ? formatDateTime(d.fechaProcesado?.toDate ? d.fechaProcesado.toDate() : d.fechaProcesado) : null;
                const modTxt = d.modalidadReal && d.modalidadReal !== d.modalidad
                    ? `${d.modalidad} ➔ <strong style="color:#059669;">Efectuado: ${d.modalidadReal}</strong>`
                    : d.modalidad;

                devsHtml += `
                    <div class="nested-incidencia-box nested-devolucion">
                        <div class="d-flex justify-between align-center flex-wrap gap-1">
                            <div>
                                <strong style="color:#92400E; font-size:0.92rem;">
                                    💸 Devolución de Dinero: ${formatCurrency(d.monto)}
                                </strong>
                                ${d.esDevolucionDeReposicion ? '<span class="badge" style="background:var(--primary-color); font-size:0.7rem; margin-left:0.35rem;">Sobre Reposición</span>' : ''}
                            </div>
                            <div>
                                ${esProc 
                                    ? '<span class="badge" style="background:var(--success-color); font-size:0.72rem;">✅ Reembolso Procesado</span>' 
                                    : '<span class="badge" style="background:#F59E0B; font-size:0.72rem;">⏳ Solicitud Pendiente</span>'}
                            </div>
                        </div>
                        <div style="font-size:0.85rem; color:#374151; margin-top:0.4rem; line-height:1.5;">
                            • <strong>Solicitado:</strong> ${fSolStr} por ${d.datosContacto?.nombre || clienteNom}<br>
                            • <strong>Motivo del Reclamo:</strong> <span style="color:#DC2626; font-weight:600;">${d.motivo || 'No especificado'}</span>
                            ${d.observacion ? ` <em>(Obs: "${d.observacion}")</em>` : ''}<br>
                            • <strong>Canal de Reembolso:</strong> ${modTxt}
                            ${d.destinoReal ? ` (${d.destinoReal})` : (d.datosModalidad?.telefono ? ` (Cel: ${d.datosModalidad.telefono})` : (d.datosModalidad?.cuentaBancaria ? ` (${d.datosModalidad.tipoCuenta === 'cci' ? 'CCI' : 'Cta'}: ${d.datosModalidad.cuentaBancaria})` : ''))}
                            ${d.datosModificadosPorAdmin ? '<span class="badge" style="background:#F59E0B; font-size:0.68rem; margin-left:0.35rem;">✏️ Datos Corregidos</span>' : ''}<br>
                            ${esProc && fProcStr ? `• <strong>Fecha de Pago Real:</strong> <span style="color:#059669; font-weight:600;">${fProcStr}</span><br>` : ''}
                            ${d.numeroNotaCredito ? `• <strong>Nota de Crédito SUNAT:</strong> <span style="font-family:monospace; font-weight:bold;">${d.numeroNotaCredito}</span>` : ''}
                        </div>
                        ${esProc ? `
                            <div class="d-flex gap-1 mt-1 flex-wrap">
                                <button type="button" class="btn btn-sm btn-success btn-ver-voucher" data-id="${d.id}" style="padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600;">
                                    🖼️ Ver Voucher
                                </button>
                                <a href="nota-credito.html?id=${d.id}" target="_blank" class="btn btn-sm" style="background:#0284C7; color:#fff; text-decoration:none; padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600;">
                                    📄 Ver Nota de Crédito
                                </a>
                            </div>
                        ` : `
                            <div style="margin-top:0.4rem; font-size:0.78rem; color:#B45309; font-style:italic;">
                                ⏳ Reembolso pendiente de ejecución por el Administrador en la pestaña "Procesar Devoluciones".
                            </div>
                        `}
                    </div>
                `;
            });

            // Si no tiene ninguna incidencia
            let sinIncidenciasHtml = '';
            if (reposAsoc.length === 0 && devsAsoc.length === 0) {
                sinIncidenciasHtml = `
                    <div style="font-size:0.8rem; color:#16A34A; margin-top:0.6rem; display:flex; align-items:center; gap:0.35rem;">
                        <span style="font-weight:bold;">✓</span> <em>Atendido con normalidad (Sin incidencias)</em>
                    </div>
                `;
            }

            const card = document.createElement('div');
            card.className = 'pedido-incidencia-card';
            card.innerHTML = `
                <!-- Cabecera de la orden -->
                <div class="d-flex justify-between align-center flex-wrap gap-1" style="border-bottom:1px solid var(--border-color); padding-bottom:0.65rem; margin-bottom:0.75rem;">
                    <div>
                        <strong style="font-family:monospace; font-size:1.1rem; color:var(--text-main);">#${codLimpio}</strong>
                        <span style="margin: 0 0.5rem; color:#CBD5E1;">|</span>
                        <span style="font-size:0.88rem; font-weight:600; color:#475569;">${tipoComp}: ${numComp}</span>
                        <span style="margin: 0 0.5rem; color:#CBD5E1;">|</span>
                        <span style="font-size:0.82rem; color:var(--text-muted);">${fechaStr}</span>
                    </div>
                    <div class="d-flex align-center gap-1 flex-wrap">
                        ${modBadge}
                        ${estadoBadge}
                        <strong style="font-size:1.15rem; color:#1E3A8A; margin-left:0.35rem;">${formatCurrency(p.total)}</strong>
                        <a href="../cajera/comprobante.html?id=${p.id}" target="_blank" class="btn btn-sm" style="background:#0F172A; color:#fff; text-decoration:none; padding:0.3rem 0.65rem; font-size:0.78rem; font-weight:600; display:inline-flex; align-items:center;" title="Ver e imprimir comprobante electrónico emitido">
                            📄 Comprobante
                        </a>
                    </div>
                </div>

                <!-- Datos del cliente y productos -->
                <div style="font-size:0.88rem; color:var(--text-main); line-height:1.5;">
                    <div><strong>Cliente:</strong> ${clienteNom}${clienteDocStr}</div>
                    <div style="margin-top:0.35rem;">
                        <strong style="color:var(--text-muted); font-size:0.8rem; text-transform:uppercase;">Productos:</strong>
                        <div style="margin-top:0.2rem;">${prodsHtml}</div>
                    </div>
                    ${p.observacion || p.nota ? `
                        <div style="margin-top:0.35rem; font-size:0.82rem; color:#64748B;">
                            📝 <strong>Nota de caja:</strong> <em>${p.observacion || p.nota}</em>
                        </div>
                    ` : ''}
                </div>

                <!-- Incidencias anidadas -->
                ${reposHtml}
                ${devsHtml}
                ${sinIncidenciasHtml}
            `;
            listaPedidosIncidencias.appendChild(card);
        });

        // Eventos a botones de voucher dentro de los pedidos
        document.querySelectorAll('.btn-ver-voucher').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const dev = ultimosDevoluciones.find(x => x.id === id);
                if (dev) abrirModalVisorVoucher(dev);
            });
        });
    }

    // -------------------------------------------------------------
    // RENDER PESTAÑA INCIDENCIAS (CA08, CA09, CA10, CA11)
    // -------------------------------------------------------------
    function renderPestanaIncidencias(pedidos, devoluciones) {
        // 1. Filtrar reposiciones del rango (CA08)
        const reposiciones = pedidos.filter(p => p.esReposicion === true);
        conteoReposiciones.textContent = `${reposiciones.length} reposiciones`;
        conteoDevoluciones.textContent = `${devoluciones.length} devoluciones`;

        // 2. Resumen Estadístico de Motivos de Reclamo (CA11)
        // Calculado sobre el total de reposiciones y devoluciones del rango
        const motivosContador = {};
        let totalCasosIncidencias = 0;

        reposiciones.forEach(r => {
            const motivo = r.motivoReposicion || 'No especificado';
            motivosContador[motivo] = (motivosContador[motivo] || 0) + 1;
            totalCasosIncidencias++;
        });

        devoluciones.forEach(d => {
            const motivo = d.motivo || 'No especificado';
            motivosContador[motivo] = (motivosContador[motivo] || 0) + 1;
            totalCasosIncidencias++;
        });

        motivosTotalBadge.textContent = `${totalCasosIncidencias} incidencias en total`;
        motivosListaContainer.innerHTML = '';

        const listaMotivos = Object.entries(motivosContador).sort((a, b) => b[1] - a[1]);
        if (listaMotivos.length === 0) {
            motivosListaContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; margin:0.5rem 0 0 0;">No se registraron reclamos ni incidencias en este rango de fechas.</p>';
        } else {
            listaMotivos.forEach(([motivo, count]) => {
                const pct = totalCasosIncidencias > 0 ? ((count / totalCasosIncidencias) * 100).toFixed(0) : 0;
                const row = document.createElement('div');
                row.className = 'motivo-item-row';
                row.innerHTML = `
                    <div style="flex:1; padding-right:1rem;">
                        <div class="d-flex justify-between align-center" style="margin-bottom:0.25rem;">
                            <strong style="color:var(--text-main); font-size:0.88rem;">${motivo}</strong>
                            <span style="font-weight:700; color:#DC2626; font-size:0.88rem;">${count} caso${count > 1 ? 's' : ''} (${pct}%)</span>
                        </div>
                        <div style="background:#E2E8F0; border-radius:999px; height:7px; overflow:hidden;">
                            <div style="background:var(--primary-color); height:100%; width:${pct}%;"></div>
                        </div>
                    </div>
                `;
                motivosListaContainer.appendChild(row);
            });
        }

        // 3. Renderizar Tabla de Reposiciones (CA08)
        tbodyReposiciones.innerHTML = '';
        if (reposiciones.length === 0) {
            sinReposicionesMsg.style.display = 'block';
        } else {
            sinReposicionesMsg.style.display = 'none';
            reposiciones.forEach(r => {
                const tr = document.createElement('tr');
                const fechaStr = formatDateTime(r.fechaRegistro?.toDate ? r.fechaRegistro.toDate() : r.fechaRegistro);
                const codOrigen = r.pedidoOrigenCodigo ? `#${String(r.pedidoOrigenCodigo).replace(/^#+/, '')}` : 'S/N';
                const codRepo = `#${String(r.codigo || r.id).replace(/^#+/, '')}`;

                const prodsStr = (r.productos || []).map(p => `${p.cantidad}x ${p.nombre}`).join(', ');
                const diferencia = parseFloat(r.total) || 0;
                const diferenciaStr = diferencia > 0 ? formatCurrency(diferencia) : '<span style="color:#16A34A; font-weight:600;">Sin costo (S/ 0.00)</span>';

                tr.innerHTML = `
                    <td style="font-size:0.85rem; color:var(--text-muted);">${fechaStr}</td>
                    <td>
                        <strong>${codRepo}</strong><br>
                        <small style="color:var(--text-muted);">Ref: ${codOrigen}</small>
                    </td>
                    <td style="font-size:0.88rem; max-width:280px; word-break:break-word;">
                        ${prodsStr}
                    </td>
                    <td style="font-size:0.88rem;">
                        <strong style="color:#DC2626;">${r.motivoReposicion || '---'}</strong>
                        ${r.observacionReposicion ? `<br><small style="color:var(--text-muted); font-style:italic;">Obs: ${r.observacionReposicion}</small>` : ''}
                    </td>
                    <td style="text-align:right; font-weight:700;">${diferenciaStr}</td>
                `;
                tbodyReposiciones.appendChild(tr);
            });
        }

        // 4. Renderizar Tabla de Devoluciones (CA09, CA10)
        tbodyDevoluciones.innerHTML = '';
        if (devoluciones.length === 0) {
            sinDevolucionesMsg.style.display = 'block';
        } else {
            sinDevolucionesMsg.style.display = 'none';
            devoluciones.forEach(d => {
                const tr = document.createElement('tr');
                const fechaStr = formatDateTime(d.fechaSolicitud?.toDate ? d.fechaSolicitud.toDate() : d.fechaSolicitud);
                const codLimpio = String(d.pedidoCodigo || 'S/N').replace(/^#+/, '');
                const esProcesada = d.estado === 'Procesada';

                const badgeEstado = esProcesada
                    ? '<span class="badge" style="background:var(--success-color); font-size:0.75rem;">Procesada</span>'
                    : '<span class="badge" style="background:#F59E0B; font-size:0.75rem;">Solicitada</span>';

                // Modalidad
                let modBadge = '';
                const modEfectiva = (d.estado === 'Procesada' && d.modalidadReal) ? d.modalidadReal : d.modalidad;
                if (modEfectiva === 'Yape') modBadge = '<span class="badge" style="background:#702382; font-size:0.72rem;">Yape</span>';
                else if (modEfectiva === 'Plin') modBadge = '<span class="badge" style="background:#00BFA5; font-size:0.72rem;">Plin</span>';
                else modBadge = '<span class="badge" style="background:#2563EB; font-size:0.72rem;">Transferencia</span>';

                if (d.estado === 'Procesada' && d.modalidadReal && d.modalidadReal !== d.modalidad) {
                    modBadge += `<div style="font-size:0.68rem; color:var(--text-muted); margin-top:0.15rem;">(Sol: ${d.modalidad})</div>`;
                }

                // Acciones: Acceso a Comprobante y Nota de Crédito si está procesada (CA10)
                let accionesHtml = '';
                if (esProcesada) {
                    accionesHtml = `
                        <div class="pedido-actions-group" style="justify-content:flex-end;">
                            <button type="button" class="btn btn-sm btn-success btn-ver-voucher" data-id="${d.id}" style="padding:0.3rem 0.55rem; font-size:0.78rem; font-weight:600;" title="Ver comprobante de transferencia bancaria">
                                🖼️ Voucher
                            </button>
                            <a href="nota-credito.html?id=${d.id}" target="_blank" class="btn btn-sm" style="background:#0284C7; color:#fff; text-decoration:none; padding:0.3rem 0.55rem; font-size:0.78rem; font-weight:600; display:inline-flex; align-items:center;" title="Ver Nota de Crédito Electrónica SUNAT">
                                📄 Nota Crédito
                            </a>
                        </div>
                    `;
                } else {
                    accionesHtml = `<span style="font-size:0.75rem; color:#D97706; font-style:italic;">Pendiente en módulo</span>`;
                }

                tr.innerHTML = `
                    <td style="font-size:0.85rem; color:var(--text-muted);">${fechaStr}</td>
                    <td>
                        <strong style="font-family:monospace;">#${codLimpio}</strong>
                        ${d.esDevolucionDeReposicion ? '<br><span class="badge" style="background:var(--primary-color); font-size:0.65rem;">Dev. Reposición</span>' : ''}
                    </td>
                    <td style="font-size:0.88rem;">
                        <strong>${d.datosContacto?.nombre || 'Cliente'}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Cel: ${d.datosContacto?.telefono || 'N/A'}</div>
                    </td>
                    <td>
                        ${modBadge}
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">
                            ${d.datosModalidad?.telefono ? `Cel: <strong>${d.datosModalidad.telefono}</strong>` : (d.datosModalidad?.cuentaBancaria ? `${d.datosModalidad.tipoCuenta === 'cci' ? 'CCI' : 'Cta'}: <strong>${d.datosModalidad.cuentaBancaria}</strong>` : '')}
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">
                            Titular: ${d.datosModalidad?.titular || 'N/A'}
                        </div>
                        ${d.datosModificadosPorAdmin ? '<span class="badge" style="background:#F59E0B; font-size:0.65rem; margin-top:0.2rem;">✏️ Corregido</span>' : ''}
                    </td>
                    <td style="text-align:right; font-weight:700; color:#1E3A8A; font-size:0.95rem;">
                        ${formatCurrency(d.monto)}
                    </td>
                    <td style="text-align:center;">${badgeEstado}</td>
                    <td style="text-align:right;">${accionesHtml}</td>
                `;
                tbodyDevoluciones.appendChild(tr);
            });

            // Asignar eventos para ver voucher
            document.querySelectorAll('.btn-ver-voucher').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const dev = ultimosDevoluciones.find(x => x.id === id);
                    if (dev) abrirModalVisorVoucher(dev);
                });
            });
        }
    }

    // -------------------------------------------------------------
    // MODAL VISOR DE VOUCHER (CA10)
    // -------------------------------------------------------------
    function abrirModalVisorVoucher(devolucion) {
        const codLimpio = String(devolucion.pedidoCodigo || 'S/N').replace(/^#+/, '');
        const modTxt = devolucion.modalidadReal && devolucion.modalidadReal !== devolucion.modalidad
            ? `${devolucion.modalidadReal} (Solicitado: ${devolucion.modalidad})`
            : devolucion.modalidad;

        visorMeta.innerHTML = `
            <strong>Pedido:</strong> #${codLimpio} &nbsp;|&nbsp;
            <strong>Monto Reembolsado:</strong> ${formatCurrency(devolucion.monto)} &nbsp;|&nbsp;
            <strong>Canal:</strong> ${modTxt}<br>
            <strong>Fecha Procesado:</strong> ${formatDateTime(devolucion.fechaProcesado?.toDate ? devolucion.fechaProcesado.toDate() : devolucion.fechaProcesado)}
        `;

        if (!devolucion.comprobanteArchivo) {
            visorContent.innerHTML = '<p style="color:var(--text-muted); padding:2rem;">No se encontró archivo adjunto para esta devolución.</p>';
            btnDescargarVoucher.style.display = 'none';
        } else {
            btnDescargarVoucher.style.display = 'inline-block';
            btnDescargarVoucher.href = devolucion.comprobanteArchivo;
            btnDescargarVoucher.download = devolucion.comprobanteNombre || `voucher-pedido-${codLimpio}`;

            if (devolucion.comprobanteTipo === 'application/pdf') {
                visorContent.innerHTML = `
                    <iframe src="${devolucion.comprobanteArchivo}" style="width:100%; height:450px; border:none; border-radius:4px;"></iframe>
                `;
            } else {
                visorContent.innerHTML = `
                    <img src="${devolucion.comprobanteArchivo}" alt="Voucher de Reembolso" style="max-width:100%; max-height:480px; object-fit:contain; border-radius:6px; box-shadow:var(--shadow-sm);">
                `;
            }
        }

        modalVisor.style.display = 'flex';
    }

    btnCerrarModalVisor.addEventListener('click', () => modalVisor.style.display = 'none');
    btnCerrarVisor.addEventListener('click', () => modalVisor.style.display = 'none');
});
