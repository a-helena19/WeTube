import "/js/cursormode.js";

document.addEventListener("DOMContentLoaded", () => {
    const endCursorModeBtn = document.getElementById("end-cursor-mode");

    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");



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

document.addEventListener("DOMContentLoaded", async () => {
    const activateBtn = document.getElementById("activate-cursor-mode");
    const endBtn = document.getElementById("end-cursor-mode");
    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const webcam = document.getElementById("webcam");
    const cursorEl = document.getElementById("virtual-cursor");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;
    await webcam.play();

    const cursorController = new window.CursorModeController();
    await cursorController.initialize(webcam);

    let cursorActive = false;
    let dragTarget = null;

    cursorController.on("onCursorMove", (x, y) => {
        cursorEl.style.left = x + "px";
        cursorEl.style.top = y + "px";
    });

    cursorController.on("onCursorClick", (x, y) => {
        dragTarget = document.elementFromPoint(x, y);
        if (!dragTarget) return;

        dragTarget.dispatchEvent(new MouseEvent("mousedown", {
            bubbles: true,
            clientX: x,
            clientY: y
        }));
    });

    cursorController.on("onDrag", (x, y) => {
        if (!dragTarget) return;

        dragTarget.dispatchEvent(new MouseEvent("mousemove", {
            bubbles: true,
            clientX: x,
            clientY: y
        }));
    });

    cursorController.on("onDragEnd", (x, y) => {
        if (!dragTarget) return;

        dragTarget.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: true,
            clientX: x,
            clientY: y
        }));

        dragTarget = null;
    });

    async function enterCursorMode() {
        if (cursorActive) return;
        cursorActive = true;

        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = "<span>Cursor Mode</span>";
        }

        await cursorController.start();
        cursorEl.style.display = "block";
    }

    function exitCursorMode() {
        if (!cursorActive) return;
        cursorActive = false;

        cursorController.stop();
        cursorEl.style.display = "none";

        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = "<span>Gesture Mode</span>";
        }
    }

    cursorController.on("onModeExit", () => exitCursorMode());
    activateBtn.onclick = enterCursorMode;
    endBtn.onclick = exitCursorMode;
});

