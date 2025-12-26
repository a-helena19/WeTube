import {
    GestureRecognizer,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9";

const video = document.getElementById('video');
const gestureDisplay = document.getElementById('gesture');

async function initMediaPipe() {
    // Files laden
    const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
    );

    const gestureRecognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
        },
        runningMode: "VIDEO",
    });

    // Kamera starten
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    // Loop
    function detect() {
        const result = gestureRecognizer.recognizeForVideo(video, performance.now());

        if (result?.gestures?.length) {
            const gesture = result.gestures[0][0];
            gestureDisplay.textContent = `🎯 ${gesture.categoryName} (${(gesture.score * 100).toFixed(0)}%)`;
        } else {
            gestureDisplay.textContent = "Keine Geste erkannt";
        }

        requestAnimationFrame(detect);
    }

    detect();
}

window.addEventListener('load', initMediaPipe);
