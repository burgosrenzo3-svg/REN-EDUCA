let modalLoginListo = false;

const ICONO_OJO_ABIERTO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICONO_OJO_CERRADO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.22-5.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`;

/* Agrega el boton "ojito" a cada input de tipo password de la
   pagina que todavia no lo tenga, para poder mostrar u ocultar
   la contraseña escrita. Funciona tanto con inputs envueltos en
   ".campo-flotante" (label flotante) como con inputs sueltos. */
function iniciarToggleContrasena() {
    const inputsPassword = document.querySelectorAll("input[type='password']");

    inputsPassword.forEach((input) => {
        if (input.dataset.toggleListo) return;
        input.dataset.toggleListo = "true";

        let wrapper = input.parentElement;
        if (!wrapper.classList.contains("campo-flotante")) {
            wrapper = document.createElement("div");
            wrapper.className = "campo-password-simple";
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
        }
        wrapper.classList.add("campo-password");

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "toggle-password";
        boton.setAttribute("aria-label", "Mostrar contraseña");
        boton.innerHTML = ICONO_OJO_CERRADO;

        boton.addEventListener("click", () => {
            const ocultar = input.type === "password";
            input.type = ocultar ? "text" : "password";
            boton.innerHTML = ocultar ? ICONO_OJO_ABIERTO : ICONO_OJO_CERRADO;
            boton.setAttribute("aria-label", ocultar ? "Ocultar contraseña" : "Mostrar contraseña");
        });

        wrapper.appendChild(boton);
    });
}

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

document.addEventListener("renHeaderLoaded", () => {
    iniciarModalLogin();
    iniciarToggleContrasena();
});
iniciarModalLogin();
iniciarToggleContrasena();
