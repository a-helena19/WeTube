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
let pinchStartTime = null;
let pinchTriggered = false;
const PINCH_HOLD_TIME = 400;

const GESTURE_HOLD_TIME = {
    Open_Palm: 500,
    Closed_Fist: 600,
    Pointing_Up: 500,
    Victory: 500,
    Thumb_Up: 500,
    Thumb_Down: 500,

    SHAKA: 750
};

const GESTURE_REPEAT = {
    Thumb_Up: {
        interval: 150
    },
    Thumb_Down: {
        interval: 150
    }
};

let activeGesture = null;
let gestureStartTime = null;
let gestureTriggered = false;
let lastRepeatTime = null;

const FOUR_FINGER_SEEK_HOLD_TIME = 100;
const FOUR_FINGER_SEEK_REPEAT_INTERVAL = 150;

let fourFingerSeekStartTime = null;
let fourFingerLastRepeatTime = null;
let fourFingerActiveDirection = null;

const ILY_NAV_HOLD_TIME = 500;

let ilyNavStartTime = null;
let ilyNavTriggered = false;
let ilyNavDirection = null;

const OPEN_PALM_FULLSCREEN_HOLD = 500;

let openPalmStartTime = null;
let openPalmTriggered = false;

let pinchActive = false;
let pinchRestartStartTime = null;
let pinchRestartTriggered = false;
const PINCH_RESTART_HOLD_TIME = 600;

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

window.addEventListener('cursorModeChanged', (e) => {
    if (isInternalChange) return;

    const active = e.detail.active;
    cursorModeActive = active;

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = active ? "block" : "none";
    }
});

async function initGestureEngine() {
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

    cursorModeActive = false;
}

async function startCamera() {
    if (cameraEnabled && isRunning) return;

    cameraEnabled = true;

    if (!handLandmarker || !gestureRecognizer) {
        await initGestureEngine();
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

function isFourFinger(lm) {
    const indexUp  = lm[8].y  < lm[6].y;
    const middleUp = lm[12].y < lm[10].y;
    const ringUp   = lm[16].y < lm[14].y;
    const pinkyUp  = lm[20].y < lm[18].y;

    const thumbDown = lm[4].y > lm[3].y;

    return indexUp && middleUp && ringUp && pinkyUp && thumbDown;
}

function isILoveYou(lm) {
    const thumbUp  = isFingerUp(lm, 4, 3);
    const indexUp  = isFingerUp(lm, 8, 6);
    const pinkyUp  = isFingerUp(lm, 20, 18);

    const middleDown = !isFingerUp(lm, 12, 10);
    const ringDown   = !isFingerUp(lm, 16, 14);

    return thumbUp && indexUp && pinkyUp && middleDown && ringDown;
}

function isFingerUp(lm, tip, pip) {
    return lm[tip].y < lm[pip].y;
}

function isShaka(lm) {
    const thumbUp = lm[4].y < lm[3].y;
    const pinkyUp = isFingerUp(lm, 20, 18);

    const indexUp = isFingerUp(lm, 8, 6);
    const middleUp = isFingerUp(lm, 12, 10);
    const ringUp = isFingerUp(lm, 16, 14);

    return thumbUp && pinkyUp && !indexUp && !middleUp && !ringUp;
}

function isPinch(lm) {
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    return Math.sqrt(dx * dx + dy * dy) < 0.055;
}

function dispatchGestureFeedback(name) {
    document.dispatchEvent(
        new CustomEvent("gestureDetected", {
            detail: { gestureName: name }
        })
    );
}

function handleFourFingerSeek(direction, now) {

    if (fourFingerActiveDirection !== direction) {
        fourFingerActiveDirection = direction;
        fourFingerSeekStartTime = now;
        fourFingerLastRepeatTime = null;
        return;
    }

    const heldTime = now - fourFingerSeekStartTime;

    if (heldTime < FOUR_FINGER_SEEK_HOLD_TIME) {
        return;
    }

    if (!fourFingerLastRepeatTime) {
        emitGesture(direction === "FORWARD" ? "SEEK_FORWARD" : "SEEK_BACKWARD");
        fourFingerLastRepeatTime = now;
        return;
    }

    if (now - fourFingerLastRepeatTime >= FOUR_FINGER_SEEK_REPEAT_INTERVAL) {
        emitGesture(direction === "FORWARD" ? "SEEK_FORWARD" : "SEEK_BACKWARD");
        fourFingerLastRepeatTime = now;
    }
}

function handleILYNavigationOnce(direction, now) {
    if (ilyNavDirection !== direction) {
        ilyNavDirection = direction;
        ilyNavStartTime = now;
        ilyNavTriggered = false;
        return;
    }

    if (ilyNavTriggered) return;

    const heldTime = now - ilyNavStartTime;

    if (heldTime >= ILY_NAV_HOLD_TIME) {
        emitGesture(direction === "NEXT" ? "NEXT_VIDEO" : "BACK_VIDEO");
        ilyNavTriggered = true;
    }
}

function handlePinchRestart(lm, now) {
    if (isPinch(lm)) {
        dispatchGestureFeedback("PINCH");

        if (!pinchRestartStartTime) {
            pinchRestartStartTime = now;
            pinchRestartTriggered = false;
            return;
        }

        if (pinchRestartTriggered) return;

        const heldTime = now - pinchRestartStartTime;

        if (heldTime >= PINCH_RESTART_HOLD_TIME) {
            emitGesture("RESTART_VIDEO");
            pinchRestartTriggered = true;
        }
    } else {
        pinchRestartStartTime = null;
        pinchRestartTriggered = false;
    }
}

function handleOpenPalmFullscreen(now) {
    if (!openPalmStartTime) {
        openPalmStartTime = now;
        openPalmTriggered = false;

        dispatchGestureFeedback("Open_Palm");
        return;
    }

    if (openPalmTriggered) return;

    const heldTime = now - openPalmStartTime;

    if (heldTime >= OPEN_PALM_FULLSCREEN_HOLD) {
        emitGesture("TOGGLE_FAKE_FULLSCREEN");
        openPalmTriggered = true;
    }
}

function resetOpenPalm() {
    openPalmStartTime = null;
    openPalmTriggered = false;
}

function handleGestureHold(gestureName, now) {
    const holdTime = GESTURE_HOLD_TIME[gestureName] ?? 500;
    const repeatConfig = GESTURE_REPEAT[gestureName];

    if (activeGesture !== gestureName) {
        activeGesture = gestureName;
        gestureStartTime = now;
        gestureTriggered = false;
        lastRepeatTime = null;
        return;
    }

    const heldTime = now - gestureStartTime;

    if (repeatConfig) {
        if (heldTime >= holdTime) {
            if (!lastRepeatTime || now - lastRepeatTime >= repeatConfig.interval) {
                emitGesture(gestureName);
                lastRepeatTime = now;
            }
        }
        return;
    }

    if (!gestureTriggered && heldTime >= holdTime) {
        emitGesture(gestureName);
        gestureTriggered = true;
    }
}

function resetGestureHold() {
    activeGesture = null;
    gestureStartTime = null;
    gestureTriggered = false;
    lastRepeatTime = null;
}

function resetFourFingerSeek() {
    fourFingerSeekStartTime = null;
    fourFingerLastRepeatTime = null;
    fourFingerActiveDirection = null;
}

function resetILYNav() {
    ilyNavStartTime = null;
    ilyNavTriggered = false;
    ilyNavDirection = null;
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

let scrollVelocity = 0;
let lastScrollDirection = null;

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
    const scrollAmount = -delta * 900;

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

const FEEDBACK_GESTURES = new Set([
    "Closed_Fist",
    "Pointing_Up",
    "Victory",
    "Thumb_Up",
    "Thumb_Down",
    "Open_Palm",
    "SHAKA"
]);

function loop() {
    if (!isRunning || !cameraEnabled) return;

    const now = performance.now();

    const gestureResult =
        gestureRecognizer.recognizeForVideo(video, now);

    const topGesture =
        gestureResult.gestures?.[0]?.[0] || null;

    const result = handLandmarker.detectForVideo(video, now);

    const isTwoFingers = result.landmarks?.length > 0 && isTwoFingersUp(result.landmarks[0]);

    if (topGesture && topGesture.score > 0.6 && FEEDBACK_GESTURES.has(topGesture.categoryName) && !isTwoFingers) {
        dispatchGestureFeedback(topGesture.categoryName);
    }

    if (topGesture?.categoryName === "Pointing_Up" && topGesture.score > 0.7) {
        setCursorModeActive(true);
    }

    if (topGesture?.categoryName === "Closed_Fist" && topGesture.score > 0.7) {
        setCursorModeActive(false);
    }

    if (cursorModeActive && result.landmarks?.length) {
        processCursorMode(result.landmarks[0]);
        requestAnimationFrame(loop);
        return;
    }

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) cursor.style.display = "none";

    if (topGesture?.categoryName === "Open_Palm" && topGesture.score > 0.6) {
        handleOpenPalmFullscreen(now);
        requestAnimationFrame(loop);
        return;
    } else {
        resetOpenPalm();
    }

    const ALLOWED_GESTURES = new Set([
        "Closed_Fist",
        "Pointing_Up",
        "Victory",
        "Thumb_Up",
        "Thumb_Down"
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
        resetILYNav();
        resetFourFingerSeek();
        requestAnimationFrame(loop);
        return;
    }

    const lm = result.landmarks[0];

    handlePinchRestart(lm, now);

    if (isShaka(lm)) {
        handleGestureHold("SHAKA", now);
        dispatchGestureFeedback("SHAKA");
    } else {
        resetGestureHold();
    }

    if (isFourFinger(lm)) {
        const handedness =
            result.handednesses?.[0]?.[0]?.categoryName;

        if (handedness === "Right") {
            handleFourFingerSeek("FORWARD", now);
            dispatchGestureFeedback("FOUR_FINGER_RIGHT");
        } else if (handedness === "Left") {
            handleFourFingerSeek("BACKWARD", now);
            dispatchGestureFeedback("FOUR_FINGER_LEFT");
        }

        requestAnimationFrame(loop);
        return;
    }

    if (isILoveYou(lm)) {
        const handedness =
            result.handednesses?.[0]?.[0]?.categoryName;

        if (handedness === "Right") {
            handleILYNavigationOnce("NEXT", now);
            dispatchGestureFeedback("ILY_RIGHT_NEXT");
        } else if (handedness === "Left") {
            handleILYNavigationOnce("BACK", now);
            dispatchGestureFeedback("ILY_LEFT_BACK");
        }

        requestAnimationFrame(loop);
        return;
    }

    resetILYNav();
    resetFourFingerSeek();
    requestAnimationFrame(loop);
}

const storedCameraEnabled = localStorage.getItem('cameraEnabled') !== 'false';
if (storedCameraEnabled) {
    await initGestureEngine();
} else {
    cameraEnabled = false;
    isRunning = false;
}

