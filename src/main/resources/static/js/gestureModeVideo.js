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

    window.addEventListener("gesture", (e) => {
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
    }

    function toggleFakeFullscreenOpenPalm() {
        const videoPlayerContainer = document.querySelector(".video-player-container");
        const feedback = document.getElementById("video-feedback");

        if (!videoPlayerContainer) return;

        const state = window.uiState;

        state.fakeFullscreenActive = !state.fakeFullscreenActive;

        videoPlayerContainer.classList.toggle(
            "fake-fullscreen",
            state.fakeFullscreenActive
        );

        document.body.classList.toggle("fake-fullscreen-active", state.fakeFullscreenActive);

        // Fullscreen Gesture Badge erstellen/entfernen
        manageFullscreenGestureBadge(state.fakeFullscreenActive);

        showFullscreenHint(feedback);
    }

    function manageFullscreenGestureBadge(isFullscreen) {
        let fullscreenBadge = document.getElementById("fullscreen-gesture-badge");
        const originalBadge = document.getElementById("gesture-badge");

        if (isFullscreen) {
            if (!fullscreenBadge) {
                fullscreenBadge = document.createElement("div");
                fullscreenBadge.id = "fullscreen-gesture-badge";
                fullscreenBadge.className = "fullscreen-gesture-badge";
                fullscreenBadge.style.display = "none";
                document.body.appendChild(fullscreenBadge);
            }

            // Observer für das Original-Badge
            const observer = new MutationObserver(() => {
                if (originalBadge && originalBadge.style.display !== "none" && originalBadge.innerHTML) {
                    fullscreenBadge.innerHTML = originalBadge.innerHTML;
                    fullscreenBadge.style.display = "flex";
                } else {
                    fullscreenBadge.style.display = "none";
                }
            });

            if (originalBadge) {
                observer.observe(originalBadge, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['style']
                });
            }

            window.fullscreenBadgeObserver = observer;
        } else {
            if (fullscreenBadge) {
                fullscreenBadge.remove();
            }
            if (window.fullscreenBadgeObserver) {
                window.fullscreenBadgeObserver.disconnect();
                window.fullscreenBadgeObserver = null;
            }
        }
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