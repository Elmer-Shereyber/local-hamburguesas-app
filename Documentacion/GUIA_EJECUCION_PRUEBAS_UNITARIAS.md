# Guía de ejecución de pruebas unitarias

## Objetivo

Ejecutar y explicar las pruebas automatizadas derivadas directamente de los criterios de aceptación de las 15 historias de usuario.

## Requisitos

- Node.js 24 o compatible.
- npm 11 o compatible.
- Repositorio ubicado en la rama `pruebas-unitarias-guiadas`.

## Instalación

```powershell
npm ci
```

## Ejecutar todas las pruebas una vez

```powershell
npm test -- --run
```

Resultado de referencia:

```text
Test Files  15 passed (15)
Tests       88 passed (88)
```

## Ejecutar en modo interactivo

```powershell
npm test
```

Vitest queda observando cambios y repite las pruebas al guardar un archivo. Para salir se presiona `q`.

## Ejecutar una HU específica

Ejemplo para HU-01:

```powershell
npx vitest run tests/hu-01-registrar-pedido.test.js
```

## Estructura

```text
tests/
├── hu-01-registrar-pedido.test.js
├── hu-02-emitir-comprobante.test.js
├── ...
└── hu-15-recuperar-password.test.js
```

Cada HU tiene un archivo propio. El nombre de cada prueba comienza con el identificador usado en `CASOS_DE_PRUEBA_CA_15_HU.md`:

```javascript
it('CP-HU01-03 | CA03 acepta cantidades 1 y 10, pero rechaza 0 y 11', () => {
  expect(esCantidadValida(1)).toBe(true);
  expect(esCantidadValida(10)).toBe(true);
  expect(esCantidadValida(0)).toBe(false);
  expect(esCantidadValida(11)).toBe(false);
});
```

## Patrón Arrange, Act, Assert

1. **Arrange:** preparar los datos de prueba.
2. **Act:** ejecutar la función bajo prueba.
3. **Assert:** comparar el resultado obtenido con el esperado.

En casos simples, Arrange y Act pueden escribirse directamente dentro del `expect`, sin perder claridad.

## Interpretación

- `passed`: el resultado obtenido coincide con el esperado.
- `failed`: existe una diferencia; Vitest muestra el archivo, la línea, el valor esperado y el recibido.
- Una prueba aprobada confirma únicamente la regla aislada descrita por su CA.
- Los CA que dependen de interfaz, Firebase, tiempo real o proveedores externos se identifican en el documento principal como no correspondientes a una unidad aislada.

## Agregar o modificar un caso

1. Revisar la HU y el CA en la documentación original.
2. Definir datos válidos, inválidos o de frontera.
3. Asignar el siguiente identificador `CP-HUxx-yy`.
4. Agregar el caso al archivo de su HU.
5. Actualizar `CASOS_DE_PRUEBA_CA_15_HU.md` con los mismos datos y resultado esperado.
6. Ejecutar `npm test -- --run`.

## Cómo se construyó la suite

La especificación se tomó de las cinco épicas de esta carpeta. Para cada HU se leyó el enunciado de sus CA, se identificó qué decisión toma el código y se eligieron entradas capaces de distinguir una implementación correcta de una incorrecta. Cada archivo de Vitest agrupa una historia con `describe`; cada `it` conserva el ID del caso y su CA. Las funciones se importan de los módulos de la aplicación en `public/shared/`.

**Ejemplo para repetir en clase.** Abre [Registrar pedido](1_Gestionar_Pedidos.md) y busca HU-01/CA03. La cantidad permitida va de 1 a 10. Probar únicamente 5 dejaría sin descubrir un error tan sencillo como escribir `cantidad < 10`. Elegimos los dos extremos y los enteros inmediatamente exteriores.

| Cantidad | Resultado esperado de `esCantidadValida` | Qué detecta |
|---:|---|---|
| 0 | `false` | Se admitió una cantidad inferior al mínimo |
| 1 | `true` | Se excluyó el mínimo permitido |
| 10 | `true` | Se excluyó el máximo permitido |
| 11 | `false` | Se admitió una cantidad superior al máximo |

Busca `CP-HU01-03` en [la prueba de HU-01](../tests/hu-01-registrar-pedido.test.js). Cada número es la entrada, la llamada a la función es la acción y `toBe` compara la salida con la predicción escrita antes de ejecutar. Para ver esa prueba por nombre:

```powershell
npx vitest run tests/hu-01-registrar-pedido.test.js -t CP-HU01-03 --reporter=verbose
```

## Cómo continuar cuando la aplicación esté levantada

1. **Identifica la versión.** En tu clon ejecuta `git switch pruebas-unitarias-guiadas`, `git pull --ff-only` y `git rev-parse --short HEAD`. Registra también el commit publicado en la URL académica. Para probar esa versión, verifica que ambos coincidan. Ejecuta la suite como se explica arriba para obtener la referencia unitaria.
2. **Prepara el entorno.** Usa la URL de pruebas que publique el equipo desde `public/`, cuentas de prueba para los roles que intervienen y pedidos identificables. Comprueba que puedes iniciar sesión y consultar el catálogo. Si trabajas en localhost, la [configuración](../public/shared/firebase-config.js) espera Auth en 9099 y Firestore en 8085 para `demo-burger-local`. En ese caso se necesitan los emuladores con cuentas y datos cargados además del servidor web.
3. **Selecciona el criterio.** Abre el [informe por HU](CASOS_DE_PRUEBA_CA_15_HU.md). Hay 76 CA clasificados como «Requiere interfaz/integración». Revisa también la parte observable de los 77 CA con evidencia unitaria. Por ejemplo, HU-01/CA01 contiene tanto la regla de disponibilidad como el estado deshabilitado del control en caja.
4. **Diseña el caso antes de probar.** Copia el ID del CA, indica el rol, la pantalla inicial y los datos concretos. Escribe una acción reproducible y lo que debería poder observar otra persona. Asigna un ID distinto a cada escenario, por ejemplo `INT-HU03-CA07-01`. Elige escenarios adicionales cuando el criterio tenga varias condiciones.
5. **Ejecuta y conserva evidencia.** Anota qué ocurrió, fecha, versión y captura o registro. Usa «Aprobada» cuando coincida con lo esperado, «Fallida» cuando observes una diferencia y «Bloqueada» cuando falte un requisito del entorno. Si falla, conserva el primer resultado y añade la repetición con el commit corregido.
6. **Actualiza el informe.** Añade el caso bajo su HU, identifica el nivel (interfaz o integración) y enlaza la evidencia. Actualiza el resumen por nivel. Marca un CA como verificado de forma integral cuando exista evidencia para todas las condiciones de su enunciado. Varias ejecuciones sobre un mismo CA siguen correspondiendo a un solo criterio.

### Primer caso para ejecutar en pareja

| Campo | INT-HU03-CA07-01 · Actualización de estados |
|---|---|
| Preparación | Abrir caja y cocina con sus cuentas en perfiles distintos. Desde caja emitir un pedido con una hamburguesa con preparación. Anotar su comprobante. |
| Acción | En caja, abrir la consulta del día y localizar ese pedido. En cocina, iniciar la preparación de la hamburguesa. Mantener abierta la consulta de caja. |
| Resultado esperado | El mismo pedido pasa de «Pendiente» a «En preparación» en caja sin recargar la pantalla. |
| Evidencia | Grabar ambas vistas o tomar capturas con el comprobante y el estado antes y después. |
| Resultado obtenido y estado | Pendiente de ejecución en la versión publicada. |

Para repetir este flujo de forma automatizada, reproduce esas acciones con dos contextos de navegador en Playwright. Comprueba primero que caja muestra «Pendiente», dispara la acción desde cocina y espera que **esa misma fila** muestre «En preparación». Ese cambio observado por el segundo usuario es la evidencia que pide el CA.

### Plantilla para los siguientes resultados

| ID / CA | Nivel y rol | Datos y pasos | Esperado | Obtenido | Estado | Fecha, commit y evidencia |
|---|---|---|---|---|---|---|
| | | | | | Pendiente | |

## Laboratorio con código para el compañero

### Ejemplo 1 · De una regla a una aserción en Vitest

Esta variante de `CP-HU01-03` muestra cómo comparar entradas y salidas en el mismo orden. La ruta de importación corresponde a un archivo ubicado en `tests/`. Para practicar, abre el archivo existente de HU-01 y compara ambas formas de expresar el mismo caso.

```javascript
import { describe, expect, it } from 'vitest';
import { esCantidadValida } from '../public/shared/pedido-rules.js';

describe('HU-01 · Cantidad por producto', () => {
  it('CP-HU01-03 | CA03 comprueba ambos bordes', () => {
    const cantidades = [0, 1, 10, 11];             // Preparar
    const obtenidos = cantidades.map(esCantidadValida); // Ejecutar
    expect(obtenidos).toEqual([false, true, true, false]); // Comparar
  });
});
```

### Ejemplo 2 · De dos sesiones a una prueba de integración en navegador

**Estado del ejemplo: preparado para ejecutar en el entorno académico.** Emite un pedido nuevo del día con una hamburguesa con preparación, déjalo pendiente y anota su comprobante completo. Usa cuentas de caja y cocina de ese entorno. Cada repetición necesita otro pedido pendiente porque el clic inicia la preparación.

Desde la raíz del repositorio crea una carpeta de práctica **hermana del clon**. Así Playwright tiene sus propias dependencias. En PowerShell:

```powershell
cd ..
mkdir laboratorio-hamburguesas
cd laboratorio-hamburguesas
npm init -y
npm install -D @playwright/test
npx playwright install chromium
notepad cocina-caja.spec.cjs
```

Pega este archivo completo en el editor y guárdalo:

```javascript
const { test, expect } = require('@playwright/test');

function dato(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error('Falta configurar ' + nombre);
  return valor;
}

async function entrar(pagina, rol, destino) {
  await pagina.goto(new URL('/login/index.html', dato('URL_PRUEBAS')).href);
  await pagina.locator('#identifier').fill(dato(rol + '_USUARIO'));
  await pagina.locator('#password').fill(dato(rol + '_CLAVE'));
  await pagina.locator('#login-form [type="submit"]').click();
  await expect(pagina).toHaveURL(url => url.pathname === destino);
  await expect(pagina.locator('html')).toHaveAttribute('data-auth-ready', 'true');
}

test('INT-HU03-CA07-01 | caja recibe el cambio de cocina', async ({ page: caja, browser }) => {
  // Preparar dos sesiones independientes y seleccionar el pedido del ejercicio.
  const cocina = await browser.newContext();
  try {
    const cocinero = await cocina.newPage();
    await entrar(caja, 'CAJA', '/cajera/registrar-pedido.html');
    await entrar(cocinero, 'COCINA', '/cocina/pedidos.html');
    await caja.goto(new URL('/cajera/consultar-pedidos.html', dato('URL_PRUEBAS')).href);

    const numero = dato('COMPROBANTE');
    await caja.locator('#buscar-comprobante').fill(numero);
    const fila = caja.locator('#pedidos-tbody tr').filter({
      has: caja.getByText(numero, { exact: true })
    });
    await expect(fila).toHaveCount(1);
    await expect(fila.getByText('Pendiente', { exact: true })).toBeVisible();
    const id = await fila.locator('.ver-detalle').getAttribute('data-id');
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('ID de pedido inesperado');

    // Actuar en cocina sobre ese ID. El clic cambia el pedido de prueba.
    const iniciar = cocinero.locator('[data-action="iniciar-todo"][data-pid="' + id + '"]');
    await iniciar.click();

    // Observar en la sesión original de caja, sin recargarla.
    await expect(fila.getByText('En preparación', { exact: true }))
      .toBeVisible({ timeout: 15000 });
  } finally {
    await cocina.close();
  }
});
```

En la misma ventana de PowerShell, introduce los datos del entorno. Usa PowerShell 7 para la entrada oculta con `-MaskInput`. En Windows PowerShell 5.1 puedes cargar las claves con `(Get-Credential -UserName $env:CAJA_USUARIO -Message 'Cuenta de caja').GetNetworkCredential().Password` y su equivalente para cocina.

```powershell
$env:URL_PRUEBAS = Read-Host 'URL completa del entorno académico'
$env:COMPROBANTE = Read-Host 'Serie y número del pedido pendiente'
$env:CAJA_USUARIO = Read-Host 'Usuario de caja'
$env:CAJA_CLAVE = Read-Host 'Clave de caja' -MaskInput
$env:COCINA_USUARIO = Read-Host 'Usuario de cocina'
$env:COCINA_CLAVE = Read-Host 'Clave de cocina' -MaskInput
npx playwright test cocina-caja.spec.cjs --headed --workers=1 --reporter=list
Remove-Item Env:CAJA_CLAVE, Env:COCINA_CLAVE
```

Si termina con `1 passed`, registra el comprobante de prueba, el commit desplegado y el cambio observado de Pendiente a En preparación. Si falla, la línea indicada distingue tres situaciones: acceso al entorno, identificación del pedido y propagación del nuevo estado. Anota en el informe hasta qué paso llegó.

**Cómo adaptarlo al siguiente criterio.** Para HU-08/CA07 prepara un pedido *Listo*, localízalo en ambas sesiones y comprueba primero que la tarjeta existe en cocina. Desde la fila de caja pulsa `.confirmar-entrega`. La aserción final debe comprobar que la tarjeta de **ese pedido** desaparece de cocina. Conserva dos sesiones, cambia la acción y escribe el resultado que exige ese CA.

## Archivos oficiales de la entrega

- `Documentacion/CASOS_DE_PRUEBA_CA_15_HU.md`: historias, CA, casos, datos y resultados.
- `Documentacion/GUIA_EJECUCION_PRUEBAS_UNITARIAS.md`: comandos y explicación.
- `tests/hu-XX-*.test.js`: automatización en Vitest.
