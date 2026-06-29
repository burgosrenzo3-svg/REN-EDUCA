(async function iniciarCursosDocente() {
    await window.renSesionListaPromise;

    const docente = usuarioActivo();

    const cursoForm = document.getElementById("cursoForm");
    const btnCrearCurso = document.getElementById("btnCrearCurso");
    const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
    const cursosContainer = document.getElementById("cursosContainer");
    const totalCursos = document.getElementById("totalCursos");
    const totalModulos = document.getElementById("totalModulos");

    if (!cursoForm || !cursosContainer) return;

    if (typeof conectarSubidaArchivo === "function") {
        conectarSubidaArchivo({
            inputFileId: "archivoImagenCurso",
            inputOcultoId: "imagenCurso",
            ayudaId: "ayudaImagenCurso",
            previewId: "previewImagenCurso",
            carpeta: "cursos"
        });
    }

    let cursos = [];
    let indiceEditar = null;

    cursosContainer.innerHTML = `<p class="cargando-cursos">Cargando tus cursos...</p>`;
    cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
    mostrarCursos();

    cursoForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("nombreCurso").value.trim();
        const descripcion = document.getElementById("descripcionCurso").value.trim();
        const categoria = document.getElementById("categoriaCurso").value;
        const nivel = document.getElementById("nivelCurso").value;
        const imagen = document.getElementById("imagenCurso").value.trim();
        const visible = document.getElementById("cursoVisible").checked;

        if (!nombre || !descripcion || !categoria || !nivel) {
            alert("Completa nombre, descripcion, categoria y nivel.");
            return;
        }

        const curso = {
            id: indiceEditar !== null ? cursos[indiceEditar].id : Date.now(),
            nombre,
            descripcion,
            categoria,
            nivel,
            imagen,
            visible,
            modulos: indiceEditar !== null ? cursos[indiceEditar].modulos || [] : []
        };

        if (indiceEditar !== null) {
            cursos[indiceEditar] = curso;
        } else {
            cursos.push(curso);
        }

        const textoOriginal = btnCrearCurso.textContent;
        btnCrearCurso.disabled = true;
        btnCrearCurso.textContent = "Guardando...";

        await guardarCursos();

        btnCrearCurso.disabled = false;
        btnCrearCurso.textContent = textoOriginal;

        limpiarFormulario();

        cursos = docente ? await obtenerCursosDeDocente(docente.id) : [];
        mostrarCursos();
    });

    btnCancelarEdicion.addEventListener("click", limpiarFormulario);

    function mostrarCursos() {
        cursosContainer.innerHTML = "";

        actualizarEstadisticas();

        if (cursos.length === 0) {
            cursosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Aun no tienes cursos</h3>
                    <p>Crea el primer curso para empezar a agregar modulos.</p>
                </div>
            `;
            return;
        }

        cursos.forEach((curso, index) => {
            const modulos = curso.modulos || [];
            const esVisible = curso.visible !== false;
            const cursoCard = document.createElement("article");
            cursoCard.className = esVisible ? "curso" : "curso curso-oculto";

            cursoCard.innerHTML = `
                <div class="course-media">
                    <img src="${curso.imagen || imagenPorDefecto()}" alt="Imagen de ${escapeHTML(curso.nombre)}">
                    <span class="badge-visibilidad ${esVisible ? "visible" : "oculto"}">${esVisible ? "👁️ Visible" : "🚫 Oculto"}</span>
                </div>
                <div class="course-body">
                    <div class="course-meta">
                        <span>${escapeHTML(curso.categoria)}</span>
                        <span>${escapeHTML(curso.nivel)}</span>
                    </div>
                    <h3>${escapeHTML(curso.nombre)}</h3>
                    <p>${escapeHTML(curso.descripcion)}</p>
                    <strong>${modulos.length} modulo${modulos.length === 1 ? "" : "s"}</strong>
                </div>
                <div class="acciones">
                    <button class="btn-editar" type="button" data-action="editar" data-index="${index}">Editar</button>
                    <button class="btn-modulos" type="button" data-action="modulos" data-index="${index}">Modulos</button>
                    <button class="btn-visibilidad" type="button" data-action="visibilidad" data-index="${index}">${esVisible ? "Ocultar" : "Mostrar"}</button>
                    <button class="btn-eliminar" type="button" data-action="eliminar" data-index="${index}">Eliminar</button>
                </div>
            `;

            cursosContainer.appendChild(cursoCard);
        });
    }

    cursosContainer.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === "editar") editarCursoLocal(index);
        if (action === "eliminar") await eliminarCursoLocal(index);
        if (action === "modulos") gestionarModulos(index);
        if (action === "visibilidad") await alternarVisibilidad(index);
    });

    async function alternarVisibilidad(index) {
        cursos[index].visible = cursos[index].visible === false ? true : false;
        await guardarCursos();
        mostrarCursos();
    }

    function editarCursoLocal(index) {
        const curso = cursos[index];

        document.getElementById("nombreCurso").value = curso.nombre;
        document.getElementById("descripcionCurso").value = curso.descripcion;
        document.getElementById("categoriaCurso").value = curso.categoria;
        document.getElementById("nivelCurso").value = curso.nivel;
        document.getElementById("imagenCurso").value = curso.imagen || "";
        document.getElementById("cursoVisible").checked = curso.visible !== false;

        const previewImagenCurso = document.getElementById("previewImagenCurso");
        const ayudaImagenCurso = document.getElementById("ayudaImagenCurso");
        if (curso.imagen) {
            if (previewImagenCurso) {
                previewImagenCurso.src = curso.imagen;
                previewImagenCurso.style.display = "block";
            }
            if (ayudaImagenCurso) ayudaImagenCurso.textContent = "Archivo ya cargado. Elige otro para reemplazarlo.";
        } else {
            if (previewImagenCurso) previewImagenCurso.style.display = "none";
            if (ayudaImagenCurso) ayudaImagenCurso.textContent = "Sube una imagen desde tu PC (JPG, PNG, etc.)";
        }

        indiceEditar = index;
        btnCrearCurso.textContent = "Guardar cambios";
        btnCancelarEdicion.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /* Nombrada "Local" para no chocar con la funcion global
       eliminarCurso(docenteId, cursoId) definida en auth.js
       (usada por el panel de administrador). */
    async function eliminarCursoLocal(index) {
        const confirmar = confirm("Deseas eliminar este curso y sus modulos?");
        if (!confirmar) return;

        cursos.splice(index, 1);
        await guardarCursos();
        mostrarCursos();
    }

    function gestionarModulos(index) {
        localStorage.setItem("cursoSeleccionado", index);
        window.location.href = "modulos.html";
    }

    function limpiarFormulario() {
        cursoForm.reset();
        document.getElementById("cursoVisible").checked = true;
        document.getElementById("imagenCurso").value = "";

        const previewImagenCurso = document.getElementById("previewImagenCurso");
        const ayudaImagenCurso = document.getElementById("ayudaImagenCurso");
        if (previewImagenCurso) previewImagenCurso.style.display = "none";
        if (ayudaImagenCurso) ayudaImagenCurso.textContent = "Sube una imagen desde tu PC (JPG, PNG, etc.)";

        indiceEditar = null;
        btnCrearCurso.textContent = "Crear curso";
        btnCancelarEdicion.style.display = "none";
    }

    function actualizarEstadisticas() {
        const cantidadModulos = cursos.reduce((total, curso) => total + (curso.modulos || []).length, 0);
        totalCursos.textContent = `${cursos.length} curso${cursos.length === 1 ? "" : "s"}`;
        totalModulos.textContent = `${cantidadModulos} modulo${cantidadModulos === 1 ? "" : "s"}`;
    }

    async function guardarCursos() {
        if (docente) await guardarCursosDeDocente(docente.id, cursos);
    }
})();
