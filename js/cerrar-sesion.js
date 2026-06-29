const btnCerrarSesion = document.getElementById("btnCerrarSesion");

btnCerrarSesion?.addEventListener("click", async () => {
    const confirmar = confirm("Deseas cerrar sesion?");
    if (!confirmar) return;

    await cerrarSesion();
    if (typeof salirDeVistaDocente === "function") salirDeVistaDocente();
    window.location.href = "../index.html";
});
