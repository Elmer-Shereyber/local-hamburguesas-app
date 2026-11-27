# 🍔 Burger Local - Sistema Web de Gestión de Pedidos, Cocina y Facturación

Sistema web integral desarrollado para la atención en punto de venta, control de preparación en cocina en tiempo real, gestión de incidencias posventa (reposiciones y reembolsos) y supervisión administrativa con emisión de comprobantes electrónicos (Boletas, Facturas y Notas de Crédito bajo normativa SUNAT).

🌐 **Demostración en vivo:** [https://local-burguer.netlify.app](https://local-burguer.netlify.app)

---

## 📌 Características Principales

* **Épica 1: Gestión de Pedidos (Cajera)**
  * Registro ágil de comandas con validación de disponibilidad en tiempo real.
  * Múltiples modalidades de pago (Efectivo, Yape, Plin, Transferencia e Híbrido).
  * Emisión de comprobantes de pago: **Boleta simple** (hasta S/ 700), **Boleta con DNI** (validación RENIEC) y **Factura** con RUC y desglose de IGV (18%).
  * Seguimiento de pedidos del día y confirmación de entrega al cliente.

* **Épica 2: Gestión de Incidencias (Cajera y Administrador)**
  * **Reposición de productos:** Reemplazo sin costo por el mismo producto, sujeto a disponibilidad, enviando la comanda con prioridad a cocina; si no está disponible, se deriva a devolución.
  * **Solicitud de Devolución:** Registro en caja con datos bancarios (Yape, Plin o Transferencia con N° de cuenta o CCI de 20 dígitos).
  * **Procesamiento de Reembolsos (Admin):** Registro del abono bancario adjuntando voucher digital de respaldo y auditoría de canal efectivo.
  * **Nota de Crédito Electrónica SUNAT:** Generación automática de comprobante (serie `BC01` o `FC01`) según R.S. 114-2019 y Catálogo N.° 09 (*06 - Devolución total* o *07 - Devolución por ítem*).

* **Épica 3: Gestión de Preparación y Disponibilidad (Cocina)**
  * Pantalla KDS (Kitchen Display System) en tiempo real con actualización reactiva sin recargar la página.
  * Priorización visual inmediata para pedidos de reposición.
  * Control del ciclo de preparación por producto (*Con preparación* en 3 fases vs *Servicio inmediato* en 2 fases).
  * Interruptor de disponibilidad del menú sincronizado al instante con caja.

* **Épica 4: Supervisión y Reportes (Administrador)**
  * Gestión exclusiva de cuentas operativas (máximo 1 cuenta de Cajera y 1 de Cocina con credenciales corporativas `@burger.local` y purga en Firebase Authentication).
  * Catálogo de productos (altas, modificaciones y bajas lógicas respetando el historial).
  * Dashboard de Ganancias e Incidencias con arqueo neto por fecha efectiva de pago, gráficos y desglose de pedidos completos.

* **Épica 5: Autenticación y Control de Acceso**
  * Acceso diferenciado por roles (Administrador con correo electrónico; Cajera y Cocina con nombre de usuario corporativo).
  * Cierre forzado de sesión en tiempo real si el administrador da de baja una cuenta operativa.
  * Recuperación de contraseña por correo para el Administrador vía Firebase Authentication.

---

## 🚀 Arquitectura y Tecnologías

* **Frontend:** HTML5 semántico, CSS3 moderno con variables y diseño responsivo, Vanilla JavaScript (ES Modules).
* **Backend as a Service (BaaS):**
  * **Firebase Authentication:** Gestión de sesiones seguras y credenciales corporativas.
  * **Cloud Firestore:** Base de datos NoSQL reactiva en tiempo real con sincronización de estados.
* **Hosting & CI/CD:** Netlify con despliegue continuo desde GitHub.

---

## 📂 Estructura del Proyecto

```text
local-hamburguesas-app/
├── Documentacion/                           # Especificación formal de requerimientos
│   ├── 1_Gestionar_Pedidos.md               # HU-01 a HU-03
│   ├── 2_Gestionar_Incidencias.md           # HU-04 a HU-06
│   ├── 3_Gestion_de_Preparacion_y_Disponibilidad.md # HU-07 a HU-09
│   ├── 4_Supervision_y_Reportes.md          # HU-10 a HU-12
│   └── 5_Autenticacion_y_Control_de_Acceso.md # HU-13 a HU-15
├── public/                                  # Código fuente de la aplicación web
│   ├── admin/                               # Panel administrativo y reportes
│   ├── cajera/                              # Punto de venta, cobro y comprobantes
│   ├── cocina/                              # Pantalla KDS de preparación
│   ├── login/                               # Inicio de sesión y recuperación
│   ├── shared/                              # Módulos compartidos (auth, db, utils, config)
│   ├── css/                                 # Hojas de estilo globales
│   └── index.html                           # Enrutador principal
├── netlify.toml                             # Configuración de publicación para Netlify
├── .gitignore                               # Exclusiones de control de versiones
└── README.md                                # Presentación del proyecto
```

---

## 👥 Cuentas de Acceso de Demostración

| Rol | Identificador de Acceso | Tipo |
| :--- | :--- | :--- |
| **Administrador** | Correo corporativo (ej. `emorenoa2@upao.edu.pe`) | Correo real |
| **Cajera** | Nombre de usuario (ej. `cajera23`) | Usuario corporativo (`@burger.local`) |
| **Cocina** | Nombre de usuario (ej. `cocina26`) | Usuario corporativo (`@burger.local`) |

---

## 📄 Licencia y Ámbito Académico

Proyecto desarrollado con fines académicos y de demostración técnica de ingeniería de software. Los comprobantes y notas de crédito emitidas son de demostración y no poseen validez tributaria real ante SUNAT.
