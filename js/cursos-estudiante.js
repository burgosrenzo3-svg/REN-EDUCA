(async function iniciarCursosEstudiante() {
    await window.renSesionListaPromise;

    const estudiante = usuarioActivo();

    const cursosContainer = document.getElementById("cursosContainer");
    const totalCursos = document.getElementById("totalCursos");
    const totalModulos = document.getElementById("totalModulos");
    const avancePromedio = document.getElementById("avancePromedio");

    if (!cursosContainer) return;

    cursosContainer.innerHTML = `<p class="cargando-cursos">Cargando cursos...</p>`;

    let cursos = [];
    let progreso = {};
    try {
        const todosLosCursos = await obtenerTodosLosCursos();
        cursos = todosLosCursos.filter((curso) => curso.visible !== false);
        progreso = estudiante ? await obtenerProgresoDeEstudiante(estudiante.id) : {};
    } catch (error) {
        console.error("Error al cargar los cursos del estudiante:", error);
        cursosContainer.innerHTML = `
            <div class="empty-state">
                <h3>No se pudieron cargar los cursos</h3>
                <p>Ocurrio un problema de conexion. Intenta recargar la pagina.</p>
            </div>
        `;
        return;
    }

    mostrarCursos();

    function mostrarCursos() {
        cursosContainer.innerHTML = "";

        actualizarResumen();

        if (cursos.length === 0) {
            cursosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No hay cursos publicados</h3>
                    <p>Cuando un docente cree cursos, apareceran aqui.</p>
                </div>
            `;
            return;
        }

        cursos.forEach((curso, index) => {
            const modulos = curso.modulos || [];
            const porcentaje = calcularProgreso(curso);
            const card = document.createElement("article");
            card.className = "curso";
            card.innerHTML = `
                <img src="${curso.imagen || imagenPorDefecto()}" alt="Imagen de ${escapeHTML(curso.nombre)}">
                <div class="course-meta">
                    <span>${escapeHTML(curso.categoria)}</span>
                    <span>${escapeHTML(curso.nivel)}</span>
                </div>
                <h3>${escapeHTML(curso.nombre)}</h3>
                <p>${escapeHTML(curso.descripcion)}</p>
                <div class="mini-progress">
                    <div>
                        <span>${modulos.length} modulo${modulos.length === 1 ? "" : "s"}</span>
                        <strong>${porcentaje}%</strong>
                    </div>
                    <div class="track"><span style="width:${porcentaje}%"></span></div>
                </div>
                <button class="btn-ver" type="button" data-index="${index}">Ver curso</button>
            `;
            cursosContainer.appendChild(card);
        });
    }

    cursosContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".btn-ver");
        if (!button) return;
        verCurso(Number(button.dataset.index));
    });

    function verCurso(index) {
        const curso = cursos[index];
        localStorage.setItem("cursoSeleccionadoId", curso.id);
        localStorage.setItem("cursoSeleccionadoDocenteId", curso.docenteId);
        window.location.href = "curso.html";
    }

    function actualizarResumen() {
        const cantidadModulos = cursos.reduce((total, curso) => total + (curso.modulos || []).length, 0);
        const sumaProgreso = cursos.reduce((total, curso) => total + calcularProgreso(curso), 0);
        const promedio = cursos.length ? Math.round(sumaProgreso / cursos.length) : 0;

        totalCursos.textContent = cursos.length;
        totalModulos.textContent = cantidadModulos;
        avancePromedio.textContent = `${promedio}%`;
    }

    function calcularProgreso(curso) {
        const modulos = curso.modulos || [];
        if (modulos.length === 0) return 0;

        const completados = modulos.filter((modulo) => {
            return progreso[claveModulo(curso, modulo)];
        }).length;

        return Math.round((completados / modulos.length) * 100);
    }

    function claveModulo(curso, modulo) {
        return `${curso.id}_${modulo.id}`;
    }
})();
