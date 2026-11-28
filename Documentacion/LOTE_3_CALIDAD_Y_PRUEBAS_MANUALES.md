# Lote 3 — Calidad no funcional y verificaciones externas

## Objetivo

Complementar las **252 pruebas funcionales automatizadas ya aprobadas** sin mezclarlas con pruebas de calidad, compatibilidad o servicios externos.

## Automatizaciones del lote

| Área | Comando | Resultado esperado |
|---|---|---|
| Cobertura | `npm run test:coverage` | Superar los cuatro umbrales configurados |
| Accesibilidad | `npm run test:a11y` | 11 rutas sin violaciones serias o críticas WCAG 2.1 A/AA |
| Compatibilidad | `npm run test:cross-browser` | 42 pruebas: 14 en Chromium, 14 en Firefox y 14 en WebKit |
| Regresión funcional | `npm run test:all` | Mantener las 252 pruebas previamente certificadas |
| Integración continua | GitHub Actions | Ejecutar regresión y calidad en cada cambio |

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
| MAN-09 | Correlativos con solicitudes concurrentes | Proyecto aislado de pruebas | Lista sin duplicados | Pendiente |
| MAN-10 | Volumen y tiempos de respuesta | Datos sintéticos | Tabla de tiempos y errores | Pendiente |

## Criterio de cierre

El lote se cierra cuando:

1. cobertura, accesibilidad y compatibilidad están verdes;
2. GitHub Actions ejecuta correctamente la regresión;
3. cada prueba manual tiene evidencia o una limitación justificada;
4. ningún resultado manual se suma artificialmente al conteo automatizado de 252.
