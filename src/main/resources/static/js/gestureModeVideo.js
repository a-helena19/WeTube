import { initVideoActions } from "./videoActions.js";

const videoEl = document.getElementById("main-video");
const feedbackEl = document.getElementById("video-feedback");

const videoActions = initVideoActions(videoEl, feedbackEl);

document.addEventListener("DOMContentLoaded", () => {
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const gestureBadge = document.getElementById('gesture-badge');
    const videoEl = document.getElementById("main-video");

    let cursorModeActive = false;
    let gestureLock = false;

    let gestureClearTimeout = null;


    const gestureEmojis = {
        'Pointing_Up': '👆',
        'Closed_Fist': '✊',
        'Thumb_Up': '👍',
        'Thumb_Down': '👎',
        'Victory': '✌️',
        'Open_Palm': '✋',
        'SHAKA': '🤙',
        'ILY_RIGHT_NEXT': '🤟',
        'ILY_LEFT_NEXT': '🤟'
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

    const VOLUME_STEP = 0.1;

    function volumeUp() {
        videoEl.volume = Math.min(1, videoEl.volume + VOLUME_STEP);
        videoEl.muted = false;
        showVideoFeedback("🔊", `${Math.round(videoEl.volume * 100)}%`);
    }

    function volumeDown() {
        videoEl.volume = Math.max(0, videoEl.volume - VOLUME_STEP);
        showVideoFeedback("🔉", `${Math.round(videoEl.volume * 100)}%`);
    }

    function toggleMute() {
        videoEl.muted = !videoEl.muted;
        showVideoFeedback(
            videoEl.muted ? "🔇" : "🔊",
            videoEl.muted ? "Muted" : "Unmuted"
        );
    }

    // ===========================
    // GESTURE HANDLING
    // ===========================

    function handleGesture(gesture) {
        if (!gesture) return;
        if (gestureLock && gesture !== "Closed_Fist") return;

        console.log("[HOME] handleGesture:", gesture);

        switch (gesture) {
            case "Pointing_Up":
                activateCursorMode();
                break;

            case "Closed_Fist":
                deactivateCursorMode();
                break;

            case "Victory":
                videoActions.playPause();
                break;

            case "Thumb_Up":
                videoActions.volumeUp();
                break;

            case "Thumb_Down":
                videoActions.volumeDown();
                break;

            case "SHAKA":
                videoActions.toggleMute();
                break;

            case "SEEK_FORWARD":
                seekVideo("forward");
                break;

            case "SEEK_BACKWARD":
                seekVideo("backward");
                break;

            case "NEXT_VIDEO":
                goToNextVideo();
                break;

            case "BACK_VIDEO":
                window.history.back();
                break;

            case "RESTART_VIDEO":
                restartVideo();
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

    function goToNextVideo() {
        const nextVideoLink = document.querySelector(
            ".video-grid .video-card-link"
        );

        if (nextVideoLink) {
            window.location.href = nextVideoLink.href;
        }
    }

    function restartVideo() {
        const video = document.getElementById("main-video");
        if (!video) return;

        video.currentTime = 0;
        video.play();

        console.log("[VIDEO] Restarted via Fist → Open");
    }
});