/* =======================================================
   REN EDUCA · Inicio de sesion (sin contraseña)
   -------------------------------------------------------
   Al enviar el formulario, se le pide a Supabase que mande
   un enlace de acceso al correo escrito. La persona hace
   click en ese enlace desde su bandeja de entrada y vuelve
   a esta misma pagina ya con la sesion iniciada.
======================================================= */

let loginListo = false;

function iniciarLogin() {
    if (loginListo) return;

    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    loginListo = true;

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const correo = document.getElementById("loginCorreo").value.trim();
        const errorEl = document.getElementById("loginError");
        const exitoEl = document.getElementById("loginExito");
        const btnSubmit = loginForm.querySelector("button[type='submit']");

        const mostrarError = (mensaje) => {
            if (errorEl) {
                errorEl.textContent = mensaje;
                errorEl.style.display = "block";
            } else {
                alert(mensaje);
            }
        };

        if (errorEl) errorEl.style.display = "none";
        if (exitoEl) exitoEl.style.display = "none";

        if (!correoValido(correo)) {
            mostrarError("Ingresa un correo electronico valido.");
            return;
        }

        const textoOriginalBoton = btnSubmit ? btnSubmit.innerHTML : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = "<span>Enviando enlace...</span>";
        }

        const resultado = await enviarEnlaceAcceso({ correo });

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textoOriginalBoton;
        }

        if (!resultado.ok) {
            mostrarError(resultado.error);
            return;
        }

        loginForm.reset();

        if (exitoEl) {
            exitoEl.textContent = `Listo. Revisa ${correo} y haz click en el enlace para entrar.`;
            exitoEl.style.display = "block";
        } else {
            alert(`Revisa tu correo (${correo}) y haz click en el enlace para entrar.`);
        }
    });
}

document.addEventListener("renHeaderLoaded", iniciarLogin);
iniciarLogin();
