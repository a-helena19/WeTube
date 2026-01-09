import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

// ===============================
// CAMERA (hidden)
// ===============================

const video = document.createElement("video");
video.setAttribute("playsinline", "");

let handLandmarker = null;

async function initGestureEngine() {
    // 1️⃣ Kamera starten
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
    console.log("[GestureEngine] Camera started");

    // 2️⃣ MediaPipe Vision initialisieren
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );

    // 3️⃣ HandLandmarker laden (✅ FIXED MODEL PATH)
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    console.log("[GestureEngine] HandLandmarker ready");

    requestAnimationFrame(loop);
}

// ===============================
// FRAME LOOP
// ===============================

const HOLD_TIME = 750; // 1 Sekunde

let pointUpStart = null;
let fistStart = null;
let victoryStart = null;
let openPalmStart = null;

let pointUpTriggered = false;
let fistTriggered = false;
let victoryTriggered = false;
let openPalmTriggered = false;

function isFingerUp(landmarks, tip, pip) {
    return landmarks[tip].y < landmarks[pip].y;
}

function loop() {
    const now = performance.now();
    const result = handLandmarker.detectForVideo(video, now);

    if (!result.landmarks || result.landmarks.length === 0) {
        // Reset alles, wenn keine Hand
        pointUpStart = null;
        fistStart = null;
        pointUpTriggered = false;
        fistTriggered = false;
        requestAnimationFrame(loop);
        return;
    }

    const lm = result.landmarks[0];

    const indexUp = isFingerUp(lm, 8, 6);
    const middleUp = isFingerUp(lm, 12, 10);
    const ringUp = isFingerUp(lm, 16, 14);
    const pinkyUp = isFingerUp(lm, 20, 18);

    const pointUp = indexUp && !middleUp && !ringUp && !pinkyUp;
    const fist = !indexUp && !middleUp && !ringUp && !pinkyUp;
    const victory = indexUp && middleUp && !ringUp && !pinkyUp;
    const openPalm = indexUp && middleUp && ringUp && pinkyUp;

    /* ===========================
       POINT UP (1s Hold)
    ============================ */

    if (pointUp) {
        document.dispatchEvent(new CustomEvent('gestureDetected', {
            detail: { gestureName: 'point-up' }
        }));
        if (!pointUpStart) pointUpStart = now;

        if (!pointUpTriggered && now - pointUpStart >= HOLD_TIME) {
            console.log("[GestureEngine] 👆 POINT_UP CONFIRMED");
            emitGesture("POINT_UP");
            pointUpTriggered = true;
        }
    } else {
        pointUpStart = null;
        pointUpTriggered = false;
    }

    /* ===========================
       FIST (1s Hold)
    ============================ */

    if (fist) {
        document.dispatchEvent(new CustomEvent('gestureDetected', {
            detail: { gestureName: 'fist' }
        }));
        if (!fistStart) fistStart = now;

        if (!fistTriggered && now - fistStart >= HOLD_TIME) {
            console.log("[GestureEngine] ✊ FIST CONFIRMED");
            emitGesture("FIST");
            fistTriggered = true;
        }
    } else {
        fistStart = null;
        fistTriggered = false;
    }

    if (victory) {
        document.dispatchEvent(new CustomEvent('gestureDetected', {
            detail: { gestureName: 'peace' }
        }));

        if (!victoryStart) victoryStart = now;

        if (!victoryTriggered && now - victoryStart >= HOLD_TIME) {
            console.log("[GestureEngine] ✌️ VICTORY CONFIRMED");
            emitGesture("PLAY_PAUSE");
            victoryTriggered = true;
        }
    } else {
        victoryStart = null;
        victoryTriggered = false;
    }

    if (openPalm) {
        document.dispatchEvent(new CustomEvent('gestureDetected', {
            detail: { gestureName: 'open-palm' }
        }));

        if (!openPalmStart) openPalmStart = now;

        if (!openPalmTriggered && now - openPalmStart >= HOLD_TIME) {
            console.log("[GestureEngine] ✋ OPEN PALM CONFIRMED");
            emitGesture("FULLSCREEN");
            openPalmTriggered = true;
        }
    } else {
        openPalmStart = null;
        openPalmTriggered = false;
    }


    requestAnimationFrame(loop);
}

// 🚀 START (top-level await ist OK, da type="module")
await initGestureEngine();