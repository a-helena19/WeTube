const mode = document.body.dataset.mode;

/* Placeholder hooks for AR / hand tracking */
if (mode === "cursor") {
    const dot = document.querySelector(".cursorDot");
    window.addEventListener("mousemove", e => {
        dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    });
}

if (mode === "gesture") {
    console.log("Gesture mode active");
    // Hook MediaPipe / WebXR / AR gesture logic here
}
