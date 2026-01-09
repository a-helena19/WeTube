// ===============================
// Gesture Mode Controller – Home
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");

    let cursorModeActive = false;
    let gestureLock = false;

    // ===========================
    // UI SWITCH FUNCTIONS
    // ===========================

    function activateCursorMode() {
        if (cursorModeActive) return;

        cursorModeActive = true;
        gestureLock = true;

        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = "<span>Cursor Mode</span>";
        }

        console.log("[HOME] Cursor Mode aktiviert");
    }

    function deactivateCursorMode() {
        if (!cursorModeActive) return;

        cursorModeActive = false;
        gestureLock = false;

        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = "<span>Gesture Mode</span>";
        }

        console.log("[HOME] Cursor Mode deaktiviert");
    }

    // ===========================
    // GESTURE HANDLING
    // ===========================

    function handleGesture(gesture) {
        if (!gesture) return;
        if (gestureLock && gesture !== "FIST") return;

        console.log("[HOME] handleGesture:", gesture);

        switch (gesture) {
            case "POINT_UP":
                activateCursorMode();
                break;

            case "FIST":
                deactivateCursorMode();
                break;
        }
    }

    // ===========================
    // EVENT LISTENER
    // ===========================

    window.addEventListener("gesture", (e) => {
        console.log("[HOME] gesture event:", e.detail.name);
        handleGesture(e.detail.name);
    });
});