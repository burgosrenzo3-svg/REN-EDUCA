(async function iniciarCurso() {
    await window.renSesionListaPromise;

    const estudiante = usuarioActivo();
    const cursoId = localStorage.getItem("cursoSeleccionadoId");
    const docenteIdDelCurso = localStorage.getItem("cursoSeleccionadoDocenteId");

    const cursosDelDocente = docenteIdDelCurso ? await obtenerCursosDeDocente(docenteIdDelCurso) : [];
    const curso = cursosDelDocente.find((c) => String(c.id) === String(cursoId));

    const progreso = estudiante ? await obtenerProgresoDeEstudiante(estudiante.id) : {};

    if (!curso) {
        document.body.innerHTML = `
            <main class="course-shell">
                <a class="back-link" href="panel-estudiante.html">Volver al panel</a>
                <section class="empty-state">
                    <h1>Curso no encontrado</h1>
                    <p>Selecciona nuevamente un curso desde el panel estudiante.</p>
                </section>
            </main>
        `;
        return;
    }

    cargarCurso();
    mostrarModulos();
    actualizarProgreso();

    function cargarCurso() {
        document.getElementById("cursoNombre").textContent = curso.nombre;
        document.getElementById("cursoDescripcion").textContent = curso.descripcion;
        document.getElementById("cursoCategoria").textContent = curso.categoria;
        document.getElementById("cursoNivel").textContent = curso.nivel;
        document.getElementById("cursoImagen").src = curso.imagen || imagenPorDefecto();
    }

    function mostrarModulos() {
        const modulosContainer = document.getElementById("modulosContainer");
        const modulos = curso.modulos || [];

        modulosContainer.innerHTML = "";

        if (modulos.length === 0) {
            modulosContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Este curso aun no tiene modulos</h3>
                    <p>El docente puede agregarlos desde su panel.</p>
                </div>
            `;
            return;
        }

        modulos.forEach((modulo, index) => {
            const completado = Boolean(progreso[claveModulo(modulo)]);
            const bloqueado = !completado && !moduloDesbloqueado(index);

            const card = document.createElement("article");
            card.className = completado ? "modulo completado" : (bloqueado ? "modulo bloqueado" : "modulo");

            const estadoTexto = completado
                ? "✓ Completado"
                : (bloqueado ? "🔒 Bloqueado" : "Por iniciar");

            const estadoClase = completado ? "estado-completado" : (bloqueado ? "estado-bloqueado" : "");

            const botonHTML = bloqueado
                ? `<button type="button" disabled title="Completa el modulo anterior para desbloquear este">Bloqueado</button>`
                : `<button type="button" data-index="${index}">Ver modulo</button>`;

            card.innerHTML = `
                <div>
                    <span class="module-number">${String(index + 1).padStart(2, "0")}</span>
                    <h3>${escapeHTML(modulo.nombre)}</h3>
                    <p>${bloqueado ? "Completa el modulo anterior para desbloquear" : (modulo.contenido ? "Contenido disponible" : "Pendiente de contenido")}</p>
                </div>
                <div class="module-actions">
                    <span class="${estadoClase}">${estadoTexto}</span>
                    ${botonHTML}
                </div>
            `;
            modulosContainer.appendChild(card);
        });
    }

    /* Un modulo esta desbloqueado si es el primero, o si el modulo
       inmediatamente anterior ya fue marcado como completado. */
    function moduloDesbloqueado(index) {
        if (index === 0) return true;
        const modulos = curso.modulos || [];
        const anterior = modulos[index - 1];
        if (!anterior) return true;
        return Boolean(progreso[claveModulo(anterior)]);
    }

    document.getElementById("modulosContainer")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-index]");
        if (!button) return;
        verModulo(Number(button.dataset.index));
    });

    function actualizarProgreso() {
        const modulos = curso.modulos || [];
        const completados = modulos.filter((modulo) => progreso[claveModulo(modulo)]).length;
        const porcentaje = modulos.length ? Math.round((completados / modulos.length) * 100) : 0;

        document.getElementById("porcentajeProgreso").textContent = `${porcentaje}%`;
        document.getElementById("barraInterna").style.width = `${porcentaje}%`;
    }

    function verModulo(index) {
        if (!moduloDesbloqueado(index) && !progreso[claveModulo(curso.modulos[index])]) {
            alert("Debes completar el modulo anterior antes de acceder a este.");
            return;
        }
        localStorage.setItem("moduloSeleccionadoIndex", index);
        window.location.href = "ver-modulo.html";
    }

    function claveModulo(modulo) {
        return `${curso.id}_${modulo.id}`;
    }
})();
