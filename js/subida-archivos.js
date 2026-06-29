/* =======================================================
   REN EDUCA · Subida de archivos (desde la PC o desde un enlace)
   -------------------------------------------------------
   Conecta un <input type="file"> con la funcion subirArchivo()
   (definida en auth.js). Cuando la persona elige un archivo:
   1. Se sube a Supabase Storage (bucket "contenido-cursos").
   2. La URL publica resultante se guarda en un <input type="hidden">
      que el resto del formulario ya sabe leer (igual que antes,
      cuando ese campo se llenaba escribiendo una URL a mano).
   3. Si el campo es de imagen, se muestra una vista previa.

   Si el campo tiene pestañas "Desde mi PC" / "Desde un enlace"
   (marcadas con el atributo data-tabs-de en el HTML), la persona
   tambien puede pegar directamente la URL de un archivo que ya
   esta en internet (por ejemplo, un video de YouTube o un PDF
   alojado en otro sitio), sin necesidad de subir nada.

   Uso:
   <div class="campo-archivo">
       <div class="archivo-tabs" data-tabs-de="archivoX">
           <button type="button" class="archivo-tab activa" data-modo="pc">Desde mi PC</button>
           <button type="button" class="archivo-tab" data-modo="url">Desde un enlace</button>
       </div>
       <input type="file" id="archivoX" accept="image/*">
       <input type="url" id="urlX" class="archivo-input-url" style="display:none">
       <input type="hidden" id="campoOculto">
       <p class="archivo-ayuda" id="ayudaX">...</p>
       <img id="previewX" class="archivo-preview" style="display:none">
   </div>

   conectarSubidaArchivo({
       inputFileId: "archivoX",
       inputUrlId: "urlX",      // opcional, solo si hay pestañas
       inputOcultoId: "campoOculto",
       ayudaId: "ayudaX",
       previewId: "previewX",   // opcional, solo si es imagen
       previewVideoId: "previewVideoX", // opcional, solo si es video
       carpeta: "cursos"        // subcarpeta dentro del bucket
   });
======================================================= */

function conectarSubidaArchivo({ inputFileId, inputUrlId, inputOcultoId, ayudaId, previewId, previewVideoId, carpeta }) {
    const inputFile = document.getElementById(inputFileId);
    const inputUrl = inputUrlId ? document.getElementById(inputUrlId) : null;
    const inputOculto = document.getElementById(inputOcultoId);
    const ayuda = ayudaId ? document.getElementById(ayudaId) : null;
    const preview = previewId ? document.getElementById(previewId) : null;
    const previewVideo = previewVideoId ? document.getElementById(previewVideoId) : null;

    if (!inputFile || !inputOculto) return;

    const textoAyudaOriginal = ayuda ? ayuda.textContent : "";

    function mostrarVistaPrevia(url) {
        if (preview) {
            preview.src = url;
            preview.style.display = "block";
        }
        if (previewVideo) {
            previewVideo.src = url;
            previewVideo.style.display = "block";
        }
    }

    inputFile.addEventListener("change", async () => {
        const archivo = inputFile.files?.[0];
        if (!archivo) return;

        if (ayuda) {
            ayuda.textContent = "Subiendo archivo...";
            ayuda.classList.remove("archivo-error");
        }

        const resultado = await subirArchivo(archivo, carpeta);

        if (!resultado.ok) {
            if (ayuda) {
                ayuda.textContent = resultado.error;
                ayuda.classList.add("archivo-error");
            } else {
                alert(resultado.error);
            }
            inputFile.value = "";
            return;
        }

        inputOculto.value = resultado.url;

        if (ayuda) {
            ayuda.textContent = `Listo: ${archivo.name}`;
            ayuda.classList.remove("archivo-error");
        }

        mostrarVistaPrevia(resultado.url);
    });

    /* Modo "Desde un enlace": cada vez que la persona escribe o
       pega una URL, se guarda directo en el campo oculto (no hay
       nada que subir, el archivo ya vive en otro servidor). */
    if (inputUrl) {
        inputUrl.addEventListener("input", () => {
            const url = inputUrl.value.trim();
            inputOculto.value = url;

            if (!url) {
                if (ayuda) ayuda.textContent = "Pega el enlace del archivo.";
                return;
            }

            if (ayuda) {
                ayuda.textContent = "Enlace guardado.";
                ayuda.classList.remove("archivo-error");
            }

            mostrarVistaPrevia(url);
        });
    }

    /* Si ya existe una URL previa (al editar contenido existente),
       muestra la vista previa de entrada sin tener que resubir nada. */
    if (inputOculto.value) {
        mostrarVistaPrevia(inputOculto.value);
    }

    if (inputOculto.value && ayuda) {
        ayuda.textContent = "Archivo ya cargado. Puedes reemplazarlo.";
    } else if (ayuda) {
        ayuda.textContent = textoAyudaOriginal;
    }
}

/* Activa el comportamiento de pestañas "Desde mi PC" / "Desde un
   enlace" para todos los campos de archivo de la pagina que las
   tengan. Al cambiar de pestaña se muestra el control adecuado
   (input de archivo o input de URL) y se limpia el otro, para
   que el campo oculto siempre refleje un solo origen a la vez. */
function iniciarPestanasArchivo() {
    document.querySelectorAll(".archivo-tabs").forEach((tabs) => {
        if (tabs.dataset.tabsListo) return;
        tabs.dataset.tabsListo = "true";

        const inputFileId = tabs.dataset.tabsDe;
        const inputFile = document.getElementById(inputFileId);
        if (!inputFile) return;

        const wrapper = inputFile.closest(".campo-archivo");
        const inputUrl = wrapper?.querySelector(".archivo-input-url");
        const botones = tabs.querySelectorAll(".archivo-tab");

        botones.forEach((boton) => {
            boton.addEventListener("click", () => {
                const modo = boton.dataset.modo;

                botones.forEach((b) => b.classList.toggle("activa", b === boton));

                if (modo === "url") {
                    inputFile.style.display = "none";
                    inputFile.value = "";
                    if (inputUrl) inputUrl.style.display = "block";
                } else {
                    if (inputUrl) {
                        inputUrl.style.display = "none";
                        inputUrl.value = "";
                    }
                    inputFile.style.display = "block";
                }
            });
        });

        /* Si el campo ya trae un enlace guardado (al editar contenido
           existente) y ese enlace no es de Supabase Storage, abre
           directamente en la pestaña "Desde un enlace" para que se
           vea de donde vino. */
        const inputOcultoId = inputFile.parentElement.querySelector("input[type='hidden']")?.id;
        const valorActual = inputOcultoId ? document.getElementById(inputOcultoId)?.value : "";

        if (valorActual && inputUrl && !valorActual.includes("supabase.co")) {
            const botonUrl = tabs.querySelector("[data-modo='url']");
            botonUrl?.click();
            inputUrl.value = valorActual;
        }
    });
}

document.addEventListener("DOMContentLoaded", iniciarPestanasArchivo);
iniciarPestanasArchivo();
