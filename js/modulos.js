(async function iniciarModulos() {
    await window.renSesionListaPromise;

    const docente = usuarioActivo();
    const cursoIndex = Number(localStorage.getItem("cursoSeleccionado"));
    const moduloForm = document.getElementById("moduloForm");
    const btnCrearModulo = document.getElementById("btnCrearModulo");
    const modulosContainer = document.getElementById("modulosContainer");
    const tituloCurso = document.getElementById("tituloCurso");

    let cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
    let curso = cursos[cursoIndex];

    let indiceEditar = null;

    if (!curso) {
        document.body.innerHTML = `
            <main class="module-shell">
                <a class="back-link" href="panel-docente.html">Volver al panel docente</a>
                <section class="empty-state">
                    <h1>Curso no encontrado</h1>
                    <p>Regresa al panel docente y selecciona un curso.</p>
                </section>
            </main>
        `;
        return;
    }

    curso.modulos = curso.modulos || [];
    tituloCurso.textContent = curso.nombre;
    mostrarModulos();

    moduloForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("nombreModulo").value.trim();

        if (!nombre) {
            alert("Ingresa el nombre del modulo.");
            return;
        }

        if (indiceEditar !== null) {
            curso.modulos[indiceEditar].nombre = nombre;
            indiceEditar = null;
            btnCrearModulo.textContent = "Crear modulo";
        } else {
            curso.modulos.push({
                id: Date.now(),
                nombre,
                contenido: null,
                quiz: []
            });
        }

        const textoOriginal = btnCrearModulo.textContent;
        btnCrearModulo.disabled = true;
        btnCrearModulo.textContent = "Guardando...";

        await guardarCursos();

        btnCrearModulo.disabled = false;
        btnCrearModulo.textContent = textoOriginal === "Guardando..." ? "Crear modulo" : textoOriginal;

        moduloForm.reset();
        mostrarModulos();
    });

    function mostrarModulos() {
        modulosContainer.innerHTML = "";

        if (curso.modulos.length === 0) {
            modulosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Aun no hay modulos</h3>
                    <p>Crea el primer modulo para cargar contenido.</p>
                </div>
            `;
            return;
        }

        curso.modulos.forEach((modulo, index) => {
            const item = document.createElement("article");
            item.className = "modulo";
            const cantidadPreguntas = (modulo.quiz || []).length;
            item.innerHTML = `
                <div class="module-info">
                    <span>${String(index + 1).padStart(2, "0")}</span>
                    <div>
                        <h3>${escapeHTML(modulo.nombre)}</h3>
                        <p>${modulo.contenido ? "Contenido cargado" : "Sin contenido todavia"} · ${cantidadPreguntas} pregunta${cantidadPreguntas === 1 ? "" : "s"} en el quiz</p>
                    </div>
                </div>
                <div class="acciones">
                    <button type="button" data-action="editar" data-index="${index}">Editar</button>
                    <button type="button" data-action="contenido" data-index="${index}">Contenido</button>
                    <button type="button" class="btn-quiz" data-action="quiz" data-index="${index}">Quiz (${cantidadPreguntas})</button>
                    <button type="button" data-action="ver" data-index="${index}">Vista previa</button>
                    <button type="button" class="danger" data-action="eliminar" data-index="${index}">Eliminar</button>
                </div>
            `;
            modulosContainer.appendChild(item);
        });
    }

    modulosContainer?.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "editar") editarModulo(index);
        if (action === "eliminar") await eliminarModulo(index);
        if (action === "contenido") contenidoModulo(index);
        if (action === "quiz") quizModulo(index);
        if (action === "ver") verModulo(index);
    });

    function editarModulo(index) {
        document.getElementById("nombreModulo").value = curso.modulos[index].nombre;
        indiceEditar = index;
        btnCrearModulo.textContent = "Guardar cambios";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function eliminarModulo(index) {
        const confirmar = confirm("Deseas eliminar este modulo?");
        if (!confirmar) return;

        curso.modulos.splice(index, 1);
        await guardarCursos();
        mostrarModulos();
    }

    function contenidoModulo(index) {
        localStorage.setItem("moduloSeleccionado", index);
        window.location.href = "contenido-modulo.html";
    }

    function quizModulo(index) {
        localStorage.setItem("moduloSeleccionado", index);
        window.location.href = "quiz-editor.html";
    }

    function verModulo(index) {
        localStorage.setItem("moduloSeleccionado", index);
        window.location.href = "ver-modulo.html";
    }

    async function guardarCursos() {
        if (docente) await guardarCursosDeDocente(docente.id, cursos);
    }
})();
