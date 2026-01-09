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

async function initGestureEngineHome() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    console.log("[GestureEngineHome] Camera started");

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

    console.log("[GestureEngineHome] Models ready");
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

function loop() {
    const now = performance.now();

    // ===============================
    // 1️⃣ GestureRecognizer
    // ===============================

    const gestureResult =
        gestureRecognizer.recognizeForVideo(video, now);

    const topGesture =
        gestureResult.gestures?.[0]?.[0] || null;

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

    const result =
        handLandmarker.detectForVideo(video, now);

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