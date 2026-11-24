import { requireAuth } from '../shared/auth.js';
import { getPedidoById, getConfiguracion } from '../shared/db.js';
import { formatCurrency, formatDateTime, numeroALetras } from '../shared/utils.js';

requireAuth(['cajera', 'admin']);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('id');

    const ticketContent = document.getElementById('ticket-content');

    if (!pedidoId) {
        ticketContent.innerHTML = '<p class="text-center">No se especificó un ID de pedido.</p>';
        return;
    }

    try {
        const pedido = await getPedidoById(pedidoId);
        
        // Fallback de datos del emisor si fuera un pedido previo sin esos campos
        if (!pedido.datosEmisor) {
            try {
                pedido.datosEmisor = await getConfiguracion();
            } catch (e) {
                pedido.datosEmisor = {
                    nombreComercial: "Burger Local",
                    razonSocial: "Hamburguesas Local S.A.C.",
                    ruc: "20123456789",
                    domicilioFiscal: "Local Principal"
                };
            }
        }

        renderTicket(pedido);
        
        // Disparar impresión automática después de renderizar (opcional, con ligero delay)
        setTimeout(() => {
            window.print();
        }, 500);

    } catch (error) {
        console.error("Error al cargar comprobante:", error);
        ticketContent.innerHTML = '<p class="text-center">Error al cargar el comprobante o el pedido no existe.</p>';
    }

    function renderTicket(pedido) {
        const emisor = pedido.datosEmisor || {
            nombreComercial: "Burger Local",
            razonSocial: "Hamburguesas Local S.A.C.",
            ruc: "20123456789",
            domicilioFiscal: "Local Principal"
        };
        const cliente = pedido.datosCliente;
        const esFactura = pedido.tipoComprobante === 'Factura';
        const esReposicion = pedido.esReposicion === true || pedido.tipoComprobante === 'Reposición';
        const fecha = formatDateTime(pedido.fechaRegistro?.toDate() || new Date());

        const cleanCodigo = pedido.codigo ? String(pedido.codigo).replace(/^#+/, '') : '';
        const displayCodigo = cleanCodigo ? `#${cleanCodigo}` : 'S/N';
        const cleanOrigen = pedido.pedidoOrigenCodigo ? String(pedido.pedidoOrigenCodigo).replace(/^#+/, '') : '';

        let html = `
            <div class="text-center mb-1">
                <div class="bold" style="font-size: 1.2rem;">${emisor.nombreComercial || emisor.razonSocial || 'Burger Local'}</div>
                <div>${emisor.razonSocial || ''}</div>
                <div>RUC: ${emisor.ruc || '20123456789'}</div>
                <div>${emisor.domicilioFiscal || ''}</div>
                <div class="divider"></div>
                <div class="bold" style="font-size: 1.1rem;">${esReposicion ? 'COMPROBANTE DE REPOSICIÓN' : (pedido.tipoComprobante ? pedido.tipoComprobante.toUpperCase() + ' ELECTRÓNICA' : 'COMPROBANTE DE PAGO')}</div>
                <div class="bold">${pedido.comprobante || displayCodigo}</div>
                ${cleanOrigen ? `<div style="font-size:0.85rem; margin-top:2px;">Ref. Pedido Original: <strong>#${cleanOrigen}</strong></div>` : ''}
                <div class="divider"></div>
            </div>
            
            <div>
                <div><span class="bold">Fecha Emisión:</span> ${fecha}</div>
                <div><span class="bold">Pedido:</span> ${displayCodigo}</div>
                ${esReposicion && pedido.motivoReposicion ? `<div><span class="bold">Motivo Reclamo:</span> ${pedido.motivoReposicion}</div>` : ''}
                ${esReposicion && pedido.observacionReposicion ? `<div><span class="bold">Observación:</span> ${pedido.observacionReposicion}</div>` : ''}
                <div><span class="bold">Mod. Pago:</span> ${(() => {
                    if (pedido.modalidadPago === 'Híbrido') {
                        const partes = [];
                        if (pedido.pagoHibridoEfectivo > 0) partes.push(`Efectivo: ${formatCurrency(pedido.pagoHibridoEfectivo)}`);
                        if (pedido.pagoHibridoYape > 0) partes.push(`Yape: ${formatCurrency(pedido.pagoHibridoYape)}`);
                        if (pedido.pagoHibridoPlin > 0) partes.push(`Plin: ${formatCurrency(pedido.pagoHibridoPlin)}`);
                        if (pedido.pagoHibridoTransferencia > 0) partes.push(`Transf.: ${formatCurrency(pedido.pagoHibridoTransferencia)}`);
                        return partes.length > 0 ? `Híbrido (${partes.join(', ')})` : 'Híbrido';
                    }
                    return pedido.modalidadPago || 'Sin costo (S/ 0.00)';
                })()}</div>
            </div>
            <div class="divider"></div>
        `;

        if (esFactura) {
            html += `
                <div class="mb-1">
                    <div><span class="bold">Cliente:</span> ${cliente.razonSocial}</div>
                    <div><span class="bold">RUC:</span> ${cliente.ruc}</div>
                    <div><span class="bold">Dirección:</span> ${cliente.direccion}</div>
                </div>
                <div class="divider"></div>
            `;
        } else if (cliente && cliente.documento) {
            html += `
                <div class="mb-1">
                    <div><span class="bold">Cliente:</span> ${cliente.nombre}</div>
                    <div><span class="bold">DNI:</span> ${cliente.documento}</div>
                </div>
                <div class="divider"></div>
            `;
        } else {
            // Boleta simple
            html += `
                <div class="mb-1">
                    <div><span class="bold">Cliente:</span> PÚBLICO GENERAL</div>
                </div>
                <div class="divider"></div>
            `;
        }

        html += `
            <table style="font-size: 11px; width: 100%;">
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="width: 12%; text-align: left;">Cant</th>
                        <th style="width: 36%; text-align: left;">Descripción</th>
                        <th class="right" style="width: 17%;">P.U.</th>
                        <th class="right" style="width: 17%;">IGV</th>
                        <th class="right" style="width: 18%;">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        pedido.productos.forEach(prod => {
            const totalProd = prod.cantidad * prod.precio;
            const subtotalProd = totalProd / 1.18;
            const igvProd = totalProd - subtotalProd;

            const displayTotal = esReposicion ? 'S/ 0.00' : formatCurrency(totalProd);
            const displayIgv = esReposicion ? 'S/ 0.00' : formatCurrency(igvProd);

            html += `
                <tr>
                    <td>${prod.cantidad}</td>
                    <td style="word-break: break-word;">${prod.nombre}</td>
                    <td class="right">${formatCurrency(prod.precio)}</td>
                    <td class="right">${displayIgv}</td>
                    <td class="right">${displayTotal}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div class="divider"></div>
        `;

        if (esFactura) {
            const subtotal = pedido.total / 1.18;
            const igv = pedido.total - subtotal;
            html += `
                <table style="font-size: 12px; margin-top: 5px;">
                    <tr>
                        <td class="bold">Op. Gravada</td>
                        <td class="right">${formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="bold">IGV (18%)</td>
                        <td class="right">${formatCurrency(igv)}</td>
                    </tr>
                    <tr>
                        <td class="bold" style="font-size: 1.05rem;">IMPORTE TOTAL</td>
                        <td class="right bold" style="font-size: 1.05rem;">${formatCurrency(pedido.total)}</td>
                    </tr>
                </table>
                <div class="divider"></div>
                <div class="text-left" style="font-size: 0.85rem; margin-top: 6px;">
                    SON: ${numeroALetras(pedido.total)}
                </div>
                <div class="divider"></div>
                <div class="text-center" style="font-size: 0.8rem; margin-top: 6px;">
                    COPIA SIN DERECHO A CRÉDITO FISCAL DEL IGV
                </div>
            `;
        } else if (esReposicion) {
            html += `
                <div class="text-right bold" style="font-size: 1.1rem; margin-top: 5px;">
                    TOTAL COBRADO: S/ 0.00 (SIN COSTO)
                </div>
            `;
        } else {
            // Boletas (Simple o con DNI) - Muestra desglose de Op. Gravada, IGV y Total
            const subtotal = pedido.total / 1.18;
            const igv = pedido.total - subtotal;
            html += `
                <table style="font-size: 12px; margin-top: 5px;">
                    <tr>
                        <td class="bold">Op. Gravada</td>
                        <td class="right">${formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="bold">IGV (18%)</td>
                        <td class="right">${formatCurrency(igv)}</td>
                    </tr>
                    <tr>
                        <td class="bold" style="font-size: 1.05rem;">IMPORTE TOTAL</td>
                        <td class="right bold" style="font-size: 1.05rem;">${formatCurrency(pedido.total)}</td>
                    </tr>
                </table>
            `;
        }

        html += `
            <div class="divider"></div>
            <div class="text-center" style="font-size: 0.72rem; color: #222; margin: 8px 0; line-height: 1.35;">
                <span class="bold">AVISO IMPORTANTE:</span><br>
                Una vez emitido el comprobante e ingresado el pedido a cocina, no se aceptan cancelaciones ni devoluciones de dinero por tratarse de alimentos de preparación inmediata.
            </div>
            <div class="divider"></div>
            <div class="text-center mt-1">
                ¡Gracias por su compra!<br>
                Vuelva pronto.
            </div>
        `;

        ticketContent.innerHTML = html;
    }
});
