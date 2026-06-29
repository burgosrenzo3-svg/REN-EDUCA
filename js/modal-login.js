let modalLoginListo = false;

function iniciarModalLogin() {
    if (modalLoginListo) return;

    const btnLogin = document.getElementById("btnLogin");
    const modal = document.getElementById("modalLogin");
    const cerrar = document.getElementById("cerrarLogin");

    if (!btnLogin || !modal || !cerrar) return;

    modalLoginListo = true;

    btnLogin.addEventListener("click", () => {
        modal.classList.add("active");
    });

    cerrar.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.remove("active");
        }
    });
}

document.addEventListener("renHeaderLoaded", iniciarModalLogin);
iniciarModalLogin();
