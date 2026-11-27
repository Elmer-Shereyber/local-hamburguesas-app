# ÉPICA: Supervisión y Reportes

Permitir que el administrador gestione las cuentas de cajera y cocina, mantenga actualizado el catálogo de productos, y consulte las ganancias del negocio junto con el detalle de las devoluciones y reposiciones registradas.

---

## HU-10: Gestionar usuarios

- **Story Points:** 5
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como administrador, quiero crear y eliminar las cuentas de cajera y de cocina, para gestionar quién tiene acceso al sistema sin perder el historial de operaciones ya registrado.

### Criterios de aceptación

- **CA01. Roles gestionables:** el administrador puede crear como máximo una cuenta de Cajera y una de Cocina. El perfil de administrador ya está predefinido y no se crea desde aquí.
- **CA02. Creación por rol específico:** la interfaz presenta tarjetas dedicadas e independientes para Cajera y Cocina. El botón de creación se habilita únicamente en la tarjeta del rol que no esté creado, asignando dicho rol de forma fija y directa en el modal (sin selector de roles para evitar confusiones operativas). Si el rol ya cuenta con una cuenta activa, se muestra su estado "ACTIVA" con la opción de eliminarla.
- **CA03. Formato del usuario:** solo letras y números, sin espacios ni caracteres especiales, entre 4 y 20 caracteres. El sistema valida el formato en tiempo real mientras se escribe. La contraseña debe tener un mínimo de 6 caracteres, sin otro requisito de formato.
- **CA04. Usuario único:** no se permite un usuario ya existente entre las cuentas activas. La disponibilidad también se valida en tiempo real.
- **CA05. Autenticación por dominio fijo corporativo:** internamente, el sistema concatena el usuario con el dominio corporativo `@burger.local` para autenticar contra Firebase Authentication. Cajera y cocina inician sesión ingresando únicamente su nombre de usuario (o con el dominio si lo desean) y su contraseña.
- **CA06. Eliminar cuenta y purga de credenciales:** el administrador puede eliminar la cuenta de cajera o de cocina en cualquier momento. La eliminación purga de forma completa tanto el registro en Firestore como el usuario en Firebase Authentication (`deleteUser`), liberando el rol inmediatamente y permitiendo reutilizar el mismo nombre de usuario con una nueva contraseña sin conflictos de credenciales huérfanas.
- **CA07. Cierre forzado de sesión en tiempo real:** si la cuenta eliminada tenía una sesión activa en cualquier navegador o terminal, el sistema detecta de inmediato la baja mediante escucha en tiempo real de Firestore (y en su próxima acción o validación periódica), cerrando la sesión de forma forzada y redirigiendo al usuario a la pantalla de inicio de sesión con una alerta informativa.
- **CA08. Historial intacto:** eliminar o recrear una cuenta no elimina ni modifica los pedidos, reposiciones o devoluciones ya registrados. Esos registros conservan el nombre de usuario que los generó, como un dato de texto, sin depender de que la cuenta siga existiendo. Si el nombre de usuario se reutiliza, los registros antiguos y nuevos mostrarán el mismo texto, sin distinguir que se trató de personas distintas.
- **CA09. Sin recuperación propia:** cajera y cocina no tienen recuperación de contraseña; si la olvidan, el administrador elimina su cuenta y crea una nueva.

---

## HU-11: Gestionar productos

- **Story Points:** 5
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como administrador, quiero crear, modificar y eliminar los productos del menú, para mantener actualizado lo que la cajera puede vender y el área de cocina puede preparar.

### Criterios de aceptación

- **CA01. Crear producto:** el administrador ingresa nombre, precio (solo valores positivos) y tipo (*Con preparación* / *Servicio inmediato*). El sistema genera un identificador interno único, que el administrador no ve ni ingresa.
- **CA02. Nombre único:** no se permite un nombre que coincida con el de un producto activo existente, ignorando mayúsculas/minúsculas y espacios de más.
- **CA03. Disponible por defecto:** al crearse, el producto queda *Disponible*.
- **CA04. Modificar nombre y precio:** el administrador puede modificar el nombre y el precio de un producto existente, con la misma validación de unicidad del CA02. El identificador interno no cambia.
- **CA05. Tipo no editable:** el tipo de producto (*Con preparación* / *Servicio inmediato*) se define al crearlo y no puede modificarse después, para no afectar la lógica de estados de pedidos en curso. Si se necesita cambiar, se elimina el producto y se crea uno nuevo.
- **CA06. Pedidos ya registrados no se alteran:** modificar un producto no cambia los pedidos ya registrados que lo incluyen; conservan el nombre y precio tal como estaban al momento de la venta.
- **CA07. Eliminar producto:** al eliminarse, deja de mostrarse a la cajera y al área de cocina para nuevas selecciones. Su nombre queda libre para reutilizarse en un producto nuevo, sin relación con el eliminado.
- **CA08. Historial intacto:** eliminar un producto no elimina ni modifica los pedidos ya registrados que lo incluyen.
- **CA09. Reportes por identificador:** los reportes de ventas por producto agrupan por el identificador interno, no por el nombre, de modo que un producto renombrado sigue contándose como uno solo.

---

## HU-12: Consultar ganancias e incidencias

- **Story Points:** 8
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como administrador, quiero consultar las ganancias del negocio en un rango de fechas y ver el detalle de las devoluciones y reposiciones registradas, para tener visibilidad completa de las ventas y de las incidencias que las afectan.

### Criterios de aceptación

#### Filtro de fechas

- **CA01. Rango de fechas:** el administrador puede consultar información de cualquier rango de fechas, incluyendo días anteriores y el día actual, a diferencia de la cajera que solo ve el día actual.
- **CA02. Rango por defecto:** al ingresar al módulo, el sistema muestra por defecto los datos del día actual.
- **CA03. Pestañas separadas:** la información se organiza en dos pestañas: *Ganancias* e *Incidencias*. El rango de fechas seleccionado aplica a ambas.

#### Pestaña Ganancias

- **CA04. Total de ventas:** el sistema muestra el monto total vendido en el rango seleccionado, sumando el total de todos los pedidos cobrados. Las reposiciones sin costo no incrementan las ventas.
- **CA05. Desglose por modalidad de pago:** el sistema muestra cuánto se cobró en cada modalidad (Efectivo, Yape, Plin, Transferencia) dentro del rango seleccionado.
- **CA06. Ventas por producto y desglose de pedidos:** el sistema muestra las ventas agrupadas por producto (cantidad y monto acumulado por identificador interno) y, en la sección inferior de detalles, presenta el desglose ordenado de pedidos completos del día/rango con su correlativo de comprobante, tipo de pago, productos y clientes, integrando directamente las incidencias asociadas (reposiciones y notas de crédito de devolución).
- **CA07. Monto neto e impacto por fecha de reembolso:** el sistema muestra el total de devoluciones procesadas y el monto neto (ventas brutas menos reembolsos efectivos). Las devoluciones impactan financieramente el arqueo y balance en la fecha en que fueron efectivamente pagadas/procesadas por el administrador con su comprobante de pago, independientemente de la fecha en que se registró la solicitud original en caja.

#### Pestaña Incidencias

- **CA08. Listado de reposiciones:** el administrador puede ver todas las reposiciones registradas en el rango de fechas, con el pedido original, los productos afectados, el motivo y su condición de reposición sin costo.
- **CA09. Listado de devoluciones:** el administrador puede ver todas las devoluciones del rango, con su estado (*Solicitada* / *Procesada*), el pedido original, los productos afectados, el motivo, el monto y, si está procesada, el comprobante adjunto registrado en *Procesar devolución*.
- **CA10. Acceso al comprobante:** desde el listado de devoluciones procesadas, el administrador puede abrir o descargar el comprobante adjunto de cada una.
- **CA11. Resumen de motivos:** el sistema muestra un resumen con la cantidad de casos por motivo (por ejemplo, "Producto en mal estado: 5 casos"), calculado sobre el total de reposiciones y devoluciones del rango seleccionado, para identificar problemas recurrentes.

#### Restricciones

- **CA12. Solo lectura:** esta historia es de consulta; el procesamiento de devoluciones pendientes se realiza en *Procesar devolución*, no aquí.
- **CA13. Solo administrador:** únicamente el rol administrador accede a este módulo.
- **CA14. Sin exportación:** el sistema no ofrece exportar esta información a otros formatos; toda la consulta se realiza dentro del sistema.
