import { initVideoActions } from "./videoActions.js";

const videoEl = document.getElementById("main-video");
const feedbackEl = document.getElementById("video-feedback");

const videoActions = initVideoActions(videoEl, feedbackEl);

window.uiState = {
    fakeFullscreenActive: false,
    cursorModeActive: false
};

document.addEventListener("DOMContentLoaded", () => {
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const gestureBadge = document.getElementById('gesture-badge');
    const videoEl = document.getElementById("main-video");
    const controlsEl = document.getElementById("cursor-video-controls");
    const exitBtn = document.getElementById("fake-fullscreen-exit");

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
        'ILY_LEFT_BACK': '🤟',
        'FOUR_FINGER_RIGHT': '🖐️',
        'FOUR_FINGER_LEFT': '🖐️',
        'PINCH': '🤏'
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
        if (window.uiState.cursorModeActive) return;

        window.uiState.cursorModeActive = true;
        gestureLock = true;

        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = "<span>Cursor Mode</span>";
        }

        controlsEl?.classList.remove("hidden");

        if (window.uiState.fakeFullscreenActive) {
            exitBtn?.classList.remove("hidden");
        }

        window.dispatchEvent(
            new CustomEvent("cursorModeChanged", {
                detail: { active: true }
            })
        );


    }

    function deactivateCursorMode() {
        if (!window.uiState.cursorModeActive) return;

        window.uiState.cursorModeActive = false;
        gestureLock = false;

        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = "<span>Gesture Mode</span>";
        }

        controlsEl?.classList.add("hidden");
        exitBtn?.classList.add("hidden");

        window.dispatchEvent(
            new CustomEvent("cursorModeChanged", {
                detail: { active: false }
            })
        );
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

            case "TOGGLE_FAKE_FULLSCREEN":
                toggleFakeFullscreenOpenPalm();
                break;


        }
    }

    // ===========================
    // EVENT LISTENER
    // ===========================
    exitBtn.addEventListener("click", () => {
        const state = window.uiState;

        state.fakeFullscreenActive = false;

        document
            .querySelector(".video-player")
            .classList.remove("fake-fullscreen");
        exitBtn.classList.add("hidden");
    });

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

    function toggleFakeFullscreenOpenPalm() {
        const videoPlayer = document.querySelector(".video-player");
        const feedback = document.getElementById("video-feedback");

        if (!videoPlayer) return;

        const state = window.uiState;

        state.fakeFullscreenActive = !state.fakeFullscreenActive;

        videoPlayer.classList.toggle(
            "fake-fullscreen",
            state.fakeFullscreenActive
        );

        if (state.fakeFullscreenActive && state.cursorModeActive) {
            exitBtn?.classList.remove("hidden");
        } else {
            exitBtn?.classList.add("hidden");
        }

        showFullscreenHint(feedback);
    }

    function showFullscreenHint(feedback) {
        if (!feedback) return;

        feedback.textContent = window.uiState.fakeFullscreenActive
            ? "🖐 Open hand to close"
            : "🖐 Open hand to expand";

        feedback.classList.remove("hidden");
        feedback.classList.add("show");

        setTimeout(() => {
            feedback.classList.remove("show");
            feedback.classList.add("hidden");
        }, 1200);
    }

});