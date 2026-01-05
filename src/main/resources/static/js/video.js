document.addEventListener("DOMContentLoaded", () => {
    const activateCursorModeBtn = document.getElementById("activate-cursor-mode");
    const endCursorModeBtn = document.getElementById("end-cursor-mode");
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");

    function switchToPointingMode() {
        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = '<span>Pointing Mode</span>';
        }
    }

    function switchToGestureMode() {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = '<span>Gesture Mode</span>';
        }
    }

    activateCursorModeBtn.addEventListener("click", switchToPointingMode);
    endCursorModeBtn.addEventListener("click", switchToGestureMode);

    if (modeBadge) {
        modeBadge.addEventListener("click", () => {
            if (modeBadge.classList.contains("gesture-badge")) {
                switchToPointingMode();
            } else if (modeBadge.classList.contains("pointing-badge")) {
                switchToGestureMode();
            }
        });

        modeBadge.style.cursor = "pointer";

        modeBadge.addEventListener("mouseenter", () => {
            modeBadge.style.opacity = "0.8";
            modeBadge.style.transform = "scale(1.05)";
        });

        modeBadge.addEventListener("mouseleave", () => {
            modeBadge.style.opacity = "1";
            modeBadge.style.transform = "scale(1)";
        });
    }
});