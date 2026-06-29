/* =======================================================
   REN EDUCA · Catalogo resumido en la pagina de inicio
   -------------------------------------------------------
   Se muestra ANTES de iniciar sesion (gracias a la politica
   de Supabase que permite lectura publica de cursos visibles).
   Es una vista resumida (nombre, categoria, nivel) pensada
   como incentivo: para ver el contenido completo y entrar al
   aula, la persona debe crear una cuenta gratuita.
======================================================= */

(async function iniciarCatalogoIndex() {
    const contenedor = document.getElementById("catalogoPublicoContainer");
    if (!contenedor) return;

    contenedor.innerHTML = `<p class="catalogo-cargando">Cargando cursos...</p>`;

    if (window.renSesionListaPromise) {
        try { await window.renSesionListaPromise; } catch { /* sigue igual */ }
    }

    const cursos = typeof obtenerCursosPublicosResumen === "function"
        ? await obtenerCursosPublicosResumen()
        : [];

    pintarCatalogoIndex(cursos, contenedor);
})();

function pintarCatalogoIndex(cursos, contenedor) {
    if (!cursos || cursos.length === 0) {
        contenedor.innerHTML = `
            <p class="catalogo-vacio">Aun no hay cursos publicados. Vuelve pronto.</p>
        `;
        return;
    }

    contenedor.innerHTML = "";

    cursos.forEach((curso) => {
        const card = document.createElement("article");
        card.className = "curso-mini-card";
        card.innerHTML = `
            <img src="${curso.imagen || imagenPorDefecto()}" alt="Imagen de ${escapeHTML(curso.nombre)}">
            <div class="curso-mini-meta">
                ${curso.categoria ? `<span class="curso-mini-tag">${escapeHTML(curso.categoria)}</span>` : ""}
                ${curso.nivel ? `<span class="curso-mini-tag">${escapeHTML(curso.nivel)}</span>` : ""}
            </div>
            <h3>${escapeHTML(curso.nombre)}</h3>
            <button type="button" data-curso-id="${curso.id}">Ver curso</button>
        `;
        contenedor.appendChild(card);
    });

    contenedor.addEventListener("click", (event) => {
        const boton = event.target.closest("button[data-curso-id]");
        if (!boton) return;
        manejarClickVerCursoIndex();
    });
}

/* Si ya hay sesion, manda directo al aula. Si no, abre el modal
   de registro (con prioridad sobre el de login, ya que la idea
   es captar cuentas nuevas desde el catalogo). */
function manejarClickVerCursoIndex() {
    const usuario = typeof usuarioActivo === "function" ? usuarioActivo() : null;

    if (usuario) {
        window.location.href = "paginas/panel-estudiante.html";
        return;
    }

    const modalRegistro = document.getElementById("modalRegistro");
    if (modalRegistro) {
        modalRegistro.classList.add("active");
    } else {
        alert("Crea una cuenta gratuita para entrar al aula.");
    }
}
