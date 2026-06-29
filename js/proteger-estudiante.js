(async function protegerRutaEstudiante() {
    await window.renSesionListaPromise;

    const usuarioProtegido = usuarioActivo();
    const modoVistaDocente = typeof esModoVistaDocente === "function" && esModoVistaDocente();

    if (!usuarioProtegido) {
        window.location.href = "../index.html";
    } else if (usuarioProtegido.rol !== "estudiante" && !(usuarioProtegido.rol === "docente" && modoVistaDocente)) {
        alert("Acceso denegado: esta seccion es solo para estudiantes.");
        window.location.href = "panel-docente.html";
    }
})();
