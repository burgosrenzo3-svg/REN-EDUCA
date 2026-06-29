let modalRegistroListo = false;

function iniciarModalRegistro() {
    if (modalRegistroListo) return;

    const btnRegistro = document.getElementById("btnRegistro");
    const modalRegistro = document.getElementById("modalRegistro");
    const cerrarRegistro = document.getElementById("cerrarRegistro");

    if (!btnRegistro || !modalRegistro || !cerrarRegistro) return;

    modalRegistroListo = true;

    btnRegistro.addEventListener("click", () => {
        modalRegistro.classList.add("active");
    });

    cerrarRegistro.addEventListener("click", () => {
        modalRegistro.classList.remove("active");
    });

    modalRegistro.addEventListener("click", (event) => {
        if (event.target === modalRegistro) {
            modalRegistro.classList.remove("active");
        }
    });
}

document.addEventListener("renHeaderLoaded", iniciarModalRegistro);
iniciarModalRegistro();
