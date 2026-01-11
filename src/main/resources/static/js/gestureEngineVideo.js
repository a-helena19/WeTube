import {
    HandLandmarker,
    GestureRecognizer,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

// ===============================
// CAMERA (hidden)
// ===============================

const video = document.createElement("video");
video.setAttribute("playsinline", "");

let handLandmarker = null;
let gestureRecognizer = null;
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
const PINCH_HOLD_TIME = 500;

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
        interval: 150 // ms
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
let fourFingerActiveDirection = null; // "FORWARD" | "BACKWARD"

const ILY_NAV_HOLD_TIME = 500;

let ilyNavStartTime = null;
let ilyNavTriggered = false;
let ilyNavDirection = null; // "NEXT" | "BACK"

const OPEN_PALM_FULLSCREEN_HOLD = 500;

let openPalmStartTime = null;
let openPalmTriggered = false;

let pinchActive = false;


export function setCursorModeActive(active) {
    cursorModeActive = active;
    console.log("[GESTURE ENGINE] Cursor Mode:", active ? "ACTIVE" : "INACTIVE");

    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
        cursor.style.display = active ? "block" : "none";
    }

    window.dispatchEvent(new CustomEvent('cursorModeChanged', {
        detail: { active }
    }));
}

async function initGestureEngine() {
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

// ===============================
// HELPERS
// ===============================
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
    // direction: "FORWARD" | "BACKWARD"

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

    // erster Trigger
    if (!fourFingerLastRepeatTime) {
        emitGesture(direction === "FORWARD" ? "SEEK_FORWARD" : "SEEK_BACKWARD");
        fourFingerLastRepeatTime = now;
        return;
    }

    // repeats
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

function handlePinchRestart(lm) {
    if (isPinch(lm)) {
        if (!pinchActive) {
            emitGesture("RESTART_VIDEO");
            dispatchGestureFeedback("RESTART_VIDEO");
            pinchActive = true;
        }
    } else {
        pinchActive = false;
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

    dispatchGestureFeedback(gestureName);

    if (activeGesture !== gestureName) {
        activeGesture = gestureName;
        gestureStartTime = now;
        gestureTriggered = false;
        lastRepeatTime = null;
        return;
    }

    const heldTime = now - gestureStartTime;

    // Repeat-Geste (z.B. Lautstärke)
    if (repeatConfig) {
        if (heldTime >= holdTime) {
            if (!lastRepeatTime || now - lastRepeatTime >= repeatConfig.interval) {
                emitGesture(gestureName);
                lastRepeatTime = now;
            }
        }
        return;
    }

    // Einmal-Geste
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
    console.log("cursor:", x, y);
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
        console.log("Clicked:", clickable);
    }
}

let scrollVelocity = 0;

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
    }
}


// ===============================
// FRAME LOOP
// ===============================

function loop() {
    const now = performance.now();

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

    handlePinchRestart(lm);

    if (isShaka(lm)) {
        handleGestureHold("SHAKA", now);
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

await initGestureEngine();