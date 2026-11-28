# Casos de prueba unitarios derivados de los CA de las 15 HU

## Propósito

Este documento sigue el formato solicitado en clase: código, título, prioridad, puntos, descripción, criterios de aceptación, casos, datos de prueba y resultado esperado. La suite contiene únicamente pruebas unitarias derivadas de los CA; no incluye E2E, accesibilidad, multinavegador, concurrencia ni servicios externos.

## Resultado certificado

- 15 historias de usuario.
- 153 criterios de aceptación revisados.
- 88 casos unitarios automatizados.
- 15 archivos de prueba.
- 88 aprobados y 0 fallidos.

Comando: `npm test -- --run`.

## Clasificación de los criterios

- **Prueba unitaria:** el CA contiene una regla que puede comprobarse llamando una función aislada con entradas y salidas controladas.
- **Requiere interfaz/integración:** el CA depende del DOM, navegación, Firebase, tiempo real, archivos o servicios externos. Se documenta, pero no se presenta falsamente como prueba unitaria.


## HU-01: Registrar pedido

| Campo | Valor |
|---|---|
| Código | HU-01 |
| Título | Registrar pedido |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 8 |

### Descripción

Como cajera, quiero registrar un pedido con los productos, cantidades y modalidad de pago indicados por el cliente, para calcular el total a cobrar y dejarlo listo para emitir su comprobante.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Selección de productos:** el sistema muestra el listado completo de productos con su disponibilidad. Solo los productos disponibles pueden seleccionarse; los no disponibles se muestran deshabilitados. | Prueba unitaria |
| CA02 | **Mínimo de productos:** el pedido debe tener al menos 1 producto. | Prueba unitaria |
| CA03 | **Cantidad por producto:** cada producto debe tener una cantidad entre 1 y 10. | Prueba unitaria |
| CA04 | **Detalle opcional:** la cajera puede añadir un detalle general del pedido (opcional, máximo 300 caracteres). | Prueba unitaria |
| CA05 | **Cálculo del total:** el sistema calcula automáticamente el total según los productos y cantidades seleccionados. | Prueba unitaria |
| CA06 | **Modalidad de pago:** la cajera selecciona una sola modalidad: Efectivo, Yape, Plin, Transferencia o Híbrido. | Prueba unitaria |
| CA07 | **Pago híbrido:** si la modalidad es Híbrido, la cajera digita el monto correspondiente a cada modalidad usada. El sistema valida que la suma sea igual al total antes de continuar. | Prueba unitaria |
| CA08 | **Sin verificación externa:** el sistema no confirma que el pago se haya recibido realmente (no valida transferencias, Yape o Plin); solo registra la modalidad declarada por la cajera. | Prueba unitaria |
| CA09 | **Registro completo:** el pedido solo se registra cuando todos los campos obligatorios están completos. | Prueba unitaria |
| CA10 | **Resultado del registro:** al registrarse, el pedido queda con su total y modalidad de pago definidos, listo para emitir su comprobante (ver HU-02). El pedido aún no es visible para el área de cocina. | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU01-01:** permite disponibles y rechaza no disponibles | Producto con `disponible=true` y otro con `false` | Permite el primero y rechaza el segundo |
| **CP-HU01-02:** rechaza un pedido sin productos | Arreglo de productos vacío | Devuelve `SIN_PRODUCTOS` |
| **CP-HU01-03:** acepta cantidades 1 y 10, pero rechaza 0 y 11 | Cantidades 1, 10, 0 y 11 | Acepta 1 y 10; rechaza 0 y 11 |
| **CP-HU01-04:** acepta detalle opcional hasta 300 caracteres | Detalle vacío, 300 y 301 caracteres | Acepta hasta 300 y rechaza 301 |
| **CP-HU01-05:** calcula precio por cantidad y redondea | 2 × S/15 y 1 × S/4.505 | Total redondeado de S/34.51 |
| **CP-HU01-06:** acepta solo las cinco modalidades definidas | Efectivo, Yape, Plin, Transferencia, Híbrido y Tarjeta | Acepta las cinco modalidades definidas y rechaza Tarjeta |
| **CP-HU01-07:** exige dos medios y suma híbrida exacta | Total S/15; combinaciones 10+5, 15 y 10+4 | Solo acepta dos medios cuya suma sea exacta |
| **CP-HU01-08:** registra la modalidad declarada sin verificación externa | Pedido pagado con Yape | El borrador conserva la modalidad declarada |
| **CP-HU01-09:** rechaza campos obligatorios incompletos | Producto válido y modalidad vacía | Devuelve `MODALIDAD_INVALIDA` |
| **CP-HU01-10:** crea el borrador con total, pago y estado inicial | Dos hamburguesas a S/15, Efectivo | Borrador total S/30, pago Efectivo y estado Pendiente |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU01-01 | CA01 | Válido e inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-02 | CA02 | Inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-03 | CA03 | Válido e inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-04 | CA04 | Válido e inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-05 | CA05 | Válido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-06 | CA06 | Válido e inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-07 | CA07 | Válido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-08 | CA08 | Válido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-09 | CA09 | Inválido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |
| CP-HU01-10 | CA10 | Válido | `tests/hu-01-registrar-pedido.test.js` | Aprobada |

## HU-02: Emitir comprobante de pago

| Campo | Valor |
|---|---|
| Código | HU-02 |
| Título | Emitir comprobante de pago |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 8 |

### Descripción

Como cajera, quiero emitir la boleta o factura de un pedido ya registrado, validando los datos del cliente según la normativa peruana vigente, para formalizar la venta y habilitar su preparación en cocina.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Datos fijos del negocio:** el sistema tiene preconfigurados el RUC, razón social, nombre comercial y domicilio fiscal del negocio, junto con la serie de boleta y de factura. No se ingresan en cada emisión. | Requiere interfaz/integración |
| CA02 | **Pedido previo requerido:** depende de un pedido ya registrado (HU-01), con su total y modalidad de pago definidos. | Requiere interfaz/integración |
| CA03 | **Tipo de comprobante:** la cajera elige exactamente uno: Boleta o Factura, nunca ambos para el mismo pedido. | Prueba unitaria |
| CA04 | **Dos variantes de boleta:** al elegir Boleta, la cajera selecciona entre **Boleta con DNI** o **Boleta simple** (sin datos del cliente). | Prueba unitaria |
| CA05 | **Boleta simple disponible solo hasta S/ 700:** la opción "Boleta simple" solo está habilitada si el total del pedido es igual o menor a S/ 700. Al elegirla, el comprobante se emite sin nombre ni documento del cliente. | Prueba unitaria |
| CA06 | **Boleta con DNI obligatoria sobre S/ 700:** si el total supera S/ 700, la opción "Boleta simple" no está disponible; el sistema obliga a elegir "Boleta con DNI". | Prueba unitaria |
| CA07 | **Validación del DNI:** al elegir "Boleta con DNI" (por obligación o por elección voluntaria del cliente aun con monto menor a S/ 700), el sistema solicita el DNI, lo valida con RENIEC/SUNAT y autocompleta el nombre, no editable. | Prueba unitaria |
| CA08 | **Importe único, sin desglose:** en ambas variantes, la boleta muestra el detalle de productos con cantidad y precio unitario, y un importe total único que ya incluye todos los tributos. No se discrimina el IGV. | Requiere interfaz/integración |
| CA09 | **Datos del comprador:** la cajera ingresa el RUC, el sistema lo valida con SUNAT y autocompleta razón social y domicilio fiscal, no editables. Si el RUC no es válido, no se puede finalizar hasta corregirlo. | Prueba unitaria |
| CA10 | **Desglose obligatorio:** la factura muestra el detalle de productos con cantidad y precio unitario, el valor de venta (sin IGV), el IGV discriminado (18%), y el importe total, expresado en números y en letras. | Prueba unitaria |
| CA11 | **Leyenda en copias:** las copias incluyen la leyenda "COPIA SIN DERECHO A CRÉDITO FISCAL DEL IGV". | Requiere interfaz/integración |
| CA12 | **Identificación del comprobante:** no existe alias del cliente; el comprobante se identifica por su serie y número correlativo, generado automáticamente. | Prueba unitaria |
| CA13 | **Datos mínimos comunes:** todo comprobante incluye datos del emisor, serie y correlativo, fecha de emisión, detalle de productos con cantidad y precio, importe total y modalidad de pago registrada en HU-01. | Requiere interfaz/integración |
| CA14 | **Habilitación para cocina:** al emitirse el comprobante, el pedido pasa a estado *Pendiente* y se hace visible en la pantalla de cocina (ver HU-03). | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU02-01:** acepta exactamente boleta o factura | Boleta, Factura y Ticket | Acepta Boleta/Factura y rechaza Ticket |
| **CP-HU02-02:** valida las dos variantes de boleta | Boleta simple y boleta con DNI válido | Ambas variantes resultan válidas |
| **CP-HU02-03:** aplican el límite exacto de S/ 700 | Totales S/700 y S/700.01 | Permite boleta simple solo hasta S/700 |
| **CP-HU02-04:** acepta DNI de ocho dígitos y rechaza formatos inválidos | DNI 12345678, 1234567 y 1234567A | Acepta exactamente ocho dígitos |
| **CP-HU02-05:** exige DNI y nombre validados | DNI 123 y nombre vacío | Reporta DNI y nombre no validados |
| **CP-HU02-06:** crea una boleta simple sin datos del cliente | Boleta simple de S/20 | Los datos del cliente son nulos |
| **CP-HU02-07:** acepta RUC de once dígitos y empresa activa y habida | RUC de 11/10 dígitos y estados ACTIVO/BAJA | Valida longitud y condición ACTIVO-HABIDO |
| **CP-HU02-08:** exige datos completos del comprador | Factura con razón social y domicilio vacíos | Rechaza ambos datos faltantes |
| **CP-HU02-09:** calcula valor de venta e IGV del 18 por ciento | Total S/118 | Valor venta S/100 e IGV S/18 |
| **CP-HU02-10:** genera serie y correlativo automático | Serie B001 y correlativo 25 | Genera B001-000025 |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU02-01 | CA03 | Válido e inválido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-02 | CA04 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-03 | CA05 y CA06 | Límite | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-04 | CA07 | Válido e inválido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-05 | CA07 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-06 | CA05 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-07 | CA09 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-08 | CA09 | Inválido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-09 | CA10 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |
| CP-HU02-10 | CA12 | Válido | `tests/hu-02-emitir-comprobante.test.js` | Aprobada |

## HU-03: Consultar pedidos

| Campo | Valor |
|---|---|
| Código | HU-03 |
| Título | Consultar pedidos |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 3 |

### Descripción

Como cajera, quiero consultar los pedidos del día y ver el estado general de cada uno, el estado individual de sus productos y si tienen una devolución o reposición registrada, para hacer seguimiento a su preparación y confirmar la entrega al cliente cuando estén listos.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Pedidos recientes por defecto:** al ingresar al módulo, el sistema muestra los 10 pedidos más recientes del día, del más reciente al más antiguo, con su código, estado general e indicadores de devolución o reposición, si corresponde. | Prueba unitaria |
| CA02 | **Búsqueda por comprobante:** la cajera filtra por número de comprobante. Si no hay coincidencias, el sistema lo indica. | Prueba unitaria |
| CA03 | **Alcance de la consulta:** la cajera solo puede consultar pedidos del día actual. | Prueba unitaria |
| CA04 | **Ver detalle:** al seleccionar un pedido, el sistema muestra código, comprobante, fecha y hora, productos con cantidad, precio y estado individual, total, estado general e indicadores de devolución o reposición. | Requiere interfaz/integración |
| CA05 | **Estado general automático:** Pendiente (ningún producto tomado por cocina), En preparación (al menos uno en preparación o listo, sin estar todos listos), Listo (todos listos) o Entregado (cajera confirmó entrega). | Prueba unitaria |
| CA06 | **Solo lectura:** la cajera no modifica estados de productos ni el estado general, salvo confirmar la entrega cuando el pedido está *Listo*. | Prueba unitaria |
| CA07 | **Actualización de estados:** los cambios que hace cocina se reflejan en tiempo real para la cajera. | Requiere interfaz/integración |
| CA08 | **Confirmar entrega:** disponible solo cuando el pedido está *Listo*; al confirmarla, pasa a *Entregado*. | Prueba unitaria |
| CA09 | **Sincronización con cocina:** un pedido *Listo* permanece en la pantalla de cocina hasta que la cajera confirma la entrega. | Requiere interfaz/integración |
| CA10 | **Indicadores visibles:** *Con reposición*, *Devolución solicitada* o *Devolución procesada*, junto con los productos afectados. | Prueba unitaria |
| CA11 | **Solo sobre pedidos entregados:** las devoluciones y reposiciones solo se registran sobre pedidos *Entregados*. Si el pedido es una reposición ya entregada, solo puede solicitarse una devolución; no se permite una segunda reposición. | Prueba unitaria |
| CA12 | **El estado de entrega se conserva:** una devolución o reposición no cambia el estado general del pedido original. | Prueba unitaria |
| CA13 | **Pedido de reposición:** genera un pedido nuevo, vinculado al que reemplaza, con el mismo producto reclamado y su propio ciclo de estados. Se identifica como "Reposición del pedido #025", tiene total S/ 0.00 y aparece en cocina con etiqueta *Reposición* y prioridad al inicio de la cola (sin desplazar lo que ya está *En preparación*). | Requiere interfaz/integración |
| CA14 | **Consulta únicamente:** el registro de devoluciones y reposiciones se define en historias de usuario aparte. | Requiere interfaz/integración |
| CA15 | **Cierre de la incidencia:** cada pedido original admite una única solución inicial (reposición o devolución). Si la reposición entregada no satisface al cliente, se permite solicitar una devolución vinculada que cierra el caso; no se encadenan reposiciones. | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU03-01:** devuelve como máximo los diez pedidos más recientes | Doce pedidos con fechas ascendentes | Devuelve los diez más recientes en orden descendente |
| **CP-HU03-02:** filtra por comprobante o código | Comprobantes B001/F001 y códigos A01/A02 | Filtra por comprobante o código |
| **CP-HU03-03:** distingue pedidos del día actual | Fecha del mismo día y del día anterior | Solo identifica como actual la primera |
| **CP-HU03-04:** calcula los estados generales | Productos Pendiente, En preparación y Listo | Calcula Pendiente, En preparación o Listo |
| **CP-HU03-05:** solo permiten entregar un pedido listo | Pedidos Listo y En preparación | Solo habilita entrega para Listo |
| **CP-HU03-06:** prioriza el indicador de devolución procesada | Pedido procesado y pedido con reposición | Prioriza Devolución procesada y muestra Con reposición |
| **CP-HU03-07:** solo habilita incidencias en pedidos entregados | Pedidos Listo y Entregado | Solo el Entregado habilita incidencias |
| **CP-HU03-08:** impide una segunda reposición | Reposición entregada | Solo permite devolución |
| **CP-HU03-09:** conserva el estado entregado al mostrar una incidencia | Pedido Entregado con reposición | Muestra indicador sin modificar Entregado |
| **CP-HU03-10:** cierra las acciones después de una solución inicial | Pedido con devolución o reposición previa | No ofrece una segunda solución inicial |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU03-01 | CA01 | Válido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-02 | CA02 | Válido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-03 | CA03 | Válido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-04 | CA05 | Válido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-05 | CA06 y CA08 | Límite | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-06 | CA10 | Válido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-07 | CA11 | Límite | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-08 | CA11 | Límite | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-09 | CA12 | Límite | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |
| CP-HU03-10 | CA15 | Inválido | `tests/hu-03-consultar-pedidos.test.js` | Aprobada |

## HU-04: Registrar reposición

| Campo | Valor |
|---|---|
| Código | HU-04 |
| Título | Registrar reposición |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 5 |

### Descripción

Como cajera, quiero registrar la reposición de uno o más productos de un pedido entregado, para atender el reclamo de un cliente entregándole un producto de reemplazo sin devolver dinero.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Selección de pedido y productos:** desde un pedido del día en estado *Entregado*, la cajera selecciona uno o más productos y la cantidad a reponer de cada uno, sin superar las unidades que aún no tengan reposición ni devolución registrada. | Prueba unitaria |
| CA02 | **Motivo obligatorio:** la cajera elige un motivo de una lista fija (*Producto en mal estado*, *Error en la preparación*, *Producto incorrecto*, *Otro*). Puede agregar una observación de hasta 250 caracteres, obligatoria (mínimo 10 caracteres) si elige *Otro*. | Prueba unitaria |
| CA03 | **Mismo producto obligatorio:** el sistema permite reponer únicamente el mismo producto reclamado, sin costo, si está disponible en cocina. | Prueba unitaria |
| CA04 | **Producto no disponible:** si el producto original figura *No disponible*, esa unidad no puede reponerse y el sistema orienta a registrar una *Solicitud de devolución*, sin guardar una reposición pendiente. | Prueba unitaria |
| CA05 | **Sin productos alternativos:** este flujo no ofrece productos sustitutos de otro tipo ni calcula diferencias de precio. | Requiere interfaz/integración |
| CA06 | **Reposición sin cobro:** la reposición siempre tiene importe S/ 0.00 y no solicita modalidad de pago. | Requiere interfaz/integración |
| CA07 | **Generación del pedido de reposición:** al confirmar, el sistema crea un pedido nuevo vinculado al pedido reclamado, identificado como "Reposición del pedido #025", con total S/ 0.00 y estado *Pendiente*. | Requiere interfaz/integración |
| CA08 | **Prioridad en cocina:** el pedido de reposición aparece en la pantalla de cocina con la etiqueta *Reposición*, al inicio de la cola, por delante de los pedidos *Pendientes* (sin desplazar los que ya están *En preparación*). Entre reposiciones se respeta el orden de registro. | Requiere interfaz/integración |
| CA09 | **Indicador en el pedido original:** el pedido original muestra *Con reposición*, con los productos afectados, sin cambiar su estado general. | Requiere interfaz/integración |
| CA10 | **Solo reemplazos:** el pedido de reposición contiene únicamente los productos de reemplazo. Productos adicionales se registran como un pedido nuevo e independiente. | Requiere interfaz/integración |
| CA11 | **Sin segunda reposición:** no puede registrarse una nueva reposición sobre un pedido de reposición. Si el cliente no queda conforme después de recibirla, solo puede solicitar una devolución vinculada para cerrar el caso. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU04-01:** exige pedido entregado | Pedidos Entregado y Listo | Solo permite incidencia sobre Entregado |
| **CP-HU04-02:** descuenta unidades ya atendidas | 3 unidades, 1 repuesta; reclamos de 2 y 3 | Quedan 2 reclamables; acepta 2 y rechaza 3 |
| **CP-HU04-03:** valida motivo fijo y observación para Otro | Motivo fijo; Otro con observación larga/corta | Valida lista y mínimo de 10 caracteres para Otro |
| **CP-HU04-04:** limita la observación a 250 caracteres | Observaciones de 250 y 251 caracteres | Acepta 250 y rechaza 251 |
| **CP-HU04-05:** permite únicamente el mismo producto disponible | Mismo producto disponible y producto distinto | Solo permite el mismo producto |
| **CP-HU04-06:** rechaza el producto original no disponible | Mismo producto con `disponible=false` | Rechaza la reposición |
| **CP-HU04-07:** rechaza una cantidad de reposición igual a cero | Cantidades 1 y 0 sobre unidades disponibles | Acepta 1 y rechaza 0 |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU04-01 | CA01 | Límite | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-02 | CA01 | Válido e inválido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-03 | CA02 | Válido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-04 | CA02 | Válido e inválido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-05 | CA03 | Válido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-06 | CA04 | Inválido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |
| CP-HU04-07 | CA01 | Válido e inválido | `tests/hu-04-registrar-reposicion.test.js` | Aprobada |

## HU-05: Solicitar devolución

| Campo | Valor |
|---|---|
| Código | HU-05 |
| Título | Solicitar devolución |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 3 |

### Descripción

Como cajera, quiero registrar la solicitud de devolución de uno o más productos de un pedido entregado, con los datos necesarios para que el administrador pueda depositarle al cliente, para dejar constancia del reclamo mientras se gestiona el reembolso.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Selección de pedido y productos:** desde un pedido del día en estado *Entregado*, la cajera selecciona uno o más productos y la cantidad a devolver, sin superar las unidades que aún no tengan devolución ni reposición registrada. | Prueba unitaria |
| CA02 | **Motivo obligatorio:** misma lista fija y regla de observación que en Registrar reposición (CA02). | Requiere interfaz/integración |
| CA03 | **Monto calculado automáticamente:** el sistema calcula el monto a devolver según lo pagado por los productos y cantidades seleccionados; no es editable. | Prueba unitaria |
| CA04 | **Modalidad de devolución:** la cajera registra la modalidad elegida por el cliente: Yape, Plin o Transferencia bancaria. El efectivo no está disponible. | Prueba unitaria |
| CA05 | **Datos según modalidad:** Yape o Plin: número de teléfono (solo números, 9 dígitos) y nombre del titular (texto, hasta 100 caracteres). Transferencia: la cajera ingresa **una** de las dos opciones: número de cuenta (solo números, 10 a 20 dígitos) o CCI (solo números, 20 dígitos), más el nombre del titular. | Prueba unitaria |
| CA06 | **Datos de contacto del cliente:** nombre y teléfono del cliente que reclama, para que el administrador pueda comunicarse con él. Si el titular de la cuenta es otra persona, ambos nombres quedan registrados por separado. | Prueba unitaria |
| CA07 | **Registro de la solicitud:** al confirmar, el sistema crea la solicitud vinculada al pedido, en estado *Solicitada*, con motivo, productos, monto, modalidad y datos de contacto. | Prueba unitaria |
| CA08 | **Indicador en el pedido:** el pedido muestra *Devolución solicitada*, con los productos afectados, sin cambiar su estado general. | Requiere interfaz/integración |
| CA09 | **Visible para el administrador:** la solicitud queda disponible para ser procesada en la historia *Procesar devolución*. | Requiere interfaz/integración |
| CA10 | **Devolución posterior a reposición:** puede solicitarse sobre un pedido de reposición ya entregado. El monto se toma de los productos pagados en el pedido original vinculado, pues la reposición tuvo costo S/ 0.00; esta devolución cierra el caso. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU05-01:** limita la cantidad a las unidades reclamables | 2 unidades, 1 ya repuesta; reclamos 1 y 2 | Acepta 1 y rechaza 2 |
| **CP-HU05-02:** calcula automáticamente el monto | 2 × S/15 y 1 × S/5 | Calcula S/35 |
| **CP-HU05-03:** rechaza modalidades distintas de Yape, Plin o Transferencia | Modalidad Efectivo | La rechaza como destino de devolución |
| **CP-HU05-04:** valida teléfono de billetera | Teléfonos 987654321 y 887654321 | Acepta celular peruano que inicia en 9 |
| **CP-HU05-05:** valida cuenta o CCI para transferencia | Cuenta de 10 dígitos, CCI de 20 y cuenta de 3 | Acepta cuenta/CCI válidos y rechaza formato corto |
| **CP-HU05-06:** exige datos de contacto completos | Contacto sin nombre y teléfono 123 | Reporta `CONTACTO_INVALIDO` |
| **CP-HU05-07:** acepta una solicitud completa | Pedido entregado, producto, motivo, Yape y contacto válidos | Solicitud válida sin errores |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU05-01 | CA01 | Válido e inválido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-02 | CA03 | Válido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-03 | CA04 | Inválido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-04 | CA05 | Válido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-05 | CA05 | Válido e inválido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-06 | CA06 | Válido | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |
| CP-HU05-07 | CA07 | Límite | `tests/hu-05-solicitar-devolucion.test.js` | Aprobada |

## HU-06: Procesar devolución

| Campo | Valor |
|---|---|
| Código | HU-06 |
| Título | Procesar devolución |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 3 |

### Descripción

Como administrador, quiero ver las solicitudes de devolución pendientes y registrar cuando realizo el reembolso al cliente desde las cuentas de la empresa, adjuntando el comprobante correspondiente, para dejar constancia de que el dinero fue devuelto.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Solicitudes pendientes:** el administrador ve un listado de todas las devoluciones en estado *Solicitada*, de cualquier día, ordenadas de la más antigua a la más reciente. | Requiere interfaz/integración |
| CA02 | **Ver detalle:** al seleccionar una solicitud, el sistema muestra el pedido de origen, los productos y cantidades afectadas, el motivo y observación, el monto a devolver, la modalidad (Yape, Plin o Transferencia), los datos para el depósito y los datos de contacto del cliente. | Requiere interfaz/integración |
| CA03 | **Registrar el procesamiento:** el administrador realiza la devolución fuera del sistema y luego la registra adjuntando el comprobante de la transacción (un archivo, en formato PDF o imagen). | Prueba unitaria |
| CA04 | **Comprobante obligatorio:** el sistema no permite marcar la solicitud como procesada sin un archivo adjunto. | Prueba unitaria |
| CA05 | **Sin verificación externa:** el sistema no valida el contenido del archivo ni se conecta a ninguna entidad bancaria; solo lo almacena como respaldo. | Requiere interfaz/integración |
| CA06 | **Cambio de estado:** al registrar el procesamiento, la solicitud pasa de *Solicitada* a *Procesada*, con la fecha y hora del registro. | Requiere interfaz/integración |
| CA07 | **Canal real y corrección de datos de destino:** el administrador puede acordar con el cliente cambiar el canal de reembolso (Yape, Plin o Transferencia bancaria) o corregir errores de tipeo en el número de cuenta, CCI o teléfono ingresados en caja (validando longitud y formato numérico en tiempo real: 9 dígitos para Yape/Plin, 10 a 20 dígitos para número de cuenta y 20 dígitos para CCI). El sistema conserva los datos de destino originales registrados en caja para fines de auditoría y trazabilidad contable. | Prueba unitaria |
| CA08 | **Reflejo en consulta:** una vez procesada, el pedido asociado muestra el indicador *Devolución procesada* en *Consultar pedidos*, en lugar de *Devolución solicitada*. | Requiere interfaz/integración |
| CA09 | **Solo administrador:** únicamente el rol administrador accede a este módulo. | Requiere interfaz/integración |
| CA10 | **No reversible:** una vez marcada como *Procesada*, no puede volver a *Solicitada* ni anularse. | Prueba unitaria |
| CA11 | **Emisión de Nota de Crédito Electrónica (SUNAT):** al registrar el reembolso, el sistema genera automáticamente la Nota de Crédito Electrónica asociada al comprobante original (serie BC01 para boletas o FC01 para facturas), clasificada según el Catálogo N.° 09 de SUNAT en *06 - Devolución total* o *07 - Devolución por ítem (parcial)*. El documento desglosa ítems devueltos, valor venta, 18% de IGV e importe total, incluye la leyenda académica "Documento de demostración – sin validez tributaria", y queda disponible para su visualización e impresión oficial en PDF. | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU06-01:** acepta comprobante adjunto y destino válido | Solicitud, voucher.pdf y destino Yape válido | Procesamiento válido |
| **CP-HU06-02:** rechaza procesamiento sin comprobante | Solicitud sin archivo | Reporta `COMPROBANTE_OBLIGATORIO` |
| **CP-HU06-03:** valida el destino corregido | Transferencia con cuenta 123 | Reporta `DESTINO_INVALIDO` |
| **CP-HU06-04:** impide reprocesar una devolución | Estado Procesada con voucher | Reporta `YA_PROCESADA` |
| **CP-HU06-05:** clasifica devolución total con código 06 | Pedido S/30 y devolución S/30 | Nota de crédito código 06 total |
| **CP-HU06-06:** clasifica devolución parcial con código 07 | Pedido S/30 y devolución S/15 | Nota de crédito código 07 parcial |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU06-01 | CA03 | Válido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |
| CP-HU06-02 | CA04 | Inválido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |
| CP-HU06-03 | CA07 | Válido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |
| CP-HU06-04 | CA10 | Inválido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |
| CP-HU06-05 | CA11 | Válido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |
| CP-HU06-06 | CA11 | Válido | `tests/hu-06-procesar-devolucion.test.js` | Aprobada |

## HU-07: Gestionar disponibilidad de productos

| Campo | Valor |
|---|---|
| Código | HU-07 |
| Título | Gestionar disponibilidad de productos |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 3 |

### Descripción

Como área de cocina, quiero marcar cada producto del menú como disponible o no disponible, para que la cajera solo pueda vender lo que realmente se puede preparar en el momento.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Listado de productos:** el sistema muestra el listado completo de productos del menú, sin orden específico, cada uno con su nombre, precio y estado actual de disponibilidad (*Disponible* / *No disponible*). | Requiere interfaz/integración |
| CA02 | **Cambio de estado:** junto a cada producto hay un control que permite alternar su estado entre *Disponible* y *No disponible* con una sola acción. | Prueba unitaria |
| CA03 | **Aplicación inmediata:** el cambio se refleja de inmediato para la cajera, tanto en *Registrar pedido* (producto deshabilitado si no está disponible) como en *Registrar reposición* (producto no ofrecido como reemplazo si no está disponible). | Requiere interfaz/integración |
| CA04 | **No afecta pedidos ya registrados:** marcar un producto como *No disponible* no modifica los pedidos que ya lo incluyen y que están en curso o entregados. | Requiere interfaz/integración |
| CA05 | **Sin justificación obligatoria:** cocina puede cambiar la disponibilidad en cualquier momento, sin necesidad de indicar un motivo. | Requiere interfaz/integración |
| CA06 | **Persistencia del estado:** el estado de disponibilidad no se reinicia automáticamente al cambiar de día; se mantiene tal como quedó, y su actualización antes de abrir el local es responsabilidad operativa de cocina. | Requiere interfaz/integración |
| CA07 | **Solo área de cocina:** únicamente el rol de cocina cambia la disponibilidad. La cajera y el administrador solo la consultan; crear o eliminar productos del catálogo corresponde al administrador, en otra historia. | Requiere interfaz/integración |
| CA08 | **Todos los productos visibles:** el listado no se filtra ni se pagina; cocina ve todos los productos a la vez. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU07-01:** alterna de disponible a no disponible | Producto disponible | Devuelve una copia no disponible |
| **CP-HU07-02:** cambia el estado sin modificar el objeto original | Objeto original disponible | No muta el objeto original |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU07-01 | CA02 | Válido | `tests/hu-07-disponibilidad.test.js` | Aprobada |
| CP-HU07-02 | CA02 | Válido | `tests/hu-07-disponibilidad.test.js` | Aprobada |

## HU-08: Visualizar pedidos en cocina

| Campo | Valor |
|---|---|
| Código | HU-08 |
| Título | Visualizar pedidos en cocina |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 3 |

### Descripción

Como área de cocina, quiero ver los pedidos en curso con sus productos y cantidades, ordenados según su prioridad, para saber qué preparar y en qué orden.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Pedidos visibles:** el sistema muestra los pedidos en estado *Pendiente*, *En preparación* y *Listo*. Los *Entregados* no se muestran. | Prueba unitaria |
| CA02 | **Datos por pedido:** cada pedido muestra su código, hora de registro, lista de productos con su cantidad y estado individual, y el detalle general si la cajera lo ingresó. | Requiere interfaz/integración |
| CA03 | **Orden de la cola:** entre los pedidos que aún no están *En preparación*, los de reposición se muestran primero, ordenados por hora de registro entre ellos, y luego los demás pedidos *Pendientes*, del más antiguo al más reciente. Los pedidos *En preparación* mantienen su posición según el momento en que cocina los tomó. | Prueba unitaria |
| CA04 | **Sin reordenar en marcha:** una vez que un pedido pasa a *En preparación*, no cambia de posición en la cola por la llegada de nuevos pedidos o reposiciones. | Prueba unitaria |
| CA05 | **Identificador visual de reposición:** los pedidos de reposición se distinguen con un color distintivo, además de la etiqueta *Reposición*, para que cocina los identifique de un vistazo. | Requiere interfaz/integración |
| CA06 | **Tiempo real:** un pedido nuevo aparece automáticamente en la pantalla de cocina, sin necesidad de recargar. | Requiere interfaz/integración |
| CA07 | **Salida de la pantalla:** cuando la cajera confirma la entrega de un pedido, este desaparece de inmediato. | Requiere interfaz/integración |
| CA08 | **Solo lectura de datos del pedido:** desde esta historia, cocina solo visualiza los pedidos; el cambio de estado de los productos se define en otra historia. | Requiere interfaz/integración |
| CA09 | **Sin historial:** no se muestran pedidos entregados ni de días anteriores. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU08-01:** muestra pendientes, en preparación y listos, no entregados | Estados Pendiente, En preparación, Listo y Entregado | Muestra los tres primeros y oculta Entregado |
| **CP-HU08-02:** prioriza en preparación, reposición y pendiente | Pedido normal, reposición y pedido en preparación | Ordena en preparación, reposición y normal |
| **CP-HU08-03:** conserva el orden de los pedidos en preparación | Dos pedidos en preparación con distintas horas y reposición nueva | Conserva el orden de toma antes de la reposición |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU08-01 | CA01 | Límite | `tests/hu-08-pedidos-cocina.test.js` | Aprobada |
| CP-HU08-02 | CA03 | Válido | `tests/hu-08-pedidos-cocina.test.js` | Aprobada |
| CP-HU08-03 | CA04 | Válido | `tests/hu-08-pedidos-cocina.test.js` | Aprobada |

## HU-09: Actualizar estado de productos

| Campo | Valor |
|---|---|
| Código | HU-09 |
| Título | Actualizar estado de productos |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 3 |

### Descripción

Como área de cocina, quiero actualizar el estado de cada producto dentro de un pedido conforme avanzo en su preparación, para que la cajera pueda ver el progreso real del pedido y el cliente sepa cuándo está listo.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Ciclo según tipo de producto:** cada producto tiene un tipo definido en el catálogo (fuera del alcance de esta historia): *Con preparación* (ciclo *Pendiente → En preparación → Listo*) o *Servicio inmediato* (ciclo *Pendiente → Listo*, sin estado intermedio). | Prueba unitaria |
| CA02 | **Progreso secuencial:** el estado de un producto solo avanza hacia adelante según su ciclo correspondiente. No se puede saltar etapas en un producto *Con preparación*. | Prueba unitaria |
| CA03 | **Cambio manual individual:** cocina cambia el estado de cada producto con una acción directa (tocar el producto o su botón), sin pasos adicionales. | Requiere interfaz/integración |
| CA04 | **Acción general para productos con preparación:** cocina puede usar un botón "Iniciar preparación del pedido" que mueve a *En preparación* todos los productos *Con preparación* que estén en *Pendiente*, en un solo paso. Solo está disponible si ninguno de esos productos ya avanzó de estado. Los productos de *Servicio inmediato* no se ven afectados por este botón; se marcan individualmente. | Prueba unitaria |
| CA05 | **Aplica a toda la cantidad:** el cambio de estado afecta a la cantidad completa de ese producto dentro del pedido; no se maneja preparación parcial por unidades. | Requiere interfaz/integración |
| CA06 | **Estado general automático:** el cambio de estado de un producto recalcula automáticamente el estado general del pedido, según las reglas ya definidas en *Consultar pedidos*. | Requiere interfaz/integración |
| CA07 | **Sin acción sobre el estado general:** cocina no fija el estado general del pedido de forma manual; es siempre un resultado del estado de sus productos. | Requiere interfaz/integración |
| CA08 | **Visibilidad inmediata:** el cambio se refleja en tiempo real en la pantalla de cocina y en la consulta de la cajera. | Requiere interfaz/integración |
| CA09 | **Sin retroceso:** una vez que un producto cambia de estado, no puede regresar a un estado anterior. Si cocina se equivoca, la corrección se maneja de forma operativa (por ejemplo, verificando antes de tocar el botón), no mediante una función de retroceso en el sistema. | Prueba unitaria |
| CA10 | **Solo pedidos visibles en cocina:** cocina solo puede cambiar estados de pedidos en *Pendiente*, *En preparación* o *Listo*. Un pedido *Entregado* ya no aparece en su pantalla y no puede modificarse. | Requiere interfaz/integración |
| CA11 | **Sin confirmación de entrega:** cocina no puede marcar un pedido como *Entregado*; esa acción es exclusiva de la cajera, una vez que el pedido está *Listo*. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU09-01:** aplica ciclo completo a productos con preparación | Producto Con preparación en Pendiente y En preparación | Avanza secuencialmente a En preparación y Listo |
| **CP-HU09-02:** envía servicios inmediatos directamente a Listo | Servicio inmediato Pendiente | Avanza directamente a Listo |
| **CP-HU09-03:** impide saltar o retroceder estados | Producto Listo | No obtiene siguiente estado ni puede avanzar |
| **CP-HU09-04:** habilita acción general solo al inicio | Preparados todos Pendientes y uno ya iniciado | Solo habilita la acción al inicio |
| **CP-HU09-05:** inicia preparados sin afectar servicios inmediatos | Preparado Pendiente y servicio inmediato Pendiente | Solo cambia el preparado y recalcula En preparación |
| **CP-HU09-06:** mantiene un producto listo sin retroceso | Servicio inmediato Listo | No permite retroceso |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU09-01 | CA01 | Válido | `tests/hu-09-estado-productos.test.js` | Aprobada |
| CP-HU09-02 | CA01 | Válido | `tests/hu-09-estado-productos.test.js` | Aprobada |
| CP-HU09-03 | CA02 | Inválido | `tests/hu-09-estado-productos.test.js` | Aprobada |
| CP-HU09-04 | CA04 | Válido | `tests/hu-09-estado-productos.test.js` | Aprobada |
| CP-HU09-05 | CA04 | Válido | `tests/hu-09-estado-productos.test.js` | Aprobada |
| CP-HU09-06 | CA09 | Inválido | `tests/hu-09-estado-productos.test.js` | Aprobada |

## HU-10: Gestionar usuarios

| Campo | Valor |
|---|---|
| Código | HU-10 |
| Título | Gestionar usuarios |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 5 |

### Descripción

Como administrador, quiero crear y eliminar las cuentas de cajera y de cocina, para gestionar quién tiene acceso al sistema sin perder el historial de operaciones ya registrado.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Roles gestionables:** el administrador puede crear como máximo una cuenta de Cajera y una de Cocina. El perfil de administrador ya está predefinido y no se crea desde aquí. | Prueba unitaria |
| CA02 | **Creación por rol específico:** la interfaz presenta tarjetas dedicadas e independientes para Cajera y Cocina. El botón de creación se habilita únicamente en la tarjeta del rol que no esté creado, asignando dicho rol de forma fija y directa en el modal (sin selector de roles para evitar confusiones operativas). Si el rol ya cuenta con una cuenta activa, se muestra su estado "ACTIVA" con la opción de eliminarla. | Requiere interfaz/integración |
| CA03 | **Formato del usuario:** solo letras y números, sin espacios ni caracteres especiales, entre 4 y 20 caracteres. El sistema valida el formato en tiempo real mientras se escribe. La contraseña debe tener un mínimo de 6 caracteres, sin otro requisito de formato. | Prueba unitaria |
| CA04 | **Usuario único:** no se permite un usuario ya existente entre las cuentas activas. La disponibilidad también se valida en tiempo real. | Requiere interfaz/integración |
| CA05 | **Autenticación por dominio fijo corporativo:** internamente, el sistema concatena el usuario con el dominio corporativo `@burger.local` para autenticar contra Firebase Authentication. Cajera y cocina inician sesión ingresando únicamente su nombre de usuario (o con el dominio si lo desean) y su contraseña. | Prueba unitaria |
| CA06 | **Eliminar cuenta y purga de credenciales:** el administrador puede eliminar la cuenta de cajera o de cocina en cualquier momento. La eliminación purga de forma completa tanto el registro en Firestore como el usuario en Firebase Authentication (`deleteUser`), liberando el rol inmediatamente y permitiendo reutilizar el mismo nombre de usuario con una nueva contraseña sin conflictos de credenciales huérfanas. | Requiere interfaz/integración |
| CA07 | **Cierre forzado de sesión en tiempo real:** si la cuenta eliminada tenía una sesión activa en cualquier navegador o terminal, el sistema detecta de inmediato la baja mediante escucha en tiempo real de Firestore (y en su próxima acción o validación periódica), cerrando la sesión de forma forzada y redirigiendo al usuario a la pantalla de inicio de sesión con una alerta informativa. | Requiere interfaz/integración |
| CA08 | **Historial intacto:** eliminar o recrear una cuenta no elimina ni modifica los pedidos, reposiciones o devoluciones ya registrados. Esos registros conservan el nombre de usuario que los generó, como un dato de texto, sin depender de que la cuenta siga existiendo. Si el nombre de usuario se reutiliza, los registros antiguos y nuevos mostrarán el mismo texto, sin distinguir que se trató de personas distintas. | Requiere interfaz/integración |
| CA09 | **Sin recuperación propia:** cajera y cocina no tienen recuperación de contraseña; si la olvidan, el administrador elimina su cuenta y crea una nueva. | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU10-01:** permite como máximo una cuenta por rol | Sin usuarios, cajera existente y rol admin | Permite rol libre; bloquea duplicado y admin |
| **CP-HU10-02:** acepta usuarios de 4 a 20 caracteres alfanuméricos | Usuarios de 4 y 20 caracteres | Ambos son válidos |
| **CP-HU10-03:** rechaza longitud, espacios y caracteres especiales | Usuario de 3, con espacio y con símbolo | Rechaza los tres |
| **CP-HU10-04:** exige contraseña mínima de seis caracteres | Contraseñas de 6 y 5 caracteres | Acepta 6 y rechaza 5 |
| **CP-HU10-05:** genera el correo corporativo | Usuario Cajera1 | Genera cajera1@burger.local |
| **CP-HU10-06:** rechaza recuperación propia para usuario operativo | Usuario cocina1 | No permite recuperación propia |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU10-01 | CA01 | Válido e inválido | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |
| CP-HU10-02 | CA03 | Límite | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |
| CP-HU10-03 | CA03 | Inválido | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |
| CP-HU10-04 | CA03 | Válido e inválido | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |
| CP-HU10-05 | CA05 | Válido | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |
| CP-HU10-06 | CA09 | Inválido | `tests/hu-10-gestionar-usuarios.test.js` | Aprobada |

## HU-11: Gestionar productos

| Campo | Valor |
|---|---|
| Código | HU-11 |
| Título | Gestionar productos |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 5 |

### Descripción

Como administrador, quiero crear, modificar y eliminar los productos del menú, para mantener actualizado lo que la cajera puede vender y el área de cocina puede preparar.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Crear producto:** el administrador ingresa nombre, precio (solo valores positivos) y tipo (*Con preparación* / *Servicio inmediato*). El sistema genera un identificador interno único, que el administrador no ve ni ingresa. | Prueba unitaria |
| CA02 | **Nombre único:** no se permite un nombre que coincida con el de un producto activo existente, ignorando mayúsculas/minúsculas y espacios de más. | Prueba unitaria |
| CA03 | **Disponible por defecto:** al crearse, el producto queda *Disponible*. | Requiere interfaz/integración |
| CA04 | **Modificar nombre y precio:** el administrador puede modificar el nombre y el precio de un producto existente, con la misma validación de unicidad del CA02. El identificador interno no cambia. | Prueba unitaria |
| CA05 | **Tipo no editable:** el tipo de producto (*Con preparación* / *Servicio inmediato*) se define al crearlo y no puede modificarse después, para no afectar la lógica de estados de pedidos en curso. Si se necesita cambiar, se elimina el producto y se crea uno nuevo. | Prueba unitaria |
| CA06 | **Pedidos ya registrados no se alteran:** modificar un producto no cambia los pedidos ya registrados que lo incluyen; conservan el nombre y precio tal como estaban al momento de la venta. | Requiere interfaz/integración |
| CA07 | **Eliminar producto:** al eliminarse, deja de mostrarse a la cajera y al área de cocina para nuevas selecciones. Su nombre queda libre para reutilizarse en un producto nuevo, sin relación con el eliminado. | Requiere interfaz/integración |
| CA08 | **Historial intacto:** eliminar un producto no elimina ni modifica los pedidos ya registrados que lo incluyen. | Requiere interfaz/integración |
| CA09 | **Reportes por identificador:** los reportes de ventas por producto agrupan por el identificador interno, no por el nombre, de modo que un producto renombrado sigue contándose como uno solo. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU11-01:** acepta nombre, precio positivo y tipo permitido | Hamburguesa, S/15, Con preparación | Producto válido |
| **CP-HU11-02:** rechaza precio no positivo y tipo desconocido | Precio 0 y tipo Otro | Reporta precio y tipo inválidos |
| **CP-HU11-03:** detecta nombres duplicados sin distinguir espacios o mayúsculas | Nombre existente con mayúsculas y espacios distintos | Detecta nombre duplicado |
| **CP-HU11-04:** permite editar el mismo producto | Edición del mismo ID con nuevo precio | No se considera duplicado de sí mismo |
| **CP-HU11-05:** solo admite los dos tipos definidos | Servicio inmediato e Inventario | Acepta el tipo definido y rechaza el desconocido |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU11-01 | CA01 | Válido | `tests/hu-11-gestionar-productos.test.js` | Aprobada |
| CP-HU11-02 | CA01 | Inválido | `tests/hu-11-gestionar-productos.test.js` | Aprobada |
| CP-HU11-03 | CA02 | Válido | `tests/hu-11-gestionar-productos.test.js` | Aprobada |
| CP-HU11-04 | CA04 | Válido | `tests/hu-11-gestionar-productos.test.js` | Aprobada |
| CP-HU11-05 | CA05 | Válido e inválido | `tests/hu-11-gestionar-productos.test.js` | Aprobada |

## HU-12: Consultar ganancias e incidencias

| Campo | Valor |
|---|---|
| Código | HU-12 |
| Título | Consultar ganancias e incidencias |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 8 |

### Descripción

Como administrador, quiero consultar las ganancias del negocio en un rango de fechas y ver el detalle de las devoluciones y reposiciones registradas, para tener visibilidad completa de las ventas y de las incidencias que las afectan.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Rango de fechas:** el administrador puede consultar información de cualquier rango de fechas, incluyendo días anteriores y el día actual, a diferencia de la cajera que solo ve el día actual. | Prueba unitaria |
| CA02 | **Rango por defecto:** al ingresar al módulo, el sistema muestra por defecto los datos del día actual. | Requiere interfaz/integración |
| CA03 | **Pestañas separadas:** la información se organiza en dos pestañas: *Ganancias* e *Incidencias*. El rango de fechas seleccionado aplica a ambas. | Requiere interfaz/integración |
| CA04 | **Total de ventas:** el sistema muestra el monto total vendido en el rango seleccionado, sumando el total de todos los pedidos cobrados. Las reposiciones sin costo no incrementan las ventas. | Prueba unitaria |
| CA05 | **Desglose por modalidad de pago:** el sistema muestra cuánto se cobró en cada modalidad (Efectivo, Yape, Plin, Transferencia) dentro del rango seleccionado. | Prueba unitaria |
| CA06 | **Ventas por producto y desglose de pedidos:** el sistema muestra las ventas agrupadas por producto (cantidad y monto acumulado por identificador interno) y, en la sección inferior de detalles, presenta el desglose ordenado de pedidos completos del día/rango con su correlativo de comprobante, tipo de pago, productos y clientes, integrando directamente las incidencias asociadas (reposiciones y notas de crédito de devolución). | Prueba unitaria |
| CA07 | **Monto neto e impacto por fecha de reembolso:** el sistema muestra el total de devoluciones procesadas y el monto neto (ventas brutas menos reembolsos efectivos). Las devoluciones impactan financieramente el arqueo y balance en la fecha en que fueron efectivamente pagadas/procesadas por el administrador con su comprobante de pago, independientemente de la fecha en que se registró la solicitud original en caja. | Prueba unitaria |
| CA08 | **Listado de reposiciones:** el administrador puede ver todas las reposiciones registradas en el rango de fechas, con el pedido original, los productos afectados, el motivo y su condición de reposición sin costo. | Requiere interfaz/integración |
| CA09 | **Listado de devoluciones:** el administrador puede ver todas las devoluciones del rango, con su estado (*Solicitada* / *Procesada*), el pedido original, los productos afectados, el motivo, el monto y, si está procesada, el comprobante adjunto registrado en *Procesar devolución*. | Requiere interfaz/integración |
| CA10 | **Acceso al comprobante:** desde el listado de devoluciones procesadas, el administrador puede abrir o descargar el comprobante adjunto de cada una. | Requiere interfaz/integración |
| CA11 | **Resumen de motivos:** el sistema muestra un resumen con la cantidad de casos por motivo (por ejemplo, "Producto en mal estado: 5 casos"), calculado sobre el total de reposiciones y devoluciones del rango seleccionado, para identificar problemas recurrentes. | Prueba unitaria |
| CA12 | **Solo lectura:** esta historia es de consulta; el procesamiento de devoluciones pendientes se realiza en *Procesar devolución*, no aquí. | Requiere interfaz/integración |
| CA13 | **Solo administrador:** únicamente el rol administrador accede a este módulo. | Requiere interfaz/integración |
| CA14 | **Sin exportación:** el sistema no ofrece exportar esta información a otros formatos; toda la consulta se realiza dentro del sistema. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU12-01:** valida rangos cronológicos | Rango 01–27 y rango 27–01 | Acepta el cronológico y rechaza el invertido |
| **CP-HU12-02:** calcula ventas y modalidades, excluyendo el costo de reposición | Venta Efectivo S/30, híbrida S/20 y reposición S/0 | Ventas S/50 y desglose 30/10/10/0 |
| **CP-HU12-03:** agrupa productos y resta reembolsos procesados | Reembolso procesado S/15 y ventas S/50 | Neto S/35; producto p1 con 2 unidades y S/30 vendidos |
| **CP-HU12-04:** resume la cantidad de incidencias por motivo | Dos incidencias Producto incorrecto y una Otro | Resumen 2 y 1 |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU12-01 | CA01 | Válido e inválido | `tests/hu-12-reportes.test.js` | Aprobada |
| CP-HU12-02 | CA04 y CA05 | Válido | `tests/hu-12-reportes.test.js` | Aprobada |
| CP-HU12-03 | CA06 y CA07 | Válido | `tests/hu-12-reportes.test.js` | Aprobada |
| CP-HU12-04 | CA11 | Válido | `tests/hu-12-reportes.test.js` | Aprobada |

## HU-13: Iniciar Sesión

| Campo | Valor |
|---|---|
| Código | HU-13 |
| Título | Iniciar Sesión |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 3 |

### Descripción

Como usuario del sistema (administrador, cajera o cocina), quiero iniciar sesión con mis credenciales, para acceder únicamente a las funciones que corresponden a mi rol.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Campos según el sistema:** la pantalla de inicio de sesión muestra dos campos: identificador (correo para el administrador, usuario para cajera y cocina) y contraseña. El sistema no pide seleccionar el rol; lo determina según la credencial ingresada. | Requiere interfaz/integración |
| CA02 | **Autenticación del administrador:** si el identificador tiene formato de correo, el sistema valida directamente contra el correo y contraseña del administrador, ya configurados desde el inicio. | Prueba unitaria |
| CA03 | **Autenticación de cajera/cocina:** el personal puede ingresar únicamente su nombre de usuario (o el identificador completo con `@burger.local`); el sistema normaliza internamente la credencial con el dominio corporativo y valida contra las cuentas de cajera y cocina activas existentes. | Prueba unitaria |
| CA04 | **Credenciales inválidas:** si el identificador o la contraseña no coinciden con ninguna cuenta, el sistema muestra un mensaje genérico de error, sin indicar cuál de los dos datos fue incorrecto. | Prueba unitaria |
| CA05 | **Cuenta inexistente:** si el rol de cajera o cocina no ha sido creado por el administrador, el intento de inicio de sesión con ese usuario se trata igual que una credencial inválida (CA04). | Prueba unitaria |
| CA06 | **Redirección según rol:** al iniciar sesión correctamente, el sistema redirige a la pantalla principal correspondiente: Administrador, Cajera o Cocina. | Prueba unitaria |
| CA07 | **Restricción de funciones:** cada rol solo puede acceder a las historias de usuario de su propia épica. El sistema no permite navegar manualmente hacia pantallas de otro rol. | Prueba unitaria |
| CA08 | **Sesión persistente:** una vez iniciada la sesión, el usuario permanece autenticado hasta que cierre sesión manualmente o su cuenta sea eliminada, sin necesidad de volver a ingresar sus credenciales en cada uso. | Prueba unitaria |
| CA09 | **Sesión única por cuenta:** cada cuenta (administrador, cajera o cocina) solo puede tener una sesión activa a la vez. Si se inicia sesión en un nuevo dispositivo, la sesión activa en el dispositivo anterior se cierra automáticamente. | Prueba unitaria |
| CA10 | **Intentos fallidos sin bloqueo:** el sistema no bloquea la cuenta tras varios intentos fallidos, dado el alcance académico del proyecto. | Requiere interfaz/integración |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU13-01:** conserva el correo válido del administrador | ADMIN@empresa.pe | Normaliza correo y reconoce administrador |
| **CP-HU13-02:** normaliza usuario operativo al dominio corporativo | Cajera01 y cajera01@burger.local | Normaliza ambos al correo corporativo |
| **CP-HU13-03:** rechaza identificador vacío o inválido | Vacío y abc | Rechaza identificadores inválidos |
| **CP-HU13-04:** usan un mensaje genérico | Cualquier credencial incorrecta | Mensaje único Credenciales inválidas |
| **CP-HU13-05:** redirige cada rol a su pantalla | Roles admin, cajera y cocina | Devuelve la ruta principal de cada rol |
| **CP-HU13-06:** restringe funciones por rol | Cajera frente a permisos cajera/admin | Permite su rol y bloquea otro |
| **CP-HU13-07:** mantiene una sesión activa con token coincidente | Token abc registrado y actual | Sesión vigente |
| **CP-HU13-08:** invalida la sesión anterior cuando cambia el token | Token anterior frente a token nuevo | Invalida la sesión anterior |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU13-01 | CA02 | Válido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-02 | CA03 | Válido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-03 | CA04 | Válido e inválido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-04 | CA04 y CA05 | Inválido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-05 | CA06 | Válido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-06 | CA07 | Válido e inválido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-07 | CA08 | Válido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |
| CP-HU13-08 | CA09 | Inválido | `tests/hu-13-iniciar-sesion.test.js` | Aprobada |

## HU-14: Cerrar Sesión

| Campo | Valor |
|---|---|
| Código | HU-14 |
| Título | Cerrar Sesión |
| Prioridad | 4 — Must have / Obligatorio |
| Puntos | 1 |

### Descripción

Como usuario del sistema (administrador, cajera o cocina), quiero cerrar mi sesión de forma manual, para dejar el dispositivo disponible y evitar que otra persona continúe usando mi cuenta.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Opción visible:** en cualquier pantalla del sistema, el usuario autenticado tiene una opción visible para cerrar sesión. | Requiere interfaz/integración |
| CA02 | **Cierre inmediato:** al confirmar, el sistema finaliza la sesión de inmediato y redirige a la pantalla de inicio de sesión. | Requiere interfaz/integración |
| CA03 | **Sin confirmación adicional:** no se requiere una segunda confirmación (como una ventana emergente de "¿estás seguro?"), para mantener la acción simple y rápida. | Requiere interfaz/integración |
| CA04 | **Acceso bloqueado tras el cierre:** una vez cerrada la sesión, el sistema no permite volver a ninguna pantalla protegida sin iniciar sesión nuevamente (por ejemplo, usando el botón "atrás" del navegador). | Prueba unitaria |
| CA05 | **No afecta otras sesiones:** cerrar sesión en un dispositivo no tiene efecto sobre las sesiones de los otros roles; cada cuenta gestiona su propia sesión de forma independiente. | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU14-01:** una sesión sin token deja de ser válida | Token actual vacío y registrado abc | Sesión inválida |
| **CP-HU14-02:** el cierre de una cuenta no invalida otra sesión | Cajera sin token y cocina con token coincidente | Cierra cajera sin afectar cocina |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU14-01 | CA04 | Inválido | `tests/hu-14-cerrar-sesion.test.js` | Aprobada |
| CP-HU14-02 | CA05 | Válido | `tests/hu-14-cerrar-sesion.test.js` | Aprobada |

## HU-15: Recuperar Contraseña (Admin)

| Campo | Valor |
|---|---|
| Código | HU-15 |
| Título | Recuperar Contraseña (Admin) |
| Prioridad | 3 — Should have / Recomendable |
| Puntos | 3 |

### Descripción

Como administrador, quiero recuperar el acceso a mi cuenta cuando olvide mi contraseña, para no depender de nadie más para volver a ingresar al sistema.

### Criterios de aceptación

| CA | Criterio | Tipo de verificación |
|---|---|---|
| CA01 | **Acceso desde el inicio de sesión:** en la pantalla de inicio de sesión hay una opción visible "¿Olvidaste tu contraseña?", disponible únicamente cuando se está intentando ingresar con correo (es decir, solo aplica al administrador, no a cajera ni cocina). | Prueba unitaria |
| CA02 | **Solicitud por correo:** al seleccionar la opción, el sistema pide el correo del administrador y usa el servicio de recuperación de contraseña de Firebase Authentication para enviar un enlace de restablecimiento a ese correo. | Requiere interfaz/integración |
| CA03 | **Mensaje neutro:** el sistema muestra un mensaje de confirmación genérico ("si el correo está registrado, se enviará un enlace"), sin indicar si el correo ingresado existe o no, para no revelar esa información. | Requiere interfaz/integración |
| CA04 | **Enlace de restablecimiento:** el correo recibido contiene un enlace gestionado por Firebase donde el administrador ingresa su nueva contraseña, con el mismo requisito mínimo de 6 caracteres definido para las demás cuentas. | Requiere interfaz/integración |
| CA05 | **Enlace de un solo uso y con expiración:** el enlace enviado por Firebase es válido solo por un tiempo limitado y se invalida después de usarse una vez, según el comportamiento estándar del servicio. | Requiere interfaz/integración |
| CA06 | **Cierre de sesiones anteriores:** al restablecer la contraseña, cualquier sesión activa previa del administrador se cierra, en línea con la regla de sesión única (HU-13, CA09). | Requiere interfaz/integración |
| CA07 | **Sin esta opción para cajera y cocina:** como sus cuentas no tienen correo asociado, no cuentan con esta función; si olvidan su contraseña, el administrador elimina y recrea su cuenta (ver HU-10). | Prueba unitaria |

### Casos de prueba

| Caso | Datos de prueba | Resultado esperado |
|---|---|---|
| **CP-HU15-01:** permite mostrar recuperación al correo del administrador | admin@empresa.pe | Permite recuperación |
| **CP-HU15-02:** no permite recuperación a cajera ni cocina | cajera01 y cocina01@burger.local | No permite recuperación |

### Trazabilidad de la automatización

| ID | CA relacionado | Tipo de caso | Archivo automatizado | Estado |
|---|---|---|---|---|
| CP-HU15-01 | CA01 | Válido | `tests/hu-15-recuperar-password.test.js` | Aprobada |
| CP-HU15-02 | CA07 | Inválido | `tests/hu-15-recuperar-password.test.js` | Aprobada |

## Tarjetas de responsabilidades y colaboraciones

### Clase o módulo: Pedido

| Responsabilidades | Colaboraciones |
|---|---|
| Validar productos, cantidades, detalle, total y modalidad de pago; crear el borrador. | Producto y Comprobante. |

### Clase o módulo: Comprobante

| Responsabilidades | Colaboraciones |
|---|---|
| Validar tipo, DNI/RUC, límite de boleta, IGV, serie y correlativo. | Pedido y datos del cliente. |

### Clase o módulo: Incidencia

| Responsabilidades | Colaboraciones |
|---|---|
| Calcular unidades reclamables, validar reposición/devolución y clasificar la nota de crédito. | Pedido, Producto y Comprobante. |

### Clase o módulo: Cocina

| Responsabilidades | Colaboraciones |
|---|---|
| Gestionar disponibilidad, ordenar la cola y avanzar estados. | Producto y Pedido. |

### Clase o módulo: Usuario y sesión

| Responsabilidades | Colaboraciones |
|---|---|
| Normalizar credenciales, aplicar rol, ruta y vigencia de sesión. | Administrador, Cajera y Cocina. |

### Clase o módulo: Reporte

| Responsabilidades | Colaboraciones |
|---|---|
| Validar rangos y resumir ventas, pagos, productos, devoluciones y motivos. | Pedido e Incidencia. |

## Correspondencia entre documentación y código

Cada caso usa el mismo identificador en este documento y en Vitest. Por ejemplo, `CP-HU01-03` puede buscarse directamente en `tests/hu-01-registrar-pedido.test.js`.
