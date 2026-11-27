# Guía y bitácora de pruebas unitarias automatizadas

## Proyecto

- **Sistema:** Burger Local
- **Repositorio de trabajo:** `KohakuAzureFire/local-hamburguesas-app`
- **Rama:** `pruebas-unitarias-guiadas`
- **Inicio de la práctica:** 27 de noviembre de 2026
- **Modalidad:** práctica guiada; el estudiante escribe y ejecuta las pruebas, y el asistente explica, revisa y documenta.

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

## Próximo paso

Diseñar y ejecutar una segunda prueba de `formatCurrency` con un número decimal.

## Historial de actualización

- **2026-11-27:** creación inicial de la guía y registro de versiones de Node.js y npm.
- **2026-11-27:** registro del clon correcto, estado limpio y advertencia sobre el repositorio Git accidental en una carpeta superior.
- **2026-11-27:** registro de la inicialización de npm, instalación de Vitest 5.1.2 y auditoría con cero vulnerabilidades.
- **2026-11-27:** registro de PU-UTIL-001, incluyendo el intento fallido por archivo no guardado y su ejecución aprobada.
