import {
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

const video = document.createElement("video");
video.setAttribute("playsinline", "");

let handLandmarker = null;
let gestureRecognizer = null;

const GESTURE_HOLD_TIME = {
    Pointing_Up: 400,
    Closed_Fist: 400,
    PINCH: 600
};

let activeGesture = null;
let gestureStartTime = null;
let gestureTriggered = false;
let cursorModeActive = false;
let cursorX = 0.5;
let cursorY = 0.5;
const CURSOR_SMOOTHING = 0.17;
const CURSOR_TRACKING_ZONE = {
    xMin: 0.2, xMax: 0.8,
    yMin: 0.15, yMax: 0.85
};
let twoFingerScrollActive = false;
let lastScrollY = 0;
let lastScrollDirection = null;
let pinchStartTime = null;
let pinchTriggered = false;
const PINCH_HOLD_TIME = 500;

// Flag to prevent event loop
let isInternalChange = false;

export function setCursorModeActive(active) {
    cursorModeActive = active;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = active ? "block" : "none";
    }

    isInternalChange = true;
    window.dispatchEvent(new CustomEvent('cursorModeChanged', {
        detail: { active }
    }));
    isInternalChange = false;
}

// Listen for external cursor mode changes (from UI clicks)
window.addEventListener('cursorModeChanged', (e) => {
    if (isInternalChange) return;

    const active = e.detail.active;
    cursorModeActive = active;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = active ? "block" : "none";
    }
});


async function initGestureEngineHome() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-assets/gesture_recognizer.task"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    requestAnimationFrame(loop);
}

function dispatchGestureFeedback(name) {
    document.dispatchEvent(
        new CustomEvent("gestureDetected", {
            detail: { gestureName: name }
        })
    );
}

function resetGestureHold() {
    activeGesture = null;
    gestureStartTime = null;
    gestureTriggered = false;
}

function handleGestureHold(gestureName, now) {
    const holdTime = GESTURE_HOLD_TIME[gestureName] ?? 400;

    dispatchGestureFeedback(gestureName);

    if (activeGesture !== gestureName) {
        activeGesture = gestureName;
        gestureStartTime = now;
        gestureTriggered = false;
        return;
    }

    if (!gestureTriggered && now - gestureStartTime >= holdTime) {
        emitGesture(gestureName);
        gestureTriggered = true;
    }
}

function isPinch(lm) {
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 0.04;
}

function mapHandToScreen(handX, handY) {
    const zone = CURSOR_TRACKING_ZONE;
    const normalizedX = (handX - zone.xMin) / (zone.xMax - zone.xMin);
    const normalizedY = (handY - zone.yMin) / (zone.yMax - zone.yMin);

    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    const mirroredX = 1 - clampedX;

    cursorX = cursorX + (mirroredX - cursorX) * CURSOR_SMOOTHING;
    cursorY = cursorY + (clampedY - cursorY) * CURSOR_SMOOTHING;

    return {
        x: cursorX * window.innerWidth,
        y: cursorY * window.innerHeight
    };
}

function updateVirtualCursor(x, y) {
    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = "block";
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
    }
}

function handleVideoInteraction(x, y) {
    const el = document.elementFromPoint(x, y);

    const video = el?.closest("video");
    if (!video) return false;

    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }

    return true;
}


function isTwoFingersUp(lm) {
    const indexUp = lm[8].y < lm[6].y;
    const middleUp = lm[12].y < lm[10].y;
    const ringDown = lm[16].y > lm[14].y;
    const pinkyDown = lm[20].y > lm[18].y;
    return indexUp && middleUp && ringDown && pinkyDown;
}

function handleElementClick(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    const clickable = el.closest(
        "button, a, .video-card, .video-card-link, [role='button']"
    );

    if (clickable) {
        clickable.click();
    }
}

function handleTwoFingerScroll(lm) {
    const y = lm[12].y;

    if (!twoFingerScrollActive) {
        twoFingerScrollActive = true;
        lastScrollY = y;
        return;
    }

    const delta = y - lastScrollY;
    lastScrollY = y;

    if (Math.abs(delta) < 0.0015) return;
    const scrollAmount = -delta * 800;

    // Dispatch feedback for scroll direction
    const scrollDirection = delta < 0 ? "SCROLL_UP" : "SCROLL_DOWN";
    if (scrollDirection !== lastScrollDirection) {
        dispatchGestureFeedback(scrollDirection);
        lastScrollDirection = scrollDirection;
    }

    window.scrollBy({
        top: scrollAmount,
        behavior: "auto"
    });
}

function processCursorMode(lm) {
    const pos = mapHandToScreen(lm[8].x, lm[8].y);
    updateVirtualCursor(pos.x, pos.y);

    const pinching = isPinch(lm);

    if (pinching) {
        if (!pinchStartTime) {
            pinchStartTime = performance.now();
            pinchTriggered = false;
        }

        const heldTime = performance.now() - pinchStartTime;

        if (!pinchTriggered && heldTime >= PINCH_HOLD_TIME) {
            dispatchGestureFeedback("CURSOR_PINCH");

            const handledVideo = handleVideoInteraction(pos.x, pos.y);

            if (!handledVideo) {
                handleElementClick(pos.x, pos.y);
            }

            pinchTriggered = true;
        }
    } else {
        pinchStartTime = null;
        pinchTriggered = false;
        const cursor = document.getElementById("virtual-cursor");
        if (cursor) cursor.style.transform = "scale(1)";
    }


    if (isTwoFingersUp(lm)) {
        handleTwoFingerScroll(lm);
    } else {
        twoFingerScrollActive = false;
        lastScrollDirection = null;
    }
}


function loop() {
    const now = performance.now();

    // ===============================
    // 1️⃣ GestureRecognizer
    // ===============================

    const gestureResult =
        gestureRecognizer.recognizeForVideo(video, now);

    const topGesture =
        gestureResult.gestures?.[0]?.[0] || null;

    if (topGesture?.categoryName === "Pointing_Up" && topGesture.score > 0.7) {
        setCursorModeActive(true);
    }

    if (topGesture?.categoryName === "Closed_Fist" && topGesture.score > 0.7) {
        setCursorModeActive(false);
    }

    const result = handLandmarker.detectForVideo(video, now);

    if (cursorModeActive && result.landmarks?.length) {
        processCursorMode(result.landmarks[0]);
        requestAnimationFrame(loop);
        return;
    }

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) cursor.style.display = "none";

    const ALLOWED_GESTURES = new Set([
        "Pointing_Up",
        "Closed_Fist"
    ]);

    if (
        topGesture &&
        ALLOWED_GESTURES.has(topGesture.categoryName) &&
        topGesture.score > 0.6
    ) {
        handleGestureHold(topGesture.categoryName, now);
        requestAnimationFrame(loop);
        return;
    }

    // ===============================
    // 2️⃣ HandLandmarker (PINCH)
    // ===============================

    if (!result.landmarks || result.landmarks.length === 0) {
        resetGestureHold();
        requestAnimationFrame(loop);
        return;
    }

    const lm = result.landmarks[0];

    if (isPinch(lm)) {
        handleGestureHold("PINCH", now);
    } else {
        resetGestureHold();
    }

    requestAnimationFrame(loop);
}

await initGestureEngineHome();