import { requireAuth } from '../shared/auth.js';
import { formatCurrency, generateOrderCode, showAlert } from '../shared/utils.js';
import { getConfiguracion, incrementCorrelativo, registrarPedido } from '../shared/db.js';
import { consultarPersona } from '../shared/persona-api.js';

requireAuth('cajera');

// Prevenir que el navegador restaure el estado bloqueado usando el botón "Atrás" (bfcache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    // Recuperar borrador de sessionStorage
    const pedidoBorradorStr = sessionStorage.getItem('pedidoBorrador');
    if (!pedidoBorradorStr) {
        window.location.href = 'registrar-pedido.html';
        return;
    }
    const pedido = JSON.parse(pedidoBorradorStr);

    const totalSpan = document.getElementById('resumen-total');
    const productosDiv = document.getElementById('resumen-productos');
    const modalidadSpan = document.getElementById('resumen-modalidad');
    
    // UI Comprobante
    const radiosTipo = document.getElementsByName('tipo-comprobante');
    const panelBoleta = document.getElementById('panel-boleta');
    const panelFactura = document.getElementById('panel-factura');
    
    // Boleta
    const tipoBoletaSelect = document.getElementById('tipo-boleta');
    const panelDni = document.getElementById('panel-dni');
    const panelNombreDni = document.getElementById('panel-nombre-dni');
    const dniInput = document.getElementById('dni-cliente');
    const btnBuscarDni = document.getElementById('btn-buscar-dni');
    const nombreInput = document.getElementById('nombre-cliente');

    // Factura
    const rucInput = document.getElementById('ruc-cliente');
    const btnBuscarRuc = document.getElementById('btn-buscar-ruc');
    const razonSocialInput = document.getElementById('razon-social');
    const domicilioFiscalInput = document.getElementById('domicilio-fiscal');

    const btnEmitir = document.getElementById('btn-emitir');

    // Inicializar UI Resumen
    totalSpan.textContent = formatCurrency(pedido.total);
    modalidadSpan.textContent = pedido.modalidadPago;
    productosDiv.innerHTML = pedido.productos.map(p => `${p.cantidad}x ${p.nombre}`).join('<br>');

    // Regla de negocio: Boleta simple hasta S/ 700
    if (pedido.total > 700) {
        tipoBoletaSelect.querySelector('option[value="simple"]').disabled = true;
        tipoBoletaSelect.value = 'con-dni';
    }

    // Manejar Tipo de Comprobante
    Array.from(radiosTipo).forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'Boleta') {
                panelBoleta.style.display = 'block';
                panelFactura.style.display = 'none';
            } else {
                panelBoleta.style.display = 'none';
                panelFactura.style.display = 'block';
            }
            validarFormulario();
        });
    });

    // Manejar Tipo de Boleta
    tipoBoletaSelect.addEventListener('change', (e) => {
        if (e.target.value === 'con-dni') {
            panelDni.style.display = 'block';
            panelNombreDni.style.display = 'block';
        } else {
            panelDni.style.display = 'none';
            panelNombreDni.style.display = 'none';
        }
        validarFormulario();
    });

    // Búsqueda de DNI
    btnBuscarDni.addEventListener('click', async () => {
        const dni = dniInput.value.trim();
        if (dni.length !== 8) {
            showAlert("Ingrese un DNI válido de 8 dígitos.");
            return;
        }

        btnBuscarDni.disabled = true;
        btnBuscarDni.textContent = 'Buscando...';
        nombreInput.value = '';

        try {
            const persona = await consultarPersona('dni', dni);
            nombreInput.value = persona.nombre;
            validarFormulario();
        } catch (error) {
            console.error("Network Error:", error);
            showAlert(error.message || "Error de conexión al consultar DNI.");
        } finally {
            btnBuscarDni.disabled = false;
            btnBuscarDni.textContent = 'Buscar';
        }
    });

    // Búsqueda de RUC
    btnBuscarRuc.addEventListener('click', async () => {
        const ruc = rucInput.value.trim();
        if (ruc.length !== 11) {
            showAlert("Ingrese un RUC válido de 11 dígitos.");
            return;
        }

        btnBuscarRuc.disabled = true;
        btnBuscarRuc.textContent = 'Buscando...';
        razonSocialInput.value = '';
        domicilioFiscalInput.value = '';

        try {
            const empresa = await consultarPersona('ruc', ruc);
            razonSocialInput.value = empresa.razonSocial;
            domicilioFiscalInput.value = empresa.direccion;
            validarFormulario();
        } catch (error) {
            console.error("Network Error:", error);
            showAlert(error.message || "Error de conexión al consultar RUC.");
        } finally {
            btnBuscarRuc.disabled = false;
            btnBuscarRuc.textContent = 'Buscar';
        }
    });

    function validarFormulario() {
        const tipoComprobante = document.querySelector('input[name="tipo-comprobante"]:checked').value;
        let valido = false;

        if (tipoComprobante === 'Boleta') {
            if (tipoBoletaSelect.value === 'simple') {
                valido = true;
            } else {
                valido = (dniInput.value.length === 8 && nombreInput.value.length > 0);
            }
        } else {
            valido = (rucInput.value.length === 11 && razonSocialInput.value.length > 0);
        }

        btnEmitir.disabled = !valido;
    }

    // Listeners para validación en tiempo real y limpieza de caracteres inválidos
    dniInput.addEventListener('input', (e) => {
        // Solo permitir números y máximo 8 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
        nombreInput.value = ''; 
        validarFormulario(); 
    });

    rucInput.addEventListener('input', (e) => {
        // Solo permitir números y máximo 11 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        razonSocialInput.value = ''; 
        domicilioFiscalInput.value = ''; 
        validarFormulario(); 
    });
    
    tipoBoletaSelect.addEventListener('change', validarFormulario);

    // Evento Emitir
    btnEmitir.addEventListener('click', async () => {
        btnEmitir.disabled = true;
        btnEmitir.textContent = 'Emitiendo...';

        try {
            const config = await getConfiguracion();
            const tipoComprobante = document.querySelector('input[name="tipo-comprobante"]:checked').value;
            
            // Generar nuevo correlativo
            const nuevoCorrelativo = await incrementCorrelativo(tipoComprobante);
            const serie = tipoComprobante === 'Factura' ? config.serieFactura : config.serieBoleta;
            const comprobanteFormat = `${serie}-${String(nuevoCorrelativo).padStart(6, '0')}`;

            // Preparar datos del cliente
            let datosCliente = null;
            if (tipoComprobante === 'Boleta') {
                if (tipoBoletaSelect.value === 'con-dni') {
                    datosCliente = { documento: dniInput.value, nombre: nombreInput.value };
                }
            } else {
                datosCliente = { ruc: rucInput.value, razonSocial: razonSocialInput.value, direccion: domicilioFiscalInput.value };
            }

            // Generar identificador corto del pedido (para pantalla de cocina y cliente)
            const codigoPedido = generateOrderCode();

            // Combinar con el borrador
            const pedidoFinal = {
                ...pedido,
                codigo: codigoPedido,
                comprobante: comprobanteFormat,
                tipoComprobante,
                datosCliente,
                datosEmisor: {
                    ruc: config.ruc,
                    razonSocial: config.razonSocial,
                    domicilioFiscal: config.domicilioFiscal
                },
                estadoGeneral: 'Pendiente', // Ahora es visible para cocina (se suscriben a Pendiente/En preparación/Listo)
            };

            const docId = await registrarPedido(pedidoFinal);
            
            // Limpiar sesión
            sessionStorage.removeItem('pedidoBorrador');
            // Redirigir al ticket abriéndolo directamente (que a su vez tiene botón para volver a Nuevo Pedido)
            window.location.href = `comprobante.html?id=${docId}`;

        } catch (error) {
            console.error("Error al emitir:", error);
            showAlert("Ocurrió un error al emitir el comprobante.");
            btnEmitir.disabled = false;
            btnEmitir.textContent = 'Emitir y Finalizar';
        }
    });

    // Evento Cancelar Pedido
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (confirm("¿Estás seguro de cancelar este pedido? Se perderá todo lo registrado y tendrás que empezar de nuevo.")) {
                sessionStorage.removeItem('pedidoBorrador');
                window.location.href = 'registrar-pedido.html';
            }
        });
    }

    validarFormulario(); // Inicial
});
