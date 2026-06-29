(async function iniciarContenidoModulo() {
    await window.renSesionListaPromise;

    const docente = usuarioActivo();
    const cursoIndex = Number(localStorage.getItem("cursoSeleccionado"));
    const moduloIndex = Number(localStorage.getItem("moduloSeleccionado"));

    const cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
    const curso = cursos[cursoIndex];
    const modulo = curso?.modulos?.[moduloIndex];

    const contenidoForm = document.getElementById("contenidoForm");
    const mensajeGuardado = document.getElementById("mensajeGuardado");

    if (!modulo) {
        document.body.innerHTML = `
            <main class="content-shell">
                <a class="back-link" href="modulos.html">Volver a modulos</a>
                <section class="empty-state">
                    <h1>Modulo no encontrado</h1>
                    <p>Selecciona nuevamente el modulo desde el panel docente.</p>
                </section>
            </main>
        `;
        return;
    }

    document.getElementById("nombreModulo").textContent = modulo.nombre;

    cargarContenido();

    if (typeof conectarSubidaArchivo === "function") {
        conectarSubidaArchivo({
            inputFileId: "archivoImagenContenido",
            inputOcultoId: "imagenContenido",
            ayudaId: "ayudaImagenContenido",
            previewId: "previewImagenContenido",
            carpeta: "modulos"
        });

        conectarSubidaArchivo({
            inputFileId: "archivoVideoContenido",
            inputOcultoId: "videoContenido",
            ayudaId: "ayudaVideoContenido",
            previewId: "previewVideoContenido",
            carpeta: "modulos"
        });

        conectarSubidaArchivo({
            inputFileId: "archivoPdfContenido",
            inputOcultoId: "pdfContenido",
            ayudaId: "ayudaPdfContenido",
            carpeta: "modulos"
        });
    }

    contenidoForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titulo = document.getElementById("tituloContenido").value.trim();
        const texto = document.getElementById("textoContenido").value.trim();
        const imagen = document.getElementById("imagenContenido").value.trim();
        const video = document.getElementById("videoContenido").value.trim();
        const pdf = document.getElementById("pdfContenido").value.trim();

        if (!titulo || !texto) {
            alert("Agrega por lo menos titulo y desarrollo del tema.");
            return;
        }

        modulo.contenido = { titulo, texto, imagen, video, pdf };

        const btnSubmit = contenidoForm.querySelector("button[type='submit']");
        const textoOriginal = btnSubmit ? btnSubmit.textContent : "";
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Guardando...";
        }

        if (docente) await guardarCursosDeDocente(docente.id, cursos);

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = textoOriginal;
        }

        mensajeGuardado.textContent = "Contenido guardado correctamente.";
        setTimeout(() => {
            mensajeGuardado.textContent = "";
        }, 2500);
    });

    function cargarContenido() {
        const contenido = modulo.contenido;
        if (!contenido) return;

        document.getElementById("tituloContenido").value = contenido.titulo || "";
        document.getElementById("textoContenido").value = contenido.texto || "";
        document.getElementById("imagenContenido").value = contenido.imagen || "";
        document.getElementById("videoContenido").value = contenido.video || "";
        document.getElementById("pdfContenido").value = contenido.pdf || "";
    }
})();
