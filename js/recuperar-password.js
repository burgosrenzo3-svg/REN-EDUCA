/* =======================================================
   REN EDUCA · Recuperar / restablecer contraseña
   -------------------------------------------------------
   Flujo:
   1. La persona hace click en "¿Olvidaste tu contraseña?"
      desde el modal de login -> se abre "modalRecuperar".
   2. Escribe su correo y se le envia un enlace (ver
      enviarCorreoRecuperacion en auth.js).
   3. Hace click en ese enlace desde su correo y vuelve a esta
      misma pagina. Supabase dispara el evento "PASSWORD_RECOVERY"
      (ver auth.js), que aqui escuchamos para abrir
      "modalNuevaPassword" automaticamente.
   4. Escribe su nueva contraseña dos veces y se guarda con
      guardarNuevaPassword (tambien en auth.js).
======================================================= */

let recuperarListo = false;

function iniciarRecuperarPassword() {
    if (recuperarListo) return;

    const modalLogin = document.getElementById("modalLogin");
    const modalRecuperar = document.getElementById("modalRecuperar");
    const modalNuevaPassword = document.getElementById("modalNuevaPassword");
    const irARecuperar = document.getElementById("irARecuperar");
    const irALoginDesdeRecuperar = document.getElementById("irALoginDesdeRecuperar");
    const cerrarRecuperar = document.getElementById("cerrarRecuperar");
    const recuperarForm = document.getElementById("recuperarForm");
    const nuevaPasswordForm = document.getElementById("nuevaPasswordForm");

    if (!recuperarForm && !nuevaPasswordForm) return;

    recuperarListo = true;

    /* Navegacion entre modales */
    irARecuperar?.addEventListener("click", (event) => {
        event.preventDefault();
        modalLogin?.classList.remove("active");
        modalRecuperar?.classList.add("active");
    });

    irALoginDesdeRecuperar?.addEventListener("click", (event) => {
        event.preventDefault();
        modalRecuperar?.classList.remove("active");
        modalLogin?.classList.add("active");
    });

    cerrarRecuperar?.addEventListener("click", () => {
        modalRecuperar?.classList.remove("active");
    });

    modalRecuperar?.addEventListener("click", (event) => {
        if (event.target === modalRecuperar) {
            modalRecuperar.classList.remove("active");
        }
    });

    /* Paso 1: enviar el enlace de recuperacion */
    if (recuperarForm) {
        recuperarForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const correo = document.getElementById("recuperarCorreo").value.trim();
            const errorEl = document.getElementById("recuperarError");
            const exitoEl = document.getElementById("recuperarExito");
            const btnSubmit = recuperarForm.querySelector("button[type='submit']");

            if (errorEl) errorEl.style.display = "none";
            if (exitoEl) exitoEl.style.display = "none";

            if (!correoValido(correo)) {
                if (errorEl) {
                    errorEl.textContent = "Ingresa un correo electronico valido.";
                    errorEl.style.display = "block";
                }
                return;
            }

            const textoOriginal = btnSubmit ? btnSubmit.innerHTML : "";
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = "<span>Enviando...</span>";
            }

            const resultado = await enviarCorreoRecuperacion(correo);

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginal;
            }

            if (!resultado.ok) {
                if (errorEl) {
                    errorEl.textContent = resultado.error;
                    errorEl.style.display = "block";
                }
                return;
            }

            recuperarForm.reset();
            if (exitoEl) {
                exitoEl.textContent = `Listo. Revisa ${correo} y haz click en el enlace para crear tu nueva contraseña.`;
                exitoEl.style.display = "block";
            }
        });
    }

    /* Paso 3: la persona ya volvio desde el correo. Mostramos el
       modal de nueva contraseña (y cerramos cualquier otro modal
       que pudiera estar abierto). */
    document.addEventListener("ren:recuperarPassword", () => {
        modalLogin?.classList.remove("active");
        modalRecuperar?.classList.remove("active");
        document.getElementById("modalRegistro")?.classList.remove("active");
        modalNuevaPassword?.classList.add("active");
    });

    /* Paso 4: guardar la nueva contraseña */
    if (nuevaPasswordForm) {
        nuevaPasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const nuevaPassword = document.getElementById("nuevaPassword").value;
            const confirmar = document.getElementById("confirmarNuevaPassword").value;
            const errorEl = document.getElementById("nuevaPasswordError");
            const exitoEl = document.getElementById("nuevaPasswordExito");
            const btnSubmit = nuevaPasswordForm.querySelector("button[type='submit']");

            if (errorEl) errorEl.style.display = "none";
            if (exitoEl) exitoEl.style.display = "none";

            if (nuevaPassword.length < 6) {
                if (errorEl) {
                    errorEl.textContent = "La contraseña debe tener al menos 6 caracteres.";
                    errorEl.style.display = "block";
                }
                return;
            }

            if (nuevaPassword !== confirmar) {
                if (errorEl) {
                    errorEl.textContent = "Las contraseñas no coinciden.";
                    errorEl.style.display = "block";
                }
                return;
            }

            const textoOriginal = btnSubmit ? btnSubmit.innerHTML : "";
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = "<span>Guardando...</span>";
            }

            const resultado = await guardarNuevaPassword(nuevaPassword);

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginal;
            }

            if (!resultado.ok) {
                if (errorEl) {
                    errorEl.textContent = resultado.error;
                    errorEl.style.display = "block";
                }
                return;
            }

            nuevaPasswordForm.reset();
            window.renEnFlujoRecuperacion = false;

            if (exitoEl) {
                exitoEl.textContent = "Contraseña actualizada. Redirigiendo...";
                exitoEl.style.display = "block";
            }

            // Ya tiene sesion iniciada (resetPasswordForEmail + el
            // click en el enlace la inician automaticamente), asi
            // que la llevamos directo a su panel segun su rol.
            setTimeout(async () => {
                const usuario = await usuarioActivoAsync();
                modalNuevaPassword?.classList.remove("active");

                const destinoPorRol = {
                    admin: "panel-admin.html",
                    docente: "panel-docente.html",
                    estudiante: "panel-estudiante.html"
                };
                const prefijo = typeof prefix !== "undefined" ? prefix : "";
                const destino = destinoPorRol[usuario?.rol] || destinoPorRol.estudiante;
                window.location.href = prefijo + "paginas/" + destino;
            }, 1200);
        });
    }
}

document.addEventListener("renHeaderLoaded", iniciarRecuperarPassword);
iniciarRecuperarPassword();
