/**
 * Formatea un número a moneda (S/ 0.00)
 */
export function formatCurrency(amount) {
    return `S/ ${Number(amount).toFixed(2)}`;
}

/**
 * Formatea una fecha y hora (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Genera un código de pedido aleatorio (ej. #A1B2)
 */
export function generateOrderCode() {
    return '#' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Calcula el estado general de un pedido basado en sus productos
 */
export function calculateOrderState(productos) {
    if (!productos || productos.length === 0) return 'Pendiente';
    
    let todosListos = true;
    let algunEnPreparacionOListo = false;

    for (const p of productos) {
        if (p.estado === 'En preparación' || p.estado === 'Listo') {
            algunEnPreparacionOListo = true;
        }
        if (p.estado !== 'Listo') {
            todosListos = false;
        }
    }

    if (todosListos) return 'Listo';
    if (algunEnPreparacionOListo) return 'En preparación';
    return 'Pendiente';
}

/**
 * Muestra un mensaje de error o alerta en la UI (básico)
 */
export function showAlert(message) {
    alert(message);
}

/**
 * Devuelve la clase CSS correspondiente al estado
 */
export function getBadgeClass(estado) {
    if (!estado) return '';
    const e = estado.toLowerCase();
    if (e === 'pendiente') return 'pendiente';
    if (e === 'en preparación' || e === 'en preparacion') return 'preparacion';
    if (e === 'listo') return 'listo';
    if (e === 'entregado') return 'entregado';
    return '';
}

/**
 * Convierte un número a letras (Básico para facturas en soles)
 */
export function numeroALetras(num) {
    const unidades = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const decenas2 = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    function convertirEntero(n) {
        if (n < 10) return unidades[n];
        if (n < 20) return decenas[n - 10];
        if (n < 100) return decenas2[Math.floor(n / 10)] + (n % 10 !== 0 ? ' y ' + unidades[n % 10] : '');
        if (n === 100) return 'cien';
        if (n < 1000) return centenas[Math.floor(n / 100)] + (n % 100 !== 0 ? ' ' + convertirEntero(n % 100) : '');
        if (n === 1000) return 'mil';
        if (n < 2000) return 'mil ' + (n % 1000 !== 0 ? convertirEntero(n % 1000) : '');
        if (n < 1000000) return convertirEntero(Math.floor(n / 1000)) + ' mil ' + (n % 1000 !== 0 ? convertirEntero(n % 1000) : '');
        return 'Monto fuera de rango';
    }

    const entero = Math.floor(num);
    const centimos = Math.round((num - entero) * 100);
    const letrasEntero = convertirEntero(entero).toUpperCase();
    const txtCentimos = String(centimos).padStart(2, '0') + '/100 SOLES';
    
    return `${letrasEntero} Y ${txtCentimos}`;
}

/**
 * Normaliza el tipo de producto independientemente de mayúsculas o tildes
 * Retorna 'Con preparación' o 'Servicio inmediato'
 */
export function normalizarTipo(tipo) {
    if (!tipo) return 'Con preparación';
    const t = String(tipo).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes('inmediato') || t.includes('servicio')) {
        return 'Servicio inmediato';
    }
    return 'Con preparación';
}
