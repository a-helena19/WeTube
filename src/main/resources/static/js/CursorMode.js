class CursorModeController {
    constructor() {
        this.isActive = false;

        this.cursor = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };

        this.isPinching = false;
        this.fistStartTime = null;

        this.callbacks = {
            onMove: null,
            onClick: null,
            onExit: null
        };

        // Tunables
        this.SMOOTHING = 0.3;
        this.PINCH_ON = 0.045;
        this.PINCH_OFF = 0.07;
        this.FIST_DISTANCE = 0.11;
        this.FIST_HOLD_MS = 500;
    }

    async init(video) {
        this.hands = new Hands({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.hands.onResults(r => this.onResults(r));

        this.camera = new Camera(video, {
            onFrame: async () => {
                if (this.isActive) await this.hands.send({ image: video });
            },
            width: 1280,
            height: 720
        });
    }

    async start() {
        this.isActive = true;
        await this.camera.start();
    }

    stop() {
        this.isActive = false;
        this.camera.stop();
    }

    on(event, cb) {
        this.callbacks[event] = cb;
    }

    onResults(results) {
        if (!results.multiHandLandmarks?.length) return;

        const lm = results.multiHandLandmarks[0];

        this.updateCursor(lm);
        this.detectPinch(lm);
        this.detectFist(lm);
    }

    // === CURSOR ===
    updateCursor(lm) {
        const index = lm[8];

        const tx = (1 - index.x) * window.innerWidth;
        const ty = index.y * window.innerHeight;

        this.cursor.x += (tx - this.cursor.x) * this.SMOOTHING;
        this.cursor.y += (ty - this.cursor.y) * this.SMOOTHING;

        this.callbacks.onMove?.(this.cursor.x, this.cursor.y);
    }

    // === CLICK ===
    detectPinch(lm) {
        const d = this.dist(lm[4], lm[8]); // thumb ↔ index

        if (!this.isPinching && d < this.PINCH_ON) {
            this.isPinching = true;
            this.callbacks.onClick?.(this.cursor.x, this.cursor.y);
        }

        if (this.isPinching && d > this.PINCH_OFF) {
            this.isPinching = false;
        }
    }

    // === EXIT ===
    detectFist(lm) {
        const wrist = lm[0];
        const index = lm[8];
        const middle = lm[12];

        const isFist =
            this.dist(wrist, index) < this.FIST_DISTANCE &&
            this.dist(wrist, middle) < this.FIST_DISTANCE;

        if (isFist) {
            if (!this.fistStartTime) {
                this.fistStartTime = performance.now();
            } else if (performance.now() - this.fistStartTime > this.FIST_HOLD_MS) {
                this.callbacks.onExit?.();
                this.fistStartTime = null;
            }
        } else {
            this.fistStartTime = null;
        }
    }

    dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    }
}
