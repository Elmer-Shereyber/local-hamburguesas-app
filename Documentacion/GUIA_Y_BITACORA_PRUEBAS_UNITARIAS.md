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

## Próximo paso

Inicializar npm e instalar Vitest dentro del clon correcto.

## Historial de actualización

- **2026-11-27:** creación inicial de la guía y registro de versiones de Node.js y npm.
- **2026-11-27:** registro del clon correcto, estado limpio y advertencia sobre el repositorio Git accidental en una carpeta superior.
