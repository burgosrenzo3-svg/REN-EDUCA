const form = document.getElementById("contactForm");

form.addEventListener("submit", (e) => {

    e.preventDefault();

    alert("🚀 Mensaje enviado correctamente");

    form.reset();

});