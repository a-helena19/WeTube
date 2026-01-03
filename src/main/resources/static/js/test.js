import {
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
        const result = handLandmarker.detectForVideo(video, performance.now());

        if (result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            const fingers = getFingerStates(lm);
            const gesture = detectGesture(lm, fingers);

            if (gesture && isStable(gesture)) {
                gestureDiv.textContent = `🎯 ${gesture}`;
            }
        } else {
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
   GESTURE DETECTION
======================= */
function detectGesture(lm, f) {

    if (isOpenHand(f)) return "Open Hand";
    if (isFist(f)) return "Fist";
    if (isVictory(f)) return "Victory";
    if (isThumbUp(lm, f)) return "Thumb Up";
    if (isThumbDown(lm, f)) return "Thumb Down";

    const dir = twoFingerDirection(f, lm);
    if (dir === "LEFT") return "Two Fingers Left";
    if (dir === "RIGHT") return "Two Fingers Right";

    if (isPinch(lm)) {
        return lm[4].x < 0.5 ? "Pinch Left" : "Pinch Right";
    }

    if (f.index && !f.middle && !f.ring && !f.pinky) {
        return "Point (Index Finger)";
    }

    return null;
}

/* =======================
   HELPERS
======================= */
function isOpenHand(f) {
    return f.thumb && f.index && f.middle && f.ring && f.pinky;
}

function isFist(f) {
    return !f.thumb && !f.index && !f.middle && !f.ring && !f.pinky;
}

function isVictory(f) {
    return !f.thumb && f.index && f.middle && !f.ring && !f.pinky;
}

function isThumbUp(lm, f) {
    return f.thumb && !f.index && !f.middle &&
        lm[4].y < lm[0].y;
}

function isThumbDown(lm, f) {
    return f.thumb && !f.index && !f.middle &&
        lm[4].y > lm[0].y;
}

function twoFingerDirection(f, lm) {
    if (f.index && f.middle && !f.ring && !f.pinky) {
        return lm[8].x > lm[12].x ? "LEFT" : "RIGHT";
    }
    return null;
}

function isPinch(lm) {
    const d = Math.hypot(
        lm[4].x - lm[8].x,
        lm[4].y - lm[8].y
    );
    return d < 0.04;
}

/* =======================
   STABILITY HELPERS
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
