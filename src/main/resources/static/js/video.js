import {initVideoActions} from "./videoActions.js";

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

    const progressContainer = document.getElementById("progress-container");
    const progressPlayed = document.querySelector(".progress-played");
    const progressBuffered = document.querySelector(".progress-buffered");
    const timeDisplay = document.getElementById("time-display");

    updateMuteIcon();

    videoEl.addEventListener("timeupdate", () => {
        const percent = (videoEl.currentTime / videoEl.duration) * 100;
        progressPlayed.style.width = `${percent}%`;
    });

    videoEl.addEventListener("progress", () => {
        if (videoEl.buffered.length > 0) {
            const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
            const percent = (bufferedEnd / videoEl.duration) * 100;
            progressBuffered.style.width = `${percent}%`;
        }
    });

    progressContainer.addEventListener("click", (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;

        videoEl.currentTime = percent * videoEl.duration;
    });

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    videoEl.addEventListener("timeupdate", () => {
        timeDisplay.textContent =
            `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
    });


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
            window.location.href = nextVideoLink.getAttribute("href");
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

        window.uiState.cursorModeActive = true;
    }

    function switchToGestureMode() {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

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
        updateMuteIcon();
        videoActions.showMuteFeedback();
    };

    function updateMuteIcon() {
        if (!btnMute) return;

        btnMute.textContent = videoEl.muted || videoEl.volume === 0
            ? "🔇"
            : "🔊";
    }

    videoEl.addEventListener("volumechange", updateMuteIcon);

    function updateVolumeGrid() {
        const grid = document.getElementById("volume-grid");
        if (!grid) return;

        if (videoEl.muted) {
            grid.classList.add("muted");
            volumeSteps.forEach(step => step.classList.remove("active"));
            return;
        }

        grid.classList.remove("muted");

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
            videoEl.muted = false;
            videoEl.volume = volume;

            updateVolumeGrid();
            videoActions.showVolumeFeedback(Math.round(volume * 100));
        });
    });

    videoEl.addEventListener("volumechange", updateVolumeGrid);
    updateVolumeGrid();


    btnFullscreen.onclick = () => toggleFakeFullscreen();


    function toggleFakeFullscreen() {
        const videoPlayerContainer = document.querySelector(".video-player-container");

        if (!videoPlayerContainer) return;

        let state = window.uiState;

        state.fakeFullscreenActive = !state.fakeFullscreenActive;
        videoPlayerContainer.classList.toggle("fake-fullscreen", state.fakeFullscreenActive);
        document.body.classList.toggle("fake-fullscreen-active", state.fakeFullscreenActive);

        // Fullscreen Gesture Badge erstellen/entfernen
        manageFullscreenGestureBadge(state.fakeFullscreenActive);
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

});