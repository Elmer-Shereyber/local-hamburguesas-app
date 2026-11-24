# ÉPICA: Gestionar Incidencias

Permitir registrar y resolver los reclamos sobre pedidos ya entregados, ya sea mediante la reposición de productos o la solicitud y procesamiento de una devolución de dinero.

## Alcance y supuestos

- Reposición y devolución solo proceden sobre pedidos en estado *Entregado*.
- Ningún pedido ni producto se anula; reposición y devolución son las únicas vías posteriores a la venta.
- Una unidad de producto recibe una sola solución: si tiene reposición registrada no puede tener devolución sobre la misma unidad, y viceversa.
- La disponibilidad de un producto la controla cocina mediante un interruptor manual (disponible / no disponible); no hay control de inventario por insumos.
- La validación del reclamo (que el producto realmente esté mal) ocurre en persona entre cliente, cajera y cocina; el sistema no registra ninguna aprobación.
- Al procesar una devolución válida, el sistema genera automáticamente la correspondiente Nota de Crédito Electrónica según la normativa de SUNAT (R.S. 114-2019/SUNAT y Catálogo N.° 09), distinguiendo entre Devolución total (código 06) y Devolución por ítem / parcial (código 07). Para diferencias de precio en reposiciones no se emite comprobante adicional (supuesto académico).
- No se manejan combos ni promociones.

---

## HU-04: Registrar reposición

- **Story Points:** 5
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como cajera, quiero registrar la reposición de uno o más productos de un pedido entregado, para atender el reclamo de un cliente entregándole un producto de reemplazo sin devolver dinero.

### Criterios de aceptación

- **CA01. Selección de pedido y productos:** desde un pedido del día en estado *Entregado*, la cajera selecciona uno o más productos y la cantidad a reponer de cada uno, sin superar las unidades que aún no tengan reposición ni devolución registrada.
- **CA02. Motivo obligatorio:** la cajera elige un motivo de una lista fija (*Producto en mal estado*, *Error en la preparación*, *Producto incorrecto*, *Otro*). Puede agregar una observación de hasta 250 caracteres, obligatoria (mínimo 10 caracteres) si elige *Otro*.
- **CA03. Mismo producto por defecto:** el sistema propone reponer el mismo producto, sin costo, si está disponible.
- **CA04. Otro producto si no está disponible:** si el producto figura *No disponible*, el sistema ofrece solo productos *Disponibles* de igual o mayor precio. Los de menor precio no se ofrecen, porque este flujo no da vuelto.
- **CA05. Sin alternativas disponibles:** si no existe ningún reemplazo de igual o mayor precio, el sistema no permite reponer esa unidad y muestra un mensaje con un botón para pasar a *Solicitar devolución*, sin guardar ningún registro pendiente.
- **CA06. Cálculo y cobro de la diferencia:** si el reemplazo cuesta más, el sistema calcula la diferencia (precio × cantidad) y la cajera registra su modalidad de pago (Efectivo, Yape, Plin o Transferencia) antes de enviar la reposición a cocina.
- **CA07. Generación del pedido de reposición:** al confirmar, el sistema crea un pedido nuevo vinculado al pedido reclamado, identificado como "Reposición del pedido #025", con total S/ 0.00 o la diferencia cobrada, en estado *Pendiente*.
- **CA08. Prioridad en cocina:** el pedido de reposición aparece en la pantalla de cocina con la etiqueta *Reposición*, al inicio de la cola, por delante de los pedidos *Pendientes* (sin desplazar los que ya están *En preparación*). Entre reposiciones se respeta el orden de registro.
- **CA09. Indicador en el pedido original:** el pedido original muestra *Con reposición*, con los productos afectados, sin cambiar su estado general.
- **CA10. Solo reemplazos:** el pedido de reposición contiene únicamente los productos de reemplazo. Productos adicionales se registran como un pedido nuevo e independiente.
- **CA11. Reposición sobre reposición:** puede registrarse una nueva reposición sobre un pedido de reposición ya entregado, quedando todos los pedidos vinculados en cadena.

---

## HU-05: Solicitar devolución

- **Story Points:** 3
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como cajera, quiero registrar la solicitud de devolución de uno o más productos de un pedido entregado, con los datos necesarios para que el administrador pueda depositarle al cliente, para dejar constancia del reclamo mientras se gestiona el reembolso.

### Criterios de aceptación

- **CA01. Selección de pedido y productos:** desde un pedido del día en estado *Entregado*, la cajera selecciona uno o más productos y la cantidad a devolver, sin superar las unidades que aún no tengan devolución ni reposición registrada.
- **CA02. Motivo obligatorio:** misma lista fija y regla de observación que en Registrar reposición (CA02).
- **CA03. Monto calculado automáticamente:** el sistema calcula el monto a devolver según lo pagado por los productos y cantidades seleccionados; no es editable.
- **CA04. Modalidad de devolución:** la cajera registra la modalidad elegida por el cliente: Yape, Plin o Transferencia bancaria. El efectivo no está disponible.
- **CA05. Datos según modalidad:** Yape o Plin: número de teléfono (solo números, 9 dígitos) y nombre del titular (texto, hasta 100 caracteres). Transferencia: la cajera ingresa **una** de las dos opciones: número de cuenta (solo números, 10 a 20 dígitos) o CCI (solo números, 20 dígitos), más el nombre del titular.
- **CA06. Datos de contacto del cliente:** nombre y teléfono del cliente que reclama, para que el administrador pueda comunicarse con él. Si el titular de la cuenta es otra persona, ambos nombres quedan registrados por separado.
- **CA07. Registro de la solicitud:** al confirmar, el sistema crea la solicitud vinculada al pedido, en estado *Solicitada*, con motivo, productos, monto, modalidad y datos de contacto.
- **CA08. Indicador en el pedido:** el pedido muestra *Devolución solicitada*, con los productos afectados, sin cambiar su estado general.
- **CA09. Visible para el administrador:** la solicitud queda disponible para ser procesada en la historia *Procesar devolución*.
- **CA10. Devolución sobre pedido de reposición:** puede solicitarse sobre un pedido de reposición ya entregado; el monto máximo es lo efectivamente pagado en ese pedido puntual (la diferencia cobrada, si la hubo). Si el pedido de reposición no tuvo costo, no hay monto que devolver.

---

## HU-06: Procesar devolución

- **Story Points:** 3
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como administrador, quiero ver las solicitudes de devolución pendientes y registrar cuando realizo el reembolso al cliente desde las cuentas de la empresa, adjuntando el comprobante correspondiente, para dejar constancia de que el dinero fue devuelto.

### Criterios de aceptación

#### Listado

- **CA01. Solicitudes pendientes:** el administrador ve un listado de todas las devoluciones en estado *Solicitada*, de cualquier día, ordenadas de la más antigua a la más reciente.
- **CA02. Ver detalle:** al seleccionar una solicitud, el sistema muestra el pedido de origen, los productos y cantidades afectadas, el motivo y observación, el monto a devolver, la modalidad (Yape, Plin o Transferencia), los datos para el depósito y los datos de contacto del cliente.

#### Procesamiento

- **CA03. Registrar el procesamiento:** el administrador realiza la devolución fuera del sistema y luego la registra adjuntando el comprobante de la transacción (un archivo, en formato PDF o imagen).
- **CA04. Comprobante obligatorio:** el sistema no permite marcar la solicitud como procesada sin un archivo adjunto.
- **CA05. Sin verificación externa:** el sistema no valida el contenido del archivo ni se conecta a ninguna entidad bancaria; solo lo almacena como respaldo.
- **CA06. Cambio de estado:** al registrar el procesamiento, la solicitud pasa de *Solicitada* a *Procesada*, con la fecha y hora del registro.
- **CA07. Canal real y corrección de datos de destino:** el administrador puede acordar con el cliente cambiar el canal de reembolso (Yape, Plin o Transferencia bancaria) o corregir errores de tipeo en el número de cuenta, CCI o teléfono ingresados en caja (validando longitud y formato numérico en tiempo real: 9 dígitos para Yape/Plin, 10 a 20 dígitos para número de cuenta y 20 dígitos para CCI). El sistema conserva los datos de destino originales registrados en caja para fines de auditoría y trazabilidad contable.
- **CA08. Reflejo en consulta:** una vez procesada, el pedido asociado muestra el indicador *Devolución procesada* en *Consultar pedidos*, en lugar de *Devolución solicitada*.

#### Restricciones

- **CA09. Solo administrador:** únicamente el rol administrador accede a este módulo.
- **CA10. No reversible:** una vez marcada como *Procesada*, no puede volver a *Solicitada* ni anularse.
- **CA11. Emisión de Nota de Crédito Electrónica (SUNAT):** al registrar el reembolso, el sistema genera automáticamente la Nota de Crédito Electrónica asociada al comprobante original (serie BC01 para boletas o FC01 para facturas), clasificada según el Catálogo N.° 09 de SUNAT en *06 - Devolución total* o *07 - Devolución por ítem (parcial)*. El documento desglosa ítems devueltos, valor venta, 18% de IGV e importe total, incluye la leyenda académica "Documento de demostración – sin validez tributaria", y queda disponible para su visualización e impresión oficial en PDF.
