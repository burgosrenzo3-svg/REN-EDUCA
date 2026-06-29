/* =======================================================
   REN EDUCA · Catalogo publico (paginas/cursos.html)
   -------------------------------------------------------
   Esta vista puede cargar incluso sin sesion iniciada,
   gracias a la politica de Supabase que permite lectura
   publica de cursos visibles. Si la persona NO tiene sesion
   y hace click para entrar a un curso, se le pide registrarse
   o iniciar sesion en vez de llevarla directo al panel.
======================================================= */

(async function iniciarCatalogoPublico() {
    const cursosPublicoContainer = document.getElementById("cursosPublicoContainer");
    if (!cursosPublicoContainer) return;

    cursosPublicoContainer.innerHTML = `<p class="cargando-cursos">Cargando cursos...</p>`;

    if (window.renSesionListaPromise) await window.renSesionListaPromise;

    const cursosPublicos = await obtenerCursosPublicosResumen();
    mostrarCatalogoPublico(cursosPublicos, cursosPublicoContainer);
})();

function mostrarCatalogoPublico(cursosPublicos, cursosPublicoContainer) {
    if (cursosPublicos.length === 0) {
        cursosPublicoContainer.innerHTML = `
            <article class="curso-card">
                <h2>Aun no hay cursos publicados</h2>
                <p>Cuando un docente registre cursos en su panel, apareceran aqui automaticamente.</p>
            </article>
        `;
        return;
    }

    cursosPublicoContainer.innerHTML = "";

    cursosPublicos.forEach((curso) => {
        const card = document.createElement("article");
        card.className = "curso-card";
        card.innerHTML = `
            <img src="${curso.imagen || imagenPorDefecto()}" alt="Imagen de ${escapeHTML(curso.nombre)}">
            <h2>${escapeHTML(curso.nombre)}</h2>
            <p>${escapeHTML(curso.descripcion || "")}</p>
            <p><strong>${escapeHTML(curso.categoria || "")}</strong> · ${escapeHTML(curso.nivel || "")}</p>
            <a href="#" class="btn-entrar-curso" data-curso-id="${curso.id}">Entrar al aula</a>
        `;
        cursosPublicoContainer.appendChild(card);
    });

    cursosPublicoContainer.addEventListener("click", (event) => {
        const link = event.target.closest(".btn-entrar-curso");
        if (!link) return;
        event.preventDefault();
        manejarClickEntrarCurso();
    });
}

function manejarClickEntrarCurso() {
    const usuario = typeof usuarioActivo === "function" ? usuarioActivo() : null;

    if (usuario) {
        window.location.href = "panel-estudiante.html";
        return;
    }

    const modalRegistro = document.getElementById("modalRegistro");
    if (modalRegistro) {
        modalRegistro.classList.add("active");
    } else {
        alert("Crea una cuenta gratuita para entrar al aula.");
    }
}
