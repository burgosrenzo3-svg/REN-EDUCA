/* =======================================================
   REN EDUCA · Inicio de sesion (correo + contraseña)
   -------------------------------------------------------
   Al enviar el formulario, se valida el correo y la
   contraseña contra Supabase. Si son correctos, la sesion
   queda iniciada de inmediato y la persona es redirigida
   a su panel segun su rol (ver main.js).
======================================================= */

let loginListo = false;

function iniciarLogin() {
    if (loginListo) return;

    const loginForm = document.getElementById("loginForm");
    const btnGoogleLogin = document.getElementById("btnGoogleLogin");
    if (!loginForm && !btnGoogleLogin) return;

    loginListo = true;

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const correo = document.getElementById("loginCorreo").value.trim();
            const password = document.getElementById("loginPassword").value;
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

            if (!password) {
                mostrarError("Ingresa tu contraseña.");
                return;
            }

            const textoOriginalBoton = btnSubmit ? btnSubmit.innerHTML : "";
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = "<span>Ingresando...</span>";
            }

            const resultado = await iniciarSesionConPassword({ correo, password });

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
                exitoEl.textContent = "Sesion iniciada. Redirigiendo...";
                exitoEl.style.display = "block";
            }

            // El cierre del modal y la redireccion al panel correcto
            // los maneja main.js al escuchar "ren:sesionActualizada"
            // (disparado automaticamente por auth.js tras el login).
        });
    }

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", async () => {
            const errorEl = document.getElementById("loginError");
            if (errorEl) errorEl.style.display = "none";

            btnGoogleLogin.disabled = true;
            const resultado = await iniciarSesionConGoogle();

            if (!resultado.ok) {
                btnGoogleLogin.disabled = false;
                if (errorEl) {
                    errorEl.textContent = resultado.error;
                    errorEl.style.display = "block";
                } else {
                    alert(resultado.error);
                }
            }
            // Si todo sale bien, el navegador ya esta saliendo
            // hacia Google: no hay nada mas que hacer aqui.
        });
    }
}

document.addEventListener("renHeaderLoaded", iniciarLogin);
iniciarLogin();
