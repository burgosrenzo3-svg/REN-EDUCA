/* =======================================================
   REN EDUCA · main.js
   -------------------------------------------------------
   El header y el footer ya vienen incluidos directamente
   en el HTML de cada pagina (no se cargan por fetch), para
   que el sitio funcione sin servidor, sin CORS y sin
   depender de la conexion al abrir el archivo localmente.
   Este script solo conecta los eventos sobre ese HTML.
======================================================= */

const path = window.location.pathname;
const prefix = path.includes("/paginas/") ? "../" : "";

function actualizarEstadoSesionHeader() {
    const navInvitado = document.getElementById("navInvitado");
    const navUsuario = document.getElementById("navUsuario");
    const navNombreUsuario = document.getElementById("navNombreUsuario");
    const linkPanelUsuario = document.getElementById("linkPanelUsuario");
    const btnSalirHeader = document.getElementById("btnSalirHeader");

    if (!navInvitado || !navUsuario) return;

    const usuario = typeof usuarioActivo === "function" ? usuarioActivo() : null;

    if (usuario) {
        navInvitado.style.display = "none";
        navUsuario.style.display = "flex";
        if (navNombreUsuario) navNombreUsuario.textContent = usuario.nombre.split(" ")[0];

        if (linkPanelUsuario) {
            const destinosPorRol = {
                admin: "panel-admin.html",
                docente: "panel-docente.html",
                estudiante: "panel-estudiante.html"
            };
            const destino = destinosPorRol[usuario.rol] || destinosPorRol.estudiante;
            linkPanelUsuario.href = prefix + "paginas/" + destino;
        }

        if (btnSalirHeader) {
            btnSalirHeader.onclick = async () => {
                await cerrarSesion();
                window.location.href = prefix + "index.html";
            };
        }
    } else {
        navInvitado.style.display = "flex";
        navUsuario.style.display = "none";
    }
}

function iniciarHeaderYModales() {
    if (typeof iniciarTema === "function") iniciarTema();
    if (typeof iniciarModalLogin === "function") iniciarModalLogin();
    if (typeof iniciarModalRegistro === "function") iniciarModalRegistro();
    if (typeof iniciarLogin === "function") iniciarLogin();
    if (typeof iniciarRegistro === "function") iniciarRegistro();

    actualizarEstadoSesionHeader();

    const irARegistro = document.getElementById("irARegistro");
    const irALogin = document.getElementById("irALogin");

    irARegistro?.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("modalLogin")?.classList.remove("active");
        document.getElementById("modalRegistro")?.classList.add("active");
    });

    irALogin?.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("modalRegistro")?.classList.remove("active");
        document.getElementById("modalLogin")?.classList.add("active");
    });
}

iniciarHeaderYModales();

/* La primera vez que se abre el sitio (sin cache de sesion aun),
   actualizarEstadoSesionHeader() puede mostrar "invitado" por una
   fraccion de segundo. En cuanto auth.js confirma la sesion real
   contra Supabase, volvemos a actualizar el header. */
if (window.renSesionListaPromise) {
    window.renSesionListaPromise.then(actualizarEstadoSesionHeader);
}

/* Cuando alguien inicia sesion (con correo y contraseña, desde el
   modal de cualquier pagina) o cuando confirma su correo de registro
   y vuelve al sitio ya autenticado, Supabase dispara "SIGNED_IN" y
   auth.js reenvia ese evento como "ren:sesionActualizada". Aprovechamos
   ese momento para cerrar el modal (si estaba abierto) y llevar a la
   persona directo a su panel segun su rol. */
let yaRedirigioPorSesion = false;

document.addEventListener("ren:sesionActualizada", async (event) => {
    actualizarEstadoSesionHeader();

    let usuario = event.detail?.usuario;
    if (!usuario || yaRedirigioPorSesion) return;

    /* Si la persona llego aqui mediante el enlace de "Recuperar
       contraseña", NO la redirigimos a su panel: primero debe
       elegir su nueva contraseña en el modal correspondiente
       (ver recuperar-password.js, que escucha "ren:recuperarPassword"). */
    if (window.renEnFlujoRecuperacion) return;

    yaRedirigioPorSesion = true;

    document.getElementById("modalLogin")?.classList.remove("active");
    document.getElementById("modalRegistro")?.classList.remove("active");

    /* Si la persona elegio un rol (Estudiante/Docente) en el
       formulario de registro ANTES de continuar con Google, lo
       aplicamos ahora. El trigger de la base de datos ya creo su
       perfil con el rol por defecto "estudiante"; aqui lo
       corregimos si hacia falta. */
    const rolPendiente = sessionStorage.getItem("ren_rol_pendiente_google");
    sessionStorage.removeItem("ren_rol_pendiente_google");

    if (rolPendiente && (rolPendiente === "docente" || rolPendiente === "estudiante") && usuario.rol !== rolPendiente) {
        try {
            const { data, error } = await supabaseClient
                .from("perfiles")
                .update({ rol: rolPendiente })
                .eq("id", usuario.id)
                .select()
                .single();

            if (!error && data) {
                usuario = { id: data.id, nombre: data.nombre, correo: data.correo, rol: data.rol, fechaRegistro: data.fecha_registro };
                guardarSesionCache(usuario);
            }
        } catch (error) {
            console.error("No se pudo aplicar el rol elegido tras el login con Google:", error);
        }
    }

    const destinoPorRol = {
        admin: "panel-admin.html",
        docente: "panel-docente.html",
        estudiante: "panel-estudiante.html"
    };

    const destino = destinoPorRol[usuario.rol] || destinoPorRol.estudiante;
    window.location.href = prefix + "paginas/" + destino;
});
