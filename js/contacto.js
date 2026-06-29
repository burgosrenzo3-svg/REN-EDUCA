/* =======================================================
   REN EDUCA · Formulario de contacto (envia correo real)
   -------------------------------------------------------
   Este formulario usa EmailJS (https://www.emailjs.com) para
   enviar el mensaje directo a burgosrenzo3@gmail.com, SIN
   necesitar un servidor propio. EmailJS tiene un plan gratis
   (200 correos al mes) que es mas que suficiente para esto.

   PARA ACTIVARLO (una sola vez), sigue estos pasos:

   1. Entra a https://www.emailjs.com y crea una cuenta gratis
      (puedes usar el mismo correo burgosrenzo3@gmail.com).

   2. Ve a "Email Services" -> "Add New Service" -> elige Gmail
      -> conecta la cuenta burgosrenzo3@gmail.com. Copia el
      "Service ID" que te genera (ej: service_abc1234).

   3. Ve a "Email Templates" -> "Create New Template". Usa estas
      variables en el cuerpo del correo: {{from_name}}, {{from_email}}
      y {{message}}. Por ejemplo:

         Nuevo mensaje de contacto - REN EDUCA

         Nombre: {{from_name}}
         Correo: {{from_email}}

         Mensaje:
         {{message}}

      En el campo "To Email" de la plantilla escribe:
      burgosrenzo3@gmail.com
      Guarda y copia el "Template ID" (ej: template_xyz789).

   4. Ve a "Account" -> "General" y copia tu "Public Key"
      (ej: AbCdEfGhIjKlMnOp).

   5. Pega esos 3 valores aqui abajo, en EMAILJS_CONFIG, y listo:
      cada mensaje del formulario llegara a tu Gmail.
======================================================= */

const EMAILJS_CONFIG = {
    serviceId: "PEGA_AQUI_TU_SERVICE_ID",
    templateId: "PEGA_AQUI_TU_TEMPLATE_ID",
    publicKey: "PEGA_AQUI_TU_PUBLIC_KEY"
};

const CORREO_DESTINO_CONTACTO = "burgosrenzo3@gmail.com";

function contactoConfigurado() {
    return (
        EMAILJS_CONFIG.serviceId &&
        EMAILJS_CONFIG.templateId &&
        EMAILJS_CONFIG.publicKey &&
        !EMAILJS_CONFIG.serviceId.startsWith("PEGA_AQUI") &&
        !EMAILJS_CONFIG.templateId.startsWith("PEGA_AQUI") &&
        !EMAILJS_CONFIG.publicKey.startsWith("PEGA_AQUI")
    );
}

const form = document.getElementById("contactForm");

if (form) {
    if (typeof emailjs !== "undefined" && contactoConfigurado()) {
        emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const errorEl = document.getElementById("contactoError");
        const exitoEl = document.getElementById("contactoExito");
        const btnSubmit = form.querySelector("button[type='submit']");

        if (errorEl) errorEl.style.display = "none";
        if (exitoEl) exitoEl.style.display = "none";

        const nombre = document.getElementById("contactoNombre").value.trim();
        const correo = document.getElementById("contactoCorreo").value.trim();
        const mensaje = document.getElementById("contactoMensaje").value.trim();

        const mostrarError = (texto) => {
            if (errorEl) {
                errorEl.textContent = texto;
                errorEl.style.display = "block";
            } else {
                alert(texto);
            }
        };

        if (!nombre || !correo || !mensaje) {
            mostrarError("Completa todos los campos.");
            return;
        }

        if (!contactoConfigurado() || typeof emailjs === "undefined") {
            mostrarError(
                `Para que los mensajes lleguen a ${CORREO_DESTINO_CONTACTO}, falta conectar EmailJS ` +
                `(revisa las instrucciones en js/contacto.js).`
            );
            return;
        }

        const textoOriginalBoton = btnSubmit ? btnSubmit.innerHTML : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Enviando...";
        }

        try {
            await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
                from_name: nombre,
                from_email: correo,
                message: mensaje,
                to_email: CORREO_DESTINO_CONTACTO
            });

            form.reset();

            if (exitoEl) {
                exitoEl.textContent = "Mensaje enviado correctamente. Te responderemos pronto.";
                exitoEl.style.display = "block";
            } else {
                alert("Mensaje enviado correctamente.");
            }
        } catch (error) {
            console.error("Error EmailJS:", error);
            mostrarError("No se pudo enviar el mensaje. Intenta de nuevo en un momento.");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginalBoton;
            }
        }
    });
}
