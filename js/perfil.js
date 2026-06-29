(async function pintarPerfilUsuario() {
    await window.renSesionListaPromise;

    const usuario = usuarioActivo();

    const nombreUsuarioEl = document.getElementById("nombreUsuario");
    const rolUsuarioEl = document.getElementById("rolUsuario");
    const fotoUsuarioEl = document.getElementById("fotoUsuario");
    const menuNombreUsuarioEl = document.getElementById("menuNombreUsuario");
    const menuCorreoUsuarioEl = document.getElementById("menuCorreoUsuario");

    if (!usuario) return;

    const etiquetasRol = { docente: "Docente", estudiante: "Estudiante", admin: "Administrador" };
    const etiquetaRol = etiquetasRol[usuario.rol] || usuario.rol;

    if (nombreUsuarioEl) nombreUsuarioEl.textContent = usuario.nombre;
    if (rolUsuarioEl) rolUsuarioEl.textContent = etiquetaRol;
    if (menuNombreUsuarioEl) menuNombreUsuarioEl.textContent = usuario.nombre;
    if (menuCorreoUsuarioEl) menuCorreoUsuarioEl.textContent = usuario.correo;

    if (fotoUsuarioEl) {
        const inicial = usuario.nombre.trim().charAt(0).toUpperCase() || "U";
        fotoUsuarioEl.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inicial)}&backgroundColor=0f6b67&textColor=ffffff`;
        fotoUsuarioEl.alt = usuario.nombre;
    }
})();
