# Guía y bitácora de pruebas unitarias automatizadas

## Proyecto

- **Sistema:** Burger Local
- **Repositorio de trabajo:** `KohakuAzureFire/local-hamburguesas-app`
- **Rama:** `pruebas-unitarias-guiadas`
- **Inicio de la práctica:** 27 de noviembre de 2026
- **Modalidad:** inició como práctica guiada y luego, por decisión del estudiante, se completó la implementación automatizada de las 15 HU, conservando esta bitácora como material de revisión y aprendizaje.

## Objetivo

Aprender a diseñar, escribir, ejecutar e interpretar pruebas unitarias automatizadas sobre el sistema Burger Local. Esta bitácora permitirá que otro integrante del equipo revise posteriormente:

- conceptos estudiados;
- decisiones tomadas;
- comandos ejecutados;
- archivos creados o modificados;
- casos de prueba implementados;
- resultados obtenidos;
- errores encontrados y sus correcciones;
- cobertura alcanzada;
- conclusiones y trabajo pendiente.

## Alcance previsto

1. Preparación del entorno con Node.js, npm y Vitest.
2. Primera suite sobre funciones puras de `public/shared/utils.js`.
3. Pruebas de valores válidos, inválidos, límites y casos excepcionales.
4. Separación gradual de reglas de negocio que actualmente están acopladas al DOM.
5. Pruebas unitarias de pedidos, comprobantes, cocina, incidencias, administración y autenticación.
6. Uso de mocks para dependencias externas.
7. Medición de cobertura.
8. Diferenciación entre pruebas unitarias, de DOM, integración y extremo a extremo.

## Estado inicial del repositorio

Al comenzar la práctica se observó que el proyecto:

- usa HTML, CSS y JavaScript con módulos ES;
- utiliza Firebase Authentication y Cloud Firestore;
- no contiene todavía `package.json`;
- no tiene framework de pruebas configurado;
- no contiene una carpeta de pruebas;
- concentra varias reglas de negocio dentro de manejadores del DOM;
- sí dispone de funciones puras inicialmente comprobables en `public/shared/utils.js`.

## Registro de sesiones

### Sesión 01 — Verificación del entorno

**Fecha:** 27 de noviembre de 2026

El estudiante ejecutó en PowerShell:

```powershell
node -v
npm -v
```

Resultados:

```text
v24.16.0
11.13.0
```

Conclusión:

- Node.js es compatible con la versión actual de Vitest.
- npm está disponible.
- El equipo puede continuar con la preparación del proyecto.
- Antes de instalar dependencias se debe comprobar si la carpeta local es un clon Git o una descarga ZIP.

### Sesión 02 — Preparación correcta del repositorio Git

**Fecha:** 27 de noviembre de 2026

La primera copia local provenía de una descarga ZIP denominada `local-hamburguesas-app-main`. Al ejecutar `git status` desde esa ubicación, Git encontró un repositorio inicializado accidentalmente en una carpeta superior del perfil de Windows. Como consecuencia, intentó enumerar archivos personales y carpetas protegidas.

**Advertencia de seguridad operativa:** no se debe ejecutar `git add .`, `git commit` ni `git clean` dentro de la copia ZIP ni desde el perfil `C:\\Users\\kohah`. Esta situación no afectó el repositorio remoto.

Se conservó la carpeta anterior como respaldo y se clonó correctamente la rama de trabajo:

```powershell
cd C:\Users\kohah\OneDrive\Desktop
git clone -b pruebas-unitarias-guiadas https://github.com/KohakuAzureFire/local-hamburguesas-app.git local-hamburguesas-app-pruebas
cd local-hamburguesas-app-pruebas
git status
```

Resultado comprobado:

```text
On branch pruebas-unitarias-guiadas
Your branch is up to date with 'origin/pruebas-unitarias-guiadas'.

nothing to commit, working tree clean
```

Conclusión:

- la copia de trabajo está conectada correctamente al fork;
- se encuentra en la rama destinada a la práctica;
- el árbol de trabajo está limpio;
- ya es seguro instalar y registrar las dependencias de pruebas.

### Sesión 03 — Inicialización de npm e instalación de Vitest

**Fecha:** 27 de noviembre de 2026

El estudiante sincronizó primero la actualización de la bitácora mediante `git pull --ff-only`. La actualización se aplicó como avance rápido, sin conflictos.

Después ejecutó:

```powershell
npm init -y
npm install --save-dev vitest
```

Resultados:

- se crearon `package.json` y `package-lock.json`;
- se instaló Vitest `5.1.2` como dependencia de desarrollo;
- se añadieron 36 paquetes;
- npm auditó 37 paquetes;
- se encontraron **0 vulnerabilidades**.

Observaciones:

- `npm init -y` generó inicialmente el script de prueba de ejemplo que termina con error porque todavía no existe un ejecutor configurado;
- el archivo quedó con `"type": "commonjs"`, pero el código del proyecto usa módulos ES mediante `import` y `export`, por lo que se cambiará a `"type": "module"`;
- PowerShell mostró caracteres como `atenciÃ³n` al utilizar `Get-Content` sin especificar UTF-8. Se comprobará el archivo con `Get-Content -Encoding utf8 package.json`.

### Sesión 04 — Primera prueba unitaria automatizada

**Fecha:** 27 de noviembre de 2026

Se configuró el proyecto para usar módulos ES y Vitest:

```json
{
  "scripts": {
    "test": "vitest"
  },
  "type": "module",
  "devDependencies": {
    "vitest": "^5.1.2"
  }
}
```

Se creó `tests/utils.test.js` para probar `formatCurrency` de `public/shared/utils.js`.

#### Primer intento

Comando:

```powershell
npm test -- --run
```

Resultado:

```text
tests/utils.test.js (0 test)
Error: No test suite found in file
Test Files  1 failed
Tests       no tests
```

Diagnóstico: el archivo estaba abierto en VS Code, pero aún no se había guardado. Vitest encontró el archivo físico vacío y, por ello, no registró ninguna llamada a `describe` o `it`.

Corrección: guardar `tests/utils.test.js` y ejecutar nuevamente el mismo comando.

#### Segundo intento

Resultado:

```text
✓ tests/utils.test.js (1 test) 2ms
  ✓ formatCurrency (1)
    ✓ formatea un número entero con dos decimales 1ms

Test Files  1 passed (1)
Tests       1 passed (1)
Duration    204ms
```

#### Prueba registrada

| Campo | Valor |
|---|---|
| Identificador | PU-UTIL-001 |
| Requisito asociado | Utilidad transversal de presentación monetaria |
| Unidad bajo prueba | `formatCurrency` |
| Objetivo | Comprobar que un entero se presenta como soles con dos decimales |
| Entrada | `15` |
| Resultado esperado | `S/ 15.00` |
| Resultado obtenido | `S/ 15.00` |
| Estado | Aprobada |
| Observaciones | Primera ejecución exitosa después de guardar el archivo |

Aprendizaje: el ejecutor, el archivo y la prueba son elementos diferentes. Que Vitest encuentre un archivo no significa que haya encontrado pruebas dentro de él.

### Sesión 05 — Segundo caso y diferencia entre modificar y añadir una prueba

**Fecha:** 27 de noviembre de 2026

El objetivo fue conservar `PU-UTIL-001` y añadir `PU-UTIL-002` para comprobar `formatCurrency(18.5)`.

#### Incidencia 1: marcador copiado como código

Se copiaron literalmente los puntos suspensivos `...` de una plantilla explicativa. JavaScript no acepta `...` como una sentencia independiente y Vitest informó:

```text
RolldownError: Parse failure
Unexpected token
Tests no tests
```

Aprendizaje: las plantillas conceptuales deben reemplazarse por instrucciones reales antes de ejecutar. Un error de análisis sintáctico impide que Vitest registre incluso las pruebas válidas del archivo.

#### Incidencia 2: se modificó la prueba existente

Después de corregir la sintaxis, se sustituyó la entrada de la primera prueba por `18.5` y la expectativa por `S/ 18.50`, pero se mantuvo un solo bloque `it`. Vitest ejecutó correctamente una prueba, no dos.

Aprendizaje: cambiar los datos de un bloque `it` modifica un caso existente; para añadir otro caso se necesita un segundo bloque `it`.

También se detectó que el título decía “número entero” mientras la entrada era decimal. Una prueba puede pasar técnicamente y aun así estar descrita incorrectamente.

#### Resultado final

```text
✓ tests/utils.test.js (2 tests) 4ms
  ✓ formatCurrency (2)
    ✓ formatea un número entero con dos decimales 2ms
    ✓ formatea un decimal agregando el cero faltante 0ms

Test Files  1 passed (1)
Tests       2 passed (2)
Duration    207ms
```

#### Pruebas registradas

| ID | Entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---:|---|---|---|
| PU-UTIL-001 | `15` | `S/ 15.00` | `S/ 15.00` | Aprobada |
| PU-UTIL-002 | `18.5` | `S/ 18.50` | `S/ 18.50` | Aprobada |

### Sesión 06 — Primer punto de control en Git

**Fecha:** 27 de noviembre de 2026

Se seleccionaron explícitamente los archivos de configuración y pruebas:

```powershell
git add package.json package-lock.json tests/utils.test.js
git commit -m "test: configurar Vitest y agregar pruebas de moneda"
git push origin pruebas-unitarias-guiadas
```

Resultado:

- commit corto: `70ce9d6`;
- commit completo: `70ce9d6170bd1fc04b9bcaac67efbf90e6b42dcc`;
- 3 archivos nuevos;
- 1230 líneas añadidas, principalmente por el archivo de bloqueo de dependencias;
- publicación remota completada en `pruebas-unitarias-guiadas`.

Se verificó posteriormente mediante GitHub que el commit remoto conserva el mensaje correcto y que `tests/utils.test.js` contiene los dos casos aprobados.

Durante `git add` Windows mostró la advertencia `LF will be replaced by CRLF`. No representa un error de las pruebas ni una corrupción: informa sobre la normalización de finales de línea entre Git y Windows.

## Estrategia de cobertura por historias de usuario

A partir de este punto, el trabajo se organiza según las 15 historias de usuario de la carpeta `Documentacion`. Para cada HU se seguirá el mismo ciclo:

1. comparar criterios de aceptación con HTML y JavaScript;
2. determinar si cada discrepancia corresponde a documentación desactualizada, defecto de implementación o decisión pendiente;
3. reconciliar el requisito antes de escribir o modificar pruebas;
4. registrar cumplimientos, discrepancias y riesgos;
5. clasificar cada criterio como prueba unitaria, DOM, integración o extremo a extremo;
6. extraer reglas puras cuando estén acopladas a la interfaz o Firebase;
7. escribir la suite completa de la etapa;
8. ejecutar y analizar resultados;
9. corregir defectos sin alterar arbitrariamente el requisito;
10. medir cobertura y crear un commit.

Orden de trabajo:

| Etapa | Historia | Tema |
|---:|---|---|
| 1 | HU-01 | Registrar pedido |
| 2 | HU-02 | Emitir comprobante |
| 3 | HU-03 | Consultar pedidos |
| 4 | HU-04 | Registrar reposición |
| 5 | HU-05 | Solicitar devolución |
| 6 | HU-06 | Procesar devolución |
| 7 | HU-07 | Gestionar disponibilidad |
| 8 | HU-08 | Visualizar pedidos en cocina |
| 9 | HU-09 | Actualizar estados de productos |
| 10 | HU-10 | Gestionar usuarios |
| 11 | HU-11 | Gestionar productos |
| 12 | HU-12 | Consultar ganancias e incidencias |
| 13 | HU-13 | Iniciar sesión |
| 14 | HU-14 | Cerrar sesión |
| 15 | HU-15 | Recuperar contraseña |

## Auditoría previa de HU-01 — Registrar pedido

Se compararon `Documentacion/1_Gestionar_Pedidos.md`, `public/cajera/registrar-pedido.html` y `public/cajera/registrar-pedido.js`.

| Criterio | Estado observado | Evidencia y decisión de prueba |
|---|---|---|
| CA01 Selección disponible | Implementado en interfaz | Solo los productos disponibles reciben evento de selección y los que dejan de estar disponibles se retiran del carrito. Requiere separar la regla de selección y posteriormente probar el DOM. |
| CA02 Mínimo un producto | Implementado, acoplado | `validarFormulario` exige `carrito.length > 0`. Se extraerá una regla pura. |
| CA03 Cantidad 1–10 | Implementado, acoplado | Los botones impiden superar 10 y eliminan al llegar a 0. Falta una validación de dominio importable y resistente a llamadas externas a la UI. |
| CA04 Detalle opcional | **Documentación desactualizada** | El HTML, la etiqueta y el contador implementan coherentemente un máximo de 300 caracteres. Se conservará el comportamiento actual y se actualizarán la HU y las pruebas para cubrir 0, 299, 300 y 301 caracteres. |
| CA05 Cálculo automático | Implementado, acoplado | Se suma `precio × cantidad` dentro de `renderCarrito`. Se extraerá `calcularTotalPedido`. |
| CA06 Modalidad permitida | Parcial | El HTML ofrece las cinco modalidades correctas, pero JavaScript solo comprueba que el valor no esté vacío. Se añadirá una lista blanca de modalidades. |
| CA07 Pago híbrido exacto | **Defecto de implementación** | La propia interfaz indica “2 o más medios”, pero la validación acepta que un solo medio cubra el total. Se mantendrá el requisito de dos medios y se corregirá la lógica. |
| CA08 Sin verificación externa | Cumple | El registro solo conserva la modalidad declarada. No debe introducirse ninguna dependencia bancaria en pruebas unitarias. |
| CA09 Campos obligatorios | Parcial | Se controla carrito y modalidad; otras reglas dependen solo de restricciones HTML. Se centralizará la validación. |
| CA10 Borrador no visible en cocina | Cumple | El pedido permanece en `sessionStorage` y no se escribe en Firestore hasta emitir el comprobante. La creación del borrador podrá probarse de forma unitaria; la invisibilidad en cocina corresponde a integración. |

### Decisión técnica para HU-01

Se creará un módulo puro de reglas de pedido, independiente del DOM y Firebase. Incluirá como mínimo:

- validación de disponibilidad;
- validación de cantidad;
- validación de detalle;
- cálculo del total;
- validación de modalidad;
- suma y validación del pago híbrido;
- validación integral del borrador;
- creación del snapshot de productos.

Las pruebas unitarias cubrirán entradas normales, límites e inválidas. Las verificaciones visuales y de persistencia quedarán identificadas para sus niveles correspondientes, evitando llamar “unitaria” a una prueba que realmente depende del navegador o de Firestore.

### Sesión 07 — HU-01A: reglas puras y suite automatizada

**Fecha:** 27 de noviembre de 2026

Se crearon localmente:

- `public/shared/pedido-rules.js`;
- `tests/pedido-rules.test.js`.

El módulo separa del DOM y Firebase las reglas de disponibilidad, cantidades, detalle, total, modalidades, pago híbrido, validación integral, snapshot y borrador del pedido.

Ejecución:

```powershell
npm test -- --run
```

Resultado:

```text
✓ tests/utils.test.js (2 tests) 5ms
✓ tests/pedido-rules.test.js (56 tests) 12ms

Test Files  2 passed (2)
Tests       58 passed (58)
Duration    243ms
```

No se encontraron fallos en la suite. Las 56 pruebas del módulo incluyen las iteraciones generadas por `it.each`: cada entrada de una tabla parametrizada cuenta como una prueba independiente.

#### Trazabilidad unitaria de HU-01A

| Criterio | Reglas cubiertas | Resultado |
|---|---|---|
| CA01 | producto disponible, no disponible e inexistente | Aprobado |
| CA02 | carrito vacío y con productos | Aprobado |
| CA03 | límites 1 y 10; valores 0, 11, negativos, decimales y tipos inválidos | Aprobado |
| CA04 | límites reconciliados de 300 y 301 caracteres | Aprobado |
| CA05 | uno o varios productos, estructura del carrito, redondeo y entradas inválidas | Aprobado |
| CA06 | cinco modalidades permitidas y modalidades desconocidas | Aprobado |
| CA07 | suma, dos medios, céntimos, monto incompleto, excedido, negativo y no numérico | Aprobado |
| CA08 | ausencia deliberada de verificación bancaria en el módulo | Conforme al alcance |
| CA09 | pedido válido, híbrido válido, múltiples errores y campos obligatorios | Aprobado |
| CA10 | snapshot independiente y borrador sin escritura en Firebase | Aprobado a nivel unitario |

Estado histórico de la sesión: **HU-01A aprobada**. Posteriormente se integraron las reglas con la interfaz, se reconcilió el límite de 300 caracteres y se ejecutó la regresión final.

### Corrección de criterio — documentación desactualizada

Durante la preparación de HU-01B se confirmó que varias mejoras del código no fueron trasladadas a la documentación. Por ello, la documentación no se considerará automáticamente superior al código. Cada discrepancia se resolverá usando evidencia de consistencia entre interfaz, lógica, README y finalidad operativa.

Para CA04, el máximo de **300 caracteres** aparece de forma coherente en la etiqueta, el atributo `maxlength` y el contador de la interfaz. Se clasifica como cambio funcional intencional no documentado. Se conservará 300 y se actualizarán tanto la HU como `pedido-rules.js` y sus pruebas.

Para el pago híbrido, la interfaz dice explícitamente “2 o más medios” mientras la lógica antigua permitía uno. Esto se clasifica como defecto de implementación, no como documentación obsoleta.

### Sesión 08 — Integración y cierre de HU-01

**Fecha:** 27 de noviembre de 2026

Se integró `pedido-rules.js` con `public/cajera/registrar-pedido.js`. La interfaz ahora usa las mismas funciones probadas para cantidades, total, pago híbrido, validación integral y creación del borrador. También se actualizó CA04 a 300 caracteres en la historia y en las pruebas de frontera.

Decisiones aplicadas:

- se aceptan exactamente 300 caracteres y se rechazan 301;
- Híbrido exige dos o más medios con monto positivo;
- la suma debe coincidir con el total a nivel de céntimos;
- las modalidades se validan mediante una lista permitida;
- no se escribe en Firebase hasta emitir el comprobante.

### Sesión 09 — Reglas automatizadas de HU-02 a HU-15

**Fecha:** 27 de noviembre de 2026

Se añadieron seis módulos puros y sus suites:

| Dominio | Módulo | Suite | HU |
|---|---|---|---|
| Comprobantes | `comprobante-rules.js` | `comprobante-rules.test.js` | HU-02 |
| Consulta | `consulta-pedidos-rules.js` | `consulta-pedidos-rules.test.js` | HU-03 |
| Incidencias | `incidencia-rules.js` | `incidencia-rules.test.js` | HU-04 a HU-06 |
| Cocina | `cocina-rules.js` | `cocina-rules.test.js` | HU-07 a HU-09 |
| Administración | `admin-rules.js` | `admin-rules.test.js` | HU-10 a HU-12 |
| Autenticación | `auth-rules.js` | `auth-rules.test.js` | HU-13 a HU-15 |

Además, `utils.test.js` pasó de 2 a 32 pruebas para cubrir moneda, fechas, códigos, estados, alertas, clases, números en letras y normalización de comprobantes.

La documentación de reposiciones también se alineó con el código vigente: solo se repone el mismo producto, sin costo, una sola vez; si no está disponible o la reposición no satisface, corresponde devolución.

### Sesión 10 — Cobertura y regresión completa

**Fecha:** 27 de noviembre de 2026

Se instaló `@vitest/coverage-v8`, se creó `vitest.config.js` y se agregaron los scripts reproducibles:

```powershell
npm run test:run
npm run test:coverage
```

Resultado final:

```text
Test Files  8 passed (8)
Tests       184 passed (184)
Failures    0
```

| Métrica | Cobertura |
|---|---:|
| Sentencias | 88.45 % (360/407) |
| Ramas | 78.23 % (381/487) |
| Funciones | 98.97 % (97/98) |
| Líneas | 94.83 % (294/310) |

Los umbrales automáticos son 80 % en sentencias, 70 % en ramas, 90 % en funciones y 90 % en líneas. La ejecución falla si una regresión coloca el total por debajo de ellos.

La trazabilidad completa y los límites de la prueba unitaria están en `Documentacion/MATRIZ_PRUEBAS_UNITARIAS_15_HU.md`.

### Sesión 11 — Contratos DOM y proveedor DNI/RUC simulado

**Fecha:** 27 de noviembre de 2026

Se añadieron 16 pruebas DOM que inspeccionan la estructura HTML de las 15 HU: campos, límites, modalidades, elementos protegidos, recuperación, carga de archivos y adaptación declarada. También se extrajo `persona-api.js` para probar seis escenarios de DNI/RUC sin depender de Internet: formatos, respuesta válida, empresa inactiva/no habida, ausencia de datos, error HTTP y desconexión.

Resultado:

```text
Test Files  10 passed (10)
Tests       206 passed (206)
```

### Sesión 12 — Firebase Emulator Suite

**Fecha:** 27 de noviembre de 2026

Se configuraron Auth y Firestore Emulator mediante `firebase.json`, `firestore.test.rules` y una configuración Vitest independiente. Las 14 pruebas de integración validan:

- rechazo de acceso no autenticado;
- lectura autenticada;
- permisos de administrador, cajera y cocina;
- creación de pedidos y solicitudes;
- actualización restringida de disponibilidad y preparación;
- procesamiento administrativo de devoluciones;
- propagación en tiempo real;
- inicio y cierre de sesión;
- contraseña incorrecta;
- solicitud de recuperación del administrador.

Resultado:

```text
Test Files  2 passed (2)
Tests       14 passed (14)
```

### Sesión 13 — Preparación de Playwright

**Fecha:** 27 de noviembre de 2026

Se crearon 14 pruebas E2E para comprobar que once rutas responden correctamente y que las pantallas principales no desbordan en 375, 768 y 1440 píxeles. Playwright reconoce correctamente los 14 casos. La ejecución no pudo certificarse en este entorno porque la descarga oficial de Chromium fue rechazada por la red con HTTP 403 y el lanzador Chromium preinstalado no contiene su binario interno.

Esto se registra como limitación del entorno, no como prueba aprobada ni como fallo funcional de Burger Local. En Windows se resuelve ejecutando:

```powershell
npm run test:e2e:install
npm run test:e2e
```

También se fijó `@grpc/grpc-js` 1.14.7 mediante `overrides`; `npm audit` volvió a **0 vulnerabilidades**.

En la primera ejecución en Windows, Playwright no pudo iniciar el servidor porque la configuración dependía de `python3`, que no estaba instalado. Se sustituyó por `scripts/static-server.js`, un servidor estático basado únicamente en Node.js. De esta manera las E2E funcionan en Windows sin instalar Python ni habilitar alias de Microsoft Store.

## Formato para documentar cada prueba

Cada prueba añadida se registrará con esta información:

| Campo | Descripción |
|---|---|
| Identificador | Código único de la prueba |
| Requisito asociado | Historia y criterio de aceptación relacionado |
| Unidad bajo prueba | Función o módulo aislado |
| Objetivo | Comportamiento que se desea comprobar |
| Entrada | Datos utilizados |
| Resultado esperado | Salida o efecto esperado |
| Resultado obtenido | Resultado real de la ejecución |
| Estado | Aprobada, fallida o pendiente |
| Observaciones | Error encontrado, corrección o aprendizaje |

## Resultados acumulados

| Sesión | Pruebas ejecutadas | Aprobadas | Fallidas | Pendientes |
|---|---:|---:|---:|---:|
| 01 | 0 | 0 | 0 | Preparar repositorio |
| 02 | 0 | 0 | 0 | Instalar Vitest |
| 03 | 0 | 0 | 0 | Configurar módulos y scripts |
| 04 | 2 intentos | 1 | 1 intento de configuración | Diseñar PU-UTIL-002 |
| 05 | 2 pruebas finales | 2 | 0 | Crear primer commit |
| 06 | 2 verificadas en GitHub | 2 | 0 | Diseñar casos adicionales |
| 07 | 58 | 58 | 0 | Integrar reglas HU-01 en la interfaz |
| 08 | 58 | 58 | 0 | Extender a las demás HU |
| 09 | 184 | 184 | 0 | Medir cobertura |
| 10 | 184 | 184 | 0 | Pruebas de integración y E2E |
| 11 | 206 | 206 | 0 | Integrar Firebase Emulator |
| 12 | 14 | 14 | 0 | Ejecutar E2E en Chromium |
| 13 | 14 E2E definidas | 0 certificadas | 0 fallos de aplicación | Instalar navegador en un entorno con acceso al CDN |

## Próximo paso recomendado

Ejecutar las 14 E2E en un equipo con Chromium de Playwright y después ampliar Playwright con un recorrido funcional autenticado contra Auth/Firestore Emulator. Persistencia, tiempo real, permisos y API simulada ya tienen cobertura automatizada; archivos, impresión/PDF, sesión única e invalidación posterior al restablecimiento siguen requiriendo verificación funcional adicional.

## Historial de actualización

- **2026-11-27:** creación inicial de la guía y registro de versiones de Node.js y npm.
- **2026-11-27:** registro del clon correcto, estado limpio y advertencia sobre el repositorio Git accidental en una carpeta superior.
- **2026-11-27:** registro de la inicialización de npm, instalación de Vitest 5.1.2 y auditoría con cero vulnerabilidades.
- **2026-11-27:** registro de PU-UTIL-001, incluyendo el intento fallido por archivo no guardado y su ejecución aprobada.
- **2026-11-27:** registro de PU-UTIL-002, errores de sintaxis y estructura encontrados, y ejecución final con dos pruebas aprobadas.
- **2026-11-27:** verificación del primer commit de pruebas publicado en GitHub.
- **2026-11-27:** definición del plan por 15 HU y auditoría de cumplimiento de HU-01.
- **2026-11-27:** HU-01A ejecutada con 56 pruebas de reglas y 58 pruebas totales sin fallos; CA04 queda pendiente de actualizar de 50 a 300.
- **2026-11-27:** metodología corregida para reconciliar documentación desactualizada antes de modificar código o pruebas.
- **2026-11-27:** HU-01 integrada con la interfaz y límites 300/301 reconciliados.
- **2026-11-27:** reglas y suites añadidas para HU-02 a HU-15; utilidades ampliadas.
- **2026-11-27:** regresión final de 184 pruebas, cobertura V8 y matriz de trazabilidad de las 15 HU.
- **2026-11-27:** 16 contratos DOM y 6 pruebas controladas de la API DNI/RUC; total Vitest elevado a 206.
- **2026-11-27:** 14 integraciones aprobadas con Auth y Firestore Emulator, incluidos permisos y tiempo real.
- **2026-11-27:** 14 E2E de rutas y adaptación preparadas; ejecución pendiente por bloqueo de descarga de Chromium en el entorno.
