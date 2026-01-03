import {
    GestureRecognizer,
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

const video = document.getElementById("video");
const gestureDiv = document.getElementById("gesture");

/* =======================
   STABILITY
======================= */
let lastGesture = null;
let stableFrames = 0;

/* =======================
   INIT
======================= */
async function init() {

    const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );

    /* ---------- Gesture Recognizer ---------- */
    const gestureRecognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
        },
        runningMode: "VIDEO"
    });

    /* ---------- Hand Landmarker ---------- */
    const handLandmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
        },
        runningMode: "VIDEO",
        numHands: 1
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    gestureDiv.textContent = "🖐️ Hand zeigen";

    function loop() {
        const now = performance.now();
        let detectedGesture = null;

        /* ---------- 1️⃣ Gesture Recognizer ---------- */
        const gResult = gestureRecognizer.recognizeForVideo(video, now);

        if (gResult.gestures?.length) {
            const g = gResult.gestures[0][0];
            const name = g.categoryName;

            // ❗ WICHTIG: None / Unknown ignorieren
            if (name !== "None" && name !== "Unknown") {
                detectedGesture = `🤖 ${name}`;
            }
        }

        /* ---------- 2️⃣ Hand Landmarker (IMMER!) ---------- */
        const hResult = handLandmarker.detectForVideo(video, now);

        if (hResult.landmarks.length > 0) {
            const lm = hResult.landmarks[0];
            const fingers = getFingerStates(lm);
            const customGesture = detectCustomGesture(lm, fingers);

            // Custom-Gesten überschreiben GR nur, wenn sie existieren
            if (customGesture) {
                detectedGesture = `🧠 ${customGesture}`;
            }
        }

        /* ---------- 3️⃣ Anzeige ---------- */
        if (detectedGesture && isStable(detectedGesture)) {
            gestureDiv.textContent = detectedGesture;
        }

        if (!hResult.landmarks.length && !gResult.gestures?.length) {
            gestureDiv.textContent = "❌ Keine Hand";
            resetStability();
        }

        requestAnimationFrame(loop);
    }

    loop();
}

init();

/* =======================
   FINGER STATES
======================= */
function fingerUp(lm, tip, pip) {
    return lm[tip].y < lm[pip].y;
}

function getFingerStates(lm) {
    return {
        thumb:  fingerUp(lm, 4, 3),
        index:  fingerUp(lm, 8, 6),
        middle: fingerUp(lm, 12,10),
        ring:   fingerUp(lm, 16,14),
        pinky:  fingerUp(lm, 20,18),
    };
}

/* =======================
   CUSTOM GESTURES
======================= */
function detectCustomGesture(lm, f) {

    // 👉 Two Finger Direction
    if (f.index && f.middle && !f.ring && !f.pinky) {
        return lm[8].x > lm[12].x
            ? "Two Fingers Left"
            : "Two Fingers Right";
    }

    // 🤏 Pinch Left / Right
    if (isPinch(lm)) {
        return lm[4].x < 0.5 ? "Pinch Left" : "Pinch Right";
    }

    // ☝ Index Finger
    if (f.index && !f.middle && !f.ring && !f.pinky) {
        return "Point (Index)";
    }

    return null;
}

/* =======================
   HELPERS
======================= */
function isPinch(lm) {
    const d = Math.hypot(
        lm[4].x - lm[8].x,
        lm[4].y - lm[8].y
    );
    return d < 0.04;
}

/* =======================
   STABILITY
======================= */
function isStable(gesture) {
    if (gesture === lastGesture) {
        stableFrames++;
    } else {
        lastGesture = gesture;
        stableFrames = 0;
    }
    return stableFrames > 5;
}

function resetStability() {
    lastGesture = null;
    stableFrames = 0;
}
