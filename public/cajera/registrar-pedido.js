import { requireAuth } from '../shared/auth.js';
import { onProductosChange } from '../shared/db.js';
import { formatCurrency, showAlert } from '../shared/utils.js';
import {
    calcularTotalPedido,
    crearBorradorPedido,
    esCantidadValida,
    sumarPagoHibrido,
    validarBorradorPedido
} from '../shared/pedido-rules.js';

requireAuth('cajera');

// Limpiar cualquier borrador anterior apenas carga la página
sessionStorage.removeItem('pedidoBorrador');

// Prevenir que el navegador restaure el estado anterior usando el botón "Atrás" (bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const productosGrid = document.getElementById('productos-grid');
    const carritoContainer = document.getElementById('carrito-container');
    const totalMontoSpan = document.getElementById('total-monto');
    const btnRegistrar = document.getElementById('btn-registrar');
    const modalidadPago = document.getElementById('modalidad-pago');
    const hibridoContainer = document.getElementById('hibrido-container');
    const detallePedido = document.getElementById('detalle-pedido');
    const detalleCounter = document.getElementById('detalle-counter');

    detallePedido.addEventListener('input', () => {
        detalleCounter.textContent = detallePedido.value.length;
        validarFormulario();
    });

    let productos = [];
    let carrito = []; // { producto, cantidad }

    onProductosChange((nuevosProductos) => {
        productos = nuevosProductos;
        renderProductos();
        
        // Verificar si algún producto del carrito ya no está disponible
        let carritoModificado = false;
        carrito = carrito.filter(item => {
            const prodRef = productos.find(p => p.id === item.producto.id);
            if (!prodRef || !prodRef.disponible) {
                showAlert(`El producto "${item.producto.nombre}" ya no está disponible y fue removido de tu pedido.`);
                carritoModificado = true;
                return false;
            }
            item.producto = prodRef;
            return true;
        });

        if (carritoModificado) {
            renderCarrito();
        }
    });

    function renderProductos() {
        productosGrid.innerHTML = '';
        productos.forEach(p => {
            const div = document.createElement('div');
            div.className = `product-card ${p.disponible ? '' : 'disabled'}`;
            div.innerHTML = `
                <h4 style="margin-bottom:0.5rem;">${p.nombre}</h4>
                <div style="color:var(--primary-color); font-weight:bold;">${formatCurrency(p.precio)}</div>
                ${p.disponible ? '' : '<div style="font-size:0.8rem; color:#999;">No disponible</div>'}
            `;
            if (p.disponible) {
                div.addEventListener('click', () => agregarAlCarrito(p));
            }
            productosGrid.appendChild(div);
        });
    }

    function agregarAlCarrito(producto) {
        const item = carrito.find(i => i.producto.id === producto.id);
        if (item) {
            if (esCantidadValida(item.cantidad + 1)) item.cantidad++;
            else showAlert("La cantidad máxima por producto es 10.");
        } else {
            carrito.push({ producto, cantidad: 1 });
        }
        renderCarrito();
    }

    function quitarDelCarrito(productoId) {
        carrito = carrito.filter(i => i.producto.id !== productoId);
        renderCarrito();
    }

    function cambiarCantidad(productoId, delta) {
        const item = carrito.find(i => i.producto.id === productoId);
        if (item) {
            const nuevaCat = item.cantidad + delta;
            if (esCantidadValida(nuevaCat)) {
                item.cantidad = nuevaCat;
            } else if (nuevaCat > 10) {
                showAlert("La cantidad máxima por producto es 10.");
                return;
            } else if (nuevaCat === 0) {
                quitarDelCarrito(productoId);
                return;
            }
            renderCarrito();
        }
    }

    function renderCarrito() {
        if (carrito.length === 0) {
            carritoContainer.innerHTML = '<p class="text-center" style="color: #666; margin-top: 2rem;">Agrega productos al pedido</p>';
            totalMontoSpan.textContent = 'S/ 0.00';
            totalMontoSpan.setAttribute('data-total', '0');
            btnRegistrar.disabled = true;
            validarFormulario();
            return;
        }

        carritoContainer.innerHTML = '';
        carrito.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 500; font-size: 0.9rem;">${item.producto.nombre}</div>
                    <div style="font-size: 0.85rem; color: #666;">${formatCurrency(item.producto.precio)}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn btn-secondary" style="padding: 0.1rem 0.5rem;" data-action="minus" data-id="${item.producto.id}">-</button>
                    <span style="min-width: 1.5rem; text-align: center;">${item.cantidad}</span>
                    <button class="btn btn-secondary" style="padding: 0.1rem 0.5rem;" data-action="plus" data-id="${item.producto.id}">+</button>
                    <button class="btn" style="background:transparent; color:var(--primary-color); padding:0.1rem 0.5rem;" data-action="remove" data-id="${item.producto.id}">X</button>
                </div>
            `;
            carritoContainer.appendChild(div);
        });

        const total = calcularTotalPedido(carrito);
        totalMontoSpan.textContent = formatCurrency(total);
        totalMontoSpan.setAttribute('data-total', total);
        validarFormulario();

        // Eventos del carrito
        carritoContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const id = e.target.getAttribute('data-id');
                if (action === 'plus') cambiarCantidad(id, 1);
                if (action === 'minus') cambiarCantidad(id, -1);
                if (action === 'remove') quitarDelCarrito(id);
            });
        });
    }

    modalidadPago.addEventListener('change', () => {
        if (modalidadPago.value === 'Híbrido') {
            hibridoContainer.style.display = 'block';
        } else {
            hibridoContainer.style.display = 'none';
        }
        validarFormulario();
    });

    const hibridoInputs = document.querySelectorAll('.hibrido-input');
    const hibridoFeedback = document.getElementById('hibrido-feedback');

    function obtenerPagosHibridos() {
        return {
            efectivo: Number(document.getElementById('hibrido-efectivo').value),
            yape: Number(document.getElementById('hibrido-yape').value),
            plin: Number(document.getElementById('hibrido-plin').value),
            transferencia: Number(document.getElementById('hibrido-transferencia').value)
        };
    }

    hibridoInputs.forEach(input => {
        // Prevenir teclas extrañas (e, -, +)
        input.addEventListener('keydown', (e) => {
            if (['e', 'E', '-', '+'].includes(e.key)) {
                e.preventDefault();
            }
        });
        // Auto-seleccionar al enfocar para reemplazar el 0 fácilmente
        input.addEventListener('focus', () => {
            if (input.value === '0' || input.value === '0.00') {
                input.select();
            }
        });
        input.addEventListener('input', validarFormulario);
    });

    function actualizarFeedbackHibrido(totalPedido, sumaHibrido) {
        if (!hibridoFeedback) return;

        if (!Number.isFinite(sumaHibrido) || sumaHibrido < 0) {
            hibridoFeedback.style.backgroundColor = '#FEE2E2';
            hibridoFeedback.style.borderColor = '#FCA5A5';
            hibridoFeedback.style.color = '#991B1B';
            hibridoFeedback.innerHTML = '<div style="font-size:0.88rem;font-weight:700;">⚠️ Ingrese montos válidos y no negativos</div>';
            return;
        }

        if (totalPedido <= 0) {
            hibridoFeedback.style.backgroundColor = '#F1F5F9';
            hibridoFeedback.style.borderColor = '#CBD5E1';
            hibridoFeedback.style.color = '#475569';
            hibridoFeedback.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: 600;">🛒 Agregue productos al pedido para calcular el total</div>
            `;
            return;
        }

        const dif = parseFloat((totalPedido - sumaHibrido).toFixed(2));

        if (dif > 0) {
            // Falta ingresar
            hibridoFeedback.style.backgroundColor = '#FEF3C7';
            hibridoFeedback.style.borderColor = '#FCD34D';
            hibridoFeedback.style.color = '#92400E';
            hibridoFeedback.innerHTML = `
                <div style="font-size: 0.88rem; font-weight: 700;">⏳ Falta ingresar: S/ ${dif.toFixed(2)}</div>
                <div style="font-size: 0.78rem; font-weight: 500; margin-top: 0.2rem; opacity: 0.9;">
                    Ingresado: S/ ${sumaHibrido.toFixed(2)} &nbsp;|&nbsp; Total pedido: S/ ${totalPedido.toFixed(2)}
                </div>
            `;
        } else if (dif < 0) {
            // Excedido
            const exceso = Math.abs(dif).toFixed(2);
            hibridoFeedback.style.backgroundColor = '#FEE2E2';
            hibridoFeedback.style.borderColor = '#FCA5A5';
            hibridoFeedback.style.color = '#991B1B';
            hibridoFeedback.innerHTML = `
                <div style="font-size: 0.88rem; font-weight: 700;">⚠️ Monto excedido por: S/ ${exceso}</div>
                <div style="font-size: 0.78rem; font-weight: 500; margin-top: 0.2rem; opacity: 0.9;">
                    Ingresado: S/ ${sumaHibrido.toFixed(2)} (Total requerido: S/ ${totalPedido.toFixed(2)})
                </div>
            `;
        } else {
            // Monto exacto cubierto
            hibridoFeedback.style.backgroundColor = '#D1FAE5';
            hibridoFeedback.style.borderColor = '#6EE7B7';
            hibridoFeedback.style.color = '#065F46';
            hibridoFeedback.innerHTML = `
                <div style="font-size: 0.88rem; font-weight: 700;">✅ ¡Monto exacto cubierto!</div>
                <div style="font-size: 0.78rem; font-weight: 500; margin-top: 0.2rem; opacity: 0.9;">
                    Total asignado: S/ ${totalPedido.toFixed(2)}
                </div>
            `;
        }
    }

    function validarFormulario() {
        const total = Number(totalMontoSpan.getAttribute('data-total') || 0);
        const pagosHibridos = obtenerPagosHibridos();
        const validacion = validarBorradorPedido({
            productos: carrito,
            detalle: detallePedido.value,
            modalidadPago: modalidadPago.value,
            pagosHibridos
        });

        if (modalidadPago.value === 'Híbrido') {
            let sumaHibrido;
            try {
                sumaHibrido = sumarPagoHibrido(pagosHibridos);
            } catch {
                sumaHibrido = Number.NaN;
            }
            actualizarFeedbackHibrido(total, sumaHibrido);
        }
        btnRegistrar.disabled = !validacion.valido;
    }

    btnRegistrar.addEventListener('click', () => {
        try {
            const pedidoDraft = crearBorradorPedido({
                carrito,
                detalle: detallePedido.value,
                modalidadPago: modalidadPago.value,
                pagosHibridos: obtenerPagosHibridos()
            });
            sessionStorage.setItem('pedidoBorrador', JSON.stringify(pedidoDraft));
            window.location.href = 'emitir-comprobante.html';
        } catch (error) {
            console.error('No se pudo crear el borrador:', error);
            showAlert('Revise los productos, cantidades y modalidad de pago.');
            validarFormulario();
        }
    });
});
