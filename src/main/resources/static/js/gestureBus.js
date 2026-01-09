// ===============================
// Global Gesture Event Bus
// ===============================

window.emitGesture = function (gestureName) {
    console.log("[GestureBus] emit:", gestureName);

    window.dispatchEvent(
        new CustomEvent("gesture", {
            detail: {
                name: gestureName,
                timestamp: Date.now()
            }
        })
    );
};
