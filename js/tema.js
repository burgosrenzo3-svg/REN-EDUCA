let temaListo = false;

function aplicarTemaGuardado() {
    const theme = localStorage.getItem("theme") || "light";
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("light-mode", !isDark);

    const btnTheme = document.getElementById("btnTheme");
    if (btnTheme) {
        const iconSol = btnTheme.querySelector(".icon-sol");
        const iconLuna = btnTheme.querySelector(".icon-luna");
        if (iconSol) iconSol.style.display = isDark ? "none" : "block";
        if (iconLuna) iconLuna.style.display = isDark ? "block" : "none";
        btnTheme.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
}

/* Si la pagina no trae su propio boton #btnTheme en el header
   (paneles internos como docente, estudiante, admin, modulos,
   quiz, etc.), se crea automaticamente un boton flotante para
   que el cambio de tema este disponible en TODO el sitio. */
function crearBotonTemaFlotante() {
    if (document.getElementById("btnTheme")) return;

    const btnTheme = document.createElement("button");
    btnTheme.id = "btnTheme";
    btnTheme.type = "button";
    btnTheme.className = "btn-theme btn-theme-flotante";
    btnTheme.setAttribute("aria-label", "Cambiar tema");
    btnTheme.innerHTML = `
        <svg class="icon-sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/></svg>
        <svg class="icon-luna" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M20.5 14.7A8.5 8.5 0 1 1 9.3 3.5a8.5 8.5 0 0 0 11.2 11.2Z"/></svg>
    `;

    document.body.appendChild(btnTheme);
}

function iniciarTema() {
    crearBotonTemaFlotante();
    aplicarTemaGuardado();

    const btnTheme = document.getElementById("btnTheme");
    if (!btnTheme || temaListo) return;

    temaListo = true;

    btnTheme.addEventListener("click", () => {
        const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
        localStorage.setItem("theme", nextTheme);
        aplicarTemaGuardado();
    });
}

document.addEventListener("renHeaderLoaded", iniciarTema);
iniciarTema();
