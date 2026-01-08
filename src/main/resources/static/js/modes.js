document.addEventListener("DOMContentLoaded", function() {
    const mode = document.body.dataset.mode;
    console.log("Mode activated:", mode);

    if (mode === "cursor") {
        const dot = document.querySelector(".cursorDot");
        if (dot) {
            window.addEventListener("mousemove", e => {
                dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
            });
            console.log("Cursor mode active - dot element:", dot);
        } else {
            console.error("Cursor dot element not found!");
        }
    }

    // In modes.js, replace the gesture mode section:
    if (mode === "gesture") {
        console.log("Gesture mode active - AR ready");

        // Simple keyboard simulation for demo
        document.addEventListener('keydown', (e) => {
            const player = document.getElementById('player');
            if (!player) return;

            switch(e.key) {
                case ' ': // Space bar = open hand (play/pause)
                    player.paused ? player.play() : player.pause();
                    console.log("Gesture: Open Hand → Play/Pause");
                    break;
                case 'ArrowRight': // Point right = next
                    console.log("Gesture: Point Right → Next Video");
                    break;
                case 'ArrowLeft': // Point left = previous
                    console.log("Gesture: Point Left → Previous Video");
                    break;
            }
        });

        console.log("Press SPACE to play/pause, ARROWS for navigation");
    }
});