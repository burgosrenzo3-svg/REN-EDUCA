/* Inserta la barra de "modo vista estudiante" al inicio del body
   cuando un docente esta navegando el aula en esa vista. */
async function iniciarPreviewBar() {
    if (window.renSesionListaPromise) await window.renSesionListaPromise;

    if (typeof esModoVistaDocente !== "function" || !esModoVistaDocente()) return;
    if (document.querySelector(".preview-bar")) return;

    const enPaginas = window.location.pathname.includes("/paginas/");
    const hrefPanelDocente = (enPaginas ? "" : "paginas/") + "panel-docente.html";

    const barra = document.createElement("div");
    barra.className = "preview-bar";
    barra.innerHTML = `
        <span class="preview-bar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </span>
        <span>Estas viendo el aula como la veria un <strong>estudiante</strong>.</span>
        <a class="preview-bar-btn" id="btnVolverPanelDocente" href="${hrefPanelDocente}">← Volver al panel docente</a>
    `;

    document.body.insertBefore(barra, document.body.firstChild);

    document.getElementById("btnVolverPanelDocente")?.addEventListener("click", () => {
        if (typeof salirDeVistaDocente === "function") salirDeVistaDocente();
    });
}

document.addEventListener("DOMContentLoaded", iniciarPreviewBar);
if (document.readyState !== "loading") iniciarPreviewBar();
