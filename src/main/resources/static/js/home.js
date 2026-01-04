document.addEventListener("DOMContentLoaded", () => {
    const activateCursorModeBtn = document.getElementById("activate-cursor-mode");
    const endCursorModeBtn = document.getElementById("end-cursor-mode");

    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");

    activateCursorModeBtn.addEventListener("click", () => {
        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");
    });

    endCursorModeBtn.addEventListener("click", () => {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");
    });
});