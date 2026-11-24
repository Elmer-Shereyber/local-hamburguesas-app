# ÉPICA: Gestión de Preparación y Disponibilidad

Permitir que el área de cocina visualice los pedidos en curso, actualice el estado de preparación de cada producto y gestione la disponibilidad del menú, para que la cajera y el cliente conozcan en todo momento el avance real de cada pedido.

## Alcance y supuestos — Épica Gestión de Preparación y Disponibilidad

- Un pedido es visible para cocina solo después de emitido su comprobante (estado *Pendiente*).
- El estado de un producto dentro de un pedido es único para toda su cantidad; no se maneja preparación parcial por unidades.
- El estado general del pedido se calcula automáticamente a partir del estado de sus productos (Pendiente, En preparación, Listo); cocina no fija el estado general de forma manual, solo el de cada producto.
- La disponibilidad de un producto es un interruptor manual (disponible / no disponible) que activa o desactiva cocina; no hay control de inventario ni descuento de insumos.
- Cocina no confirma la entrega al cliente; esa acción es exclusiva de la cajera.
- Los pedidos de reposición se muestran en la pantalla de cocina como cualquier otro pedido, con la etiqueta *Reposición* y prioridad al inicio de la cola sobre los pedidos *Pendientes*.

---

## HU-07: Gestionar disponibilidad de productos

- **Story Points:** 3
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como área de cocina, quiero marcar cada producto del menú como disponible o no disponible, para que la cajera solo pueda vender lo que realmente se puede preparar en el momento.

### Criterios de aceptación

#### Listado

- **CA01. Listado de productos:** el sistema muestra el listado completo de productos del menú, sin orden específico, cada uno con su nombre, precio y estado actual de disponibilidad (*Disponible* / *No disponible*).
- **CA02. Cambio de estado:** junto a cada producto hay un control que permite alternar su estado entre *Disponible* y *No disponible* con una sola acción.

#### Efecto del cambio

- **CA03. Aplicación inmediata:** el cambio se refleja de inmediato para la cajera, tanto en *Registrar pedido* (producto deshabilitado si no está disponible) como en *Registrar reposición* (producto no ofrecido como reemplazo si no está disponible).
- **CA04. No afecta pedidos ya registrados:** marcar un producto como *No disponible* no modifica los pedidos que ya lo incluyen y que están en curso o entregados.
- **CA05. Sin justificación obligatoria:** cocina puede cambiar la disponibilidad en cualquier momento, sin necesidad de indicar un motivo.
- **CA06. Persistencia del estado:** el estado de disponibilidad no se reinicia automáticamente al cambiar de día; se mantiene tal como quedó, y su actualización antes de abrir el local es responsabilidad operativa de cocina.

#### Restricciones

- **CA07. Solo área de cocina:** únicamente el rol de cocina cambia la disponibilidad. La cajera y el administrador solo la consultan; crear o eliminar productos del catálogo corresponde al administrador, en otra historia.
- **CA08. Todos los productos visibles:** el listado no se filtra ni se pagina; cocina ve todos los productos a la vez.

---

## HU-08: Visualizar pedidos en cocina

- **Story Points:** 3
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como área de cocina, quiero ver los pedidos en curso con sus productos y cantidades, ordenados según su prioridad, para saber qué preparar y en qué orden.

### Criterios de aceptación

#### Listado

- **CA01. Pedidos visibles:** el sistema muestra los pedidos en estado *Pendiente*, *En preparación* y *Listo*. Los *Entregados* no se muestran.
- **CA02. Datos por pedido:** cada pedido muestra su código, hora de registro, lista de productos con su cantidad y estado individual, y el detalle general si la cajera lo ingresó.
- **CA03. Orden de la cola:** entre los pedidos que aún no están *En preparación*, los de reposición se muestran primero, ordenados por hora de registro entre ellos, y luego los demás pedidos *Pendientes*, del más antiguo al más reciente. Los pedidos *En preparación* mantienen su posición según el momento en que cocina los tomó.
- **CA04. Sin reordenar en marcha:** una vez que un pedido pasa a *En preparación*, no cambia de posición en la cola por la llegada de nuevos pedidos o reposiciones.
- **CA05. Identificador visual de reposición:** los pedidos de reposición se distinguen con un color distintivo, además de la etiqueta *Reposición*, para que cocina los identifique de un vistazo.

#### Actualización

- **CA06. Tiempo real:** un pedido nuevo aparece automáticamente en la pantalla de cocina, sin necesidad de recargar.
- **CA07. Salida de la pantalla:** cuando la cajera confirma la entrega de un pedido, este desaparece de inmediato.

#### Restricciones

- **CA08. Solo lectura de datos del pedido:** desde esta historia, cocina solo visualiza los pedidos; el cambio de estado de los productos se define en otra historia.
- **CA09. Sin historial:** no se muestran pedidos entregados ni de días anteriores.

---

## Clasificar los productos en dos tipos

Esto se define en el catálogo de productos (una decisión del administrador al crear el producto, no de esta historia, pero hay que dejarlo como dependencia):

- **Con preparación** (hamburguesas, papas, etc.): ciclo completo de 3 estados → *Pendiente → En preparación → Listo*.
- **Servicio inmediato** (gaseosas, jugos servidos de un contenedor, etc.): ciclo de 2 estados → *Pendiente → Listo*, sin pasar por "En preparación", porque no hay una etapa intermedia real que mostrar.

Con esto, un producto de servicio inmediato no "miente" mostrando un estado que no existe en la práctica, y cocina lo marca *Listo* con un solo toque.

---

## HU-09: Actualizar estado de productos

- **Story Points:** 3
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como área de cocina, quiero actualizar el estado de cada producto dentro de un pedido conforme avanzo en su preparación, para que la cajera pueda ver el progreso real del pedido y el cliente sepa cuándo está listo.

### Criterios de aceptación

#### Tipos de producto

- **CA01. Ciclo según tipo de producto:** cada producto tiene un tipo definido en el catálogo (fuera del alcance de esta historia): *Con preparación* (ciclo *Pendiente → En preparación → Listo*) o *Servicio inmediato* (ciclo *Pendiente → Listo*, sin estado intermedio).

#### Cambio de estado

- **CA02. Progreso secuencial:** el estado de un producto solo avanza hacia adelante según su ciclo correspondiente. No se puede saltar etapas en un producto *Con preparación*.
- **CA03. Cambio manual individual:** cocina cambia el estado de cada producto con una acción directa (tocar el producto o su botón), sin pasos adicionales.
- **CA04. Acción general para productos con preparación:** cocina puede usar un botón "Iniciar preparación del pedido" que mueve a *En preparación* todos los productos *Con preparación* que estén en *Pendiente*, en un solo paso. Solo está disponible si ninguno de esos productos ya avanzó de estado. Los productos de *Servicio inmediato* no se ven afectados por este botón; se marcan individualmente.
- **CA05. Aplica a toda la cantidad:** el cambio de estado afecta a la cantidad completa de ese producto dentro del pedido; no se maneja preparación parcial por unidades.

#### Efecto en el pedido

- **CA06. Estado general automático:** el cambio de estado de un producto recalcula automáticamente el estado general del pedido, según las reglas ya definidas en *Consultar pedidos*.
- **CA07. Sin acción sobre el estado general:** cocina no fija el estado general del pedido de forma manual; es siempre un resultado del estado de sus productos.
- **CA08. Visibilidad inmediata:** el cambio se refleja en tiempo real en la pantalla de cocina y en la consulta de la cajera.

#### Restricciones

- **CA09. Sin retroceso:** una vez que un producto cambia de estado, no puede regresar a un estado anterior. Si cocina se equivoca, la corrección se maneja de forma operativa (por ejemplo, verificando antes de tocar el botón), no mediante una función de retroceso en el sistema.
- **CA10. Solo pedidos visibles en cocina:** cocina solo puede cambiar estados de pedidos en *Pendiente*, *En preparación* o *Listo*. Un pedido *Entregado* ya no aparece en su pantalla y no puede modificarse.
- **CA11. Sin confirmación de entrega:** cocina no puede marcar un pedido como *Entregado*; esa acción es exclusiva de la cajera, una vez que el pedido está *Listo*.
