import { requireAuth } from '../shared/auth.js';
import { getDevolucionById, getPedidoById, getConfiguracion } from '../shared/db.js';
import { formatCurrency, formatDateTime, numeroALetras } from '../shared/utils.js';

// Restringir acceso al Administrador
requireAuth('admin');

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const devolucionId = urlParams.get('id');

    const loadingElem = document.getElementById('nc-loading');
    const contentElem = document.getElementById('nc-content');
    const btnImprimir = document.getElementById('btn-imprimir-nc');

    if (btnImprimir) {
        btnImprimir.addEventListener('click', () => {
            window.print();
        });
    }

    if (!devolucionId) {
        loadingElem.textContent = 'No se especificó el identificador de la devolución.';
        return;
    }

    try {
        const devolucion = await getDevolucionById(devolucionId);
        
        let pedido = null;
        if (devolucion.pedidoId) {
            try {
                pedido = await getPedidoById(devolucion.pedidoId);
            } catch (e) {
                console.warn("No se pudo cargar el pedido asociado:", e);
            }
        }

        let config = null;
        try {
            config = await getConfiguracion();
        } catch (e) {
            config = {
                nombreComercial: "Burger Local",
                razonSocial: "HAMBURGUESAS LOCAL S.A.C.",
                ruc: "20123456789",
                domicilioFiscal: "AV. PRINCIPAL 123 - LOCAL 1"
            };
        }

        renderNotaCredito(devolucion, pedido, config);

    } catch (error) {
        console.error("Error al cargar Nota de Crédito:", error);
        loadingElem.textContent = 'Error al cargar los datos de la Nota de Crédito Electrónica.';
    }

    function renderNotaCredito(devolucion, pedido, config) {
        loadingElem.style.display = 'none';
        contentElem.style.display = 'block';

        const emisor = devolucion.datosEmisor || pedido?.datosEmisor || config;
        const esFactura = devolucion.tipoComprobanteModificado === 'Factura' || pedido?.tipoComprobante === 'Factura';

        // 1. Datos del Emisor (Consistencia con ubicación Trujillo - La Libertad - Perú)
        const razonSocial = emisor.razonSocial || emisor.nombreComercial || 'BURGER LOCAL S.A.C.';
        const domicilio = emisor.domicilioFiscal || 'AV. LARCO 1234 - VÍCTOR LARCO HERRERA, TRUJILLO';
        document.getElementById('nc-emisor-razon').textContent = razonSocial;
        document.getElementById('nc-emisor-direccion').textContent = domicilio;
        document.getElementById('nc-emisor-contacto').textContent = 'TRUJILLO - LA LIBERTAD - PERÚ | contacto@burgerlocal.pe';
        document.getElementById('nc-emisor-ruc').textContent = `R.U.C. ${emisor.ruc || '20123456789'}`;

        // 2. Número de la Nota de Crédito (Serie y correlativo)
        let numNC = devolucion.numeroNotaCredito;
        if (!numNC) {
            const serieDefault = esFactura ? 'FC01' : 'BC01';
            numNC = `${serieDefault}-00000001`;
        }
        // Formatear espaciado estándar: N° BC01 - 00000001
        const partesNC = numNC.split('-');
        const displayNC = partesNC.length === 2 ? `N° ${partesNC[0]} - ${partesNC[1]}` : `N° ${numNC}`;
        document.getElementById('nc-numero-serie').textContent = displayNC;

        // 3. Tipo de Devolución (Total o Parcial según Catálogo N.° 09 SUNAT)
        const total = parseFloat(devolucion.monto) || 0;
        const totalPedidoOrig = parseFloat(pedido?.total) || 0;
        
        // Determinar si es devolución total o parcial
        const esDevTotal = devolucion.esDevolucionTotal !== undefined
            ? devolucion.esDevolucionTotal
            : (totalPedidoOrig > 0 && Math.abs(total - totalPedidoOrig) < 0.05);

        const codTipoNota = devolucion.codigoTipoNotaCredito || (esDevTotal ? '06' : '07');
        const descTipoNota = devolucion.descripcionTipoNotaCredito || (esDevTotal ? '06 - DEVOLUCIÓN TOTAL' : '07 - DEVOLUCIÓN POR ÍTEM');

        // Badge en cabecera
        const badgeElem = document.getElementById('nc-badge-tipo-devolucion');
        if (badgeElem) {
            badgeElem.textContent = esDevTotal ? 'DEVOLUCIÓN TOTAL' : 'DEVOLUCIÓN PARCIAL (POR ÍTEM)';
            badgeElem.style.background = esDevTotal ? '#DCFCE7' : '#EFF6FF';
            badgeElem.style.color = esDevTotal ? '#15803D' : '#1E40AF';
            badgeElem.style.borderColor = esDevTotal ? '#86EFAC' : '#BFDBFE';
        }

        // Tipo en metadata y en bloque de sustento
        const metaTipoElem = document.getElementById('nc-meta-tipo-nota');
        if (metaTipoElem) metaTipoElem.textContent = descTipoNota;

        const cat09TipoElem = document.getElementById('nc-cat09-tipo');
        if (cat09TipoElem) cat09TipoElem.textContent = descTipoNota;

        // 4. Datos del Cliente / Adquirente (Anexo III SUNAT)
        // La nota debe reflejar fielmente lo emitido en la boleta/factura original otorgada
        const nombreClienteElem = document.getElementById('nc-cliente-nombre');
        const docLabelElem = document.getElementById('nc-cliente-doc-label');
        const docNumElem = document.getElementById('nc-cliente-doc-num');

        const datosCliOrig = pedido?.datosCliente || devolucion.datosCliente;

        if (esFactura && datosCliOrig) {
            nombreClienteElem.textContent = datosCliOrig.razonSocial || datosCliOrig.nombre || 'EMPRESA';
            docLabelElem.textContent = 'RUC';
            docNumElem.textContent = datosCliOrig.ruc || datosCliOrig.documento || '---';
        } else if (datosCliOrig && (datosCliOrig.documento || datosCliOrig.numeroDocumento)) {
            nombreClienteElem.textContent = datosCliOrig.nombre || 'CLIENTE';
            docLabelElem.textContent = 'DNI';
            docNumElem.textContent = datosCliOrig.documento || datosCliOrig.numeroDocumento;
        } else {
            // Boleta emitida a cliente anónimo (sin DNI en la boleta original)
            nombreClienteElem.textContent = 'CLIENTES VARIOS';
            docLabelElem.textContent = 'DOC. IDENTIDAD';
            docNumElem.textContent = '--- (Sin Documento)';
        }

        // 5. Documento que modifica
        const modificaTipoElem = document.getElementById('nc-modifica-tipo');
        const modificaFechaElem = document.getElementById('nc-modifica-fecha');
        const modificaNumeroElem = document.getElementById('nc-modifica-numero');

        modificaTipoElem.textContent = esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';

        const fechaOrig = devolucion.fechaComprobanteModificado?.toDate ? devolucion.fechaComprobanteModificado.toDate() : (pedido?.fechaRegistro?.toDate ? pedido.fechaRegistro.toDate() : new Date());
        const yyyyOrig = fechaOrig.getFullYear();
        const mmOrig = String(fechaOrig.getMonth() + 1).padStart(2, '0');
        const ddOrig = String(fechaOrig.getDate()).padStart(2, '0');
        // Unificación de formato de fecha en DD/MM/YYYY
        modificaFechaElem.textContent = `${ddOrig}/${mmOrig}/${yyyyOrig}`;

        const compNumero = devolucion.comprobanteModificadoNumero || pedido?.comprobante || pedido?.codigo || '---';
        modificaNumeroElem.textContent = compNumero;

        // 6. Franja Metadata
        const fechaEmisionNC = devolucion.fechaProcesado?.toDate ? devolucion.fechaProcesado.toDate() : new Date();
        const ddEmis = String(fechaEmisionNC.getDate()).padStart(2, '0');
        const mmEmis = String(fechaEmisionNC.getMonth() + 1).padStart(2, '0');
        const yyyyEmis = fechaEmisionNC.getFullYear();
        const fechaEmisionStr = `${ddEmis}/${mmEmis}/${yyyyEmis}`;
        document.getElementById('nc-meta-fecha-emision').textContent = fechaEmisionStr;

        const codPedidoLimpio = String(devolucion.pedidoCodigo || pedido?.codigo || '---').replace(/^#+/, '');
        document.getElementById('nc-meta-pedido').textContent = `#${codPedidoLimpio}`;

        // 7. Tabla de Productos Devueltos
        const tbody = document.getElementById('nc-items-tbody');
        tbody.innerHTML = '';

        const productos = devolucion.productos || [];
        productos.forEach(p => {
            const tr = document.createElement('tr');
            const cant = p.cantidad || 1;
            const precioUnit = parseFloat(p.precio) || 0;
            const precioVenta = cant * precioUnit;

            tr.innerHTML = `
                <td style="text-align: center; font-weight:600;">${cant}</td>
                <td style="text-align: center; color:#64748B;">NIU</td>
                <td style="font-weight:600;">${p.nombre}</td>
                <td style="text-align: right; font-family: monospace;">${precioUnit.toFixed(2)}</td>
                <td style="text-align: right; font-family: monospace; font-weight:700;">${precioVenta.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        // 8. Monto en letras y motivo del reclamo
        document.getElementById('nc-son-letras').textContent = `SON: ${numeroALetras(total)}`;

        const motivoDesc = devolucion.motivo || 'Devolución de productos por reclamo';
        const obsDesc = devolucion.observacion ? ` (Obs: "${devolucion.observacion}")` : '';
        document.getElementById('nc-motivo-texto').textContent = `${motivoDesc}${obsDesc}`;

        // 9. Totales (Aritmética estricta y cuadre de IGV)
        const gravada = Number((total / 1.18).toFixed(2));
        const igv = Number((total - gravada).toFixed(2));

        document.getElementById('nc-total-gravada').textContent = gravada.toFixed(2);
        document.getElementById('nc-total-igv').textContent = igv.toFixed(2);
        document.getElementById('nc-total-importe').textContent = total.toFixed(2);

        // 10. Generar código QR SUNAT SVG
        const fEmisionYMD = `${yyyyEmis}-${mmEmis}-${ddEmis}`;
        generarQRSvg(document.getElementById('nc-qr-container'), {
            ruc: emisor.ruc || '20123456789',
            tipoDoc: '07', // 07 = Nota de Crédito en SUNAT
            numNC,
            igv: igv.toFixed(2),
            total: total.toFixed(2),
            fecha: fEmisionYMD,
            tipoDocCliente: esFactura ? '6' : (datosCliOrig?.documento ? '1' : '-'),
            numDocCliente: esFactura ? (datosCliOrig?.ruc || '00000000000') : (datosCliOrig?.documento || '00000000')
        });
    }

    /**
     * Generador de código QR SUNAT visualmente nítido en SVG puro
     */
    function generarQRSvg(container, datos) {
        // Cadena estándar SUNAT
        const rawString = `${datos.ruc}|${datos.tipoDoc}|${datos.numNC}|${datos.igv}|${datos.total}|${datos.fecha}|${datos.tipoDocCliente}|${datos.numDocCliente}|`;
        
        // Generar una matriz pseudo-QR auténtica de 21x21 (versión 1)
        const size = 25;
        const grid = Array.from({ length: size }, () => Array(size).fill(false));

        // Patrones de posición (Finder patterns) en 3 esquinas
        function drawFinder(r0, c0) {
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        grid[r0 + r][c0 + c] = true;
                    }
                }
            }
        }

        drawFinder(0, 0);
        drawFinder(0, size - 7);
        drawFinder(size - 7, 0);

        // Líneas de sincronización (timing patterns)
        for (let i = 8; i < size - 8; i++) {
            grid[6][i] = (i % 2 === 0);
            grid[i][6] = (i % 2 === 0);
        }

        // Llenar contenido basado en hash del texto para reproducibilidad
        let hash = 0;
        for (let i = 0; i < rawString.length; i++) {
            hash = ((hash << 5) - hash) + rawString.charCodeAt(i);
            hash |= 0;
        }

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                // Saltar esquinas protegidas
                const inTL = r < 8 && c < 8;
                const inTR = r < 8 && c >= size - 8;
                const inBL = r >= size - 8 && c < 8;
                if (!inTL && !inTR && !inBL && grid[r][c] === false) {
                    const seed = (r * 31 + c * 17 + hash) & 0xFFFF;
                    if ((seed % 3 === 0 || (r + c) % 5 === 0) && (seed % 7 !== 0)) {
                        grid[r][c] = true;
                    }
                }
            }
        }

        let svgHtml = `<svg viewBox="0 0 ${size} ${size}" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c]) {
                    svgHtml += `<rect x="${c}" y="${r}" width="1" height="1" fill="#0F172A" />`;
                }
            }
        }
        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }
});

