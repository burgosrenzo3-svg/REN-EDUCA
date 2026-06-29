/* =======================================================
   REN EDUCA · Crear cuenta (sin contraseña)
   -------------------------------------------------------
   Se piden nombre, correo y rol. Al enviar, Supabase manda
   un enlace de acceso al correo. Cuando la persona hace
   click en ese enlace por primera vez, se crea su cuenta y
   su perfil automaticamente (con el nombre y rol elegidos),
   y queda con la sesion iniciada.
======================================================= */

let registroListo = false;

function iniciarRegistro() {
    if (registroListo) return;

    const registroForm = document.getElementById("registroForm");
    if (!registroForm) return;

    registroListo = true;

    registroForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("registroNombre").value.trim();
        const correo = document.getElementById("registroCorreo").value.trim();
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

        if (!nombre || !correo || !rol) {
            mostrarError("Completa todos los campos.");
            return;
        }

        if (!correoValido(correo)) {
            mostrarError("Ingresa un correo electronico valido.");
            return;
        }

        const textoOriginalBoton = btnSubmit ? btnSubmit.innerHTML : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = "<span>Enviando enlace...</span>";
        }

        const resultado = await enviarEnlaceAcceso({ correo, nombre, rol });

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textoOriginalBoton;
        }

        if (!resultado.ok) {
            mostrarError(resultado.error);
            return;
        }

        registroForm.reset();

        if (exitoEl) {
            exitoEl.textContent = `Listo. Revisa ${correo} y haz click en el enlace para confirmar tu cuenta.`;
            exitoEl.style.display = "block";
        } else {
            alert(`Revisa tu correo (${correo}) y haz click en el enlace para confirmar tu cuenta.`);
        }
    });
}

document.addEventListener("renHeaderLoaded", iniciarRegistro);
iniciarRegistro();
