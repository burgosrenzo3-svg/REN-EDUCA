(async function iniciarVerModulo() {
    await window.renSesionListaPromise;

    const usuario = usuarioActivo();

    /* ver-modulo.html se usa desde tres flujos distintos:
       1) Docente -> vista previa rapida desde modulos.html (solo lectura,
          usa indices locales del docente, sin quiz ni progreso)
       2) Estudiante real -> desde curso.html (usa cursoSeleccionadoId + docenteIdDelCurso)
       3) Docente en "Vista Estudiante" -> mismo flujo que el (2), pero el
          docente puede responder el quiz y marcar progreso igual que un
          estudiante, para poder revisar la experiencia completa. */

    let curso = null;
    let modulo = null;
    let cursoIdParaProgreso = null;
    let esVistaPreviaRapida = false;

    const cursoSeleccionadoId = localStorage.getItem("cursoSeleccionadoId");
    const docenteIdDelCurso = localStorage.getItem("cursoSeleccionadoDocenteId");
    const moduloSeleccionadoIndex = localStorage.getItem("moduloSeleccionadoIndex");
    const cursoIndexDocente = localStorage.getItem("cursoSeleccionado");
    const moduloIndexDocente = localStorage.getItem("moduloSeleccionado");

    const modoVistaDocente = typeof esModoVistaDocente === "function" && esModoVistaDocente();

    if (!modoVistaDocente && usuario && usuario.rol === "docente" && cursoIndexDocente !== null && moduloIndexDocente !== null) {
        esVistaPreviaRapida = true;
        const cursosDocente = await obtenerCursosDeDocente(usuario.id);
        curso = cursosDocente[Number(cursoIndexDocente)];
        modulo = curso?.modulos?.[Number(moduloIndexDocente)];
        cursoIdParaProgreso = curso?.id;
    } else if (docenteIdDelCurso && cursoSeleccionadoId) {
        const cursosDelDocente = await obtenerCursosDeDocente(docenteIdDelCurso);
        curso = cursosDelDocente.find((c) => String(c.id) === String(cursoSeleccionadoId));
        modulo = curso?.modulos?.[Number(moduloSeleccionadoIndex)];
        cursoIdParaProgreso = curso?.id;
    }

    /* El progreso y el quiz se guardan con la cuenta de quien esta navegando.
       Si es un estudiante real, o un docente en Vista Estudiante, ambos
       pueden tener su propio registro de avance. */
    const puedeProgresar = usuario && (usuario.rol === "estudiante" || modoVistaDocente);
    const progreso = puedeProgresar ? await obtenerProgresoDeEstudiante(usuario.id) : {};
    const quizGuardado = puedeProgresar ? await obtenerQuizDeEstudiante(usuario.id) : {};

    const tituloModulo = document.getElementById("tituloModulo");
    const textoModulo = document.getElementById("textoModulo");
    const imagenModulo = document.getElementById("imagenModulo");
    const videoContainer = document.getElementById("videoContainer");
    const pdfContainer = document.getElementById("pdfContainer");
    const estadoModulo = document.getElementById("estadoModulo");
    const linkVolver = document.getElementById("linkVolver");
    const accionFinalModulo = document.getElementById("accionFinalModulo");

    if (linkVolver) {
        linkVolver.href = esVistaPreviaRapida ? "modulos.html" : "curso.html";
        linkVolver.textContent = esVistaPreviaRapida ? "Volver a modulos" : "Volver al curso";
    }

    if (!modulo) {
        document.body.innerHTML = `
            <main class="lesson-shell">
                <a class="back-link" href="${esVistaPreviaRapida ? "modulos.html" : "curso.html"}">Volver</a>
                <section class="empty-state">
                    <h1>Modulo no encontrado</h1>
                    <p>Selecciona nuevamente un modulo.</p>
                </section>
            </main>
        `;
        return;
    } else if (!esVistaPreviaRapida && !moduloDesbloqueado()) {
        document.body.innerHTML = `
            <main class="lesson-shell">
                <a class="back-link" href="curso.html">Volver al curso</a>
                <section class="empty-state">
                    <h1>🔒 Modulo bloqueado</h1>
                    <p>Debes completar el modulo anterior antes de acceder a este contenido.</p>
                </section>
            </main>
        `;
        return;
    }

    modulo.quiz = modulo.quiz || [];
    cargarModulo();
    cargarEstado();

    /* El bloqueo por progreso secuencial solo aplica a estudiantes reales.
       El docente en Vista Estudiante puede navegar libremente para revisar
       cualquier modulo, sin importar el orden. */
    function moduloDesbloqueado() {
        if (modoVistaDocente) return true;

        const indiceActual = Number(moduloSeleccionadoIndex);
        if (!indiceActual) return true; // index 0 o NaN -> primer modulo

        const modulos = curso?.modulos || [];
        const anterior = modulos[indiceActual - 1];
        if (!anterior) return true;

        const claveAnterior = `${cursoIdParaProgreso}_${anterior.id}`;
        return Boolean(progreso[claveAnterior]);
    }

    function cargarModulo() {
        const contenido = modulo.contenido;

        tituloModulo.textContent = contenido?.titulo || modulo.nombre;
        textoModulo.textContent = contenido?.texto || "Este modulo todavia no tiene contenido cargado.";

        if (contenido?.imagen) {
            imagenModulo.src = contenido.imagen;
            imagenModulo.style.display = "block";
        } else {
            imagenModulo.style.display = "none";
        }

        videoContainer.innerHTML = contenido?.video
            ? crearRecurso("Video de apoyo", contenido.video, "Ver video")
            : crearRecursoVacio("Sin video agregado");

        pdfContainer.innerHTML = contenido?.pdf
            ? crearRecurso("Material PDF", contenido.pdf, "Abrir material")
            : crearRecursoVacio("Sin PDF agregado");
    }

    function cargarEstado() {
        if (esVistaPreviaRapida) {
            estadoModulo.textContent = "Vista previa rapida (modo docente)";
            accionFinalModulo.innerHTML = `<p class="lesson-state-note">El quiz y el boton de completar solo estan disponibles desde "Vista Estudiante".</p>`;
            return;
        }

        const tieneQuiz = modulo.quiz.length > 0;
        const completado = Boolean(progreso[claveModulo()]);
        const registroQuiz = quizGuardado[claveModulo()];

        if (completado) {
            estadoModulo.textContent = "Modulo completado";
        } else {
            estadoModulo.textContent = tieneQuiz ? "Pendiente: debes aprobar el quiz" : "Pendiente";
        }

        if (!tieneQuiz) {
            accionFinalModulo.innerHTML = `<button id="btnCompletar" type="button" ${completado ? "disabled" : ""}>${completado ? "Completado" : "Marcar como completado"}</button>`;
            document.getElementById("btnCompletar")?.addEventListener("click", marcarCompletadoDirecto);
            return;
        }

        if (completado) {
            accionFinalModulo.innerHTML = `
                <div class="quiz-resumen aprobado">
                    <p>Quiz aprobado con ${registroQuiz?.mejorNota ?? 100}% · ${registroQuiz?.intentos ?? 1} intento${(registroQuiz?.intentos ?? 1) === 1 ? "" : "s"}</p>
                    <button id="btnReintentarQuiz" type="button" class="btn-secondary-inline">Repasar quiz</button>
                </div>
            `;
        } else {
            accionFinalModulo.innerHTML = `
                <div class="quiz-resumen">
                    <p>Este modulo tiene un quiz de ${modulo.quiz.length} pregunta${modulo.quiz.length === 1 ? "" : "s"}. Debes responder todo correctamente (100%) para completarlo.</p>
                    ${registroQuiz ? `<p class="quiz-resumen-intentos">Ultimo intento: ${registroQuiz.ultimaNota}% · ${registroQuiz.intentos} intento${registroQuiz.intentos === 1 ? "" : "s"}</p>` : ""}
                    <button id="btnIrQuiz" type="button">${registroQuiz ? "Reintentar quiz" : "Responder quiz"}</button>
                </div>
            `;
        }

        document.getElementById("btnIrQuiz")?.addEventListener("click", irAQuiz);
        document.getElementById("btnReintentarQuiz")?.addEventListener("click", irAQuiz);
    }

    function irAQuiz() {
        localStorage.setItem("quizCursoSeleccionadoId", cursoIdParaProgreso);
        localStorage.setItem("quizModuloId", modulo.id);
        window.location.href = "quiz.html";
    }

    async function marcarCompletadoDirecto() {
        if (!puedeProgresar) return;

        progreso[claveModulo()] = true;
        await guardarProgresoDeEstudiante(usuario.id, progreso);
        cargarEstado();
    }

    function crearRecurso(titulo, url, textoBoton) {
        return `
            <article class="resource-card">
                <h2>${titulo}</h2>
                <a href="${escapeHTML(url)}" target="_blank" rel="noopener">${textoBoton}</a>
            </article>
        `;
    }

    function crearRecursoVacio(texto) {
        return `
            <article class="resource-card muted">
                <h2>${texto}</h2>
                <p>El docente puede completar este recurso despues.</p>
            </article>
        `;
    }

    function claveModulo() {
        return `${cursoIdParaProgreso}_${modulo.id}`;
    }
})();
