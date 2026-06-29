/* =======================================================
   REN EDUCA · Subida de archivos desde la PC
   -------------------------------------------------------
   Conecta un <input type="file"> con la funcion subirArchivo()
   (definida en auth.js). Cuando la persona elige un archivo:
   1. Se sube a Supabase Storage (bucket "contenido-cursos").
   2. La URL publica resultante se guarda en un <input type="hidden">
      que el resto del formulario ya sabe leer (igual que antes,
      cuando ese campo se llenaba escribiendo una URL a mano).
   3. Si el campo es de imagen, se muestra una vista previa.

   Uso:
   <div class="campo-archivo">
       <input type="file" id="archivoX" accept="image/*">
       <input type="hidden" id="campoOculto">
       <p class="archivo-ayuda" id="ayudaX">...</p>
       <img id="previewX" class="archivo-preview" style="display:none">
   </div>

   conectarSubidaArchivo({
       inputFileId: "archivoX",
       inputOcultoId: "campoOculto",
       ayudaId: "ayudaX",
       previewId: "previewX",   // opcional, solo si es imagen
       carpeta: "cursos"        // subcarpeta dentro del bucket
   });
======================================================= */

function conectarSubidaArchivo({ inputFileId, inputOcultoId, ayudaId, previewId, carpeta }) {
    const inputFile = document.getElementById(inputFileId);
    const inputOculto = document.getElementById(inputOcultoId);
    const ayuda = ayudaId ? document.getElementById(ayudaId) : null;
    const preview = previewId ? document.getElementById(previewId) : null;

    if (!inputFile || !inputOculto) return;

    const textoAyudaOriginal = ayuda ? ayuda.textContent : "";

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

        if (preview) {
            preview.src = resultado.url;
            preview.style.display = "block";
        }
    });

    /* Si ya existe una URL previa (al editar contenido existente),
       muestra la vista previa de entrada sin tener que resubir nada. */
    if (inputOculto.value && preview) {
        preview.src = inputOculto.value;
        preview.style.display = "block";
    }

    if (inputOculto.value && ayuda) {
        ayuda.textContent = "Archivo ya cargado. Elige otro para reemplazarlo.";
    } else if (ayuda) {
        ayuda.textContent = textoAyudaOriginal;
    }
}
