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

    const backBtn = document.getElementById("video-back-btn");
    const nextBtn = document.getElementById("video-next-btn");

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

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = '<span>Cursor Mode</span>';
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
});