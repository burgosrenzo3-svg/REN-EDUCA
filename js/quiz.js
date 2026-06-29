(async function iniciarQuiz() {
    await window.renSesionListaPromise;

    const estudiante = usuarioActivo();

    const cursoSeleccionadoId = localStorage.getItem("cursoSeleccionadoId");
    const docenteIdDelCurso = localStorage.getItem("cursoSeleccionadoDocenteId");
    const quizModuloId = localStorage.getItem("quizModuloId");

    const cursosDelDocente = docenteIdDelCurso ? await obtenerCursosDeDocente(docenteIdDelCurso) : [];
    const curso = cursosDelDocente.find((c) => String(c.id) === String(cursoSeleccionadoId));
    const modulo = curso?.modulos?.find((m) => String(m.id) === String(quizModuloId));

    const tituloModuloQuiz = document.getElementById("tituloModuloQuiz");
    const quizContenedor = document.getElementById("quizContenedor");
    const linkVolverCurso = document.getElementById("linkVolverCurso");

    let respuestas = {};
    let yaCorregido = false;

    const modoVistaDocente = typeof esModoVistaDocente === "function" && esModoVistaDocente();
    const puedeResponderQuiz = estudiante && (estudiante.rol === "estudiante" || modoVistaDocente);

    if (!puedeResponderQuiz) {
        quizContenedor.innerHTML = `
            <section class="empty-state">
                <h3>Disponible solo para estudiantes</h3>
                <p>Inicia sesion como estudiante para responder este quiz.</p>
            </section>
        `;
        return;
    } else if (!modulo || !modulo.quiz || modulo.quiz.length === 0) {
        quizContenedor.innerHTML = `
            <section class="empty-state">
                <h3>Este modulo no tiene quiz</h3>
                <p>Vuelve al curso para revisar el contenido del modulo.</p>
            </section>
        `;
        return;
    }

    tituloModuloQuiz.textContent = `Quiz · ${modulo.nombre}`;
    if (curso) linkVolverCurso.href = "curso.html";
    renderizarPreguntas();

    function renderizarPreguntas() {
        yaCorregido = false;
        respuestas = {};

        const preguntasHTML = modulo.quiz.map((pregunta, index) => {
            const opcionesHTML = pregunta.opciones.map((opcion) => `
                <label class="respuesta-opcion" data-pregunta="${pregunta.id}" data-opcion="${opcion.id}">
                    <input type="radio" name="pregunta_${pregunta.id}" value="${opcion.id}">
                    <span>${escapeHTML(opcion.texto)}</span>
                </label>
            `).join("");

            return `
                <article class="pregunta-jugable" data-pregunta-card="${pregunta.id}">
                    <h3>${index + 1}. ${escapeHTML(pregunta.texto)}</h3>
                    <div class="respuestas-grid">${opcionesHTML}</div>
                </article>
            `;
        }).join("");

        quizContenedor.innerHTML = `
            <div class="quiz-progreso">
                <span>Progreso de respuestas</span>
                <span id="contadorRespondidas">0 / ${modulo.quiz.length}</span>
            </div>
            <div class="quiz-progreso-track"><span id="barraRespondidas" style="width:0%"></span></div>

            ${preguntasHTML}

            <button id="btnEnviarQuiz" type="button" disabled>Calificar quiz</button>
            <div id="resultadoQuiz"></div>
        `;

        quizContenedor.querySelectorAll('input[type="radio"]').forEach((input) => {
            input.addEventListener("change", manejarSeleccion);
        });

        document.getElementById("btnEnviarQuiz").addEventListener("click", enviarQuiz);
    }

    function manejarSeleccion(event) {
        const preguntaId = event.target.name.replace("pregunta_", "");
        respuestas[preguntaId] = event.target.value;
        actualizarProgresoRespuestas();
    }

    function actualizarProgresoRespuestas() {
        const totalRespondidas = Object.keys(respuestas).length;
        const total = modulo.quiz.length;

        document.getElementById("contadorRespondidas").textContent = `${totalRespondidas} / ${total}`;
        document.getElementById("barraRespondidas").style.width = `${(totalRespondidas / total) * 100}%`;

        const btnEnviar = document.getElementById("btnEnviarQuiz");
        if (btnEnviar) btnEnviar.disabled = totalRespondidas < total;
    }

    async function enviarQuiz() {
        if (yaCorregido) return;
        yaCorregido = true;

        const btnEnviar = document.getElementById("btnEnviarQuiz");
        if (btnEnviar) btnEnviar.textContent = "Calificando...";

        const resultado = calificarQuiz(modulo.quiz, respuestas);

        resultado.detalle.forEach(({ preguntaId, esCorrecta }) => {
            const card = quizContenedor.querySelector(`[data-pregunta-card="${preguntaId}"]`);
            if (!card) return;

            const opcionElegida = card.querySelector(`input[name="pregunta_${preguntaId}"]:checked`);
            const pregunta = modulo.quiz.find((p) => String(p.id) === String(preguntaId));

            card.querySelectorAll(".respuesta-opcion").forEach((label) => {
                const opcionId = label.dataset.opcion;
                label.querySelector("input").disabled = true;

                if (String(opcionId) === String(pregunta.respuestaCorrecta)) {
                    label.classList.add("correcta");
                } else if (opcionElegida && String(opcionId) === String(opcionElegida.value)) {
                    label.classList.add("incorrecta");
                }
            });
        });

        const claveModulo = `${curso.id}_${modulo.id}`;
        const registro = await registrarIntentoQuiz(estudiante.id, claveModulo, {
            nota: resultado.nota,
            aprobado: resultado.aprobado
        });

        if (resultado.aprobado) {
            const progreso = await obtenerProgresoDeEstudiante(estudiante.id);
            progreso[claveModulo] = true;
            await guardarProgresoDeEstudiante(estudiante.id, progreso);
        }

        mostrarResultado(resultado, registro);

        document.getElementById("btnEnviarQuiz").style.display = "none";
    }

    function mostrarResultado(resultado, registro) {
        const resultadoQuiz = document.getElementById("resultadoQuiz");

        resultadoQuiz.innerHTML = `
            <div class="quiz-resultado ${resultado.aprobado ? "aprobado" : "reprobado"}">
                <p class="eyebrow">${resultado.aprobado ? "Quiz aprobado" : "Aun no aprobado"}</p>
                <p class="nota">${resultado.nota}%</p>
                <p>${resultado.correctas} de ${resultado.total} respuestas correctas · Intento numero ${registro.intentos}</p>
                <p>${resultado.aprobado
                    ? "Excelente trabajo. El modulo ya quedo marcado como completado."
                    : "Necesitas el 100% para completar el modulo. Revisa las respuestas marcadas arriba e intenta de nuevo."}
                </p>
                <div class="quiz-resultado-acciones">
                    ${resultado.aprobado ? "" : '<button id="btnReintentar" type="button">Intentar de nuevo</button>'}
                    <button id="btnVolverCursoResultado" type="button" class="btn-volver-curso">Volver al curso</button>
                </div>
            </div>
        `;

        document.getElementById("btnReintentar")?.addEventListener("click", renderizarPreguntas);
        document.getElementById("btnVolverCursoResultado").addEventListener("click", () => {
            window.location.href = "curso.html";
        });

        resultadoQuiz.scrollIntoView({ behavior: "smooth", block: "center" });
    }
})();
