import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const { HandLandmarker, FilesetResolver } = vision;

class CursorModeController {
    constructor() {
        this.isActive = false;
        this.rafId = null;
        this.callbacks.onDrag = null;
        this.callbacks.onDragEnd = null;
        this.isDragging = false;

        this.cursor = { x: innerWidth / 2, y: innerHeight / 2 };
        this.isPinching = false;
        this.fistStart = null;

        this.callbacks = {
            onCursorMove: null,
            onCursorClick: null,
            onDrag: null,
            onDragEnd: null,
            onModeExit: null
        };

        this.SMOOTHING = 0.3;
        this.PINCH_ON = 0.045;
        this.PINCH_OFF = 0.07;
        this.FIST_DISTANCE = 0.11;
        this.FIST_HOLD_MS = 500;
    }

    async initialize(video) {
        const resolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        this.handLandmarker = await HandLandmarker.createFromOptions(resolver, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });

        this.video = video;
    }

    async start() {
        if (this.isActive) return;
        this.isActive = true;
        this.loop();
    }

    stop() {
        this.isActive = false;

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }


    loop() {
        if (!this.isActive) return;

        const now = performance.now();
        const results = this.handLandmarker.detectForVideo(this.video, now);

        if (results.landmarks?.length) {
            const lm = results.landmarks[0];
            this.updateCursor(lm);
            this.detectPinch(lm);
            this.detectExit(lm);
        }

        this.rafId = requestAnimationFrame(() => this.loop());
    }


    updateCursor(lm) {
        const index = lm[8];

        const tx = (1 - index.x) * innerWidth;
        const ty = index.y * innerHeight;

        this.cursor.x += (tx - this.cursor.x) * this.SMOOTHING;
        this.cursor.y += (ty - this.cursor.y) * this.SMOOTHING;

        this.callbacks.onCursorMove?.(this.cursor.x, this.cursor.y);
    }

    detectPinch(lm) {
        const d = this.dist(lm[4], lm[8]); // thumb ↔ index

        if (!this.isPinching && d < this.PINCH_ON) {
            this.isPinching = true;
            this.isDragging = true;
            this.callbacks.onCursorClick?.(this.cursor.x, this.cursor.y);
        }

        if (this.isPinching && this.isDragging) {
            this.callbacks.onDrag?.(this.cursor.x, this.cursor.y);
        }

        if (this.isPinching && d > this.PINCH_OFF) {
            this.isPinching = false;
            this.isDragging = false;
            this.callbacks.onDragEnd?.(this.cursor.x, this.cursor.y);
        }
    }


    detectExit(lm) {
        const wrist = lm[0];
        const index = lm[8];
        const middle = lm[12];

        const fist =
            this.dist(wrist, index) < this.FIST_DISTANCE &&
            this.dist(wrist, middle) < this.FIST_DISTANCE;

        if (fist) {
            if (!this.fistStart) this.fistStart = performance.now();
            else if (performance.now() - this.fistStart > this.FIST_HOLD_MS) {
                this.callbacks.onModeExit?.();
                this.fistStart = null;
            }
        } else {
            this.fistStart = null;
        }
    }

    dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    on(event, cb) {
        this.callbacks[event] = cb;
    }
}

window.CursorModeController = CursorModeController;