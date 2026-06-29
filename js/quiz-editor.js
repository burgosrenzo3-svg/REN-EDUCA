(async function iniciarQuizEditor() {
    await window.renSesionListaPromise;

    const docente = usuarioActivo();
    const parametros = new URLSearchParams(window.location.search);
    const cursoId = parametros.get("curso");
    const moduloId = parametros.get("modulo");

    const cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
    const curso = cursos.find((c) => String(c.id) === String(cursoId));
    const modulo = curso?.modulos?.find((m) => String(m.id) === String(moduloId));

    const preguntaForm = document.getElementById("preguntaForm");
    const tipoPregunta = document.getElementById("tipoPregunta");
    const textoPregunta = document.getElementById("textoPregunta");
    const opcionesWrapper = document.getElementById("opcionesWrapper");
    const vfWrapper = document.getElementById("vfWrapper");
    const preguntasContainer = document.getElementById("preguntasContainer");
    const contadorPreguntas = document.getElementById("contadorPreguntas");
    const formTitulo = document.getElementById("formTitulo");
    const btnGuardarPregunta = document.getElementById("btnGuardarPregunta");
    const btnCancelarPregunta = document.getElementById("btnCancelarPregunta");
    const tituloModuloQuiz = document.getElementById("tituloModuloQuiz");

    let indiceEditar = null;

    if (!modulo) {
        const volverUrl = cursoId ? `modulos.html?curso=${cursoId}` : "panel-docente.html";
        document.body.innerHTML = `
            <main class="quiz-shell">
                <a class="back-link" href="${volverUrl}">Volver a modulos</a>
                <section class="empty-state">
                    <h1>Modulo no encontrado</h1>
                    <p>Regresa y selecciona nuevamente el modulo.</p>
                </section>
            </main>
        `;
        return;
    }

    modulo.quiz = modulo.quiz || [];
    tituloModuloQuiz.textContent = `Quiz · ${modulo.nombre}`;

    const linkVolverModulosQuiz = document.getElementById("linkVolverModulos");
    if (linkVolverModulosQuiz) linkVolverModulosQuiz.href = `modulos.html?curso=${cursoId}`;

    mostrarPreguntas();

    tipoPregunta?.addEventListener("change", () => {
        const esOpcion = tipoPregunta.value === "opcion";
        opcionesWrapper.style.display = esOpcion ? "block" : "none";
        vfWrapper.style.display = esOpcion ? "none" : "block";
    });

    preguntaForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const texto = textoPregunta.value.trim();
        if (!texto) {
            alert("Escribe el enunciado de la pregunta.");
            return;
        }

        let pregunta;

        if (tipoPregunta.value === "opcion") {
            const inputs = Array.from(document.querySelectorAll(".opcion-input"));
            const opciones = inputs.map((input) => input.value.trim());
            const opcionesValidas = opciones.filter((texto) => texto.length > 0);

            if (opcionesValidas.length < 2) {
                alert("Agrega al menos 2 opciones de respuesta.");
                return;
            }

            const correctaIndex = Number(document.querySelector('input[name="correctaRadio"]:checked').value);
            if (!opciones[correctaIndex] || !opciones[correctaIndex].trim()) {
                alert("La opcion marcada como correcta no puede estar vacia.");
                return;
            }

            pregunta = {
                id: indiceEditar !== null ? modulo.quiz[indiceEditar].id : Date.now(),
                tipo: "opcion",
                texto,
                opciones: opciones.map((texto, index) => ({ id: index, texto })).filter((o) => o.texto.length > 0),
                respuestaCorrecta: correctaIndex
            };
        } else {
            const correcta = document.querySelector('input[name="vfRadio"]:checked').value;
            pregunta = {
                id: indiceEditar !== null ? modulo.quiz[indiceEditar].id : Date.now(),
                tipo: "vf",
                texto,
                opciones: [
                    { id: "verdadero", texto: "Verdadero" },
                    { id: "falso", texto: "Falso" }
                ],
                respuestaCorrecta: correcta
            };
        }

        if (indiceEditar !== null) {
            modulo.quiz[indiceEditar] = pregunta;
        } else {
            modulo.quiz.push(pregunta);
        }

        const textoOriginal = btnGuardarPregunta.textContent;
        btnGuardarPregunta.disabled = true;
        btnGuardarPregunta.textContent = "Guardando...";

        await guardarCursos();

        btnGuardarPregunta.disabled = false;

        limpiarFormulario();
        mostrarPreguntas();
    });

    btnCancelarPregunta?.addEventListener("click", limpiarFormulario);

    function mostrarPreguntas() {
        preguntasContainer.innerHTML = "";
        contadorPreguntas.textContent = `${modulo.quiz.length} pregunta${modulo.quiz.length === 1 ? "" : "s"} creada${modulo.quiz.length === 1 ? "" : "s"}`;

        if (modulo.quiz.length === 0) {
            preguntasContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Aun no hay preguntas</h3>
                    <p>Agrega la primera pregunta para activar el quiz de este modulo.</p>
                </div>
            `;
            return;
        }

        modulo.quiz.forEach((pregunta, index) => {
            const item = document.createElement("article");
            item.className = "pregunta-card";

            const opcionesHTML = pregunta.opciones.map((opcion) => {
                const esCorrecta = String(opcion.id) === String(pregunta.respuestaCorrecta);
                return `<li class="${esCorrecta ? "correcta" : ""}">${escapeHTML(opcion.texto)}${esCorrecta ? " ✓" : ""}</li>`;
            }).join("");

            item.innerHTML = `
                <div class="pregunta-header">
                    <span class="pregunta-tipo">${pregunta.tipo === "opcion" ? "Opcion multiple" : "Verdadero / Falso"}</span>
                    <span class="pregunta-num">Pregunta ${index + 1}</span>
                </div>
                <h3>${escapeHTML(pregunta.texto)}</h3>
                <ul class="opciones-lista">${opcionesHTML}</ul>
                <div class="acciones">
                    <button type="button" data-action="editar" data-index="${index}">Editar</button>
                    <button type="button" class="danger" data-action="eliminar" data-index="${index}">Eliminar</button>
                </div>
            `;
            preguntasContainer.appendChild(item);
        });
    }

    preguntasContainer?.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "editar") editarPregunta(index);
        if (action === "eliminar") await eliminarPregunta(index);
    });

    function editarPregunta(index) {
        const pregunta = modulo.quiz[index];
        indiceEditar = index;

        tipoPregunta.value = pregunta.tipo;
        tipoPregunta.dispatchEvent(new Event("change"));
        textoPregunta.value = pregunta.texto;

        if (pregunta.tipo === "opcion") {
            const inputs = Array.from(document.querySelectorAll(".opcion-input"));
            inputs.forEach((input, i) => {
                input.value = pregunta.opciones[i]?.texto || "";
            });
            const radio = document.querySelector(`input[name="correctaRadio"][value="${pregunta.respuestaCorrecta}"]`);
            if (radio) radio.checked = true;
        } else {
            const radio = document.querySelector(`input[name="vfRadio"][value="${pregunta.respuestaCorrecta}"]`);
            if (radio) radio.checked = true;
        }

        formTitulo.textContent = "Editar pregunta";
        btnGuardarPregunta.textContent = "Guardar cambios";
        btnCancelarPregunta.style.display = "inline-flex";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function eliminarPregunta(index) {
        const confirmar = confirm("Deseas eliminar esta pregunta del quiz?");
        if (!confirmar) return;

        modulo.quiz.splice(index, 1);
        await guardarCursos();
        mostrarPreguntas();
    }

    function limpiarFormulario() {
        preguntaForm.reset();
        tipoPregunta.value = "opcion";
        tipoPregunta.dispatchEvent(new Event("change"));
        indiceEditar = null;
        formTitulo.textContent = "Nueva pregunta";
        btnGuardarPregunta.textContent = "Agregar pregunta";
        btnCancelarPregunta.style.display = "none";
    }

    async function guardarCursos() {
        if (docente) await guardarCursosDeDocente(docente.id, cursos);
    }
})();
