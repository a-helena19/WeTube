document.addEventListener("DOMContentLoaded", () => {
    const activateCursorModeBtn = document.getElementById("activate-cursor-mode");
    const endCursorModeBtn = document.getElementById("end-cursor-mode");

    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");

    // Activate Cursor Mode
    activateCursorModeBtn.addEventListener("click", () => {
        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");
    });

    // End Cursor Mode
    endCursorModeBtn.addEventListener("click", () => {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");
    });
});