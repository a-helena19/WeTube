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

let activeGesture = null;
let gestureStartTime = null;
let gestureTriggered = false;

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

function handleGestureHold(gestureName, now) {
    const holdTime = GESTURE_HOLD_TIME[gestureName] ?? 500;

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

function resetGestureHold() {
    activeGesture = null;
    gestureStartTime = null;
    gestureTriggered = false;
}

function dispatchGestureFeedback(name) {
    document.dispatchEvent(
        new CustomEvent("gestureDetected", {
            detail: { gestureName: name }
        })
    );
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

    requestAnimationFrame(loop);
}

await initGestureEngine();