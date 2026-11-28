# Lote 3 — Calidad no funcional y verificaciones externas

## Objetivo

Complementar las **252 pruebas funcionales automatizadas ya aprobadas** sin mezclarlas con pruebas de calidad, compatibilidad o servicios externos.

## Automatizaciones del lote

| Área | Comando | Resultado esperado |
|---|---|---|
| Cobertura | `npm run test:coverage` | Superar los cuatro umbrales configurados |
| Accesibilidad | `npm run test:a11y` | 11 rutas sin violaciones serias o críticas WCAG 2.1 A/AA |
| Compatibilidad | `npm run test:cross-browser` | 42 pruebas: 14 en Chromium, 14 en Firefox y 14 en WebKit |
| Concurrencia | `npm run test:concurrency` | 2 pruebas con Firebase Emulator: correlativos e incidencia única |
| Regresión funcional | `npm run test:all` | Mantener las 252 pruebas previamente certificadas |
| Integración continua | GitHub Actions | Ejecutar regresión y calidad en cada cambio |

### Primera ejecución de accesibilidad

Las 11 rutas fueron analizadas y la salida visible señaló `color-contrast` como patrón común. La paleta inicial usaba rojo `#EF4444` con texto blanco, relación 3.76:1, por debajo de WCAG AA 4.5:1 para texto normal. Se aplicaron variantes más oscuras a rojo, azul, verde y ámbar, y se programó una segunda ejecución para confirmar el resultado completo.

La segunda ejecución aprobó 10 rutas y detectó solo `select-name` en `#tipo-boleta`. El texto “Tipo de Boleta” se convirtió en una etiqueta explícita asociada al selector. La tercera ejecución aprobó las **11 rutas en 8.9 segundos**, por lo que accesibilidad automática queda cerrada.

### Resultado multinavegador

La ejecución del 27 de noviembre de 2026 aprobó **42 de 42 pruebas en 30.9 segundos**:

| Motor | Pruebas | Resultado |
|---|---:|---|
| Chromium | 14 | Aprobadas |
| Firefox | 14 | Aprobadas |
| WebKit | 14 | Aprobadas |
| **Total** | **42** | **42 aprobadas, 0 fallidas** |

Se comprobaron once rutas y ausencia de desborde horizontal en 375, 768 y 1440 píxeles. El bloque automatizado del lote 3 queda cerrado con 11 auditorías de accesibilidad y 42 verificaciones multinavegador.

### Pruebas de concurrencia preparadas

Como el proyecto Firebase actual es académico y el despliegue se realizará más adelante, las comprobaciones de correo real, enlace de recuperación e impresión quedan aplazadas hasta contar con una URL levantada. Mientras tanto se automatizaron dos riesgos que sí pueden verificarse de forma segura con los emuladores locales:

1. doce emisiones simultáneas deben producir los correlativos del 1 al 12, sin duplicados ni saltos;
2. dos intentos simultáneos de registrar una reposición sobre el mismo pedido deben dejar exactamente una reposición completa y rechazar el segundo intento.

La configuración fue validada con `playwright --list` y reconoció las dos pruebas. La ejecución visual completa queda pendiente en Windows, donde Chromium y los emuladores ya están instalados.

## Preparación local

```powershell
npm ci
npm run test:cross-browser:install
```

## Lista manual y productiva

Estas comprobaciones requieren un entorno controlado y evidencia humana. No deben ejecutarse directamente sobre datos productivos.

| ID | Verificación | Entorno seguro | Evidencia | Estado |
|---|---|---|---|---|
| MAN-01 | Recepción del correo real de recuperación | Proyecto Firebase de pruebas | Captura del correo y hora | Pendiente |
| MAN-02 | Enlace de recuperación de un solo uso y expiración | Proyecto Firebase de pruebas | Capturas del primer y segundo uso | Pendiente |
| MAN-03 | Consulta DNI válida, inválida y caída del proveedor | Credenciales sandbox o datos autorizados | Capturas y códigos HTTP | Pendiente |
| MAN-04 | Consulta RUC activo/habido e inactivo | Credenciales sandbox o datos públicos autorizados | Capturas y respuestas anonimizadas | Pendiente |
| MAN-05 | Impresión de boleta, factura y nota de crédito | Impresora o PDF local | Archivos o fotografías legibles | Pendiente |
| MAN-06 | Uso en dispositivo móvil real | Teléfono de pruebas | Capturas en orientación vertical | Pendiente |
| MAN-07 | Desconexión y reconexión durante una operación | Proyecto Firebase de pruebas | Video o secuencia de capturas | Pendiente |
| MAN-08 | Reglas equivalentes en Firebase desplegado | Proyecto aislado de pruebas | Registro de accesos permitidos/denegados | Pendiente |
| MAN-09 | Correlativos con solicitudes concurrentes | Firebase Emulator | Lista sin duplicados | Automatizada; pendiente ejecutar |
| MAN-10 | Volumen y tiempos de respuesta | Datos sintéticos | Tabla de tiempos y errores | Pendiente |

## Criterio de cierre

El lote se cierra cuando:

1. cobertura, accesibilidad y compatibilidad están verdes;
2. GitHub Actions ejecuta correctamente la regresión;
3. cada prueba manual tiene evidencia o una limitación justificada;
4. ningún resultado manual se suma artificialmente al conteo automatizado de 252.

## Orden recomendado mientras no exista despliegue

1. Ejecutar `npm run test:concurrency` y registrar el resultado.
2. Mantener MAN-01, MAN-02, MAN-05 y MAN-08 pendientes hasta levantar el sistema.
3. Continuar después con volumen, desconexión/reconexión y dispositivo móvil real.
