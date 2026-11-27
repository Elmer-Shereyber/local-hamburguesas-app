# Matriz de pruebas unitarias de las 15 historias de usuario

## Propósito

Esta matriz relaciona cada historia de usuario con las reglas aisladas, sus pruebas automatizadas y los comportamientos que no deben confundirse con una prueba unitaria. La suite se ejecuta con Vitest y no necesita navegador ni conexión a Firebase.

## Resumen ejecutable

```powershell
npm ci
npm run test:run
npm run test:coverage
```

Resultado de referencia del 27 de noviembre de 2026:

- 8 archivos de prueba aprobados;
- 184 pruebas aprobadas y 0 fallidas;
- 88.45 % de sentencias;
- 78.23 % de ramas;
- 98.97 % de funciones;
- 94.83 % de líneas.

Los porcentajes corresponden a `public/shared/*-rules.js` y `public/shared/utils.js`. Firebase, el DOM y la navegación se excluyen deliberadamente porque requieren otros niveles de prueba.

## Ampliación a DOM, integración y E2E

Después de la fase unitaria se añadieron los niveles que faltaban:

| Nivel | Archivo o herramienta | Casos | Estado verificado |
|---|---|---:|---|
| Unitarias de reglas y utilidades | Vitest | 184 | 184 aprobadas |
| Contratos DOM de las 15 HU | `tests/dom/html-contracts.test.js` | 16 | 16 aprobadas |
| API DNI/RUC con proveedor simulado | `tests/persona-api.test.js` | 6 | 6 aprobadas |
| Firestore Emulator: permisos, CRUD y tiempo real | `firestore.integration.test.js` | 10 | 10 aprobadas |
| Authentication Emulator: acceso, error, logout y recuperación | `auth.integration.test.js` | 5 | 5 aprobadas |
| Navegador real: rutas y adaptación 375/768/1440 px | `e2e/static-pages.spec.js` | 14 | 14 aprobadas en Chromium sobre Windows |
| Navegador real autenticado: acceso, pedido, cocina, incidencias, catálogo y reportes | `e2e/functional-flow.spec.js` | 8 | 8 aprobadas en Chromium sobre Windows |

Total ejecutado y aprobado: **243 pruebas** (206 de Vitest, 15 de Firebase Emulator y 22 E2E con Playwright). Las E2E fueron certificadas el 27 de noviembre de 2026 en Chromium sobre Windows. Además de rutas y adaptación visual, ya se comprueban autenticación, permisos de navegación, pedido, comprobante, cocina, reposición, devolución, voucher, nota de crédito, catálogo, disponibilidad en tiempo real y reportes.

Comandos:

```powershell
npm run test:run
npm run test:integration
npm run test:e2e:install
npm run test:e2e
```

## Trazabilidad por historia

| HU | Historia | Módulo bajo prueba | Archivo de pruebas | Reglas unitarias cubiertas | Pruebas no unitarias necesarias |
|---|---|---|---|---|---|
| HU-01 | Registrar pedido | `pedido-rules.js` | `pedido-rules.test.js` | Disponibilidad, cantidad 1–10, detalle hasta 300, total, modalidades, pago híbrido con dos medios, validación y borrador | Render del carrito, `sessionStorage`, navegación y sincronización del catálogo |
| HU-02 | Emitir comprobante | `comprobante-rules.js` | `comprobante-rules.test.js` | Tipo, boleta simple hasta S/ 700, DNI/RUC, contribuyente activo/habido, IGV, serie/correlativo y datos del cliente | Consulta real RENIEC/SUNAT, transacción correlativa, escritura en Firestore, PDF/impresión y visibilidad en cocina |
| HU-03 | Consultar pedidos | `consulta-pedidos-rules.js` | `consulta-pedidos-rules.test.js` | Limpieza/búsqueda de código, día actual, diez recientes, estado general, entrega, acciones e indicadores de incidencia | Listener en tiempo real, modal de detalle, confirmación persistida y actualización entre pantallas |
| HU-04 | Registrar reposición | `incidencia-rules.js` | `incidencia-rules.test.js` | Pedido entregado, unidades reclamables, motivo, observación y reposición estricta del mismo producto disponible | Creación vinculada en Firestore, prioridad real en cocina y actualización atómica del pedido original |
| HU-05 | Solicitar devolución | `incidencia-rules.js` | `incidencia-rules.test.js` | Cantidad reclamable, monto, Yape/Plin, cuenta/CCI, titular, contacto y validación integral | Persistencia de la solicitud, trazabilidad con el pedido y visibilidad para administración |
| HU-06 | Procesar devolución | `incidencia-rules.js` | `incidencia-rules.test.js` | Voucher obligatorio, no reprocesar, destino corregido y nota de crédito 06/07 | Carga real de archivo, conservación de datos originales, transacción, PDF y seguridad por rol |
| HU-07 | Gestionar disponibilidad | `cocina-rules.js` | `cocina-rules.test.js` | Alternancia inmutable y validación del producto | Interruptor DOM y propagación en tiempo real entre cocina y caja |
| HU-08 | Visualizar pedidos en cocina | `cocina-rules.js` | `cocina-rules.test.js` | Estados visibles y orden de cola: en preparación, reposición y pendiente | Listener Firestore, tarjetas KDS, reloj visual y desaparición después de entrega |
| HU-09 | Actualizar estados | `cocina-rules.js` | `cocina-rules.test.js` | Ciclos con preparación/inmediato, no retroceso y acción general | Escritura simultánea, actualización reactiva y concurrencia entre dispositivos |
| HU-10 | Gestionar usuarios | `admin-rules.js` | `admin-rules.test.js` | Usuario operativo, contraseña mínima, correo corporativo y máximo uno por rol | Firebase Auth, baja forzada, sesión en tiempo real y administración segura de credenciales |
| HU-11 | Gestionar productos | `admin-rules.js` | `admin-rules.test.js` | Normalización, duplicados, precio, tipo y edición del mismo registro | Formularios, altas/modificaciones/baja lógica y conservación del historial en Firestore |
| HU-12 | Consultar ganancias e incidencias | `admin-rules.js` | `admin-rules.test.js` | Rango de fechas, ventas, pagos, cantidades, devoluciones, neto y motivos | Consultas por fecha efectiva, gráficos, exportación y reconciliación con datos reales |
| HU-13 | Iniciar sesión | `auth-rules.js` | `auth-rules.test.js` | Normalización del identificador, error genérico, rol, ruta, cuenta activa y token de sesión | Firebase Auth, persistencia del token, reglas Firestore y redirecciones del navegador |
| HU-14 | Cerrar sesión | `auth-rules.js` | `auth-rules.test.js` | Una sesión sin token deja de ser válida | `signOut`, limpieza real del almacenamiento e historial del navegador |
| HU-15 | Recuperar contraseña | `auth-rules.js` | `auth-rules.test.js` | Recuperación permitida solo al administrador | Envío real del correo, enlace Firebase, cambio de clave e invalidación de sesiones anteriores |

## Distribución de las 184 pruebas

| Suite | Cantidad |
|---|---:|
| `pedido-rules.test.js` | 56 |
| `comprobante-rules.test.js` | 20 |
| `consulta-pedidos-rules.test.js` | 13 |
| `incidencia-rules.test.js` | 24 |
| `cocina-rules.test.js` | 11 |
| `admin-rules.test.js` | 15 |
| `auth-rules.test.js` | 13 |
| `utils.test.js` | 32 |
| **Total** | **184** |

Las pruebas generadas con `it.each` cuentan una vez por cada dato de la tabla; por eso la cantidad total es mayor que el número visible de bloques `it` escritos en los archivos.

## Decisiones de reconciliación

| Discrepancia | Clasificación | Decisión aplicada |
|---|---|---|
| HU-01 indicaba 50 caracteres, mientras HTML y JavaScript usaban 300 | Documentación desactualizada | Se conserva 300 y se actualizan HU, regla y límites 300/301 |
| Pago híbrido aceptaba un único medio aunque la interfaz exige dos o más | Defecto de implementación | La regla y la interfaz exigen al menos dos montos positivos cuya suma sea exacta |
| Incidencias describían productos alternativos y cadenas de reposición | Documentación desactualizada | Se documenta el flujo vigente: mismo producto, sin costo y una sola reposición; después solo procede devolución |
| La cabecera del modal aún mencionaba alternativas | Texto de interfaz desactualizado | Se alinea con la reposición estricta del mismo producto |

## Riesgos y pendientes detectados

1. `public/shared/db.js` contiene operaciones de múltiples documentos que deberían revisarse como transacciones para evitar inconsistencias por concurrencia, especialmente correlativos e incidencias.
2. La gestión de usuarios operativos no debe conservar contraseñas legibles en Firestore. La solución correcta requiere un entorno administrativo seguro, por ejemplo una función backend con Firebase Admin SDK; no debe resolverse desde el navegador.
3. Las reglas de sesión única de HU-13 y la invalidación de sesiones después de HU-15 están cubiertas como dominio, pero falta confirmar su integración completa con Firebase.
4. Las reglas de seguridad sí cuentan ahora con pruebas automatizadas en Firestore Emulator para administrador, cajera, cocina y usuarios no autenticados. Aun así, las reglas del archivo de prueba deben contrastarse antes de desplegarlas en el proyecto real.
5. Las consultas de DNI/RUC ya se prueban con un proveedor simulado y errores controlados. La comprobación contra el proveedor real debe mantenerse como prueba manual o integración controlada para evitar que una caída externa rompa la suite.
6. `firestore.test.rules` existe exclusivamente para el emulador y no se despliega automáticamente. Antes de usar reglas equivalentes en producción se debe contrastar cada permiso con el proyecto Firebase real.
7. Las E2E funcionales ya conectan navegador, Auth Emulator y Firestore Emulator para pedido e incidencias. Todavía faltan recorridos equivalentes de productos, usuarios, disponibilidad, reportes y sesión única.

## Interpretación correcta del resultado

La ejecución verde demuestra las reglas aisladas, los contratos DOM, 15 integraciones con Firebase Emulator y 22 verificaciones en Chromium, incluidas ocho funcionales autenticadas. Todavía no demuestra por sí sola que el proyecto Firebase real, el proveedor externo o varios dispositivos funcionen juntos. Para afirmar que cada HU está completamente aceptada se deben completar los recorridos funcionales indicados en los pendientes.
