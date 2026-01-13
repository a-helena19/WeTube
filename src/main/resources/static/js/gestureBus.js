window.emitGesture = function (gestureName) {
    window.dispatchEvent(
        new CustomEvent("gesture", {
            detail: {
                name: gestureName,
                timestamp: Date.now()
            }
        })
    );

    if (gestureName === "Pointing_Up") {
        setCursorModeActive(true);
    }

    if (gestureName === "Closed_Fist") {
        setCursorModeActive(false);
    }
};
