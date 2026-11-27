import { db, firebaseConfig } from './firebase-config.js';
import { normalizarTipo } from './utils.js';
import { 
    collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser, signOut 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Referencias a colecciones
const productosCol = collection(db, 'productos');
const pedidosCol = collection(db, 'pedidos');
const devolucionesCol = collection(db, 'devoluciones');
const usuariosCol = collection(db, 'usuarios');
const configDoc = doc(db, 'configuracion', 'negocio');

// ---------------------- PRODUCTOS ----------------------

export async function getProductos() {
    const snapshot = await getDocs(productosCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function onProductosChange(callback) {
    return onSnapshot(productosCol, (snapshot) => {
        const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(productos);
    });
}

export async function updateProductoDisponibilidad(id, disponible) {
    const pDoc = doc(db, 'productos', id);
    await updateDoc(pDoc, { disponible });
}

/**
 * HU-11: Crear producto en el catálogo (CA01, CA02, CA03)
 */
export async function crearProducto({ nombre, precio, tipo }) {
    const nombreLimpio = (nombre || '').trim();
    const precioNum = parseFloat(precio);
    const tipoNorm = normalizarTipo(tipo);

    if (!nombreLimpio) throw new Error("El nombre del producto es obligatorio.");
    if (isNaN(precioNum) || precioNum <= 0) throw new Error("El precio debe ser un valor positivo.");

    // CA02: Nombre único ignorando mayúsculas/minúsculas y espacios de más
    const productosExistentes = await getProductos();
    const existe = productosExistentes.some(p => p.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase());
    if (existe) {
        throw new Error(`Ya existe un producto con el nombre "${nombreLimpio}".`);
    }

    const nuevoProducto = {
        nombre: nombreLimpio,
        precio: Number(precioNum.toFixed(2)),
        tipo: tipoNorm,
        disponible: true, // CA03: Disponible por defecto
        fechaCreacion: serverTimestamp()
    };

    const docRef = await addDoc(productosCol, nuevoProducto);
    return { id: docRef.id, ...nuevoProducto };
}

/**
 * HU-11: Modificar nombre y precio de un producto existente (CA02, CA04, CA05)
 */
export async function actualizarProducto(id, { nombre, precio }) {
    const nombreLimpio = (nombre || '').trim();
    const precioNum = parseFloat(precio);

    if (!id) throw new Error("ID de producto no especificado.");
    if (!nombreLimpio) throw new Error("El nombre del producto es obligatorio.");
    if (isNaN(precioNum) || precioNum <= 0) throw new Error("El precio debe ser un valor positivo.");

    // CA02 / CA04: Nombre único excluyendo el mismo producto
    const productosExistentes = await getProductos();
    const existeOtro = productosExistentes.some(p => p.id !== id && p.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase());
    if (existeOtro) {
        throw new Error(`Ya existe otro producto con el nombre "${nombreLimpio}".`);
    }

    const pDoc = doc(db, 'productos', id);
    // CA05: El tipo de producto no se modifica
    await updateDoc(pDoc, {
        nombre: nombreLimpio,
        precio: Number(precioNum.toFixed(2))
    });
}

/**
 * HU-11: Eliminar un producto del catálogo (CA07, CA08)
 * Deja de mostrarse a cajera y cocina, sin alterar pedidos históricos.
 */
export async function eliminarProducto(id) {
    if (!id) throw new Error("ID de producto no especificado.");
    const pDoc = doc(db, 'productos', id);
    await deleteDoc(pDoc);
}

// ---------------------- CONFIGURACION ----------------------

export async function getConfiguracion() {
    const snap = await getDoc(configDoc);
    if (snap.exists()) return snap.data();
    throw new Error("No se encontró la configuración del negocio.");
}

export async function incrementCorrelativo(tipo) {
    const config = await getConfiguracion();
    const campo = tipo === 'Factura' ? 'correlativoFactura' : 'correlativoBoleta';
    const nuevoValor = (config[campo] || 0) + 1;
    await updateDoc(configDoc, { [campo]: nuevoValor });
    return nuevoValor;
}

/**
 * Incrementa el correlativo para Nota de Crédito Electrónica SUNAT
 * Factura -> FC01-XXXXXXXX
 * Boleta -> BC01-XXXXXXXX
 */
export async function incrementCorrelativoNotaCredito(tipoComprobanteModificado) {
    const config = await getConfiguracion();
    const esFactura = tipoComprobanteModificado === 'Factura';
    const campo = esFactura ? 'correlativoNotaCreditoFactura' : 'correlativoNotaCreditoBoleta';
    const nuevoValor = (config[campo] || 0) + 1;
    await updateDoc(configDoc, { [campo]: nuevoValor });
    const serie = esFactura ? 'FC01' : 'BC01';
    const numeroFormateado = `${serie}-${String(nuevoValor).padStart(8, '0')}`;
    return { numero: nuevoValor, serie, numeroFormateado };
}

// ---------------------- PEDIDOS ----------------------

export async function registrarPedido(pedidoData) {
    pedidoData.fechaRegistro = serverTimestamp();
    const docRef = await addDoc(pedidosCol, pedidoData);
    return docRef.id;
}

/**
 * Suscripción a pedidos del día (Cajera)
 */
export function onPedidosDelDia(callback) {
    const q = query(pedidosCol, orderBy('fechaRegistro', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const hoy = new Date().toDateString();
        const filtrados = pedidos.filter(p => {
            if (!p.fechaRegistro) return true;
            return p.fechaRegistro.toDate().toDateString() === hoy;
        });
        callback(filtrados);
    });
}

/**
 * Suscripción a pedidos para Cocina (Pendiente, En preparación, Listo)
 * HU-08 CA03 y CA04:
 * 1. En preparación (mantienen su posición)
 * 2. Pendientes con Reposición (al inicio de la cola)
 * 3. Pendientes regulares (por antigüedad)
 * 4. Listos (hasta que cajera confirme entrega)
 */
export function onPedidosCocina(callback) {
    const q = query(pedidosCol, where('estadoGeneral', 'in', ['Pendiente', 'En preparación', 'Listo']));
    return onSnapshot(q, (snapshot) => {
        let pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        function getOrderGroup(p) {
            if (p.estadoGeneral === 'En preparación') return 1;
            if (p.estadoGeneral === 'Pendiente' && p.esReposicion) return 2;
            if (p.estadoGeneral === 'Pendiente') return 3;
            if (p.estadoGeneral === 'Listo') return 4;
            return 5;
        }

        pedidos.sort((a, b) => {
            const gA = getOrderGroup(a);
            const gB = getOrderGroup(b);
            if (gA !== gB) return gA - gB;
            
            const timeA = a.fechaRegistro ? a.fechaRegistro.toMillis() : Date.now();
            const timeB = b.fechaRegistro ? b.fechaRegistro.toMillis() : Date.now();
            return timeA - timeB;
        });
        callback(pedidos);
    });
}

/**
 * Actualiza los productos dentro de un pedido, y opcionalmente su estado general
 */
export async function updatePedidoProductos(pedidoId, nuevosProductos, nuevoEstadoGeneral) {
    const pDoc = doc(db, 'pedidos', pedidoId);
    await updateDoc(pDoc, { 
        productos: nuevosProductos,
        estadoGeneral: nuevoEstadoGeneral 
    });
}

/**
 * Confirma entrega (Cajera)
 */
export async function confirmarEntregaPedido(pedidoId) {
    const pDoc = doc(db, 'pedidos', pedidoId);
    await updateDoc(pDoc, { estadoGeneral: 'Entregado' });
}

/**
 * Obtiene un pedido específico por ID
 */
export async function getPedidoById(pedidoId) {
    const pDoc = doc(db, 'pedidos', pedidoId);
    const snap = await getDoc(pDoc);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    throw new Error("Pedido no encontrado.");
}

// ---------------------- GESTIÓN DE INCIDENCIAS (SPRINT 2) ----------------------

/**
 * HU-04: Registrar reposición de productos sobre un pedido Entregado
 */
export async function registrarReposicion({ pedidoOriginal, productosReemplazo, productosOriginalesAfectados, motivo, observacion, diferenciaTotal, modalidadPago, datosHibrido }) {
    // 1. Crear nuevo pedido en 'pedidos' marcado como Reposición
    const codigoOriginalLimpio = (pedidoOriginal.codigo || pedidoOriginal.id.slice(0, 5)).replace(/^#+/, '');
    const codigoReposicion = `Reposición del pedido #${codigoOriginalLimpio}`;
    
    // Obtener datos del emisor para asegurar que el comprobante se imprima correctamente
    let datosEmisor = pedidoOriginal.datosEmisor;
    if (!datosEmisor) {
        try {
            datosEmisor = await getConfiguracion();
        } catch (e) {
            datosEmisor = {
                nombreComercial: "Burger Local",
                razonSocial: "Hamburguesas Local S.A.C.",
                ruc: "20123456789",
                domicilioFiscal: "Local Principal"
            };
        }
    }

    const nuevoPedido = {
        esReposicion: true,
        pedidoOrigenId: pedidoOriginal.id,
        pedidoOrigenCodigo: codigoOriginalLimpio,
        codigo: codigoReposicion,
        comprobante: `REP-${codigoOriginalLimpio}`,
        tipoComprobante: 'Reposición',
        datosEmisor: datosEmisor,
        datosCliente: pedidoOriginal.datosCliente || null,
        productos: productosReemplazo.map(p => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            tipo: p.tipo,
            cantidad: p.cantidad,
            estado: 'Pendiente'
        })),
        total: diferenciaTotal,
        modalidadPago: diferenciaTotal > 0 ? modalidadPago : 'Sin costo (S/ 0.00)',
        pagoHibridoEfectivo: datosHibrido?.pagoHibridoEfectivo || 0,
        pagoHibridoYape: datosHibrido?.pagoHibridoYape || 0,
        pagoHibridoPlin: datosHibrido?.pagoHibridoPlin || 0,
        pagoHibridoTransferencia: datosHibrido?.pagoHibridoTransferencia || 0,
        estadoGeneral: 'Pendiente',
        motivoReposicion: motivo,
        observacionReposicion: observacion || '',
        fechaRegistro: serverTimestamp()
    };

    const repoDocRef = await addDoc(pedidosCol, nuevoPedido);

    // 2. Actualizar el pedido original: marcar como 'Con reposición' e incrementar unidadesRepuestas
    const pOriginalDoc = doc(db, 'pedidos', pedidoOriginal.id);
    const productosActualizados = pedidoOriginal.productos.map(prod => {
        const afectado = productosOriginalesAfectados.find(a => a.id === prod.id);
        if (afectado) {
            return {
                ...prod,
                unidadesRepuestas: (prod.unidadesRepuestas || 0) + afectado.cantidad
            };
        }
        return prod;
    });

    const reposicionesList = pedidoOriginal.reposicionesIds || [];
    reposicionesList.push(repoDocRef.id);

    await updateDoc(pOriginalDoc, {
        tieneReposicion: true,
        productos: productosActualizados,
        reposicionesIds: reposicionesList
    });

    return repoDocRef.id;
}

/**
 * HU-05: Solicitar devolución de dinero sobre un pedido Entregado
 */
export async function solicitarDevolucion({ pedidoOriginal, productosAfectados, motivo, observacion, montoTotal, modalidad, datosModalidad, datosContacto }) {
    // 1. Crear la solicitud en la colección 'devoluciones'
    const nuevaSolicitud = {
        pedidoId: pedidoOriginal.id,
        pedidoCodigo: pedidoOriginal.codigo || 'S/N',
        esDevolucionDeReposicion: pedidoOriginal.esReposicion === true,
        pedidoOrigenId: pedidoOriginal.pedidoOrigenId || null,
        pedidoOrigenCodigo: pedidoOriginal.pedidoOrigenCodigo || null,
        productos: productosAfectados,
        monto: montoTotal,
        modalidad, // 'Yape' | 'Plin' | 'Transferencia'
        datosModalidad, // { telefono, titular, cuentaBancaria, cci, tipoCuenta }
        datosContacto, // { nombre, telefono }
        motivo,
        observacion: observacion || '',
        estado: 'Solicitada',
        fechaSolicitud: serverTimestamp()
    };

    const devDocRef = await addDoc(devolucionesCol, nuevaSolicitud);

    // 2. Actualizar el pedido activo: marcar como 'Devolución solicitada' e incrementar unidadesDevueltas
    const pOriginalDoc = doc(db, 'pedidos', pedidoOriginal.id);
    const productosActualizados = (pedidoOriginal.productos || []).map(prod => {
        const afectado = productosAfectados.find(a => a.id === prod.id);
        if (afectado) {
            return {
                ...prod,
                unidadesDevueltas: (prod.unidadesDevueltas || 0) + afectado.cantidad
            };
        }
        return prod;
    });

    const devolucionesList = pedidoOriginal.devolucionesIds || [];
    devolucionesList.push(devDocRef.id);

    await updateDoc(pOriginalDoc, {
        tieneDevolucion: true,
        estadoDevolucion: 'Solicitada',
        productos: productosActualizados,
        devolucionesIds: devolucionesList
    });

    // 3. Si era una devolución sobre una reposición, cerrar el caso también en el pedido original raíz
    if (pedidoOriginal.esReposicion && pedidoOriginal.pedidoOrigenId) {
        try {
            const pOrigenDoc = doc(db, 'pedidos', pedidoOriginal.pedidoOrigenId);
            await updateDoc(pOrigenDoc, {
                tieneDevolucion: true,
                estadoDevolucion: 'Solicitada'
            });
        } catch (e) {
            console.warn("No se pudo actualizar pedido origen:", e);
        }
    }

    return devDocRef.id;
}

/**
 * Consultar solicitudes de devoluciones en tiempo real (para HU-06 y HU-12)
 */
export function onDevoluciones(callback) {
    const q = query(devolucionesCol, orderBy('fechaSolicitud', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(docs);
    });
}

/**
 * Obtener una solicitud de devolución por ID
 */
export async function getDevolucionById(devolucionId) {
    const devDoc = doc(db, 'devoluciones', devolucionId);
    const snap = await getDoc(devDoc);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
    throw new Error("Devolución no encontrada.");
}

/**
 * HU-06: Procesar devolución (Administrador)
 * Actualiza el estado a 'Procesada', registra fecha/hora, almacena el comprobante en base64
 * y genera la Nota de Crédito Electrónica SUNAT correspondiente.
 */
export async function procesarDevolucion(devolucionId, { comprobanteArchivo, comprobanteNombre, comprobanteTipo, modalidadReal, destinoReal, datosDestinoReal } = {}) {
    const devDoc = doc(db, 'devoluciones', devolucionId);
    const snap = await getDoc(devDoc);
    if (!snap.exists()) throw new Error("Solicitud de devolución no encontrada.");
    const devolucion = snap.data();

    if (devolucion.estado === 'Procesada') {
        throw new Error("Esta devolución ya fue procesada anteriormente.");
    }

    // Modalidad efectiva real con la que se hizo el reembolso
    const modalidadEfectiva = modalidadReal || devolucion.modalidad || 'Transferencia';

    // Obtener el comprobante fiscal que se modificará con la Nota de Crédito.
    // Si el reclamo proviene de una reposición, el documento válido es la venta
    // raíz: una reposición sin costo no constituye una segunda venta.
    let pedidoOriginal = null;
    let tipoComprobanteModificado = 'Boleta';
    let comprobanteModificadoNumero = devolucion.pedidoCodigo || 'S/N';
    let fechaComprobanteModificado = null;
    let datosCliente = null;
    let datosEmisor = null;

    const pedidoFiscalId = devolucion.pedidoOrigenId || devolucion.pedidoId;
    if (pedidoFiscalId) {
        try {
            pedidoOriginal = await getPedidoById(pedidoFiscalId);
            tipoComprobanteModificado = pedidoOriginal.tipoComprobante === 'Factura' ? 'Factura' : 'Boleta';
            comprobanteModificadoNumero = pedidoOriginal.comprobante || pedidoOriginal.codigo || 'S/N';
            fechaComprobanteModificado = pedidoOriginal.fechaRegistro || null;
            datosCliente = pedidoOriginal.datosCliente || null;
            datosEmisor = pedidoOriginal.datosEmisor || null;
        } catch (e) {
            console.warn("No se pudo obtener el pedido asociado para la Nota de Crédito:", e);
        }
    }

    // Si el pedido original no tenía datosEmisor, obtenerlo de la configuración
    if (!datosEmisor) {
        try {
            datosEmisor = await getConfiguracion();
        } catch (e) {
            datosEmisor = {
                nombreComercial: "Burger Local",
                razonSocial: "Hamburguesas Local S.A.C.",
                ruc: "20123456789",
                domicilioFiscal: "Local Principal"
            };
        }
    }

    // Generar correlativo de Nota de Crédito Electrónica SUNAT
    let numeroNotaCredito = devolucion.numeroNotaCredito;
    let serieNotaCredito = devolucion.serieNotaCredito;
    let correlativoNotaCredito = devolucion.correlativoNotaCredito;

    if (!numeroNotaCredito) {
        const ncInfo = await incrementCorrelativoNotaCredito(tipoComprobanteModificado);
        numeroNotaCredito = ncInfo.numeroFormateado;
        serieNotaCredito = ncInfo.serie;
        correlativoNotaCredito = ncInfo.numero;
    }

    // Determinar si es devolución total o parcial según Catálogo N.° 09 de SUNAT
    const montoPedido = parseFloat(pedidoOriginal?.total) || 0;
    const montoDevuelto = parseFloat(devolucion.monto) || 0;
    const esDevolucionTotal = montoPedido > 0 && Math.abs(montoDevuelto - montoPedido) < 0.05;
    const codigoTipoNotaCredito = esDevolucionTotal ? '06' : '07';
    const descripcionTipoNotaCredito = esDevolucionTotal ? '06 - DEVOLUCIÓN TOTAL' : '07 - DEVOLUCIÓN POR ÍTEM';

    // 1. Actualizar la solicitud en la colección 'devoluciones'
    await updateDoc(devDoc, {
        estado: 'Procesada',
        fechaProcesado: serverTimestamp(),
        comprobanteArchivo: comprobanteArchivo || null,
        comprobanteNombre: comprobanteNombre || 'comprobante.jpg',
        comprobanteTipo: comprobanteTipo || 'image/jpeg',
        modalidadReal: modalidadEfectiva,
        modalidadEfectiva: modalidadEfectiva,
        destinoReal: destinoReal || (datosDestinoReal ? (datosDestinoReal.telefono || datosDestinoReal.cuentaBancaria) : null),
        datosModalidadReal: datosDestinoReal || null,
        datosModalidadOriginal: devolucion.datosModalidad || null,
        datosModalidad: datosDestinoReal ? { ...(devolucion.datosModalidad || {}), ...datosDestinoReal } : (devolucion.datosModalidad || {}),
        datosModificadosPorAdmin: !!datosDestinoReal,
        // Datos de la Nota de Crédito Electrónica según Catálogo 09 SUNAT
        numeroNotaCredito,
        serieNotaCredito,
        correlativoNotaCredito,
        tipoNotaCredito: codigoTipoNotaCredito,
        codigoTipoNotaCredito,
        descripcionTipoNotaCredito,
        esDevolucionTotal,
        tipoComprobanteModificado,
        comprobanteModificadoNumero,
        fechaComprobanteModificado,
        datosCliente: datosCliente || (pedidoOriginal?.datosCliente) || null,
        datosEmisor,
        motivoNotaCredito: devolucion.motivo || 'Devolución de productos por reclamo',
        itemsDevueltos: devolucion.productos || []
    });

    // 2. Actualizar el pedido directo asociado en 'pedidos'
    if (devolucion.pedidoId) {
        try {
            const pDoc = doc(db, 'pedidos', devolucion.pedidoId);
            await updateDoc(pDoc, {
                estadoDevolucion: 'Procesada',
                notaCreditoNumero: numeroNotaCredito
            });
        } catch (e) {
            console.warn("No se pudo actualizar estadoDevolucion en pedido:", e);
        }
    }

    // 3. Si era una devolución sobre reposición, actualizar también el pedido origen raíz
    if (devolucion.pedidoOrigenId) {
        try {
            const pOrigenDoc = doc(db, 'pedidos', devolucion.pedidoOrigenId);
            await updateDoc(pOrigenDoc, {
                estadoDevolucion: 'Procesada',
                notaCreditoNumero: numeroNotaCredito
            });
        } catch (e) {
            console.warn("No se pudo actualizar estadoDevolucion en pedido origen:", e);
        }
    }

    return { devolucionId, numeroNotaCredito };
}

/**
 * HU-12: Obtener pedidos en un rango de fechas (Admin)
 * Permite consultar días anteriores y el día actual.
 */
export async function getPedidosRango(fechaInicio, fechaFin) {
    const q = query(pedidosCol, orderBy('fechaRegistro', 'desc'));
    const snapshot = await getDocs(q);
    
    // Normalizar fechas a medianoche local
    const fIni = new Date(fechaInicio + 'T00:00:00');
    const fFin = new Date(fechaFin + 'T23:59:59.999');
    const inicioMs = fIni.getTime();
    const finMs = fFin.getTime();

    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => {
            if (!p.fechaRegistro) return true;
            const t = p.fechaRegistro.toDate ? p.fechaRegistro.toDate().getTime() : new Date(p.fechaRegistro).getTime();
            return t >= inicioMs && t <= finMs;
        });
}

/**
 * HU-12: Obtener devoluciones en un rango de fechas (Admin)
 */
export async function getDevolucionesRango(fechaInicio, fechaFin) {
    const q = query(devolucionesCol, orderBy('fechaSolicitud', 'desc'));
    const snapshot = await getDocs(q);

    const fIni = new Date(fechaInicio + 'T00:00:00');
    const fFin = new Date(fechaFin + 'T23:59:59.999');
    const inicioMs = fIni.getTime();
    const finMs = fFin.getTime();

    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => {
            // Verificar si fue solicitada dentro del rango
            const tSol = d.fechaSolicitud ? (d.fechaSolicitud.toDate ? d.fechaSolicitud.toDate().getTime() : new Date(d.fechaSolicitud).getTime()) : 0;
            const enRangoSolicitud = tSol >= inicioMs && tSol <= finMs;

            // O verificar si fue efectivamente procesada/pagada dentro del rango
            const tProc = d.fechaProcesado ? (d.fechaProcesado.toDate ? d.fechaProcesado.toDate().getTime() : new Date(d.fechaProcesado).getTime()) : 0;
            const enRangoProcesado = tProc >= inicioMs && tProc <= finMs;

            return enRangoSolicitud || enRangoProcesado;
        });
}

// ---------------------- GESTIÓN DE USUARIOS (HU-10) ----------------------

/**
 * HU-10: Obtiene las cuentas operativas activas (Cajera y Cocina)
 */
export async function getUsuariosOperativos() {
    const snapshot = await getDocs(usuariosCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * HU-10: Suscripción en tiempo real a las cuentas operativas
 */
export function onUsuariosOperativos(callback) {
    return onSnapshot(usuariosCol, (snapshot) => {
        const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(usuarios);
    });
}

/**
 * HU-10 CA04: Valida disponibilidad de un nombre de usuario en tiempo real
 */
export async function validarDisponibilidadUsuario(usuario) {
    const usuarioLimpio = (usuario || '').trim().toLowerCase();
    if (!usuarioLimpio) return true;
    const q = query(usuariosCol, where('usuarioLower', '==', usuarioLimpio));
    const snap = await getDocs(q);
    return snap.empty;
}

/**
 * HU-10 CA01, CA02, CA03, CA04, CA05: Crear cuenta operativa para Cajera o Cocina
 */
export async function crearCuentaOperativa({ rol, usuario, password }) {
    const rolNorm = (rol || '').toLowerCase().trim();
    const usuarioLimpio = (usuario || '').trim();
    const passwordLimpia = (password || '').trim();

    // CA01: Roles gestionables (solo Cajera y Cocina)
    if (rolNorm !== 'cajera' && rolNorm !== 'cocina') {
        throw new Error("El rol seleccionado no es válido. Solo se permite Cajera o Cocina.");
    }

    // CA01, CA02: Máximo una cuenta por rol
    const docRolRef = doc(db, 'usuarios', rolNorm);
    const snapRol = await getDoc(docRolRef);
    if (snapRol.exists()) {
        throw new Error(`Ya existe una cuenta activa para el rol ${rolNorm === 'cajera' ? 'Cajera' : 'Cocina'}. Solo se permite una cuenta como máximo.`);
    }

    // CA03: Formato del usuario (solo letras y números, 4 a 20 caracteres)
    const regexUsuario = /^[a-zA-Z0-9]{4,20}$/;
    if (!regexUsuario.test(usuarioLimpio)) {
        throw new Error("El nombre de usuario debe contener entre 4 y 20 caracteres alfanuméricos (solo letras y números, sin espacios ni caracteres especiales).");
    }

    // CA03: Contraseña mínimo 6 caracteres
    if (passwordLimpia.length < 6) {
        throw new Error("La contraseña debe tener un mínimo de 6 caracteres.");
    }

    // CA04: Usuario único entre las cuentas activas
    const disponible = await validarDisponibilidadUsuario(usuarioLimpio);
    if (!disponible) {
        throw new Error(`El nombre de usuario "${usuarioLimpio}" ya está siendo utilizado por otra cuenta activa.`);
    }

    // CA05: Autenticación por dominio fijo interno
    const emailInterno = `${usuarioLimpio.toLowerCase()}@burger.local`;

    // Registrar en Firebase Authentication usando instancia secundaria (para no cerrar la sesión del admin)
    try {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthCreation_" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);

        try {
            await createUserWithEmailAndPassword(secondaryAuth, emailInterno, passwordLimpia);
            await signOut(secondaryAuth);
        } catch (authErr) {
            if (authErr.code === 'auth/email-already-in-use') {
                // Si la credencial ya existía en Auth (por ejemplo de un seed previo),
                // actualizamos su contraseña iniciando sesión con la password o con el seed
                try {
                    const cred = await signInWithEmailAndPassword(secondaryAuth, emailInterno, passwordLimpia);
                    await signOut(secondaryAuth);
                } catch (loginErr) {
                    try {
                        const credSeed = await signInWithEmailAndPassword(secondaryAuth, emailInterno, '123456');
                        await updatePassword(credSeed.user, passwordLimpia);
                        await signOut(secondaryAuth);
                    } catch (seedErr) {
                        console.warn("Usuario ya existía en Auth:", authErr.message);
                    }
                }
            } else {
                throw authErr;
            }
        }
    } catch (e) {
        console.error("Nota sobre aprovisionamiento en Firebase Auth:", e);
    }

    // Guardar en Firestore en la colección 'usuarios' con ID = rol (máximo 1 cuenta por rol)
    const nuevoUsuario = {
        rol: rolNorm,
        usuario: usuarioLimpio,
        usuarioLower: usuarioLimpio.toLowerCase(),
        email: emailInterno,
        password: passwordLimpia,
        fechaCreacion: serverTimestamp(),
        activo: true
    };

    await setDoc(docRolRef, nuevoUsuario);
    return nuevoUsuario;
}

/**
 * HU-10 CA06: Elimina la cuenta operativa de Cajera o Cocina
 * • Elimina la credencial de acceso en Firebase Authentication permanentemente.
 * • Elimina el registro activo en Firestore.
 * • El rol queda inmediatamente disponible para crear una cuenta nueva (CA06).
 * • Los pedidos e incidencias previas conservan intacto su historial de operaciones (CA08).
 */
export async function eliminarCuentaOperativa(rol) {
    const rolNorm = (rol || '').toLowerCase().trim();
    if (rolNorm !== 'cajera' && rolNorm !== 'cocina') {
        throw new Error("El rol especificado para eliminar no es válido.");
    }

    const docRolRef = doc(db, 'usuarios', rolNorm);
    const snap = await getDoc(docRolRef);
    const datosUsuario = snap.exists() ? snap.data() : null;

    // 1. Eliminar permanentemente la cuenta de Firebase Authentication
    if (datosUsuario && datosUsuario.email) {
        try {
            const secondaryApp = initializeApp(firebaseConfig, "SecondaryAuthDeletion_" + Date.now());
            const secondaryAuth = getAuth(secondaryApp);
            
            const pwd = datosUsuario.password || '123456';
            try {
                const cred = await signInWithEmailAndPassword(secondaryAuth, datosUsuario.email, pwd);
                await deleteUser(cred.user);
            } catch (loginErr) {
                // Si la contraseña no coincidía, intentamos con '123456'
                if (pwd !== '123456') {
                    try {
                        const credSeed = await signInWithEmailAndPassword(secondaryAuth, datosUsuario.email, '123456');
                        await deleteUser(credSeed.user);
                    } catch (seedErr) {
                        console.warn("No se pudo iniciar sesión para eliminar en Auth:", seedErr.message);
                    }
                }
            } finally {
                await signOut(secondaryAuth).catch(() => {});
            }
        } catch (authErr) {
            console.error("Nota sobre eliminación en Firebase Auth:", authErr);
        }
    }

    // 2. Eliminar el documento activo en Firestore
    await deleteDoc(docRolRef);
    return true;
}




