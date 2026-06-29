# Guia paso a paso · Conectar REN EDUCA a Supabase

Esta guia asume que ya tienes una cuenta en https://supabase.com

---

## Paso 1 — Crear el proyecto

1. Entra a https://supabase.com/dashboard
2. Click en **"New project"**
3. Completa:
   - **Name**: `ren-educa` (o el nombre que quieras)
   - **Database Password**: crea una contraseña fuerte y **guardala en un lugar seguro** (la necesitaras mas adelante, no es la misma que usaras para entrar a tu pagina)
   - **Region**: elige la mas cercana a tus usuarios (si la mayoria esta en Peru, elige `South America (São Paulo)`)
4. Click en **"Create new project"**
5. Espera 1-2 minutos mientras Supabase prepara tu base de datos

---

## Paso 2 — Ejecutar el esquema de tablas

1. En el menu izquierdo de tu proyecto, click en el icono de consola **"SQL Editor"**
2. Click en **"New query"**
3. Abre el archivo `supabase/01_esquema_inicial.sql` (en la carpeta de tu proyecto), copia **todo** su contenido
4. Pegalo en el editor de Supabase
5. Click en **"Run"** (o `Ctrl+Enter` / `Cmd+Enter`)
6. Deberias ver un mensaje de exito en la parte inferior ("Success. No rows returned")

Esto crea automaticamente:
- Las 6 tablas (perfiles, cursos, modulos, preguntas_quiz, progreso, intentos_quiz)
- Las reglas de seguridad (cada persona solo ve/edita lo que le corresponde)
- La creacion automatica de un "perfil" cada vez que alguien se registra

7. Repite el mismo procedimiento (New query → pegar → Run) con estos dos archivos, EN ESTE ORDEN:
   - `supabase/02_storage_archivos.sql` → crea el almacenamiento para que los docentes puedan subir imagenes, videos y PDF desde su PC.
   - `supabase/03_catalogo_publico.sql` → permite que cualquier visitante (sin iniciar sesion) vea el catalogo de cursos en la pagina de inicio.

(Si ejecutaste `01_esquema_inicial.sql` por primera vez con la version mas reciente de este proyecto, el paso de `03_catalogo_publico.sql` ya viene incluido ahi tambien — pero no pasa nada si lo corres de nuevo, es seguro repetirlo.)

---

## Paso 3 — Obtener tus claves de conexion

Tu pagina web necesita 2 datos para hablar con Supabase:

1. En el menu izquierdo, click en el icono de engranaje **"Project Settings"**
2. Click en **"Data API"** (o "API" en versiones anteriores)
3. Copia estos dos valores, los vas a necesitar pronto:
   - **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

Estos dos datos NO son secretos sensibles del tipo "nunca los compartas" — estan diseñados para ir dentro del codigo de tu pagina web (el navegador del usuario los necesita para conectarse). Lo que SI nunca debes compartir es la **"service_role" key**, esa es la que tiene poder total y solo se usa en servidores, nunca en el navegador.

---

## Paso 4 — Confirmar el correo y el dominio del sitio (recomendado)

REN EDUCA usa el inicio de sesion clasico de Supabase: correo y contraseña. Aun asi, conviene que Supabase sepa donde vive tu sitio (por ejemplo, para los correos de confirmacion de cuenta nueva, si los activas):

1. En el menu izquierdo, click en **"Authentication"**
2. Click en la pestaña **"URL Configuration"**
3. En **"Site URL"**, escribe la direccion donde la gente va a visitar tu pagina (por ejemplo `https://tu-dominio.com`, o el valor por defecto si todavia solo lo abres en tu compu)
4. En **"Redirect URLs"**, agrega esa misma direccion seguida de `/*`
5. Click en **"Save"**

Si quieres que la confirmacion de correo al registrarse sea obligatoria u opcional, eso se controla en **"Authentication" → "Providers" → "Email"**, en la opcion **"Confirm email"**.

---

## Paso 4.1 — Activar el inicio de sesion con Google (opcional)

El sitio ya tiene el boton "Continuar con Google" listo en los formularios de inicio de sesion y de registro. Para que funcione, necesitas activar el proveedor de Google en tu proyecto de Supabase. Esto requiere crear unas credenciales en Google Cloud (un Client ID y un Client Secret) y luego pegarlas en Supabase:

**A. Crear las credenciales en Google Cloud**

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) con tu cuenta de Google
2. Si no tienes un proyecto, crea uno nuevo (arriba, donde dice "Select a project" → "New Project"). Ponle el nombre que quieras, por ejemplo "REN EDUCA"
3. Ve a **"APIs & Services"** → **"OAuth consent screen"**
   - Tipo de usuario: **"External"**
   - Completa el nombre de la app ("REN EDUCA"), tu correo de soporte y tu correo de contacto
   - Guarda y continua (los pasos de "Scopes" y "Test users" los puedes dejar con los valores por defecto)
4. Ve a **"APIs & Services"** → **"Credentials"**
5. Click en **"Create Credentials"** → **"OAuth client ID"**
6. Tipo de aplicacion: **"Web application"**
7. En **"Authorized redirect URIs"**, agrega esta URL (cambiando por tu Project URL del Paso 3):
   ```
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```
   (Esta URL te la confirma tambien el propio Supabase en el siguiente paso, al activar el proveedor)
8. Click en **"Create"**. Te va a mostrar un **Client ID** y un **Client Secret** — copia ambos, los necesitas en el siguiente paso

**B. Activar el proveedor en Supabase**

1. En tu proyecto de Supabase, ve a **"Authentication"** → **"Providers"**
2. Busca **"Google"** en la lista y haz click para expandirlo
3. Activa el interruptor para habilitarlo
4. Pega el **Client ID** y el **Client Secret** que copiaste de Google Cloud
5. Click en **"Save"**

Listo: el boton "Continuar con Google" del sitio ya deberia funcionar. Si alguien intenta usarlo antes de completar estos pasos, vera un mensaje indicando que el inicio de sesion con Google todavia no esta activado, en vez de un error confuso.

---

## Paso 5 — Crear tu primer usuario administrador

El rol de administrador se crea desde el panel de Supabase (no desde el formulario publico de "Crear cuenta", que solo entrega los roles Estudiante y Docente):

1. En el menu izquierdo, click en **"Authentication"**
2. Click en la pestaña **"Users"**
3. Click en **"Add user"** → **"Create new user"**
4. Completa:
   - **Email**: tu correo real
   - **Password**: la contraseña que usaras para entrar al sitio como administrador
   - Marca la casilla **"Auto Confirm User"** (para no tener que verificar el correo)
5. Click en **"Create user"**

Esto crea tu cuenta de acceso, pero todavia le falta el "perfil" con tu nombre y rol de administrador. Para completarlo:

6. Ve de nuevo a **"SQL Editor"** → **"New query"**
7. Pega esto (cambiando el correo por el que usaste arriba):

```sql
update public.perfiles
set rol = 'admin', nombre = 'Tu Nombre Aqui'
where correo = 'tu_correo@aqui.com';
```

8. Click en **"Run"**

Listo: ya tienes tu cuenta de administrador real, en una base de datos de verdad, accesible desde cualquier dispositivo. Para entrar, usa el boton "Ingresar" del sitio con ese correo y la contraseña que pusiste en el paso 4. Al iniciar sesion, te lleva directo al panel de administrador, y mientras tu sesion siga activa, el menu de usuario en el header (arriba a la derecha) tambien te lleva ahi directo.

---

## Paso 6 — Conectar tu pagina web a Supabase

Este paso lo hacemos juntos en el chat: necesito que me compartas el **Project URL** y la **anon public key** del Paso 3, y yo me encargo de actualizar todo el codigo (`auth.js` y los demas archivos) para que hablen con tu base de datos real en vez de guardar todo en el navegador.

**Importante:** es seguro compartirme esos 2 datos aqui en el chat — no son la contraseña de tu base de datos ni la "service_role key".

---

## Como funciona el inicio de sesion ahora (correo + contraseña, o Google)

- **Estudiante o docente nuevo:** click en "Crear cuenta" → escribe nombre, correo, contraseña y elige su rol → su cuenta y su perfil se crean automaticamente y queda dentro de su panel (o le pedimos que confirme su correo primero, si activaste esa opcion en el Paso 4).
- **Alguien que ya tiene cuenta:** click en "Ingresar" → escribe su correo y su contraseña → entra directo a su panel segun su rol (estudiante, docente o admin).
- **Con Google:** en el modal de registro, primero elige su rol (Estudiante o Docente) y luego hace click en "Continuar con Google"; en el modal de login, simplemente hace click en "Continuar con Google". En ambos casos sale hacia la pantalla de Google, confirma su cuenta, y vuelve al sitio ya con la sesion iniciada (ver Paso 4.1 para activar esto en tu proyecto).
- **¿Olvidaste tu contraseña?:** desde el modal de login, hace click en ese enlace, escribe su correo, y recibe un correo con un enlace para crear una nueva contraseña. Al hacer click en ese enlace vuelve al sitio, se le pide la nueva contraseña dos veces, y queda con sesion iniciada en su panel.
- Mientras la sesion siga activa en el navegador, el nombre aparece en el header y el boton de "panel" lleva siempre al panel correcto segun el rol (estudiante, docente o admin), aunque la persona navegue de vuelta al inicio.

## Como funciona el formulario de contacto

La pagina de Contacto envia los mensajes directo al correo `burgosrenzo3@gmail.com` usando un servicio externo gratuito llamado **EmailJS** (no necesita servidor propio). Para activarlo:

1. Entra a https://www.emailjs.com y crea una cuenta gratis.
2. **Email Services** → conecta tu Gmail (`burgosrenzo3@gmail.com`) → copia el **Service ID**.
3. **Email Templates** → crea una plantilla usando las variables `{{from_name}}`, `{{from_email}}` y `{{message}}` → copia el **Template ID**.
4. **Account → General** → copia tu **Public Key**.
5. Abre el archivo `js/contacto.js` y pega esos 3 valores donde dice `EMAILJS_CONFIG` (tiene instrucciones detalladas en los comentarios del archivo).

Hasta que esos 3 valores no se completen, el formulario avisa que falta esa conexion en vez de fallar en silencio.

## Como funciona la edicion de modulos (por enlace, con parametros en la URL)

Desde el panel docente, al entrar a "Modulos" de un curso, o a "Contenido"/"Quiz" de un modulo especifico, la pagina usa la propia direccion del navegador para saber que curso y que modulo estas editando (por ejemplo: `modulos.html?curso=123` o `contenido-modulo.html?curso=123&modulo=456`). Esto permite que el enlace se pueda compartir, recargar la pagina sin perder el lugar, o usar el boton "Atras" del navegador con normalidad.

## Como funciona la subida de imagen, video y PDF en los modulos

En "Contenido del modulo", la imagen, el video y el PDF se agregan pegando un enlace (no se sube ningun archivo desde la PC en esta pantalla):

- **Imagen:** pega el enlace de una imagen que ya este publicada en internet.
- **Video:** pega el enlace de un video de YouTube, Vimeo, o un enlace directo a un archivo .mp4.
- **PDF:** pega el enlace de un PDF o material que ya este publicado en otra pagina.

Si el video es de YouTube o Vimeo, se ve embebido directo en la pagina del modulo (tanto en la vista previa del docente como en lo que ve el estudiante), sin salir del sitio.

La imagen del curso (en "Mis cursos", al crear o editar un curso) tambien se agrega pegando un enlace, igual que el contenido de los modulos. Ya no se sube ningun archivo directo desde la PC en ninguna parte de la plataforma.

## Como funciona la subida de archivos desde la PC

- En el panel docente, al crear o editar un curso, el campo "Imagen del Curso" ahora tiene un boton para elegir un archivo de la computadora en vez de pegar una URL.
- En "Contenido del modulo", los campos de Imagen, Video y PDF funcionan igual: se elige el archivo y se sube automaticamente a Supabase Storage (bucket `contenido-cursos`).
- Limite actual: 50 MB por archivo. Si necesitas subir archivos mas grandes, se puede ajustar editando `file_size_limit` en `supabase/02_storage_archivos.sql` y volviendo a correr ese script.
