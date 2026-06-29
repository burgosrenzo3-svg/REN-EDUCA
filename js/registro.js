/* =======================================================
   REN EDUCA · Crear cuenta (correo + contraseña)
   -------------------------------------------------------
   Se piden nombre, correo, contraseña y rol. Al enviar,
   Supabase crea la cuenta y el trigger de la base de datos
   crea el perfil automaticamente (con el nombre y rol
   elegidos). Si el proyecto de Supabase tiene activada la
   confirmacion por correo, la persona debe confirmar antes
   de poder iniciar sesion; si no, queda con la sesion
   iniciada de inmediato.

   Tambien se puede crear la cuenta de un solo click con
   "Continuar con Google". Como Google no permite enviar el
   rol elegido junto con el login, lo guardamos un momento en
   sessionStorage y main.js lo aplica en cuanto la persona
   vuelve ya autenticada (ver "ren_rol_pendiente_google").
======================================================= */

let registroListo = false;

function iniciarRegistro() {
    if (registroListo) return;

    const registroForm = document.getElementById("registroForm");
    const btnGoogleRegistro = document.getElementById("btnGoogleRegistro");
    if (!registroForm && !btnGoogleRegistro) return;

    registroListo = true;

    if (registroForm) {
        registroForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const nombre = document.getElementById("registroNombre").value.trim();
            const correo = document.getElementById("registroCorreo").value.trim();
            const password = document.getElementById("registroPassword").value;
            const rol = document.getElementById("registroRol").value;
            const errorEl = document.getElementById("registroError");
            const exitoEl = document.getElementById("registroExito");
            const btnSubmit = registroForm.querySelector("button[type='submit']");

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

            if (!nombre || !correo || !password || !rol) {
                mostrarError("Completa todos los campos.");
                return;
            }

            if (!correoValido(correo)) {
                mostrarError("Ingresa un correo electronico valido.");
                return;
            }

            if (password.length < 6) {
                mostrarError("La contraseña debe tener al menos 6 caracteres.");
                return;
            }

            const textoOriginalBoton = btnSubmit ? btnSubmit.innerHTML : "";
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = "<span>Creando cuenta...</span>";
            }

            const resultado = await registrarseConPassword({ correo, password, nombre, rol });

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginalBoton;
            }

            if (!resultado.ok) {
                mostrarError(resultado.error);
                return;
            }

            registroForm.reset();

            if (resultado.requiereConfirmacion) {
                const mensaje = `Listo. Revisa ${correo} y confirma tu cuenta para poder iniciar sesion.`;
                if (exitoEl) {
                    exitoEl.textContent = mensaje;
                    exitoEl.style.display = "block";
                } else {
                    alert(mensaje);
                }
                return;
            }

            if (exitoEl) {
                exitoEl.textContent = "Cuenta creada. Redirigiendo...";
                exitoEl.style.display = "block";
            }

            // Si no se requiere confirmacion por correo, la sesion ya
            // quedo iniciada y main.js redirige al panel correcto al
            // escuchar "ren:sesionActualizada".
        });
    }

    if (btnGoogleRegistro) {
        btnGoogleRegistro.addEventListener("click", async () => {
            const errorEl = document.getElementById("registroError");
            if (errorEl) errorEl.style.display = "none";

            const rol = document.getElementById("registroRol")?.value;
            if (!rol) {
                const mensaje = "Selecciona primero un rol (Estudiante o Docente) y luego continua con Google.";
                if (errorEl) {
                    errorEl.textContent = mensaje;
                    errorEl.style.display = "block";
                } else {
                    alert(mensaje);
                }
                return;
            }

            // Guardamos el rol elegido para que main.js lo aplique al
            // perfil en cuanto la persona vuelva ya autenticada con Google.
            sessionStorage.setItem("ren_rol_pendiente_google", rol);

            btnGoogleRegistro.disabled = true;
            const resultado = await iniciarSesionConGoogle();

            if (!resultado.ok) {
                btnGoogleRegistro.disabled = false;
                sessionStorage.removeItem("ren_rol_pendiente_google");
                if (errorEl) {
                    errorEl.textContent = resultado.error;
                    errorEl.style.display = "block";
                } else {
                    alert(resultado.error);
                }
            }
        });
    }
}

document.addEventListener("renHeaderLoaded", iniciarRegistro);
iniciarRegistro();
