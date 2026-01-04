document.addEventListener("DOMContentLoaded", () => {
    const showCursorModeBtn = document.getElementById("show-cursor-mode");
    const cursorSidebar = document.getElementById("cursor-mode-sidebar");
    const hideCursorModeBtn = document.getElementById("hide-cursor-mode");

    // Show Cursor Mode
    showCursorModeBtn.addEventListener("click", () => {
        cursorSidebar.classList.remove("hidden");
        showCursorModeBtn.classList.add("hidden");
    });

    // Hide Cursor Mode
    hideCursorModeBtn.addEventListener("click", () => {
        cursorSidebar.classList.add("hidden");
        showCursorModeBtn.classList.remove("hidden");
    });
});