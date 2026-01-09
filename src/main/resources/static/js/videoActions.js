export function initVideoActions(videoEl, feedbackEl) {

    let feedbackTimeout = null;

    function showFeedback(icon, text) {
        if (!feedbackEl) return;

        feedbackEl.innerHTML = `<span>${icon}</span><span>${text}</span>`;
        feedbackEl.classList.remove("hidden");
        feedbackEl.classList.add("show");

        if (feedbackTimeout) clearTimeout(feedbackTimeout);

        feedbackTimeout = setTimeout(() => {
            feedbackEl.classList.remove("show");
            feedbackTimeout = setTimeout(() => {
                feedbackEl.classList.add("hidden");
            }, 200);
        }, 600);
    }

    const VOLUME_STEP = 0.1;

    return {
        playPause() {
            if (videoEl.paused) {
                videoEl.play().then(() => {
                });
            } else {
                videoEl.pause();
            }
        },

        volumeUp() {
            videoEl.volume = Math.min(1, videoEl.volume + VOLUME_STEP);
            videoEl.muted = false;
        },

        volumeDown() {
            videoEl.volume = Math.max(0, videoEl.volume - VOLUME_STEP);
        },

        toggleMute() {
            videoEl.muted = !videoEl.muted;
        },

        showPlayFeedback() {
            showFeedback("▶️", "Play");
        },
        showPauseFeedback() {
            showFeedback("⏸", "Pause");
        },
        showMuteFeedback() {
            showFeedback("🔇", "Muted");
        },
        showVolumeFeedback(percent) {
            showFeedback("🔊", `${percent}%`);
        }
    };
}