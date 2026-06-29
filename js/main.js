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
            const destino = usuario.rol === "docente" ? "panel-docente.html" : "panel-estudiante.html";
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

/* Cuando la persona hace click en el enlace de acceso que le
   llego por correo, Supabase abre esta misma pagina y, en cuanto
   procesa el token de la URL, dispara "ren:sesionActualizada".
   Aprovechamos ese momento para llevarla directo a su panel,
   en vez de dejarla parada en la pagina de inicio. */
let yaRedirigioPorEnlace = false;

document.addEventListener("ren:sesionActualizada", (event) => {
    actualizarEstadoSesionHeader();

    const usuario = event.detail?.usuario;
    const vinoDeEnlaceMagico = window.location.hash.includes("access_token")
        || window.location.hash.includes("type=magiclink")
        || new URLSearchParams(window.location.search).has("code");

    if (!usuario || !vinoDeEnlaceMagico || yaRedirigioPorEnlace) return;
    yaRedirigioPorEnlace = true;

    const destinoPorRol = {
        admin: "panel-admin.html",
        docente: "panel-docente.html",
        estudiante: "panel-estudiante.html"
    };

    const destino = destinoPorRol[usuario.rol] || destinoPorRol.estudiante;
    window.location.replace(prefix + "paginas/" + destino);
});
