// ===============================
// Gesture Mode Controller – Home
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const gestureBadge = document.getElementById('gesture-badge');

    let cursorModeActive = false;
    let gestureLock = false;

    let gestureClearTimeout = null;


    const gestureEmojis = {
        'Pointing_Up': '☝️',
        'Closed_Fist': '✊',
        'PINCH': '🤏',
        'CURSOR_PINCH': '🤏',
        'SCROLL_UP': '⬆️',
        'SCROLL_DOWN': '⬇️'
    };

    const gestureDisplayNames = {
        'Pointing_Up': 'Pointing Up',
        'Closed_Fist': 'Fist',
        'PINCH': 'Pinch',
        'CURSOR_PINCH': 'Pinch click',
        'SCROLL_UP': '2 Fingers Up',
        'SCROLL_DOWN': '2 Fingers Down'
    };

    function displayRecognizedGesture(gestureName) {
        const emoji = gestureEmojis[gestureName] || '🤚';
        const displayName = gestureDisplayNames[gestureName] || gestureName;
        gestureBadge.innerHTML = `<span>${emoji} ${displayName}</span>`;
        gestureBadge.style.display = "block";

        // ⏱️ Reset Timer
        if (gestureClearTimeout) {
            clearTimeout(gestureClearTimeout);
        }

        gestureClearTimeout = setTimeout(() => {
            clearGestureBadge();
        }, 400); // 300–500ms fühlt sich gut an
    }


    function clearGestureBadge() {
        gestureBadge.innerHTML = '';
        gestureBadge.style.display = "none";
    }

    document.addEventListener('gestureDetected', (event) => {
        displayRecognizedGesture(event.detail.gestureName);
    });

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

    }

    // ===========================
    // GESTURE HANDLING
    // ===========================

    function handleGesture(gesture) {
        if (!gesture) return;
        if (gestureLock && gesture !== "Closed_Fist") return;

        switch (gesture) {
            case "Pointing_Up":
                activateCursorMode();
                break;

            case "Closed_Fist":
                deactivateCursorMode();
                break;
        }
    }

    // ===========================
    // EVENT LISTENER
    // ===========================

    window.addEventListener("gesture", (e) => {
        handleGesture(e.detail.name);
    });
});
