import { initVideoActions } from "./videoActions.js";

const videoEl = document.getElementById("main-video");
const feedbackEl = document.getElementById("video-feedback");

const videoActions = initVideoActions(videoEl, feedbackEl);

let seekCount = 0;
let lastSeekTime = 0;

const SEEK_RESET_TIME = 800;
const SMALL_SEEK = 10;
const LARGE_SEEK = 60;
const SEEK_THRESHOLD = 6;

window.seekVideo = function (direction) {
    const now = performance.now();

    if (now - lastSeekTime > SEEK_RESET_TIME) {
        seekCount = 0;
    }

    seekCount++;
    lastSeekTime = now;

    const step = seekCount > SEEK_THRESHOLD ? LARGE_SEEK : SMALL_SEEK;
    const delta = direction === "forward" ? step : -step;

    videoEl.currentTime = Math.min(
        Math.max(0, videoEl.currentTime + delta),
        videoEl.duration || Infinity
    );

    videoActions.showSeekFeedback(delta);
};

document.addEventListener("DOMContentLoaded", () => {
    const activateCursorModeBtn = document.getElementById("activate-cursor-mode");
    const endCursorModeBtn = document.getElementById("end-cursor-mode");
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");

    const backBtn = document.querySelector(".video-back");
    const nextBtn = document.querySelector(".video-next");

    const btnRestart = document.getElementById("restart");
    const btnRewind = document.getElementById("rewind");
    const btnPlay = document.getElementById("play");
    const btnForward = document.getElementById("forward");
    const btnMute = document.getElementById("mute");
    const btnFullscreen = document.getElementById("fullscreen");
    const volumeSteps = document.querySelectorAll(".volume-step");

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.history.back();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            const nextVideoLink = document.querySelector(
                ".video-grid .video-card-link"
            );

            if (nextVideoLink) {
                window.location.href = nextVideoLink.href;
            }
        });
    }

    videoEl.addEventListener("ended", () => {
        if (!videoEl) return;
        const nextVideoLink = document.querySelector(
            ".video-grid .video-card-link"
        );

        if (nextVideoLink) {
            const nextUrl = nextVideoLink.getAttribute("href");
            console.log("[Autoplay] Next video:", nextUrl);

            window.location.href = nextUrl;
        } else {
            console.log("[Autoplay] No next video found");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (!videoEl) return;

        switch (e.key) {

            case "ArrowUp":
                videoActions.volumeUp();
                break;

            case "ArrowDown":
                videoActions.volumeDown();
                break;

            case "m":
            case "M":
                videoActions.toggleMute();
                break;
        }
    });

    videoEl.addEventListener("play", () => {
        videoActions.showPlayFeedback?.("Play");
    });

    videoEl.addEventListener("pause", () => {
        videoActions.showPauseFeedback?.("Pause");
    });

    videoEl.addEventListener("volumechange", () => {
        if (videoEl.muted) {
            videoActions.showMuteFeedback?.();
        } else {
            videoActions.showVolumeFeedback?.(
                Math.round(videoEl.volume * 100)
            );
        }
    });


    function switchToPointingMode() {
        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        document
            .getElementById("cursor-video-controls")
            ?.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = '<span>Cursor Mode</span>';
        }

        window.uiState.cursorModeActive = true;
    }

    function switchToGestureMode() {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        document
            .getElementById("cursor-video-controls")
            ?.classList.add("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = '<span>Gesture Mode</span>';
        }
        window.uiState.cursorModeActive = false;
    }

    window.addEventListener("cursorModeChanged", (e) => {
        const active = e.detail.active;

        if (active) {
            switchToPointingMode();
        } else {
            switchToGestureMode();
        }
    });


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


    btnRestart.onclick = () => {
        videoEl.currentTime = 0;
        videoEl.play();
        videoActions.showSeekFeedback(0);
    };

    btnPlay.onclick = () => videoActions.playPause();

    btnRewind.onclick = () => seekVideo("backward");
    btnForward.onclick = () => seekVideo("forward");

    btnMute.onclick = () => {
        videoActions.toggleMute();
        videoActions.showMuteFeedback();
    };

    function updateVolumeGrid() {
        volumeSteps.forEach(step => {
            const stepVolume = parseFloat(step.dataset.volume);
            step.classList.toggle(
                "active",
                videoEl.volume >= stepVolume - 0.01
            );
        });
    }

    volumeSteps.forEach(step => {
        step.addEventListener("click", () => {
            const volume = parseFloat(step.dataset.volume);
            videoEl.volume = volume;
            videoEl.muted = false;

            updateVolumeGrid();
            videoActions.showVolumeFeedback(Math.round(volume * 100));
        });
    });

    videoEl.addEventListener("volumechange", updateVolumeGrid);
    updateVolumeGrid();


    btnFullscreen.onclick = () => toggleFakeFullscreen();


    function toggleFakeFullscreen() {
        const exitBtn = document.getElementById("fake-fullscreen-exit");
        const videoPlayer = document.querySelector(".video-player");

        if (!videoPlayer) return;

        let state = window.uiState;

        state.fakeFullscreenActive = !state.fakeFullscreenActive;
        videoPlayer.classList.toggle("fake-fullscreen", state.fakeFullscreenActive);

        if (state.fakeFullscreenActive && state.cursorModeActive) {
            exitBtn.classList.remove("hidden");
        } else {
            exitBtn.classList.add("hidden");
        }

    }

});