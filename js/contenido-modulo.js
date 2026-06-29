(async function iniciarContenidoModulo() {
    await window.renSesionListaPromise;

    const docente = usuarioActivo();
    const parametros = new URLSearchParams(window.location.search);
    const cursoId = parametros.get("curso");
    const moduloId = parametros.get("modulo");

    const cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
    const curso = cursos.find((c) => String(c.id) === String(cursoId));
    const modulo = curso?.modulos?.find((m) => String(m.id) === String(moduloId));

    const contenidoForm = document.getElementById("contenidoForm");
    const mensajeGuardado = document.getElementById("mensajeGuardado");

    if (!modulo) {
        const volverUrl = cursoId ? `modulos.html?curso=${cursoId}` : "panel-docente.html";
        document.body.innerHTML = `
            <main class="content-shell">
                <a class="back-link" href="${volverUrl}">Volver a modulos</a>
                <section class="empty-state">
                    <h1>Modulo no encontrado</h1>
                    <p>Selecciona nuevamente el modulo desde el panel docente.</p>
                </section>
            </main>
        `;
        return;
    }

    document.getElementById("nombreModulo").textContent = modulo.nombre;

    const linkVolverModulos = document.querySelector("a.back-link");
    if (linkVolverModulos) linkVolverModulos.href = `modulos.html?curso=${cursoId}`;

    cargarContenido();
    conectarVistaPrevia();

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

    /* Muestra una vista previa en vivo de la imagen y el video a
       medida que el docente pega el enlace, para confirmar el
       material correcto antes de guardar. Si el video es de
       YouTube o Vimeo, se embebe (el <video> nativo no puede
       reproducir esos enlaces directamente). */
    function conectarVistaPrevia() {
        const inputImagen = document.getElementById("imagenContenido");
        const previewImagen = document.getElementById("previewImagenContenido");
        const inputVideo = document.getElementById("videoContenido");
        const previewVideo = document.getElementById("previewVideoContenido");
        const previewVideoWrap = previewVideo.parentElement;

        function actualizarImagen() {
            const url = inputImagen.value.trim();
            if (url) {
                previewImagen.src = url;
                previewImagen.style.display = "block";
            } else {
                previewImagen.style.display = "none";
            }
        }

        function extraerIdYoutube(url) {
            const patrones = [
                /youtube\.com\/watch\?v=([\w-]{6,})/,
                /youtu\.be\/([\w-]{6,})/,
                /youtube\.com\/embed\/([\w-]{6,})/,
                /youtube\.com\/shorts\/([\w-]{6,})/
            ];
            for (const patron of patrones) {
                const match = url.match(patron);
                if (match) return match[1];
            }
            return null;
        }

        function extraerIdVimeo(url) {
            const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            return match ? match[1] : null;
        }

        let iframePrevia = null;

        function actualizarVideo() {
            const url = inputVideo.value.trim();

            if (iframePrevia) {
                iframePrevia.remove();
                iframePrevia = null;
            }

            if (!url) {
                previewVideo.style.display = "none";
                return;
            }

            const idYoutube = extraerIdYoutube(url);
            const idVimeo = extraerIdVimeo(url);

            if (idYoutube || idVimeo) {
                previewVideo.style.display = "none";
                iframePrevia = document.createElement("iframe");
                iframePrevia.className = "archivo-preview-video";
                iframePrevia.src = idYoutube
                    ? `https://www.youtube.com/embed/${idYoutube}`
                    : `https://player.vimeo.com/video/${idVimeo}`;
                iframePrevia.setAttribute("frameborder", "0");
                iframePrevia.setAttribute("allowfullscreen", "");
                iframePrevia.setAttribute("loading", "lazy");
                previewVideoWrap.appendChild(iframePrevia);
            } else {
                previewVideo.src = url;
                previewVideo.style.display = "block";
            }
        }

        inputImagen.addEventListener("input", actualizarImagen);
        inputVideo.addEventListener("input", actualizarVideo);

        actualizarImagen();
        actualizarVideo();
    }
})();
