# ÉPICA: Autenticación y Control de Acceso

Permitir que cada rol (administrador, cajera y área de cocina) acceda al sistema de forma segura según sus credenciales, y que el administrador pueda recuperar su contraseña en caso de olvido.

## Alcance y supuestos

- Existen tres roles: Administrador, Cajera y Cocina, cada uno con acceso solo a las funciones de su propia épica.
- El administrador inicia sesión con correo electrónico y contraseña. Cajera y cocina inician sesión con su nombre de usuario corporativo (ingresando directamente el usuario o con `@burger.local`) y contraseña, como se definió en *Gestionar usuarios*.
- Solo el administrador tiene recuperación de contraseña, por tener correo real asociado. Cajera y cocina no la tienen; si la olvidan, el administrador elimina y recrea su cuenta.
- Si la cuenta de cajera o cocina es eliminada mientras tiene una sesión activa, el sistema la cierra automáticamente en tiempo real mediante listener de Firestore (ya definido en *Gestionar usuarios*, CA07).

---

## HU-13: Iniciar Sesión

- **Story Points:** 3
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como usuario del sistema (administrador, cajera o cocina), quiero iniciar sesión con mis credenciales, para acceder únicamente a las funciones que corresponden a mi rol.

### Criterios de aceptación

#### Formulario

- **CA01. Campos según el sistema:** la pantalla de inicio de sesión muestra dos campos: identificador (correo para el administrador, usuario para cajera y cocina) y contraseña. El sistema no pide seleccionar el rol; lo determina según la credencial ingresada.
- **CA02. Autenticación del administrador:** si el identificador tiene formato de correo, el sistema valida directamente contra el correo y contraseña del administrador, ya configurados desde el inicio.
- **CA03. Autenticación de cajera/cocina:** el personal puede ingresar únicamente su nombre de usuario (o el identificador completo con `@burger.local`); el sistema normaliza internamente la credencial con el dominio corporativo y valida contra las cuentas de cajera y cocina activas existentes.
- **CA04. Credenciales inválidas:** si el identificador o la contraseña no coinciden con ninguna cuenta, el sistema muestra un mensaje genérico de error, sin indicar cuál de los dos datos fue incorrecto.
- **CA05. Cuenta inexistente:** si el rol de cajera o cocina no ha sido creado por el administrador, el intento de inicio de sesión con ese usuario se trata igual que una credencial inválida (CA04).

#### Acceso según rol

- **CA06. Redirección según rol:** al iniciar sesión correctamente, el sistema redirige a la pantalla principal correspondiente: Administrador, Cajera o Cocina.
- **CA07. Restricción de funciones:** cada rol solo puede acceder a las historias de usuario de su propia épica. El sistema no permite navegar manualmente hacia pantallas de otro rol.

#### Sesión

- **CA08. Sesión persistente:** una vez iniciada la sesión, el usuario permanece autenticado hasta que cierre sesión manualmente o su cuenta sea eliminada, sin necesidad de volver a ingresar sus credenciales en cada uso.
- **CA09. Sesión única por cuenta:** cada cuenta (administrador, cajera o cocina) solo puede tener una sesión activa a la vez. Si se inicia sesión en un nuevo dispositivo, la sesión activa en el dispositivo anterior se cierra automáticamente.
- **CA10. Intentos fallidos sin bloqueo:** el sistema no bloquea la cuenta tras varios intentos fallidos, dado el alcance académico del proyecto.

---

## HU-14: Cerrar Sesión

- **Story Points:** 1
- **MoSCoW:** 4 — Must have / Obligatorio

**Historia:** Como usuario del sistema (administrador, cajera o cocina), quiero cerrar mi sesión de forma manual, para dejar el dispositivo disponible y evitar que otra persona continúe usando mi cuenta.

### Criterios de aceptación

- **CA01. Opción visible:** en cualquier pantalla del sistema, el usuario autenticado tiene una opción visible para cerrar sesión.
- **CA02. Cierre inmediato:** al confirmar, el sistema finaliza la sesión de inmediato y redirige a la pantalla de inicio de sesión.
- **CA03. Sin confirmación adicional:** no se requiere una segunda confirmación (como una ventana emergente de "¿estás seguro?"), para mantener la acción simple y rápida.
- **CA04. Acceso bloqueado tras el cierre:** una vez cerrada la sesión, el sistema no permite volver a ninguna pantalla protegida sin iniciar sesión nuevamente (por ejemplo, usando el botón "atrás" del navegador).
- **CA05. No afecta otras sesiones:** cerrar sesión en un dispositivo no tiene efecto sobre las sesiones de los otros roles; cada cuenta gestiona su propia sesión de forma independiente.

---

## HU-15: Recuperar Contraseña (Admin)

- **Story Points:** 3
- **MoSCoW:** 3 — Should have / Recomendable

**Historia:** Como administrador, quiero recuperar el acceso a mi cuenta cuando olvide mi contraseña, para no depender de nadie más para volver a ingresar al sistema.

### Criterios de aceptación

- **CA01. Acceso desde el inicio de sesión:** en la pantalla de inicio de sesión hay una opción visible "¿Olvidaste tu contraseña?", disponible únicamente cuando se está intentando ingresar con correo (es decir, solo aplica al administrador, no a cajera ni cocina).
- **CA02. Solicitud por correo:** al seleccionar la opción, el sistema pide el correo del administrador y usa el servicio de recuperación de contraseña de Firebase Authentication para enviar un enlace de restablecimiento a ese correo.
- **CA03. Mensaje neutro:** el sistema muestra un mensaje de confirmación genérico ("si el correo está registrado, se enviará un enlace"), sin indicar si el correo ingresado existe o no, para no revelar esa información.
- **CA04. Enlace de restablecimiento:** el correo recibido contiene un enlace gestionado por Firebase donde el administrador ingresa su nueva contraseña, con el mismo requisito mínimo de 6 caracteres definido para las demás cuentas.
- **CA05. Enlace de un solo uso y con expiración:** el enlace enviado por Firebase es válido solo por un tiempo limitado y se invalida después de usarse una vez, según el comportamiento estándar del servicio.
- **CA06. Cierre de sesiones anteriores:** al restablecer la contraseña, cualquier sesión activa previa del administrador se cierra, en línea con la regla de sesión única (HU-13, CA09).
- **CA07. Sin esta opción para cajera y cocina:** como sus cuentas no tienen correo asociado, no cuentan con esta función; si olvidan su contraseña, el administrador elimina y recrea su cuenta (ver HU-10).
