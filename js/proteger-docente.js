(async function protegerRutaDocente() {
    await window.renSesionListaPromise;

    const usuarioProtegido = usuarioActivo();

    if (!usuarioProtegido) {
        window.location.href = "../index.html";
    } else if (usuarioProtegido.rol !== "docente") {
        alert("Acceso denegado: esta seccion es solo para docentes.");
        window.location.href = "panel-estudiante.html";
    }
})();
