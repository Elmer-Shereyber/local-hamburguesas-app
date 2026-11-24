# Datos Semilla (Seed Data)

Para que el sistema pueda probarse correctamente desde el Sprint 1, necesitas registrar estos datos manualmente en Firebase (Authentication y Firestore).

## 1. Firebase Authentication (Usuarios)

Ve a la sección **Authentication > Users** y asegúrate de tener estas 3 cuentas (con la contraseña que prefieras, ej. `123456` para pruebas):

- Administrador: `emorenoa2@upao.edu.pe`
- Cajera: `cajera@burger.local`
- Cocina: `cocina@burger.local`

*(Nota: el sistema internamente concatenará `@burger.local` cuando el usuario ingrese "cajera" o "cocina" en el login).*

## 2. Firestore Database (Colecciones)

Debes crear dos colecciones principales: `productos` y `configuracion`. (La colección `pedidos` se creará automáticamente cuando la cajera registre el primero).

### Colección: `productos`

Crea los siguientes documentos manualmente (usa el botón "Generar ID automático" para el ID de cada documento):

**Producto 1 (Con preparación)**
- `nombre` (string): Hamburguesa Clásica
- `precio` (number): 15.00
- `tipo` (string): Con preparación
- `disponible` (boolean): true

**Producto 2 (Con preparación)**
- `nombre` (string): Salchipapa Especial
- `precio` (number): 18.50
- `tipo` (string): Con preparación
- `disponible` (boolean): true

**Producto 3 (Servicio inmediato)**
- `nombre` (string): Gaseosa Coca Cola 500ml
- `precio` (number): 4.50
- `tipo` (string): Servicio inmediato
- `disponible` (boolean): true

**Producto 4 (Servicio inmediato)**
- `nombre` (string): Agua Mineral 500ml
- `precio` (number): 3.00
- `tipo` (string): Servicio inmediato
- `disponible` (boolean): true

### Colección: `configuracion`

Crea un único documento con el ID exacto `negocio`:

**Documento ID:** `negocio`
- `ruc` (string): 20123456789
- `razonSocial` (string): Hamburguesas Local S.A.C.
- `nombreComercial` (string): Burger Local
- `domicilioFiscal` (string): Av. Principal 123, Trujillo
- `serieBoleta` (string): B001
- `serieFactura` (string): F001
- `correlativoBoleta` (number): 1
- `correlativoFactura` (number): 1
