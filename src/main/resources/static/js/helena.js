import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";

const video = document.getElementById("video");
const gestureDiv = document.getElementById("gesture");

/* =======================
   STATE
======================= */
let stableFramesActivation = 0;
let stableFramesAction = 0;
let lastActivationGesture = null;
let lastActionGesture = null;

let activated = false;
let activationTimeout = null;

/* =======================
   INIT
======================= */
async function init() {
    const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );
    gestureDiv.textContent = "⏳ Warte auf Aktivierung (✋ Vier Finger)";

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

    gestureDiv.textContent = "⏳ Warte auf Aktivierung (✋ Vier Finger)";

    function loop() {
        const now = performance.now();
        const result = handLandmarker.detectForVideo(video, now);

        if (!result.landmarks.length) {
            requestAnimationFrame(loop);
            return;
        }

        const lm = result.landmarks[0];
        const fingers = getFingerStates(lm);

        /* =======================
           STATE: IDLE
        ======================= */
        if (!activated) {
            if (isFourFingers(fingers)) {
                if (isStableActivation("FOUR_FINGERS")) {
                    activate();
                }
            } else {
                // Reset, wenn Geste weg ist
                stableFramesActivation = 0;
                lastActivationGesture = null;
            }

            requestAnimationFrame(loop);
            return;
        }

        /* =======================
           STATE: ACTIVATED
        ======================= */
        const action = detectActionGesture(lm, fingers);

        if (action && isStableAction(action.label)) {
            gestureDiv.textContent = `➡️ ${action.label} → ${action.action}`;
            deactivate();
            requestAnimationFrame(loop);
            return;
        }

        // ❗ WICHTIG: HIER PASSIERT NICHTS
        // Kein Text-Reset, kein Fallback

        requestAnimationFrame(loop);
    }

    loop();
}

init();

/* =======================
   ACTIVATION
======================= */
function activate() {
    activated = true;
    stableFramesAction = 0;
    lastActionGesture = null;
    gestureDiv.textContent = "✋ Vier Finger erkannt – Geste ausführen";
    activationTimeout = setTimeout(deactivate, 3000);
}

function deactivate() {
    activated = false;
    clearTimeout(activationTimeout);
    stableFramesActivation = 0;
    lastActivationGesture = null;
    gestureDiv.textContent = "⏳ Warte auf Aktivierung (✋ Vier Finger)";
}

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

function isFourFingers(f) {
    return (
        !f.thumb &&
        f.index &&
        f.middle &&
        f.ring &&
        f.pinky
    );
}

/* =======================
   ACTION GESTURES
======================= */
function detectActionGesture(lm, f) {

    if (isPinch(lm)) {
        return {
            label: "Pinch",
            action: lm[4].x < 0.5 ? "Seek -10s" : "Seek +10s"
        };
    }

    if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
        return { label: "Thumb Up", action: "Volume Up" };
    }

    if (!f.thumb && f.index && f.middle && f.ring && f.pinky) {
        return { label: "Thumb Down", action: "Volume Down" };
    }

    if (f.index && !f.middle && !f.ring && !f.pinky) {
        return { label: "Point", action: "Cursor Mode" };
    }

    if (!f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
        return { label: "Fist", action: "Cancel / Exit" };
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
    return d < 0.06;
}

function isStableActivation(gesture) {
    if (gesture === lastActivationGesture) {
        stableFramesActivation++;
    } else {
        lastActivationGesture = gesture;
        stableFramesActivation = 0;
    }
    return stableFramesActivation > 5;
}

function isStableAction(gesture) {
    if (gesture === lastActionGesture) {
        stableFramesAction++;
    } else {
        lastActionGesture = gesture;
        stableFramesAction = 0;
    }
    return stableFramesAction > 5;
}
