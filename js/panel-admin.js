/* =======================================================
   REN EDUCA · Panel Administrador
   -------------------------------------------------------
   - KPIs generales (docentes, estudiantes, cursos, etc.)
   - Tabla de docentes (buscar + editar + eliminar)
   - Tabla de estudiantes (buscar + editar + eliminar)
   - Listado de todos los cursos (buscar + editar + eliminar)
   - Modal de confirmacion premium + notificacion toast
   - El administrador tiene control total: puede modificar
     nombre/correo de cualquier cuenta y los datos/visibilidad
     de cualquier curso, de cualquier docente.
======================================================= */

const ICONO_PAPELERA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/><path d="M10 11v6M14 11v6"/></svg>`;
const ICONO_LAPIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;

function iniciales(nombre) {
    return (nombre || "U").trim().charAt(0).toUpperCase();
}

function formatearFecha(iso) {
    if (!iso) return "—";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return "—";
    return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function contarQuizzesAprobados(datosQuiz) {
    return Object.values(datosQuiz).filter((registro) => registro.aprobado).length;
}

function mostrarToast(mensaje, tipo = "default") {
    const toast = document.getElementById("toastAdmin");
    if (!toast) return;

    toast.textContent = mensaje;
    toast.classList.remove("toast-success");
    if (tipo === "success") toast.classList.add("toast-success");

    toast.classList.add("show");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function pedirConfirmacion({ titulo, texto, textoBoton = "Eliminar" }) {
    const modal = document.getElementById("modalConfirma");
    const tituloEl = document.getElementById("confirmaTitulo");
    const textoEl = document.getElementById("confirmaTexto");
    const btnCancelar = document.getElementById("confirmaCancelar");
    const btnEliminar = document.getElementById("confirmaEliminar");

    tituloEl.textContent = titulo;
    textoEl.textContent = texto;
    btnEliminar.textContent = textoBoton;

    modal.classList.add("active");

    return new Promise((resolve) => {
        function cerrar(resultado) {
            modal.classList.remove("active");
            btnCancelar.removeEventListener("click", onCancelar);
            btnEliminar.removeEventListener("click", onEliminar);
            modal.removeEventListener("click", onFondo);
            resolve(resultado);
        }

        function onCancelar() { cerrar(false); }
        function onEliminar() { cerrar(true); }
        function onFondo(e) {
            if (e.target === modal) cerrar(false);
        }

        btnCancelar.addEventListener("click", onCancelar);
        btnEliminar.addEventListener("click", onEliminar);
        modal.addEventListener("click", onFondo);
    });
}

function abrirModal(modal) {
    modal.classList.add("active");
}

function cerrarModal(modal) {
    modal.classList.remove("active");
}

async function construirPanelAdmin() {
    await window.renSesionListaPromise;

    async function recargarDatos() {
        const usuarios = await obtenerUsuarios();
        const todosLosCursos = await obtenerTodosLosCursos();
        const docentes = usuarios.filter((u) => u.rol === "docente");
        const estudiantes = usuarios.filter((u) => u.rol === "estudiante");

        const cursosPorDocente = {};
        docentes.forEach((d) => {
            cursosPorDocente[d.id] = todosLosCursos.filter((c) => c.docenteId === d.id).length;
        });

        const quizzesPorEstudiante = {};
        for (const est of estudiantes) {
            const datosQuiz = await obtenerQuizDeEstudiante(est.id);
            quizzesPorEstudiante[est.id] = contarQuizzesAprobados(datosQuiz);
        }

        return { usuarios, todosLosCursos, docentes, estudiantes, cursosPorDocente, quizzesPorEstudiante };
    }

    let estado = await recargarDatos();

    function actualizarKPIs() {
        const totalModulos = estado.todosLosCursos.reduce((suma, curso) => {
            const modulos = Array.isArray(curso.modulos) ? curso.modulos.length : 0;
            return suma + modulos;
        }, 0);

        const cursosPublicados = estado.todosLosCursos.filter((c) => c.visible !== false).length;

        document.getElementById("kpiDocentes").textContent = estado.docentes.length;
        document.getElementById("kpiEstudiantes").textContent = estado.estudiantes.length;
        document.getElementById("kpiCursos").textContent = estado.todosLosCursos.length;
        document.getElementById("kpiPublicados").textContent = cursosPublicados;
        document.getElementById("kpiModulos").textContent = totalModulos;
        document.getElementById("kpiUsuarios").textContent = estado.usuarios.length;
    }

    const modalEditarUsuario = document.getElementById("modalEditarUsuario");
    const formEditarUsuario = document.getElementById("formEditarUsuario");
    const editarUsuarioTitulo = document.getElementById("editarUsuarioTitulo");
    const editarUsuarioError = document.getElementById("editarUsuarioError");

    function abrirEditarUsuario(usuario, etiquetaTipo) {
        editarUsuarioTitulo.textContent = `Editar ${etiquetaTipo}`;
        editarUsuarioError.style.display = "none";
        document.getElementById("editarUsuarioId").value = usuario.id;
        document.getElementById("editarUsuarioNombre").value = usuario.nombre;
        document.getElementById("editarUsuarioCorreo").value = usuario.correo;
        abrirModal(modalEditarUsuario);
        document.getElementById("editarUsuarioNombre").focus();
    }

    function cerrarEditarUsuario() {
        cerrarModal(modalEditarUsuario);
        formEditarUsuario.reset();
    }

    document.getElementById("cerrarEditarUsuario").addEventListener("click", cerrarEditarUsuario);
    document.getElementById("cancelarEditarUsuario").addEventListener("click", cerrarEditarUsuario);
    modalEditarUsuario.addEventListener("click", (e) => {
        if (e.target === modalEditarUsuario) cerrarEditarUsuario();
    });

    formEditarUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("editarUsuarioId").value;
        const nombre = document.getElementById("editarUsuarioNombre").value.trim();
        const correo = document.getElementById("editarUsuarioCorreo").value.trim();

        if (!nombre || !correo) {
            editarUsuarioError.textContent = "Completa nombre y correo.";
            editarUsuarioError.style.display = "block";
            return;
        }

        if (!correoValido(correo)) {
            editarUsuarioError.textContent = "Ingresa un correo electronico valido.";
            editarUsuarioError.style.display = "block";
            return;
        }

        const btnGuardar = formEditarUsuario.querySelector("button[type='submit']");
        const textoOriginal = btnGuardar.textContent;
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        const resultado = await actualizarUsuario(id, { nombre, correo });

        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;

        if (!resultado.ok) {
            editarUsuarioError.textContent = resultado.error || "No se pudo guardar.";
            editarUsuarioError.style.display = "block";
            return;
        }

        estado = await recargarDatos();
        actualizarKPIs();
        renderDocentes(inputBuscarDocente.value);
        renderEstudiantes(inputBuscarEstudiante.value);
        renderCursos(inputBuscarCurso.value);
        cerrarEditarUsuario();
        mostrarToast(`Cambios guardados para "${nombre}".`, "success");
    });

    const modalEditarCurso = document.getElementById("modalEditarCurso");
    const formEditarCurso = document.getElementById("formEditarCurso");
    const editarCursoError = document.getElementById("editarCursoError");

    if (typeof conectarSubidaArchivo === "function") {
        conectarSubidaArchivo({
            inputFileId: "archivoEditarCursoImagen",
            inputOcultoId: "editarCursoImagen",
            ayudaId: "ayudaEditarCursoImagen",
            previewId: "previewEditarCursoImagen",
            carpeta: "cursos"
        });
    }

    function abrirEditarCurso(curso) {
        editarCursoError.style.display = "none";
        document.getElementById("editarCursoId").value = curso.id;
        document.getElementById("editarCursoDocenteId").value = curso.docenteId;
        document.getElementById("editarCursoNombre").value = curso.nombre || "";
        document.getElementById("editarCursoDescripcion").value = curso.descripcion || "";
        document.getElementById("editarCursoCategoria").value = curso.categoria || "";
        document.getElementById("editarCursoNivel").value = curso.nivel || "";
        document.getElementById("editarCursoImagen").value = curso.imagen || "";
        document.getElementById("editarCursoVisible").checked = curso.visible !== false;

        const previewEditarCursoImagen = document.getElementById("previewEditarCursoImagen");
        const ayudaEditarCursoImagen = document.getElementById("ayudaEditarCursoImagen");
        if (curso.imagen) {
            if (previewEditarCursoImagen) {
                previewEditarCursoImagen.src = curso.imagen;
                previewEditarCursoImagen.style.display = "block";
            }
            if (ayudaEditarCursoImagen) ayudaEditarCursoImagen.textContent = "Archivo ya cargado. Elige otro para reemplazarlo.";
        } else {
            if (previewEditarCursoImagen) previewEditarCursoImagen.style.display = "none";
            if (ayudaEditarCursoImagen) ayudaEditarCursoImagen.textContent = "Sube una imagen desde tu PC para reemplazarla.";
        }

        abrirModal(modalEditarCurso);
        document.getElementById("editarCursoNombre").focus();
    }

    function cerrarEditarCurso() {
        cerrarModal(modalEditarCurso);
        formEditarCurso.reset();

        const previewEditarCursoImagen = document.getElementById("previewEditarCursoImagen");
        const ayudaEditarCursoImagen = document.getElementById("ayudaEditarCursoImagen");
        if (previewEditarCursoImagen) previewEditarCursoImagen.style.display = "none";
        if (ayudaEditarCursoImagen) ayudaEditarCursoImagen.textContent = "Sube una imagen desde tu PC para reemplazarla.";
    }

    document.getElementById("cerrarEditarCurso").addEventListener("click", cerrarEditarCurso);
    document.getElementById("cancelarEditarCurso").addEventListener("click", cerrarEditarCurso);
    modalEditarCurso.addEventListener("click", (e) => {
        if (e.target === modalEditarCurso) cerrarEditarCurso();
    });

    formEditarCurso.addEventListener("submit", async (e) => {
        e.preventDefault();

        const cursoId = document.getElementById("editarCursoId").value;
        const docenteId = document.getElementById("editarCursoDocenteId").value;
        const nombre = document.getElementById("editarCursoNombre").value.trim();

        if (!nombre) {
            editarCursoError.textContent = "El curso necesita un nombre.";
            editarCursoError.style.display = "block";
            return;
        }

        const cambios = {
            nombre,
            descripcion: document.getElementById("editarCursoDescripcion").value.trim(),
            categoria: document.getElementById("editarCursoCategoria").value.trim(),
            nivel: document.getElementById("editarCursoNivel").value.trim(),
            imagen: document.getElementById("editarCursoImagen").value.trim(),
            visible: document.getElementById("editarCursoVisible").checked
        };

        const btnGuardar = formEditarCurso.querySelector("button[type='submit']");
        const textoOriginal = btnGuardar.textContent;
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        const resultado = await actualizarCurso(docenteId, cursoId, cambios);

        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;

        if (!resultado.ok) {
            editarCursoError.textContent = resultado.error || "No se pudo guardar.";
            editarCursoError.style.display = "block";
            return;
        }

        estado = await recargarDatos();
        actualizarKPIs();
        renderCursos(inputBuscarCurso.value);
        cerrarEditarCurso();
        mostrarToast(`Curso "${nombre}" actualizado correctamente.`, "success");
    });

    const tablaDocentes = document.getElementById("tablaDocentes");
    const vacioDocentes = document.getElementById("vacioDocentes");
    const inputBuscarDocente = document.getElementById("buscarDocente");

    function renderDocentes(filtro = "") {
        const filtroNorm = filtro.trim().toLowerCase();
        const filtrados = estado.docentes.filter((d) =>
            d.nombre.toLowerCase().includes(filtroNorm) || d.correo.toLowerCase().includes(filtroNorm)
        );

        if (filtrados.length === 0) {
            tablaDocentes.innerHTML = "";
            vacioDocentes.style.display = "block";
            vacioDocentes.textContent = estado.docentes.length === 0
                ? "Todavía no hay docentes registrados."
                : "No se encontraron docentes con ese criterio.";
            return;
        }

        vacioDocentes.style.display = "none";

        tablaDocentes.innerHTML = filtrados.map((docente) => {
            const cantidadCursos = estado.cursosPorDocente[docente.id] || 0;
            return `
                <tr data-id="${escapeHTML(docente.id)}">
                    <td>
                        <div class="cell-persona">
                            <span class="avatar-mini">${escapeHTML(iniciales(docente.nombre))}</span>
                            <span>${escapeHTML(docente.nombre)}</span>
                        </div>
                    </td>
                    <td>${escapeHTML(docente.correo)}</td>
                    <td><span class="pill-count">${cantidadCursos}</span></td>
                    <td>${formatearFecha(docente.fechaRegistro)}</td>
                    <td class="td-acciones">
                        <div class="acciones-fila">
                            <button type="button" class="btn-fila-editar btn-editar-docente" data-id="${escapeHTML(docente.id)}" aria-label="Editar docente">
                                ${ICONO_LAPIZ}
                            </button>
                            <button type="button" class="btn-fila-eliminar btn-eliminar-docente" data-id="${escapeHTML(docente.id)}" data-nombre="${escapeHTML(docente.nombre)}" aria-label="Eliminar docente">
                                ${ICONO_PAPELERA}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    inputBuscarDocente.addEventListener("input", (e) => renderDocentes(e.target.value));

    tablaDocentes.addEventListener("click", async (e) => {
        const btnEditar = e.target.closest(".btn-editar-docente");
        if (btnEditar) {
            const docente = estado.docentes.find((d) => d.id === btnEditar.dataset.id);
            if (docente) abrirEditarUsuario(docente, "docente");
            return;
        }

        const btn = e.target.closest(".btn-eliminar-docente");
        if (!btn) return;

        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;

        const confirmado = await pedirConfirmacion({
            titulo: "¿Eliminar a este docente?",
            texto: `Se eliminara a "${nombre}" junto con TODOS sus cursos y modulos. Esta accion no se puede deshacer.`,
            textoBoton: "Eliminar docente"
        });

        if (!confirmado) return;

        const resultado = await eliminarUsuario(id);
        if (!resultado.ok) {
            mostrarToast(resultado.error || "No se pudo eliminar el docente.");
            return;
        }

        estado = await recargarDatos();
        actualizarKPIs();
        renderDocentes(inputBuscarDocente.value);
        renderCursos(inputBuscarCurso.value);
        mostrarToast(`Docente "${nombre}" eliminado correctamente.`, "success");
    });

    const tablaEstudiantes = document.getElementById("tablaEstudiantes");
    const vacioEstudiantes = document.getElementById("vacioEstudiantes");
    const inputBuscarEstudiante = document.getElementById("buscarEstudiante");

    function renderEstudiantes(filtro = "") {
        const filtroNorm = filtro.trim().toLowerCase();
        const filtrados = estado.estudiantes.filter((est) =>
            est.nombre.toLowerCase().includes(filtroNorm) || est.correo.toLowerCase().includes(filtroNorm)
        );

        if (filtrados.length === 0) {
            tablaEstudiantes.innerHTML = "";
            vacioEstudiantes.style.display = "block";
            vacioEstudiantes.textContent = estado.estudiantes.length === 0
                ? "Todavía no hay estudiantes registrados."
                : "No se encontraron estudiantes con ese criterio.";
            return;
        }

        vacioEstudiantes.style.display = "none";

        tablaEstudiantes.innerHTML = filtrados.map((est) => {
            const aprobados = estado.quizzesPorEstudiante[est.id] || 0;
            return `
                <tr data-id="${escapeHTML(est.id)}">
                    <td>
                        <div class="cell-persona">
                            <span class="avatar-mini">${escapeHTML(iniciales(est.nombre))}</span>
                            <span>${escapeHTML(est.nombre)}</span>
                        </div>
                    </td>
                    <td>${escapeHTML(est.correo)}</td>
                    <td><span class="pill-count">${aprobados}</span></td>
                    <td>${formatearFecha(est.fechaRegistro)}</td>
                    <td class="td-acciones">
                        <div class="acciones-fila">
                            <button type="button" class="btn-fila-editar btn-editar-estudiante" data-id="${escapeHTML(est.id)}" aria-label="Editar estudiante">
                                ${ICONO_LAPIZ}
                            </button>
                            <button type="button" class="btn-fila-eliminar btn-eliminar-estudiante" data-id="${escapeHTML(est.id)}" data-nombre="${escapeHTML(est.nombre)}" aria-label="Eliminar estudiante">
                                ${ICONO_PAPELERA}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    inputBuscarEstudiante.addEventListener("input", (e) => renderEstudiantes(e.target.value));

    tablaEstudiantes.addEventListener("click", async (e) => {
        const btnEditar = e.target.closest(".btn-editar-estudiante");
        if (btnEditar) {
            const est = estado.estudiantes.find((d) => d.id === btnEditar.dataset.id);
            if (est) abrirEditarUsuario(est, "estudiante");
            return;
        }

        const btn = e.target.closest(".btn-eliminar-estudiante");
        if (!btn) return;

        const id = btn.dataset.id;
        const nombre = btn.dataset.nombre;

        const confirmado = await pedirConfirmacion({
            titulo: "¿Eliminar a este estudiante?",
            texto: `Se eliminara a "${nombre}" junto con todo su progreso y resultados de quizzes. Esta accion no se puede deshacer.`,
            textoBoton: "Eliminar estudiante"
        });

        if (!confirmado) return;

        const resultado = await eliminarUsuario(id);
        if (!resultado.ok) {
            mostrarToast(resultado.error || "No se pudo eliminar el estudiante.");
            return;
        }

        estado = await recargarDatos();
        actualizarKPIs();
        renderEstudiantes(inputBuscarEstudiante.value);
        mostrarToast(`Estudiante "${nombre}" eliminado correctamente.`, "success");
    });

    const cursosContainer = document.getElementById("cursosContainer");
    const vacioCursos = document.getElementById("vacioCursos");
    const inputBuscarCurso = document.getElementById("buscarCurso");

    function renderCursos(filtro = "") {
        const filtroNorm = filtro.trim().toLowerCase();
        const filtrados = estado.todosLosCursos.filter((curso) =>
            (curso.nombre || "").toLowerCase().includes(filtroNorm)
        );

        if (filtrados.length === 0) {
            cursosContainer.innerHTML = "";
            vacioCursos.style.display = "block";
            vacioCursos.textContent = estado.todosLosCursos.length === 0
                ? "Todavía no se han creado cursos."
                : "No se encontraron cursos con ese nombre.";
            return;
        }

        vacioCursos.style.display = "none";

        cursosContainer.innerHTML = filtrados.map((curso) => {
            const docente = estado.usuarios.find((u) => u.id === curso.docenteId);
            const nombreDocente = docente ? docente.nombre : "Docente desconocido";
            const visible = curso.visible !== false;

            return `
                <article class="curso-admin" data-id="${escapeHTML(curso.id)}" data-docente-id="${escapeHTML(curso.docenteId)}">
                    <div class="curso-admin-media">
                        <img src="${escapeHTML(curso.imagen || imagenPorDefecto())}" alt="${escapeHTML(curso.nombre)}">
                        <span class="badge-visibilidad ${visible ? "visible" : "oculto"}">
                            ${visible ? "Publicado" : "Oculto"}
                        </span>
                        <div class="curso-admin-acciones">
                            <button type="button" class="btn-curso-editar" data-id="${escapeHTML(curso.id)}" aria-label="Editar curso">
                                ${ICONO_LAPIZ}
                            </button>
                            <button type="button" class="btn-curso-eliminar" data-id="${escapeHTML(curso.id)}" data-docente-id="${escapeHTML(curso.docenteId)}" data-nombre="${escapeHTML(curso.nombre)}" aria-label="Eliminar curso">
                                ${ICONO_PAPELERA}
                            </button>
                        </div>
                    </div>
                    <div class="curso-admin-body">
                        <h3>${escapeHTML(curso.nombre)}</h3>
                        <div class="curso-admin-meta">
                            ${curso.categoria ? `<span>${escapeHTML(curso.categoria)}</span>` : ""}
                            ${curso.nivel ? `<span>${escapeHTML(curso.nivel)}</span>` : ""}
                        </div>
                        <p class="curso-admin-docente">Docente: <strong>${escapeHTML(nombreDocente)}</strong></p>
                    </div>
                </article>
            `;
        }).join("");
    }

    inputBuscarCurso.addEventListener("input", (e) => renderCursos(e.target.value));

    cursosContainer.addEventListener("click", async (e) => {
        const btnEditar = e.target.closest(".btn-curso-editar");
        if (btnEditar) {
            const curso = estado.todosLosCursos.find((c) => String(c.id) === String(btnEditar.dataset.id));
            if (curso) abrirEditarCurso(curso);
            return;
        }

        const btn = e.target.closest(".btn-curso-eliminar");
        if (!btn) return;

        const cursoId = btn.dataset.id;
        const docenteId = btn.dataset.docenteId;
        const nombre = btn.dataset.nombre;

        const confirmado = await pedirConfirmacion({
            titulo: "¿Eliminar este curso?",
            texto: `Se eliminara el curso "${nombre}" junto con todos sus modulos. Esta accion no se puede deshacer.`,
            textoBoton: "Eliminar curso"
        });

        if (!confirmado) return;

        const resultado = await eliminarCurso(docenteId, cursoId);
        if (!resultado.ok) {
            mostrarToast(resultado.error || "No se pudo eliminar el curso.");
            return;
        }

        estado = await recargarDatos();
        actualizarKPIs();
        renderCursos(inputBuscarCurso.value);
        renderDocentes(inputBuscarDocente.value);
        mostrarToast(`Curso "${nombre}" eliminado correctamente.`, "success");
    });

    actualizarKPIs();
    renderDocentes();
    renderEstudiantes();
    renderCursos();
}

document.addEventListener("DOMContentLoaded", construirPanelAdmin);
