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

## Archivos oficiales de la entrega

- `Documentacion/CASOS_DE_PRUEBA_CA_15_HU.md`: historias, CA, casos, datos y resultados.
- `Documentacion/GUIA_EJECUCION_PRUEBAS_UNITARIAS.md`: comandos y explicación.
- `tests/hu-XX-*.test.js`: automatización en Vitest.
