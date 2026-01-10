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

const GESTURE_HOLD_TIME = {
    Open_Palm: 500,
    Closed_Fist: 500,
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

let threeFingerStartX = null;
let lastSeekEmitTime = 0;

async function initGestureEngine() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    console.log("[GestureEngine] Camera started");

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

    console.log("[GestureEngine] Models ready");
    requestAnimationFrame(loop);
}

// ===============================
// HELPERS
// ===============================
function isThreeFinger(lm) {
    const indexUp  = lm[8].y  < lm[6].y;
    const middleUp = lm[12].y < lm[10].y;
    const ringUp   = lm[16].y < lm[14].y;

    const thumbDown = lm[4].y > lm[3].y;
    const pinkyDown = lm[20].y > lm[18].y;

    return indexUp && middleUp && ringUp && thumbDown && pinkyDown;
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

function dispatchGestureFeedback(name) {
    document.dispatchEvent(
        new CustomEvent("gestureDetected", {
            detail: { gestureName: name }
        })
    );
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

// ===============================
// FRAME LOOP
// ===============================

function loop() {
    const now = performance.now();

    const gestureResult =
        gestureRecognizer.recognizeForVideo(video, now);

    const topGesture =
        gestureResult.gestures?.[0]?.[0] || null;

    const ALLOWED_GESTURES = new Set([
        "Open_Palm",
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

    const result =
        handLandmarker.detectForVideo(video, now);

    if (!result.landmarks || result.landmarks.length === 0) {
        resetGestureHold();
        requestAnimationFrame(loop);
        return;
    }

    const lm = result.landmarks[0];

    if (isShaka(lm)) {
        handleGestureHold("SHAKA", now);
    } else {
        resetGestureHold();
    }

    if (isThreeFinger(lm)) {
        const x = lm[0].x; // Handgelenk als Referenz

        if (threeFingerStartX === null) {
            threeFingerStartX = x;
        } else {
            const deltaX = x - threeFingerStartX;
            const DEADZONE = 0.03;
            const COOLDOWN = 250;

            if (Math.abs(deltaX) > DEADZONE && now - lastSeekEmitTime > COOLDOWN) {
                emitGesture(deltaX > 0 ? "SEEK_FORWARD" : "SEEK_BACKWARD");
                lastSeekEmitTime = now;
                threeFingerStartX = x;
            }
        }

        requestAnimationFrame(loop);
        return;
    }

    threeFingerStartX = null;
    requestAnimationFrame(loop);
}

await initGestureEngine();