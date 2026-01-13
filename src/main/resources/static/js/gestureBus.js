window.emitGesture = function (gestureName) {
    window.dispatchEvent(
        new CustomEvent("gesture", {
            detail: {
                name: gestureName,
                timestamp: Date.now()
            }
        })
    );
};

