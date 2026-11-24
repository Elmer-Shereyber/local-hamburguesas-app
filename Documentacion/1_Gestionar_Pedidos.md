# ÉPICA: Gestionar Pedidos

Permitir que la cajera registre y consulte los pedidos realizados por los clientes.

## Alcance y supuestos de la épica

- No se anulan pedidos ni productos bajo ninguna circunstancia; todos se pagan por adelantado.
- Registrar reposición y Solicitar devolución solo proceden sobre pedidos en estado *Entregado*.
- Un producto dentro de un pedido tiene un único estado para toda su cantidad; no se maneja preparación parcial.
- El total de un pedido se calcula automáticamente al registrarlo y no se modifica después.
- Para diferencias de precio cobradas en una reposición no se emite comprobante adicional (se registra en el pedido de reposición). La emisión de Notas de Crédito Electrónicas oficiales SUNAT se gestiona al procesar devoluciones en la Épica de Incidencias (HU-06).

---

## HU-01: Registrar pedido

- **Story Points:** 8
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como cajera, quiero registrar un pedido con los productos, cantidades y modalidad de pago indicados por el cliente, para calcular el total a cobrar y dejarlo listo para emitir su comprobante.

### Criterios de aceptación

- **CA01. Selección de productos:** el sistema muestra el listado completo de productos con su disponibilidad. Solo los productos disponibles pueden seleccionarse; los no disponibles se muestran deshabilitados.
- **CA02. Mínimo de productos:** el pedido debe tener al menos 1 producto.
- **CA03. Cantidad por producto:** cada producto debe tener una cantidad entre 1 y 10.
- **CA04. Detalle opcional:** la cajera puede añadir un detalle general del pedido (opcional, máximo 50 caracteres).
- **CA05. Cálculo del total:** el sistema calcula automáticamente el total según los productos y cantidades seleccionados.
- **CA06. Modalidad de pago:** la cajera selecciona una sola modalidad: Efectivo, Yape, Plin, Transferencia o Híbrido.
- **CA07. Pago híbrido:** si la modalidad es Híbrido, la cajera digita el monto correspondiente a cada modalidad usada. El sistema valida que la suma sea igual al total antes de continuar.
- **CA08. Sin verificación externa:** el sistema no confirma que el pago se haya recibido realmente (no valida transferencias, Yape o Plin); solo registra la modalidad declarada por la cajera.
- **CA09. Registro completo:** el pedido solo se registra cuando todos los campos obligatorios están completos.
- **CA10. Resultado del registro:** al registrarse, el pedido queda con su total y modalidad de pago definidos, listo para emitir su comprobante (ver HU-02). El pedido aún no es visible para el área de cocina.

---

## HU-02: Emitir comprobante de pago

- **Story Points:** 8
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como cajera, quiero emitir la boleta o factura de un pedido ya registrado, validando los datos del cliente según la normativa peruana vigente, para formalizar la venta y habilitar su preparación en cocina.

### Criterios de aceptación

#### Datos del emisor

- **CA01. Datos fijos del negocio:** el sistema tiene preconfigurados el RUC, razón social, nombre comercial y domicilio fiscal del negocio, junto con la serie de boleta y de factura. No se ingresan en cada emisión.

#### Inicio

- **CA02. Pedido previo requerido:** depende de un pedido ya registrado (HU-01), con su total y modalidad de pago definidos.
- **CA03. Tipo de comprobante:** la cajera elige exactamente uno: Boleta o Factura, nunca ambos para el mismo pedido.

#### Boleta

- **CA04. Dos variantes de boleta:** al elegir Boleta, la cajera selecciona entre **Boleta con DNI** o **Boleta simple** (sin datos del cliente).
- **CA05. Boleta simple disponible solo hasta S/ 700:** la opción "Boleta simple" solo está habilitada si el total del pedido es igual o menor a S/ 700. Al elegirla, el comprobante se emite sin nombre ni documento del cliente.
- **CA06. Boleta con DNI obligatoria sobre S/ 700:** si el total supera S/ 700, la opción "Boleta simple" no está disponible; el sistema obliga a elegir "Boleta con DNI".
- **CA07. Validación del DNI:** al elegir "Boleta con DNI" (por obligación o por elección voluntaria del cliente aun con monto menor a S/ 700), el sistema solicita el DNI, lo valida con RENIEC/SUNAT y autocompleta el nombre, no editable.
- **CA08. Importe único, sin desglose:** en ambas variantes, la boleta muestra el detalle de productos con cantidad y precio unitario, y un importe total único que ya incluye todos los tributos. No se discrimina el IGV.

#### Factura

- **CA09. Datos del comprador:** la cajera ingresa el RUC, el sistema lo valida con SUNAT y autocompleta razón social y domicilio fiscal, no editables. Si el RUC no es válido, no se puede finalizar hasta corregirlo.
- **CA10. Desglose obligatorio:** la factura muestra el detalle de productos con cantidad y precio unitario, el valor de venta (sin IGV), el IGV discriminado (18%), y el importe total, expresado en números y en letras.
- **CA11. Leyenda en copias:** las copias incluyen la leyenda "COPIA SIN DERECHO A CRÉDITO FISCAL DEL IGV".

#### Comunes a ambos

- **CA12. Identificación del comprobante:** no existe alias del cliente; el comprobante se identifica por su serie y número correlativo, generado automáticamente.
- **CA13. Datos mínimos comunes:** todo comprobante incluye datos del emisor, serie y correlativo, fecha de emisión, detalle de productos con cantidad y precio, importe total y modalidad de pago registrada en HU-01.
- **CA14. Habilitación para cocina:** al emitirse el comprobante, el pedido pasa a estado *Pendiente* y se hace visible en la pantalla de cocina (ver HU-03).

---

## HU-03: Consultar pedidos

- **Story Points:** 3
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como cajera, quiero consultar los pedidos del día y ver el estado general de cada uno, el estado individual de sus productos y si tienen una devolución o reposición registrada, para hacer seguimiento a su preparación y confirmar la entrega al cliente cuando estén listos.

### Criterios de aceptación

#### Listado y búsqueda

- **CA01. Pedidos recientes por defecto:** al ingresar al módulo, el sistema muestra los 10 pedidos más recientes del día, del más reciente al más antiguo, con su código, estado general e indicadores de devolución o reposición, si corresponde.
- **CA02. Búsqueda por comprobante:** la cajera filtra por número de comprobante. Si no hay coincidencias, el sistema lo indica.
- **CA03. Alcance de la consulta:** la cajera solo puede consultar pedidos del día actual.

#### Detalle del pedido

- **CA04. Ver detalle:** al seleccionar un pedido, el sistema muestra código, comprobante, fecha y hora, productos con cantidad, precio y estado individual, total, estado general e indicadores de devolución o reposición.

#### Estados y entrega

- **CA05. Estado general automático:** Pendiente (ningún producto tomado por cocina), En preparación (al menos uno en preparación o listo, sin estar todos listos), Listo (todos listos) o Entregado (cajera confirmó entrega).
- **CA06. Solo lectura:** la cajera no modifica estados de productos ni el estado general, salvo confirmar la entrega cuando el pedido está *Listo*.
- **CA07. Actualización de estados:** los cambios que hace cocina se reflejan en tiempo real para la cajera.
- **CA08. Confirmar entrega:** disponible solo cuando el pedido está *Listo*; al confirmarla, pasa a *Entregado*.
- **CA09. Sincronización con cocina:** un pedido *Listo* permanece en la pantalla de cocina hasta que la cajera confirma la entrega.

#### Devoluciones y reposiciones

- **CA10. Indicadores visibles:** *Con reposición*, *Devolución solicitada* o *Devolución procesada*, junto con los productos afectados.
- **CA11. Solo sobre pedidos entregados:** las devoluciones y reposiciones solo se registran sobre pedidos *Entregados*, incluidos los generados por una reposición.
- **CA12. El estado de entrega se conserva:** una devolución o reposición no cambia el estado general del pedido original.
- **CA13. Pedido de reposición:** genera un pedido nuevo, vinculado al que reemplaza, con su propio ciclo de estados. Se identifica como "Reposición del pedido #025", con total S/ 0.00 o la diferencia de precio, y aparece en cocina con etiqueta *Reposición* y prioridad al inicio de la cola (sin desplazar lo que ya está *En preparación*).
- **CA14. Consulta únicamente:** el registro de devoluciones y reposiciones se define en historias de usuario aparte.
- **CA15. Cadena de reposiciones:** un pedido de reposición puede tener a su vez otra reposición o devolución; todos quedan vinculados entre sí.
