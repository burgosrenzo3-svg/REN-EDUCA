/* =======================================================
   REN EDUCA · Menu desplegable de usuario
   -------------------------------------------------------
   Controla el dropdown que se abre al hacer click en el
   avatar/nombre del usuario en cualquier panel interno
   (admin, docente, estudiante). Incluye:
   - Abrir / cerrar (click afuera, tecla Escape)
   - Opcion "Mi perfil" (resumen rapido de la cuenta)
   - Opcion "Cambiar tema" sincronizada con tema.js
   - El boton de cerrar sesion sigue siendo el mismo
     #btnCerrarSesion que ya usa cerrar-sesion.js
======================================================= */

function iniciarMenuUsuario() {
    const dropdown = document.getElementById("usuarioDropdown");
    const toggle = document.getElementById("usuarioToggle");
    const menu = document.getElementById("usuarioMenu");

    if (!dropdown || !toggle || !menu) return;

    function abrirMenu() {
        dropdown.classList.add("usuario-menu-abierto");
        toggle.setAttribute("aria-expanded", "true");
    }

    function cerrarMenu() {
        dropdown.classList.remove("usuario-menu-abierto");
        toggle.setAttribute("aria-expanded", "false");
    }

    function alternarMenu(e) {
        e.stopPropagation();
        const estaAbierto = dropdown.classList.contains("usuario-menu-abierto");
        estaAbierto ? cerrarMenu() : abrirMenu();
    }

    toggle.addEventListener("click", alternarMenu);

    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) cerrarMenu();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarMenu();
    });

    /* ---------- Mi perfil ---------- */

    const btnMiPerfil = document.getElementById("btnMiPerfil");
    btnMiPerfil?.addEventListener("click", () => {
        const usuario = usuarioActivo();
        if (!usuario) return;

        const etiquetasRol = { docente: "Docente", estudiante: "Estudiante", admin: "Administrador" };
        const etiquetaRol = etiquetasRol[usuario.rol] || usuario.rol;
        const fecha = usuario.fechaRegistro ? new Date(usuario.fechaRegistro) : null;
        const fechaTexto = fecha && !Number.isNaN(fecha.getTime())
            ? fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })
            : "—";

        alert(
            `Mi perfil\n\n` +
            `Nombre: ${usuario.nombre}\n` +
            `Correo: ${usuario.correo}\n` +
            `Rol: ${etiquetaRol}\n` +
            `Miembro desde: ${fechaTexto}`
        );
        cerrarMenu();
    });

    /* ---------- Cambiar tema (sincronizado con tema.js) ---------- */

    const btnCambiarTemaMenu = document.getElementById("btnCambiarTemaMenu");
    const textoCambiarTemaMenu = document.getElementById("textoCambiarTemaMenu");

    function actualizarTextoTema() {
        if (!textoCambiarTemaMenu) return;
        const esOscuro = document.body.classList.contains("dark-mode");
        textoCambiarTemaMenu.textContent = esOscuro ? "Modo claro" : "Modo oscuro";
    }

    actualizarTextoTema();

    btnCambiarTemaMenu?.addEventListener("click", () => {
        const btnThemeReal = document.getElementById("btnTheme");
        btnThemeReal?.click();
        actualizarTextoTema();
    });

    /* Si el tema cambia desde otro boton (header publico o flotante),
       este menu tambien debe reflejar el texto correcto al abrirse. */
    toggle.addEventListener("click", actualizarTextoTema);
}

document.addEventListener("DOMContentLoaded", iniciarMenuUsuario);
