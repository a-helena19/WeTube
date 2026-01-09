// ===============================
// Gesture Mode Controller – Home
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const gestureBadge = document.getElementById('gesture-badge');
    const videoEl = document.getElementById("main-video");

    let cursorModeActive = false;
    let gestureLock = false;

    let gestureClearTimeout = null;

    const unlockBtn = document.getElementById("fullscreen-unlock");
    let fullscreenUnlocked = false;

    unlockBtn.addEventListener("click", () => {
        fullscreenUnlocked = true;
        unlockBtn.style.display = "none";
        console.log("[VIDEO] Fullscreen gestures unlocked");
    });


    const gestureEmojis = {
        'point-up': '👆',
        'fist': '✊',
        'pinch': '🤏',
        'thumbs-up': '👍',
        'peace': '✌️',
        'open-palm': '✋'
    };

    function displayRecognizedGesture(gestureName) {
        const emoji = gestureEmojis[gestureName] || '🤚';
        gestureBadge.innerHTML = `<span>${emoji} ${gestureName}</span>`;
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

            case "PLAY_PAUSE":
                if (videoEl.paused) {
                    videoEl.muted = true;
                    videoEl.play().catch(err => {
                        console.warn("[VIDEO] play blocked:", err);
                    });
                } else {
                    videoEl.pause();
                }
                break;

            case "FULLSCREEN":
                if (!fullscreenUnlocked) {
                    console.warn("[VIDEO] Fullscreen not unlocked yet");
                    return;
                }

                // ENTER fullscreen
                if (!document.fullscreenElement &&
                    !document.webkitFullscreenElement) {

                    const el = videoEl;

                    if (el.requestFullscreen) {
                        el.requestFullscreen();
                    } else if (el.webkitRequestFullscreen) {
                        el.webkitRequestFullscreen();
                    }

                }
                // EXIT fullscreen
                else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
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