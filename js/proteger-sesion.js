/* Proteccion general: solo exige que haya una sesion activa,
   sin importar el rol. Usado en paginas como ver-modulo.html
   que sirven tanto a docentes (vista previa) como a estudiantes. */
(async function protegerSesionGeneral() {
    await window.renSesionListaPromise;

    const usuarioSesion = usuarioActivo();

    if (!usuarioSesion) {
        window.location.href = "../index.html";
    }
})();
