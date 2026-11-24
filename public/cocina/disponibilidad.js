import { requireAuth } from '../shared/auth.js';
import { onProductosChange, updateProductoDisponibilidad } from '../shared/db.js';
import { formatCurrency } from '../shared/utils.js';

// Proteger ruta
requireAuth('cocina');

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('productos-tbody');
    const table = document.getElementById('productos-table');
    const loadingMsg = document.getElementById('loading-msg');

    onProductosChange((productos) => {
        loadingMsg.style.display = 'none';
        table.style.display = 'table';
        tbody.innerHTML = '';

        productos.forEach(prod => {
            const tr = document.createElement('tr');
            
            // Texto del estado
            const estadoTexto = prod.disponible ? 
                '<span style="color: var(--success-color); font-weight: 600;">Disponible</span>' : 
                '<span style="color: var(--primary-color); font-weight: 600;">No disponible</span>';
            
            // Botón de acción
            const accionTexto = prod.disponible ? 'Marcar No Disponible' : 'Marcar Disponible';
            const accionClase = prod.disponible ? 'btn-primary' : 'btn-success';

            tr.innerHTML = `
                <td>${prod.nombre}</td>
                <td>${formatCurrency(prod.precio)}</td>
                <td>${estadoTexto}</td>
                <td>
                    <button class="btn ${accionClase}" style="padding: 0.4rem 0.8rem; font-size: 0.9rem;" data-id="${prod.id}" data-current="${prod.disponible}">
                        ${accionTexto}
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Event listener para botones de alternar
        document.querySelectorAll('button[data-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const isCurrentlyAvailable = e.target.getAttribute('data-current') === 'true';
                
                // Deshabilitar botón mientras se actualiza
                e.target.disabled = true;
                e.target.textContent = 'Actualizando...';
                
                try {
                    await updateProductoDisponibilidad(id, !isCurrentlyAvailable);
                } catch (error) {
                    console.error("Error updating availability", error);
                    alert("Ocurrió un error al actualizar.");
                    e.target.disabled = false;
                }
            });
        });
    });
});
