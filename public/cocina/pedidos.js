import { requireAuth } from '../shared/auth.js';
import { onPedidosCocina, updatePedidoProductos } from '../shared/db.js';
import { calculateOrderState, formatDateTime, getBadgeClass } from '../shared/utils.js';

requireAuth('cocina');

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('pedidos-container');

    onPedidosCocina((pedidos) => {
        container.innerHTML = '';
        
        if (pedidos.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">No hay pedidos en curso.</p>';
            return;
        }

        pedidos.forEach(pedido => {
            const card = document.createElement('div');
            card.className = `card order-card ${pedido.esReposicion ? 'reposicion' : ''}`;
            
            const codigoLimpio = pedido.codigo ? String(pedido.codigo).replace(/^#+/, '') : '';
            const codigoDisplay = codigoLimpio ? `#${codigoLimpio}` : 'S/N';

            // Header
            let html = `
                <div class="d-flex justify-between align-center mb-1">
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <h3 style="margin: 0; font-family:monospace;">${codigoDisplay}</h3>
                        ${pedido.esReposicion ? '<span class="badge" style="background:var(--primary-color);">REPOSICIÓN</span>' : ''}
                    </div>
                    <span class="badge ${getBadgeClass(pedido.estadoGeneral)}">
                        ${pedido.estadoGeneral}
                    </span>
                </div>
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 1rem; word-break: break-word; overflow-wrap: anywhere;">
                    Hora: ${formatDateTime(pedido.fechaRegistro?.toDate())}
                    ${pedido.motivoReposicion ? `<br><span style="color:var(--primary-color); font-weight:600;">Motivo: ${pedido.motivoReposicion}</span>` : ''}
                    ${pedido.observacionReposicion ? `<br><small style="color:#666; display:inline-block; word-break:break-word; overflow-wrap:anywhere;">Obs: ${pedido.observacionReposicion}</small>` : ''}
                </div>
                ${pedido.detalle ? `<div style="background:#f1f5f9; border:1px solid var(--border-color); padding:0.6rem 0.75rem; border-radius:var(--radius-md); margin-bottom:1rem; font-size:0.88rem; word-break:break-word; overflow-wrap:anywhere; white-space:pre-wrap; line-height:1.4;"><strong>Nota:</strong> ${pedido.detalle}</div>` : ''}
            `;

            // Productos
            html += `<div class="mb-1"><strong>Productos:</strong></div>`;
            
            // Verificar si podemos mostrar el botón global
            let todosPendientesConPrep = true;
            let hayConPrep = false;

            pedido.productos.forEach((prod, index) => {
                const tipoLower = prod.tipo ? prod.tipo.toLowerCase() : '';
                if (tipoLower === 'con preparación' || tipoLower === 'con preparacion') {
                    hayConPrep = true;
                    if (prod.estado !== 'Pendiente') todosPendientesConPrep = false;
                }

                let btnHTML = '';
                if (prod.estado !== 'Listo') {
                    if (tipoLower === 'con preparación' || tipoLower === 'con preparacion') {
                        if (prod.estado === 'Pendiente') {
                            btnHTML = `<button class="btn btn-secondary btn-sm" data-action="avanzar" data-pid="${pedido.id}" data-idx="${index}" data-next="En preparación" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Preparar</button>`;
                        } else if (prod.estado === 'En preparación') {
                            btnHTML = `<button class="btn btn-success btn-sm" data-action="avanzar" data-pid="${pedido.id}" data-idx="${index}" data-next="Listo" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Listo</button>`;
                        }
                    } else {
                        // Servicio Inmediato (Pasa directo a Listo)
                        btnHTML = `<button class="btn btn-success btn-sm" data-action="avanzar" data-pid="${pedido.id}" data-idx="${index}" data-next="Listo" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Listo</button>`;
                    }
                }

                html += `
                    <div class="product-item">
                        <div>
                            <strong>${prod.cantidad}x</strong> ${prod.nombre}
                            <div style="font-size: 0.8rem; color: #666;">Estado: ${prod.estado}</div>
                        </div>
                        <div>${btnHTML}</div>
                    </div>
                `;
            });

            // Botón global "Iniciar preparación del pedido"
            if (hayConPrep && todosPendientesConPrep) {
                html += `
                    <div class="mt-1" style="text-align: right;">
                        <button class="btn btn-primary" data-action="iniciar-todo" data-pid="${pedido.id}">
                            Iniciar preparación
                        </button>
                    </div>
                `;
            }

            card.innerHTML = html;

            // Bind events for buttons
            card.querySelectorAll('button[data-action="avanzar"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pid = btn.getAttribute('data-pid');
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    const next = btn.getAttribute('data-next');
                    const targetPedido = pedidos.find(p => p.id === pid);
                    
                    const nuevosProductos = [...targetPedido.productos];
                    nuevosProductos[idx].estado = next;
                    
                    const nuevoEstadoGeneral = calculateOrderState(nuevosProductos);
                    updatePedidoProductos(pid, nuevosProductos, nuevoEstadoGeneral);
                });
            });

            card.querySelectorAll('button[data-action="iniciar-todo"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pid = btn.getAttribute('data-pid');
                    const targetPedido = pedidos.find(p => p.id === pid);
                    
                    const nuevosProductos = targetPedido.productos.map(prod => {
                        const t = prod.tipo ? prod.tipo.toLowerCase() : '';
                        if ((t === 'con preparación' || t === 'con preparacion') && prod.estado === 'Pendiente') {
                            return { ...prod, estado: 'En preparación' };
                        }
                        return prod;
                    });
                    
                    const nuevoEstadoGeneral = calculateOrderState(nuevosProductos);
                    updatePedidoProductos(pid, nuevosProductos, nuevoEstadoGeneral);
                });
            });

            container.appendChild(card);
        });
    });
});
