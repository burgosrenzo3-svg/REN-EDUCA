const images = [
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200"
];

let index = 0;

const slide = document.getElementById("slide");
const next = document.getElementById("next");
const prev = document.getElementById("prev");

function showImage(i) {
    if (!slide) return;

    slide.style.opacity = 0;

    setTimeout(() => {
        slide.src = images[i];
        slide.style.opacity = 1;
    }, 300);
}

next?.addEventListener("click", () => {
    index = index >= images.length - 1 ? 0 : index + 1;
    showImage(index);
});

prev?.addEventListener("click", () => {
    index = index <= 0 ? images.length - 1 : index - 1;
    showImage(index);
});

setInterval(() => {
    index = index >= images.length - 1 ? 0 : index + 1;
    showImage(index);
}, 6000);
