/* =======================================================
   REN EDUCA · Núcleo de autenticación y datos (Supabase)
   -------------------------------------------------------
   Este archivo reemplaza la version anterior basada en
   localStorage. Ahora todos los datos viven en una base de
   datos real (Supabase), y cualquier persona puede acceder
   desde cualquier dispositivo con su mismo correo y contraseña.

   IMPORTANTE - CACHE DE SESION:
   Muchas paginas necesitan saber INMEDIATAMENTE (sin esperar)
   si hay una sesion activa, para decidir si te redirigen al
   login o te dejan pasar. Como Supabase es asincrono, este
   archivo mantiene una "foto" del usuario activo guardada en
   localStorage (clave ren_sesion_cache). Esa foto se actualiza
   automaticamente cada vez que inicias sesion, te registras,
   cierras sesion, o cuando la pagina termina de cargar (ver
   inicializarSesion() al final de este archivo).

   usuarioActivo() sigue siendo SINCRONA (lee la foto), tal
   como antes, para no romper el resto del codigo. Si necesitas
   el dato mas fresco posible, usa usuarioActivoAsync().
   Debe cargarse DESPUES de supabase-client.js y ANTES que
   cualquier otro script que use estas funciones.
======================================================= */

const REN_DB = {
    SESION_CACHE: "ren_sesion_cache"
};

/* ---------- Utilidades ---------- */

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function imagenPorDefecto() {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200";
}

function mapearErrorSupabase(error) {
    if (!error) return "Ocurrio un error inesperado.";
    const mensaje = String(error.message || error);

    if (mensaje.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
    if (mensaje.includes("already registered") || mensaje.includes("already been registered") || mensaje.includes("User already registered")) return "Este correo ya esta registrado. Intenta iniciar sesion.";
    if (mensaje.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
    if (mensaje.includes("For security purposes") || mensaje.includes("rate limit") || mensaje.includes("you can only request this")) return "Espera un momento antes de intentar de nuevo.";
    if (mensaje.includes("Signups not allowed") || mensaje.includes("signup is disabled")) return "El registro esta deshabilitado por ahora. Contacta al administrador.";
    if (mensaje.includes("Failed to fetch") || mensaje.includes("NetworkError")) return "No se pudo conectar. Revisa tu conexion a internet.";
    if (mensaje.includes("Unable to validate email") || mensaje.includes("invalid")) return "Ingresa un correo electronico valido.";
    if (mensaje.includes("Email not confirmed")) return "Confirma tu correo antes de iniciar sesion (revisa tu bandeja de entrada).";
    if (mensaje.includes("provider is not enabled") || mensaje.includes("Unsupported provider")) return "El inicio de sesion con Google todavia no esta activado en este sitio.";

    return mensaje;
}

/* ---------- Cache local de sesion (sincrona) ---------- */

function guardarSesionCache(usuario) {
    if (usuario) {
        localStorage.setItem(REN_DB.SESION_CACHE, JSON.stringify(usuario));
    } else {
        localStorage.removeItem(REN_DB.SESION_CACHE);
    }
}

function leerSesionCache() {
    try {
        return JSON.parse(localStorage.getItem(REN_DB.SESION_CACHE));
    } catch {
        return null;
    }
}

/* Lee el perfil completo (nombre, correo, rol, fecha) desde la
   tabla "perfiles" para el usuario de auth actualmente logueado.
   Devuelve null si no hay sesion. */
async function cargarPerfilDesdeSupabase() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data: perfil, error } = await supabaseClient
        .from("perfiles")
        .select("id, nombre, correo, rol, fecha_registro")
        .eq("id", user.id)
        .single();

    if (error || !perfil) return null;

    return {
        id: perfil.id,
        nombre: perfil.nombre,
        correo: perfil.correo,
        rol: perfil.rol,
        fechaRegistro: perfil.fecha_registro
    };
}

/* Refresca la cache de sesion contra Supabase. Se llama
   automaticamente al cargar cualquier pagina (ver el final
   de este archivo) y tambien tras login/registro/logout. */
async function refrescarSesionCache() {
    const usuario = await cargarPerfilDesdeSupabase();
    guardarSesionCache(usuario);
    return usuario;
}

/* ---------- Usuario activo ---------- */

/* Version sincrona (igual que en la version anterior con
   localStorage): lee la ultima foto conocida de la sesion.
   Se actualiza automaticamente al cargar cada pagina. */
function usuarioActivo() {
    return leerSesionCache();
}

/* Version asincrona: confirma contra Supabase en tiempo real.
   Util para flujos que ya son async (formularios, etc.) */
async function usuarioActivoAsync() {
    return await refrescarSesionCache();
}

/* ---------- Registro / login / logout (con correo y contraseña) ----------
   REN EDUCA usa el inicio de sesion clasico de Supabase: correo
   y contraseña. signUp() crea la cuenta (el trigger de la base
   de datos crea el perfil automaticamente con nombre y rol) y
   signInWithPassword() inicia sesion las veces siguientes. */

/* Crea una cuenta nueva con correo y contraseña.
   nombre y rol se guardan como metadata: el trigger de la base
   de datos los usa para crear el perfil. Devuelve { ok, error }. */
async function registrarseConPassword({ correo, password, nombre, rol }) {
    const correoNorm = correo.trim().toLowerCase();

    const { data, error } = await supabaseClient.auth.signUp({
        email: correoNorm,
        password,
        options: {
            data: { nombre: nombre.trim(), rol }
        }
    });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    // Si el proyecto de Supabase tiene activada la confirmacion por
    // correo, en este punto todavia no hay sesion (session === null)
    // hasta que la persona confirme su correo.
    const sesionInmediata = Boolean(data.session);

    return { ok: true, requiereConfirmacion: !sesionInmediata };
}

/* Inicia sesion con correo y contraseña. Devuelve { ok, error }. */
async function iniciarSesionConPassword({ correo, password }) {
    const correoNorm = correo.trim().toLowerCase();

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: correoNorm,
        password
    });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    return { ok: true };
}

/* Envia un correo con un enlace para restablecer la contraseña.
   Al hacer click en ese enlace, la persona vuelve a esta misma
   pagina y Supabase dispara el evento "PASSWORD_RECOVERY" (ver
   el listener de onAuthStateChange mas abajo, y recuperar-password.js
   para el formulario que pide la nueva contraseña).
   Devuelve { ok, error } */
async function enviarCorreoRecuperacion(correo) {
    const correoNorm = correo.trim().toLowerCase();

    const { error } = await supabaseClient.auth.resetPasswordForEmail(correoNorm, {
        redirectTo: window.location.origin + window.location.pathname
    });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    return { ok: true };
}

/* Guarda la nueva contraseña. Solo funciona si la persona llego
   aqui mediante el enlace de recuperacion (o si ya tiene una
   sesion iniciada). Devuelve { ok, error } */
async function guardarNuevaPassword(nuevaPassword) {
    const { error } = await supabaseClient.auth.updateUser({ password: nuevaPassword });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    return { ok: true };
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    guardarSesionCache(null);
}

/* Inicia sesion (o crea la cuenta automaticamente la primera
   vez) usando la cuenta de Google de la persona. El navegador
   sale hacia la pantalla de Google y, al volver, Supabase ya
   trae la sesion iniciada en esta misma pagina (gracias a
   "detectSessionInUrl: true" en supabase-client.js). main.js
   se encarga de redirigir al panel correcto en cuanto eso pasa.
   Requiere tener activado el proveedor "Google" en tu proyecto
   de Supabase (ver supabase/GUIA_PASO_A_PASO.md).
   Devuelve { ok, error } */
async function iniciarSesionConGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    // El navegador esta saliendo hacia Google en este punto.
    return { ok: true };
}

/* Detecta si un docente esta navegando el aula como estudiante,
   ya sea porque la URL trae ?vista=docente o porque esa marca
   quedo guardada en sessionStorage al entrar a esa vista (para
   que se mantenga al pasar de pagina en pagina dentro del recorrido). */
function esModoVistaDocente() {
    const usuario = usuarioActivo();
    if (!usuario || usuario.rol !== "docente") return false;

    const porURL = new URLSearchParams(window.location.search).get("vista") === "docente";
    const porStorage = sessionStorage.getItem("ren_vista_docente") === "true";

    if (porURL) sessionStorage.setItem("ren_vista_docente", "true");

    return porURL || porStorage;
}

function salirDeVistaDocente() {
    sessionStorage.removeItem("ren_vista_docente");
}

/* ---------- Administración de usuarios (panel admin) ---------- */

async function obtenerUsuarios() {
    const { data, error } = await supabaseClient
        .from("perfiles")
        .select("id, nombre, correo, rol, fecha_registro")
        .order("fecha_registro", { ascending: false });

    if (error || !data) return [];

    return data.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        fechaRegistro: u.fecha_registro
    }));
}

/* Actualiza datos editables de un usuario (usado por el panel de administrador).
   cambios puede incluir: nombre, correo. No permite cambiar el rol ni la password
   desde aqui por seguridad. Devuelve { ok, error, usuario } */
async function actualizarUsuario(usuarioId, cambios) {
    const datosAEnviar = { ...cambios };

    if (datosAEnviar.correo) {
        datosAEnviar.correo = datosAEnviar.correo.trim().toLowerCase();
    }

    const { data, error } = await supabaseClient
        .from("perfiles")
        .update(datosAEnviar)
        .eq("id", usuarioId)
        .select()
        .single();

    if (error) {
        const mensaje = String(error.message || "");
        if (mensaje.includes("duplicate key") || mensaje.includes("unique")) {
            return { ok: false, error: "Ese correo ya esta en uso por otra cuenta." };
        }
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    if (!data) {
        return { ok: false, error: "El usuario ya no existe." };
    }

    return {
        ok: true,
        usuario: { id: data.id, nombre: data.nombre, correo: data.correo, rol: data.rol, fechaRegistro: data.fecha_registro }
    };
}

/* Elimina un usuario. Como las tablas tienen "on delete cascade",
   al borrar el perfil se borran automaticamente sus cursos (si era
   docente) o su progreso/intentos de quiz (si era estudiante).
   Nota: esto borra la fila de "perfiles"; la cuenta de acceso
   (auth.users) puede seguir necesitando borrado manual desde
   el panel de Supabase para un borrado 100% completo. */
async function eliminarUsuario(usuarioId) {
    const { data: usuario } = await supabaseClient
        .from("perfiles")
        .select("id, nombre, correo, rol")
        .eq("id", usuarioId)
        .single();

    if (!usuario) {
        return { ok: false, error: "El usuario ya no existe." };
    }

    const { error } = await supabaseClient
        .from("perfiles")
        .delete()
        .eq("id", usuarioId);

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    const sesionActual = leerSesionCache();
    if (sesionActual && sesionActual.id === usuarioId) {
        await cerrarSesion();
    }

    return { ok: true, usuario };
}

/* ---------- Cursos ---------- */

async function obtenerCursosDeDocente(docenteId) {
    const { data, error } = await supabaseClient
        .from("cursos")
        .select("*, modulos(*, preguntas_quiz(*))")
        .eq("docente_id", docenteId)
        .order("creado_en", { ascending: true });

    if (error || !data) return [];

    return data.map(mapearCursoDesdeSupabase);
}

/* Convierte un curso de Supabase (con modulos y preguntas anidadas)
   al mismo formato que usaba el resto del codigo con localStorage:
   { id, nombre, descripcion, categoria, nivel, imagen, visible,
     modulos: [{ id, nombre, contenido, quiz: [...] }] } */
function mapearCursoDesdeSupabase(curso) {
    const modulos = (curso.modulos || [])
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        .map((modulo) => ({
            id: modulo.id,
            nombre: modulo.nombre,
            contenido: modulo.contenido && Object.keys(modulo.contenido).length > 0 ? modulo.contenido : null,
            quiz: (modulo.preguntas_quiz || [])
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map((pregunta) => ({
                    id: pregunta.id,
                    tipo: pregunta.tipo,
                    texto: pregunta.texto,
                    opciones: pregunta.opciones || [],
                    respuestaCorrecta: pregunta.respuesta_correcta
                }))
        }));

    return {
        id: curso.id,
        docenteId: curso.docente_id,
        nombre: curso.nombre,
        descripcion: curso.descripcion,
        categoria: curso.categoria,
        nivel: curso.nivel,
        imagen: curso.imagen,
        visible: curso.visible,
        modulos
    };
}

/* Guarda (crea o actualiza) el ARREGLO COMPLETO de cursos de un
   docente, igual que hacia guardarCursosDeDocente() con localStorage.
   Compara contra lo que ya existe en Supabase para crear lo nuevo,
   actualizar lo existente, y eliminar lo que ya no esta en el arreglo. */
async function guardarCursosDeDocente(docenteId, cursos) {
    const cursosExistentes = await obtenerCursosDeDocente(docenteId);
    const idsExistentes = new Set(cursosExistentes.map((c) => String(c.id)));
    const idsNuevos = new Set(cursos.map((c) => String(c.id)));

    // 1) Eliminar cursos que ya no estan en el arreglo nuevo
    for (const cursoViejo of cursosExistentes) {
        if (!idsNuevos.has(String(cursoViejo.id))) {
            await supabaseClient.from("cursos").delete().eq("id", cursoViejo.id);
        }
    }

    // 2) Crear o actualizar cada curso del arreglo nuevo
    for (const curso of cursos) {
        const esNuevo = !idsExistentes.has(String(curso.id)) || typeof curso.id === "number";

        let cursoId = curso.id;

        if (esNuevo) {
            const { data, error } = await supabaseClient
                .from("cursos")
                .insert({
                    docente_id: docenteId,
                    nombre: curso.nombre,
                    descripcion: curso.descripcion,
                    categoria: curso.categoria,
                    nivel: curso.nivel,
                    imagen: curso.imagen,
                    visible: curso.visible !== false
                })
                .select()
                .single();

            if (error || !data) continue;
            cursoId = data.id;
        } else {
            await supabaseClient
                .from("cursos")
                .update({
                    nombre: curso.nombre,
                    descripcion: curso.descripcion,
                    categoria: curso.categoria,
                    nivel: curso.nivel,
                    imagen: curso.imagen,
                    visible: curso.visible !== false
                })
                .eq("id", cursoId);
        }

        await sincronizarModulosDeCurso(cursoId, curso.modulos || []);
    }
}

/* Sincroniza el arreglo de modulos de un curso especifico contra
   la tabla "modulos" (y sus preguntas de quiz anidadas). */
async function sincronizarModulosDeCurso(cursoId, modulosNuevos) {
    const { data: modulosExistentes } = await supabaseClient
        .from("modulos")
        .select("id")
        .eq("curso_id", cursoId);

    const idsExistentes = new Set((modulosExistentes || []).map((m) => String(m.id)));
    const idsNuevos = new Set(modulosNuevos.map((m) => String(m.id)));

    for (const moduloViejo of modulosExistentes || []) {
        if (!idsNuevos.has(String(moduloViejo.id))) {
            await supabaseClient.from("modulos").delete().eq("id", moduloViejo.id);
        }
    }

    for (let i = 0; i < modulosNuevos.length; i++) {
        const modulo = modulosNuevos[i];
        const esNuevo = !idsExistentes.has(String(modulo.id)) || typeof modulo.id === "number";

        let moduloId = modulo.id;

        if (esNuevo) {
            const { data, error } = await supabaseClient
                .from("modulos")
                .insert({
                    curso_id: cursoId,
                    nombre: modulo.nombre,
                    orden: i,
                    contenido: modulo.contenido || {}
                })
                .select()
                .single();

            if (error || !data) continue;
            moduloId = data.id;
        } else {
            await supabaseClient
                .from("modulos")
                .update({
                    nombre: modulo.nombre,
                    orden: i,
                    contenido: modulo.contenido || {}
                })
                .eq("id", moduloId);
        }

        await sincronizarPreguntasDeModulo(moduloId, modulo.quiz || []);
    }
}

/* Sincroniza las preguntas de quiz de un modulo especifico. */
async function sincronizarPreguntasDeModulo(moduloId, preguntasNuevas) {
    const { data: preguntasExistentes } = await supabaseClient
        .from("preguntas_quiz")
        .select("id")
        .eq("modulo_id", moduloId);

    const idsExistentes = new Set((preguntasExistentes || []).map((p) => String(p.id)));
    const idsNuevos = new Set(preguntasNuevas.map((p) => String(p.id)));

    for (const preguntaVieja of preguntasExistentes || []) {
        if (!idsNuevos.has(String(preguntaVieja.id))) {
            await supabaseClient.from("preguntas_quiz").delete().eq("id", preguntaVieja.id);
        }
    }

    for (let i = 0; i < preguntasNuevas.length; i++) {
        const pregunta = preguntasNuevas[i];
        const esNueva = !idsExistentes.has(String(pregunta.id)) || typeof pregunta.id === "number";

        const payload = {
            modulo_id: moduloId,
            tipo: pregunta.tipo,
            texto: pregunta.texto,
            opciones: pregunta.opciones || [],
            respuesta_correcta: String(pregunta.respuestaCorrecta),
            orden: i
        };

        if (esNueva) {
            await supabaseClient.from("preguntas_quiz").insert(payload);
        } else {
            await supabaseClient.from("preguntas_quiz").update(payload).eq("id", pregunta.id);
        }
    }
}

/* Elimina un curso especifico de un docente.
   Devuelve { ok, error } */
async function eliminarCurso(docenteId, cursoId) {
    const { error } = await supabaseClient
        .from("cursos")
        .delete()
        .eq("id", cursoId)
        .eq("docente_id", docenteId);

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    return { ok: true };
}

/* Actualiza los datos editables de un curso especifico de un docente
   (usado por el panel de administrador para edicion rapida).
   cambios puede incluir: nombre, descripcion, categoria, nivel, imagen, visible.
   Devuelve { ok, error, curso } */
async function actualizarCurso(docenteId, cursoId, cambios) {
    const { data, error } = await supabaseClient
        .from("cursos")
        .update(cambios)
        .eq("id", cursoId)
        .select("*, modulos(*, preguntas_quiz(*))")
        .single();

    if (error || !data) {
        return { ok: false, error: error ? mapearErrorSupabase(error) : "El curso ya no existe." };
    }

    return { ok: true, curso: mapearCursoDesdeSupabase(data) };
}

/* Devuelve TODOS los cursos de TODOS los docentes, con referencia al dueño,
   para que el catalogo del estudiante muestre todo lo publicado
   (y el admin pueda ver tambien los ocultos, gracias a RLS). */
async function obtenerTodosLosCursos() {
    const { data, error } = await supabaseClient
        .from("cursos")
        .select("*, modulos(*, preguntas_quiz(*))")
        .order("creado_en", { ascending: true });

    if (error || !data) return [];

    return data.map(mapearCursoDesdeSupabase);
}

/* Devuelve solo los cursos VISIBLES, con los campos minimos para
   armar tarjetas resumidas en la pagina de inicio (antes de
   registrarse). No incluye modulos ni contenido interno: eso
   solo se carga ya con sesion iniciada (obtenerTodosLosCursos). */
async function obtenerCursosPublicosResumen() {
    const { data, error } = await supabaseClient
        .from("cursos")
        .select("id, nombre, descripcion, categoria, nivel, imagen")
        .eq("visible", true)
        .order("creado_en", { ascending: true });

    if (error || !data) return [];

    return data;
}

/* ---------- Progreso (por estudiante) ----------
   Cada modulo completado es una fila en la tabla "progreso".
   Para mantener compatibilidad con el resto del codigo (que
   espera un objeto tipo { "cursoId_moduloId": true }), estas
   funciones traducen entre ambos formatos. */

async function obtenerProgresoDeEstudiante(estudianteId) {
    const { data, error } = await supabaseClient
        .from("progreso")
        .select("modulo_id, modulos(curso_id)")
        .eq("estudiante_id", estudianteId);

    if (error || !data) return {};

    const progreso = {};
    data.forEach((fila) => {
        const cursoId = fila.modulos?.curso_id;
        if (cursoId) progreso[`${cursoId}_${fila.modulo_id}`] = true;
    });

    return progreso;
}

/* Recibe el objeto completo de progreso (como lo arma el resto
   del codigo: { "cursoId_moduloId": true, ... }) y guarda en
   Supabase solo las claves nuevas que aun no existian. */
async function guardarProgresoDeEstudiante(estudianteId, progreso) {
    const yaGuardado = await obtenerProgresoDeEstudiante(estudianteId);

    const clavesNuevas = Object.keys(progreso).filter((clave) => progreso[clave] && !yaGuardado[clave]);

    for (const clave of clavesNuevas) {
        const separador = clave.lastIndexOf("_");
        const moduloId = clave.slice(separador + 1);

        await supabaseClient
            .from("progreso")
            .upsert({ estudiante_id: estudianteId, modulo_id: moduloId }, { onConflict: "estudiante_id,modulo_id" });
    }
}

/* ---------- Intentos de quiz (por estudiante) ----------
   Misma logica de traduccion que el progreso: el resto del
   codigo espera un objeto { "cursoId_moduloId": {intentos,...} } */

async function obtenerQuizDeEstudiante(estudianteId) {
    const { data, error } = await supabaseClient
        .from("intentos_quiz")
        .select("modulo_id, intentos, mejor_nota, ultima_nota, aprobado, ultima_fecha, modulos(curso_id)")
        .eq("estudiante_id", estudianteId);

    if (error || !data) return {};

    const resultado = {};
    data.forEach((fila) => {
        const cursoId = fila.modulos?.curso_id;
        if (!cursoId) return;
        resultado[`${cursoId}_${fila.modulo_id}`] = {
            intentos: fila.intentos,
            mejorNota: fila.mejor_nota,
            ultimaNota: fila.ultima_nota,
            aprobado: fila.aprobado,
            ultimaFecha: fila.ultima_fecha
        };
    });

    return resultado;
}

async function registrarIntentoQuiz(estudianteId, claveModulo, { nota, aprobado }) {
    const separador = claveModulo.lastIndexOf("_");
    const moduloId = claveModulo.slice(separador + 1);

    const { data: previo } = await supabaseClient
        .from("intentos_quiz")
        .select("intentos, mejor_nota, aprobado")
        .eq("estudiante_id", estudianteId)
        .eq("modulo_id", moduloId)
        .maybeSingle();

    const nuevosIntentos = (previo?.intentos || 0) + 1;
    const mejorNota = Math.max(previo?.mejor_nota || 0, nota);
    const aprobadoFinal = Boolean(previo?.aprobado) || aprobado;

    const { data, error } = await supabaseClient
        .from("intentos_quiz")
        .upsert({
            estudiante_id: estudianteId,
            modulo_id: moduloId,
            intentos: nuevosIntentos,
            mejor_nota: mejorNota,
            ultima_nota: nota,
            aprobado: aprobadoFinal,
            ultima_fecha: new Date().toISOString()
        }, { onConflict: "estudiante_id,modulo_id" })
        .select()
        .single();

    if (error || !data) {
        return { intentos: nuevosIntentos, mejorNota, ultimaNota: nota, aprobado: aprobadoFinal };
    }

    return {
        intentos: data.intentos,
        mejorNota: data.mejor_nota,
        ultimaNota: data.ultima_nota,
        aprobado: data.aprobado,
        ultimaFecha: data.ultima_fecha
    };
}

/* ---------- Calificacion de quiz (logica pura, sin red) ----------
   preguntas: [{ id, tipo: "opcion"|"vf", texto, opciones: [..], respuestaCorrecta }]
   respuestas: { [preguntaId]: valorElegido } */

function calificarQuiz(preguntas, respuestas) {
    const total = preguntas.length;
    let correctas = 0;
    const detalle = preguntas.map((pregunta) => {
        const respuesta = respuestas[pregunta.id];
        const esCorrecta = respuesta !== undefined && String(respuesta) === String(pregunta.respuestaCorrecta);
        if (esCorrecta) correctas++;
        return { preguntaId: pregunta.id, respuesta, esCorrecta };
    });

    const nota = total > 0 ? Math.round((correctas / total) * 100) : 0;

    return { total, correctas, nota, aprobado: nota === 100, detalle };
}

/* ---------- Archivos (Supabase Storage) ----------
   Permite que el docente suba un archivo desde su PC (imagen,
   video o PDF) en vez de tener que pegar una URL externa.
   El archivo se guarda en el bucket "contenido-cursos", dentro
   de una carpeta con el id del propio docente (asi las reglas
   de seguridad del bucket le permiten subir/editar/borrar solo
   ahi). Devuelve { ok, url, error }. */
async function subirArchivo(file, carpeta) {
    if (!file) return { ok: false, error: "No se selecciono ningun archivo." };

    const usuario = usuarioActivo();
    if (!usuario) return { ok: false, error: "Debes iniciar sesion para subir archivos." };

    const limiteMB = 50;
    if (file.size > limiteMB * 1024 * 1024) {
        return { ok: false, error: `El archivo supera el limite de ${limiteMB} MB.` };
    }

    const extension = (file.name.split(".").pop() || "bin").toLowerCase();
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const ruta = `${usuario.id}/${carpeta}/${nombreUnico}`;

    const { error } = await supabaseClient
        .storage
        .from("contenido-cursos")
        .upload(ruta, file, { cacheControl: "3600", upsert: false });

    if (error) {
        return { ok: false, error: mapearErrorSupabase(error) };
    }

    const { data: publico } = supabaseClient
        .storage
        .from("contenido-cursos")
        .getPublicUrl(ruta);

    return { ok: true, url: publico.publicUrl };
}

/* ---------- Inicializacion automatica ----------
   Al cargar CUALQUIER pagina que incluya este archivo, se
   refresca la cache de sesion contra Supabase en segundo
   plano. Las paginas de proteccion de ruta (proteger-*.js)
   esperan esta promesa antes de decidir si te dejan pasar. */

window.renSesionListaPromise = (async function inicializarSesion() {
    try {
        await refrescarSesionCache();
    } catch {
        guardarSesionCache(null);
    }
})();

/* Si el usuario cierra sesion, inicia sesion en OTRA pestaña, o
   acaba de volver del login con Google, esta pestaña se mantiene
   sincronizada. El evento "ren:sesionActualizada" le avisa a
   main.js que debe refrescar el header y, si corresponde,
   redirigir al panel segun el rol (ver login.js / main.js). */
supabaseClient.auth.onAuthStateChange((evento, session) => {
    if (!session) {
        guardarSesionCache(null);
        document.dispatchEvent(new CustomEvent("ren:sesionActualizada", { detail: { usuario: null } }));
        return;
    }

    if (evento === "PASSWORD_RECOVERY") {
        window.renEnFlujoRecuperacion = true;
        document.dispatchEvent(new CustomEvent("ren:recuperarPassword"));
        return;
    }

    if (evento === "SIGNED_IN" || evento === "TOKEN_REFRESHED") {
        refrescarSesionCache().then((usuario) => {
            document.dispatchEvent(new CustomEvent("ren:sesionActualizada", { detail: { usuario, evento } }));
        });
    }
});
