import { requireAuth } from '../shared/auth.js';
import { 
    onProductosChange, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto 
} from '../shared/db.js';
import { formatCurrency, normalizarTipo, showAlert } from '../shared/utils.js';

// Restringir módulo exclusivamente al Administrador
requireAuth('admin');

document.addEventListener('DOMContentLoaded', () => {
    // Métricas
    const statTotal = document.getElementById('stat-total');
    const statPrep = document.getElementById('stat-prep');
    const statInmed = document.getElementById('stat-inmed');
    const statDisp = document.getElementById('stat-disp');

    // Filtros y tabla
    const inputBuscar = document.getElementById('buscar-producto');
    const selectFiltroTipo = document.getElementById('filtro-tipo');
    const loadingMsg = document.getElementById('loading-msg');
    const noResultsMsg = document.getElementById('no-results-msg');
    const tableWrapper = document.getElementById('table-wrapper');
    const tbody = document.getElementById('productos-tbody');
    const mobileList = document.getElementById('productos-mobile-list');

    // Modal Crear
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const modalCrear = document.getElementById('modal-crear');
    const btnCerrarModalCrear = document.getElementById('btn-cerrar-modal-crear');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    const formCrear = document.getElementById('form-crear-producto');
    const crearNombre = document.getElementById('crear-nombre');
    const crearPrecio = document.getElementById('crear-precio');
    const crearNombreFeedback = document.getElementById('crear-nombre-feedback');
    const btnSubmitCrear = document.getElementById('btn-submit-crear');

    // Modal Editar
    const modalEditar = document.getElementById('modal-editar');
    const btnCerrarModalEditar = document.getElementById('btn-cerrar-modal-editar');
    const btnCancelarEditar = document.getElementById('btn-cancelar-editar');
    const formEditar = document.getElementById('form-editar-producto');
    const editarId = document.getElementById('editar-id');
    const editarNombre = document.getElementById('editar-nombre');
    const editarPrecio = document.getElementById('editar-precio');
    const editarTipoBadge = document.getElementById('editar-tipo-badge');
    const editarNombreFeedback = document.getElementById('editar-nombre-feedback');
    const btnSubmitEditar = document.getElementById('btn-submit-editar');

    // Modal Eliminar
    const modalEliminar = document.getElementById('modal-eliminar');
    const btnCerrarModalEliminar = document.getElementById('btn-cerrar-modal-eliminar');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
    const eliminarNombreDisplay = document.getElementById('eliminar-nombre-display');

    let productosActuales = [];
    let productoAEliminarId = null;

    // Suscripción en tiempo real al catálogo de productos
    onProductosChange((productos) => {
        productosActuales = productos;
        actualizarMetricas();
        renderTabla();
    });

    function actualizarMetricas() {
        const total = productosActuales.length;
        const prep = productosActuales.filter(p => normalizarTipo(p.tipo) === 'Con preparación').length;
        const inmed = productosActuales.filter(p => normalizarTipo(p.tipo) === 'Servicio inmediato').length;
        const disp = productosActuales.filter(p => p.disponible !== false).length;

        statTotal.textContent = total;
        statPrep.textContent = prep;
        statInmed.textContent = inmed;
        statDisp.textContent = disp;
    }

    inputBuscar.addEventListener('input', renderTabla);
    selectFiltroTipo.addEventListener('change', renderTabla);

    function renderTabla() {
        loadingMsg.style.display = 'none';
        tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';

        const termino = inputBuscar.value.trim().toLowerCase();
        const tipoFiltro = selectFiltroTipo.value;

        const filtrados = productosActuales.filter(p => {
            const coincideNombre = p.nombre.toLowerCase().includes(termino);
            const tipoNormal = normalizarTipo(p.tipo);
            const coincideTipo = tipoFiltro === 'todos' || tipoNormal === tipoFiltro;
            return coincideNombre && coincideTipo;
        });

        // Ordenar alfabéticamente por nombre
        filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));

        if (filtrados.length === 0) {
            tableWrapper.style.display = 'none';
            if (mobileList) mobileList.style.display = 'none';
            noResultsMsg.style.display = 'block';
            return;
        }

        tableWrapper.style.display = '';
        if (mobileList) mobileList.style.display = '';
        noResultsMsg.style.display = 'none';

        filtrados.forEach(p => {
            const esPrep = normalizarTipo(p.tipo) === 'Con preparación';
            const badgeTipo = esPrep 
                ? '<span class="badge" style="background:#FEF3C7; color:#B45309; font-weight:700; font-size:0.75rem;">🍳 Con preparación</span>' 
                : '<span class="badge" style="background:#D1FAE5; color:#065F46; font-weight:700; font-size:0.75rem;">⚡ Servicio inmediato</span>';

            const estaDisponible = p.disponible !== false;
            const badgeDisp = estaDisponible
                ? '<span class="badge" style="background:var(--success-color); font-size:0.75rem;">Disponible</span>'
                : '<span class="badge" style="background:#EF4444; font-size:0.75rem;">No disponible</span>';

            const botonesAccion = `
                <div class="pedido-actions-group" style="justify-content:flex-end;">
                    <button class="btn btn-secondary btn-sm btn-editar" data-id="${p.id}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Modificar nombre o precio">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-eliminar" data-id="${p.id}" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600;" title="Dar de baja producto">
                        🗑️ Eliminar
                    </button>
                </div>
            `;

            // 1. RENDERIZAR EN TABLA DESKTOP
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong style="color:var(--text-main); font-size:0.95rem;">${p.nombre}</strong>
                </td>
                <td>${badgeTipo}</td>
                <td style="text-align:right; font-weight:700; font-size:1rem; color:#1E3A8A;">
                    ${formatCurrency(p.precio)}
                </td>
                <td style="text-align:center;">${badgeDisp}</td>
                <td style="text-align:right;">${botonesAccion}</td>
            `;
            tbody.appendChild(tr);

            // 2. RENDERIZAR EN CARDS MÓVIL
            if (mobileList) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'producto-card-mobile';
                cardDiv.innerHTML = `
                    <div class="d-flex justify-between align-center" style="border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                        <strong style="font-size:1rem; color:var(--text-main);">${p.nombre}</strong>
                        <div>${badgeDisp}</div>
                    </div>
                    <div class="d-flex justify-between align-center" style="font-size:0.88rem;">
                        <div>${badgeTipo}</div>
                        <div>
                            <span style="font-size:0.75rem; color:var(--text-muted); display:block; text-align:right;">PRECIO</span>
                            <strong style="font-size:1.1rem; color:#1E3A8A;">${formatCurrency(p.precio)}</strong>
                        </div>
                    </div>
                    <div style="border-top:1px dashed var(--border-color); padding-top:0.5rem;">
                        ${botonesAccion}
                    </div>
                `;
                mobileList.appendChild(cardDiv);
            }
        });

        // Eventos en botones
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const prod = productosActuales.find(x => x.id === id);
                if (prod) abrirModalEditar(prod);
            });
        });

        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const prod = productosActuales.find(x => x.id === id);
                if (prod) abrirModalEliminar(prod);
            });
        });
    }

    // -------------------------------------------------------------
    // SANITIZACIÓN DE PRECIOS (NO PERMITIR NEGATIVOS NI CARACTERES EXTRAÑOS)
    // -------------------------------------------------------------
    function configurarInputPrecio(input) {
        input.addEventListener('keydown', (e) => {
            if (['-', '+', 'e', 'E'].includes(e.key)) {
                e.preventDefault();
            }
        });
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (val < 0) e.target.value = 0;
        });
    }

    configurarInputPrecio(crearPrecio);
    configurarInputPrecio(editarPrecio);

    // -------------------------------------------------------------
    // MODAL CREAR PRODUCTO (CA01, CA02, CA03, CA05)
    // -------------------------------------------------------------
    btnAbrirCrear.addEventListener('click', () => {
        formCrear.reset();
        crearNombreFeedback.textContent = '';
        btnSubmitCrear.disabled = false;
        modalCrear.style.display = 'flex';
        crearNombre.focus();
    });

    btnCerrarModalCrear.addEventListener('click', () => modalCrear.style.display = 'none');
    btnCancelarCrear.addEventListener('click', () => modalCrear.style.display = 'none');

    // Validación de unicidad en tiempo real al escribir nombre nuevo
    crearNombre.addEventListener('input', () => {
        const val = crearNombre.value.trim().toLowerCase();
        if (!val) {
            crearNombreFeedback.textContent = '';
            btnSubmitCrear.disabled = false;
            return;
        }
        const existe = productosActuales.some(p => p.nombre.trim().toLowerCase() === val);
        if (existe) {
            crearNombreFeedback.textContent = '❌ Ya existe un producto con este nombre.';
            crearNombreFeedback.style.color = '#DC2626';
            btnSubmitCrear.disabled = true;
        } else {
            crearNombreFeedback.textContent = '✓ Nombre disponible';
            crearNombreFeedback.style.color = '#059669';
            btnSubmitCrear.disabled = false;
        }
    });

    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = crearNombre.value.trim();
        const precio = parseFloat(crearPrecio.value);
        const tipoRadio = formCrear.querySelector('input[name="crear-tipo"]:checked');
        const tipo = tipoRadio ? tipoRadio.value : 'Con preparación';

        if (!nombre || isNaN(precio) || precio <= 0) {
            showAlert("Ingrese un nombre y un precio válido mayor a 0.");
            return;
        }

        btnSubmitCrear.disabled = true;
        btnSubmitCrear.textContent = 'Guardando...';

        try {
            await crearProducto({ nombre, precio, tipo });
            showAlert(`✅ Producto "${nombre}" registrado con éxito.`);
            modalCrear.style.display = 'none';
        } catch (error) {
            console.error("Error al crear producto:", error);
            showAlert(error.message || "Ocurrió un error al registrar el producto.");
        } finally {
            btnSubmitCrear.disabled = false;
            btnSubmitCrear.textContent = 'Guardar Producto';
        }
    });

    // -------------------------------------------------------------
    // MODAL EDITAR PRODUCTO (CA04, CA05, CA06)
    // -------------------------------------------------------------
    function abrirModalEditar(prod) {
        editarId.value = prod.id;
        editarNombre.value = prod.nombre;
        editarPrecio.value = prod.precio;
        editarNombreFeedback.textContent = '';

        const esPrep = normalizarTipo(prod.tipo) === 'Con preparación';
        editarTipoBadge.innerHTML = esPrep
            ? '<span class="badge" style="background:#FEF3C7; color:#B45309; font-weight:700;">🍳 Con preparación</span>'
            : '<span class="badge" style="background:#D1FAE5; color:#065F46; font-weight:700;">⚡ Servicio inmediato</span>';

        btnSubmitEditar.disabled = false;
        modalEditar.style.display = 'flex';
        editarNombre.focus();
    }

    btnCerrarModalEditar.addEventListener('click', () => modalEditar.style.display = 'none');
    btnCancelarEditar.addEventListener('click', () => modalEditar.style.display = 'none');

    // Validación de unicidad en tiempo real al editar nombre
    editarNombre.addEventListener('input', () => {
        const val = editarNombre.value.trim().toLowerCase();
        const idActual = editarId.value;

        if (!val) {
            editarNombreFeedback.textContent = '';
            btnSubmitEditar.disabled = false;
            return;
        }
        const existeOtro = productosActuales.some(p => p.id !== idActual && p.nombre.trim().toLowerCase() === val);
        if (existeOtro) {
            editarNombreFeedback.textContent = '❌ Ya existe otro producto con este nombre.';
            editarNombreFeedback.style.color = '#DC2626';
            btnSubmitEditar.disabled = true;
        } else {
            editarNombreFeedback.textContent = '✓ Nombre disponible';
            editarNombreFeedback.style.color = '#059669';
            btnSubmitEditar.disabled = false;
        }
    });

    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editarId.value;
        const nombre = editarNombre.value.trim();
        const precio = parseFloat(editarPrecio.value);

        if (!id || !nombre || isNaN(precio) || precio <= 0) {
            showAlert("Ingrese un nombre y un precio válido mayor a 0.");
            return;
        }

        btnSubmitEditar.disabled = true;
        btnSubmitEditar.textContent = 'Actualizando...';

        try {
            await actualizarProducto(id, { nombre, precio });
            showAlert(`✅ Producto "${nombre}" actualizado con éxito.`);
            modalEditar.style.display = 'none';
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            showAlert(error.message || "Ocurrió un error al actualizar el producto.");
        } finally {
            btnSubmitEditar.disabled = false;
            btnSubmitEditar.textContent = 'Guardar Cambios';
        }
    });

    // -------------------------------------------------------------
    // MODAL ELIMINAR PRODUCTO (CA07, CA08)
    // -------------------------------------------------------------
    function abrirModalEliminar(prod) {
        productoAEliminarId = prod.id;
        eliminarNombreDisplay.textContent = prod.nombre;
        btnConfirmarEliminar.disabled = false;
        btnConfirmarEliminar.textContent = 'Sí, Eliminar';
        modalEliminar.style.display = 'flex';
    }

    btnCerrarModalEliminar.addEventListener('click', () => modalEliminar.style.display = 'none');
    btnCancelarEliminar.addEventListener('click', () => modalEliminar.style.display = 'none');

    btnConfirmarEliminar.addEventListener('click', async () => {
        if (!productoAEliminarId) return;

        btnConfirmarEliminar.disabled = true;
        btnConfirmarEliminar.textContent = 'Eliminando...';

        try {
            await eliminarProducto(productoAEliminarId);
            showAlert("✅ Producto eliminado del catálogo correctamente.");
            modalEliminar.style.display = 'none';
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            showAlert(error.message || "Ocurrió un error al eliminar el producto.");
        } finally {
            btnConfirmarEliminar.disabled = false;
            btnConfirmarEliminar.textContent = 'Sí, Eliminar';
            productoAEliminarId = null;
        }
    });
});
