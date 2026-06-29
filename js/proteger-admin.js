(async function protegerRutaAdmin() {
    await window.renSesionListaPromise;

    const usuarioProtegidoAdmin = usuarioActivo();

    if (!usuarioProtegidoAdmin) {
        window.location.href = "../index.html";
    } else if (usuarioProtegidoAdmin.rol !== "admin") {
        alert("Acceso denegado: esta seccion es solo para administradores.");
        window.location.href = usuarioProtegidoAdmin.rol === "docente" ? "panel-docente.html" : "panel-estudiante.html";
    }
})();
