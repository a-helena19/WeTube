import {
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

const video = document.createElement("video");
video.setAttribute("playsinline", "");

let handLandmarker = null;
let gestureRecognizer = null;
let cameraStream = null;
let isRunning = false;
let cameraEnabled = true;
window.cursorModeActive = false;

const GESTURE_HOLD_TIME = {
    Pointing_Up: 800,
    Closed_Fist: 800,
    PINCH: 400
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
let pinchStartTime = null;
let pinchTriggered = false;
const PINCH_HOLD_TIME = 700;
let lastScrollFeedbackTime = 0;
const SCROLL_FEEDBACK_INTERVAL = 200;

let isInternalChange = false;

window.setCursorModeActive = function(active) {
    console.log("CursorMode set to:", active);
    window.cursorModeActive = active;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) cursor.style.display = active ? "block" : "none";

    isInternalChange = true;
    window.dispatchEvent(new CustomEvent('cursorModeChanged', {
        detail: { active }
    }));
    isInternalChange = false;
};


window.addEventListener('cursorModeChanged', (e) => {
    if (isInternalChange) return;

    const active = e.detail.active;
    window.cursorModeActive = active;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = active ? "block" : "none";
    }
});

async function initGestureEngineHome() {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;
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

    isRunning = true;
    requestAnimationFrame(loop);
}

async function stopCamera() {
    isRunning = false;
    cameraEnabled = false;

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    video.srcObject = null;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) cursor.style.display = "none";

    window.cursorModeActive = false;
}

async function startCamera() {
    if (cameraEnabled && isRunning) return;

    cameraEnabled = true;

    if (!handLandmarker || !gestureRecognizer) {
        await initGestureEngineHome();
        return;
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;
    await video.play();

    isRunning = true;
    requestAnimationFrame(loop);
}

window.addEventListener('cameraToggle', async (e) => {
    const enabled = e.detail.enabled;
    if (enabled) {
        await startCamera();
    } else {
        await stopCamera();
    }
});

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

    if (activeGesture !== gestureName) {
        activeGesture = gestureName;
        gestureStartTime = now;
        gestureTriggered = false;
        return;
    }

    if (!gestureTriggered && now - gestureStartTime >= holdTime) {

        if (gestureName === "Pointing_Up") {
            setCursorModeActive(true);
        }

        if (gestureName === "Closed_Fist") {
            setCursorModeActive(false);
        }

        emitGesture(gestureName);
        gestureTriggered = true;
    }
}


let pinchState = false;
function isPinch(lm) {
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const PINCH_ON = 0.04;
    const PINCH_OFF = 0.05;

    if (!pinchState && dist < PINCH_ON) pinchState = true;
    if (pinchState && dist > PINCH_OFF) pinchState = false;

    return pinchState;
}

function getSafeLandmarks(result) {
    const lm = result.landmarks?.[0];
    return lm && lm.length === 21 ? lm : null;
}


function mapHandToScreen(handX, handY) {
    const zone = CURSOR_TRACKING_ZONE;

    const normalizedX = (handX - zone.xMin) / (zone.xMax - zone.xMin);
    const normalizedY = (handY - zone.yMin) / (zone.yMax - zone.yMin);

    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));

    const targetX = (1 - clampedX);
    const targetY = clampedY;

    const dx = targetX - cursorX;
    const dy = targetY - cursorY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const responsiveness = Math.min(1, distance * 10);
    const smoothing = 0.18 + responsiveness * 0.55;

    cursorX += dx * smoothing;
    cursorY += dy * smoothing;

    if (Math.abs(dx) < 0.0015) cursorX = targetX;
    if (Math.abs(dy) < 0.0015) cursorY = targetY;

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
    if (!lm || lm.length < 21) return false;

    const indexUp = lm[8].y < lm[6].y;
    const middleUp = lm[12].y < lm[10].y;
    const ringDown = lm[16].y > lm[14].y;
    const pinkyDown = lm[20].y > lm[18].y;
    return indexUp && middleUp && ringDown && pinkyDown;
}


function handleElementClick(x, y) {
    const radius = 12;

    const points = [
        [0, 0],
        [-radius, 0],
        [radius, 0],
        [0, -radius],
        [0, radius],
        [radius, radius],
        [-radius, -radius],
        [radius, -radius],
        [-radius, radius]
    ];

    for (const [dx, dy] of points) {
        const el = document.elementFromPoint(x + dx, y + dy);
        if (!el) continue;

        const clickable = el.closest(
            "button, a, .video-card, .video-card-link, [role='button']"
        );

        if (clickable) {
            clickable.click();
            return;
        }
    }
}

function isPointingGesture(lm) {
    if (!lm) return false;

    const indexUp  = lm[8].y  < lm[6].y;
    const middleDown = lm[12].y > lm[10].y;
    const ringDown   = lm[16].y > lm[14].y;
    const pinkyDown  = lm[20].y > lm[18].y;

    return indexUp && middleDown && ringDown && pinkyDown;
}

let scrollVelocity = 0;
let lastScrollY = null;
function handleTwoFingerScroll(lm) {
    const y = lm[12].y;
    const now = performance.now();

    if (lastScrollY === null) {
        lastScrollY = y;
        return;
    }

    const delta = y - lastScrollY;
    lastScrollY = y;

    if (Math.abs(delta) < 0.0007) return;

    scrollVelocity += -delta * 500;

    scrollVelocity = Math.max(-30, Math.min(30, scrollVelocity));


    twoFingerScrollActive = true;

    if (now - lastScrollFeedbackTime > SCROLL_FEEDBACK_INTERVAL) {
        if (delta > 0) {
            dispatchGestureFeedback("SCROLL_DOWN");
        } else {
            dispatchGestureFeedback("SCROLL_UP");
        }
        lastScrollFeedbackTime = now;
    }
}

function updateSmoothScroll() {
    if (!twoFingerScrollActive) return;

    scrollVelocity *= 0.88;

    if (Math.abs(scrollVelocity) < 0.2) {
        scrollVelocity = 0;
        return;
    }

    window.scrollBy({
        top: scrollVelocity,
        behavior: "auto"
    });
}

function processCursorMode(lm) {
    const pos = mapHandToScreen(lm[8].x, lm[8].y);
    updateVirtualCursor(pos.x, pos.y);

    if (twoFingerScrollActive) {
        pinchStartTime = null;
        pinchTriggered = false;
    }

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
        lastScrollY = null;
    }
}

const FEEDBACK_GESTURES = new Set([
    "Closed_Fist",
    "Pointing_Up"
]);

function loop() {
    if (!isRunning || !cameraEnabled) return;
    updateSmoothScroll();

    const now = performance.now();

    const gestureResult =
        gestureRecognizer.recognizeForVideo(video, now);

    const topGesture =
        gestureResult.gestures?.[0]?.[0] || null;

    if (topGesture && topGesture.score > 0.6 && FEEDBACK_GESTURES.has(topGesture.categoryName)) {
        dispatchGestureFeedback(topGesture.categoryName);
    }


    const result = handLandmarker.detectForVideo(video, now);

    if (
        topGesture &&
        topGesture.categoryName === "Closed_Fist" &&
        topGesture.score > 0.6
    ) {
        handleGestureHold("Closed_Fist", now);
    }


    if (window.cursorModeActive && result.landmarks?.length) {
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

const storedCameraEnabled = localStorage.getItem('cameraEnabled') !== 'false';
if (storedCameraEnabled) {
    await initGestureEngineHome();
} else {
    cameraEnabled = false;
    isRunning = false;
}

