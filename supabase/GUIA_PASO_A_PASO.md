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

## Paso 4 — Configurar el enlace de acceso por correo (IMPORTANTE)

REN EDUCA ya no usa contraseñas para estudiantes y docentes: para entrar, cada persona escribe su correo y Supabase le manda un enlace de acceso. Para que ese enlace funcione correctamente (y no termine en una pagina de error o en otro dominio), necesitas decirle a Supabase a donde estas publicando tu sitio:

1. En el menu izquierdo, click en **"Authentication"**
2. Click en la pestaña **"URL Configuration"**
3. En **"Site URL"**, escribe la direccion donde la gente va a visitar tu pagina (por ejemplo `https://tu-dominio.com` o, si todavia no lo subes a internet y solo lo abres en tu compu, puedes dejar el valor por defecto temporalmente)
4. En **"Redirect URLs"**, agrega esa misma direccion seguida de `/*` (por ejemplo `https://tu-dominio.com/*`) para autorizar que el enlace pueda volver a cualquier pagina de tu sitio (index, cursos, contacto, etc.)
5. Click en **"Save"**

Si mas adelante cambias de dominio (por ejemplo, al subir el sitio a un hosting definitivo), regresa a este mismo lugar y actualiza esos dos valores, o los enlaces que se envien por correo dejaran de funcionar.

---

## Paso 5 — Crear tu primer usuario administrador

El rol de administrador sigue creandose desde el panel de Supabase (no desde el formulario publico de "Crear cuenta", que solo entrega los roles Estudiante y Docente). Es la unica cuenta de la plataforma que se prepara con una contraseña en el dashboard, aunque para entrar al sitio el administrador usara el mismo boton "Ingresar" (correo + enlace) que todos los demas — la contraseña que le pongas aqui sirve como respaldo y queda guardada por Supabase:

1. En el menu izquierdo, click en **"Authentication"**
2. Click en la pestaña **"Users"**
3. Click en **"Add user"** → **"Create new user"**
4. Completa:
   - **Email**: tu correo real
   - **Password**: una contraseña (no la usaras en el dia a dia, pero Supabase la pide)
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

Listo: ya tienes tu cuenta de administrador real, en una base de datos de verdad, accesible desde cualquier dispositivo. Para entrar, usa el boton "Ingresar" del sitio con ese mismo correo: te llegara el enlace de acceso igual que a cualquier otra persona.

---

## Paso 6 — Conectar tu pagina web a Supabase

Este paso lo hacemos juntos en el chat: necesito que me compartas el **Project URL** y la **anon public key** del Paso 3, y yo me encargo de actualizar todo el codigo (`auth.js` y los demas archivos) para que hablen con tu base de datos real en vez de guardar todo en el navegador.

**Importante:** es seguro compartirme esos 2 datos aqui en el chat — no son la contraseña de tu base de datos ni la "service_role key".

---

## Como funciona el inicio de sesion ahora (sin contraseña)

- **Estudiante o docente nuevo:** click en "Crear cuenta" → escribe nombre, correo y elige su rol → Supabase le manda un enlace a ese correo → al hacer click en el enlace, su cuenta y su perfil se crean automaticamente y queda dentro de su panel.
- **Alguien que ya tiene cuenta:** click en "Ingresar" → escribe su correo → Supabase le manda el mismo tipo de enlace → al hacer click, entra directo a su panel segun su rol (estudiante, docente o admin).
- Si el correo no llega, pide revisar la carpeta de spam/no deseados, y recuerda que Supabase limita cuantos enlaces se pueden pedir en poco tiempo (por seguridad, para evitar spam).

## Como funciona la subida de archivos desde la PC

- En el panel docente, al crear o editar un curso, el campo "Imagen del Curso" ahora tiene un boton para elegir un archivo de la computadora en vez de pegar una URL.
- En "Contenido del modulo", los campos de Imagen, Video y PDF funcionan igual: se elige el archivo y se sube automaticamente a Supabase Storage (bucket `contenido-cursos`).
- Limite actual: 50 MB por archivo. Si necesitas subir archivos mas grandes, se puede ajustar editando `file_size_limit` en `supabase/02_storage_archivos.sql` y volviendo a correr ese script.
