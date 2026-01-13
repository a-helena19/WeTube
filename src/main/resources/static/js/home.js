document.addEventListener("DOMContentLoaded", () => {
    const activateCursorModeBtn = document.getElementById("activate-cursor-mode");
    const endCursorModeBtn = document.getElementById("end-cursor-mode");

    const gestureControls = document.getElementById("gesture-controls");
    const cursorControls = document.getElementById("cursor-controls");
    const modeBadge = document.getElementById("mode-badge");
    const sidebar = document.getElementById("sidebar");
    const cameraLockBadge = document.getElementById("camera-lock");
    const gestureBadge = document.getElementById("gesture-badge");
    const content = document.querySelector(".content");

    let cameraEnabled = localStorage.getItem('cameraEnabled') !== 'false';

    function updateCameraLockUI() {

        localStorage.setItem('cameraEnabled', cameraEnabled);

        if (cameraLockBadge) {
            if (cameraEnabled) {
                cameraLockBadge.innerHTML = '<span>🔓 Disable Camera & Gestures</span>';
                cameraLockBadge.style.background = 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
                cameraLockBadge.style.borderColor = '#93C5FD';
                cameraLockBadge.style.color = '#1D4ED8';
            } else {
                cameraLockBadge.innerHTML = '<span>🔒 Enable Camera & Gestures</span>';
                cameraLockBadge.style.background = 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)';
                cameraLockBadge.style.borderColor = '#FECACA';
                cameraLockBadge.style.color = '#DC2626';
            }
        }

        if (sidebar) {
            sidebar.style.display = cameraEnabled ? 'block' : 'none';
        }
        if (modeBadge) {
            modeBadge.style.display = cameraEnabled ? 'flex' : 'none';
        }
        if (gestureBadge) {
            gestureBadge.style.display = cameraEnabled ? 'none' : 'none';
        }

        if (content) {
            if (cameraEnabled) {
                content.classList.remove('camera-disabled');
            } else {
                content.classList.add('camera-disabled');
            }
        }
    }

    if (cameraLockBadge) {
        cameraLockBadge.style.cursor = 'pointer';
        cameraLockBadge.addEventListener('click', () => {
            cameraEnabled = !cameraEnabled;
            updateCameraLockUI();

            window.dispatchEvent(new CustomEvent('cameraToggle', {
                detail: { enabled: cameraEnabled }
            }));
        });
    }

    updateCameraLockUI();

    window.dispatchEvent(new CustomEvent('cameraToggle', {
        detail: { enabled: cameraEnabled }
    }));

    const searchInput = document.querySelector(".search-input");
    const searchButton = document.querySelector(".search-button");

    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `/home?search=${encodeURIComponent(query)}`;
        } else {
            window.location.href = '/home';
        }
    }

    if (searchButton) {
        searchButton.addEventListener("click", performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                performSearch();
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            searchInput.value = searchQuery;
        }
    }

    function switchToPointingMode() {
        gestureControls.classList.add("hidden");
        cursorControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "pointing-badge";
            modeBadge.innerHTML = '<span>Cursor Mode</span>';
        }

        window.dispatchEvent(new CustomEvent('cursorModeChanged', {
            detail: { active: true }
        }));
    }

    function switchToGestureMode() {
        cursorControls.classList.add("hidden");
        gestureControls.classList.remove("hidden");

        if (modeBadge) {
            modeBadge.className = "gesture-badge";
            modeBadge.innerHTML = '<span>Gesture Mode</span>';
        }

        window.dispatchEvent(new CustomEvent('cursorModeChanged', {
            detail: { active: false }
        }));
    }

    window.addEventListener("cursorModeChanged", (e) => {
        const active = e.detail.active;

        if (active) {
            gestureControls.classList.add("hidden");
            cursorControls.classList.remove("hidden");
            if (modeBadge) {
                modeBadge.className = "pointing-badge";
                modeBadge.innerHTML = '<span>Cursor Mode</span>';
            }
        } else {
            cursorControls.classList.add("hidden");
            gestureControls.classList.remove("hidden");
            if (modeBadge) {
                modeBadge.className = "gesture-badge";
                modeBadge.innerHTML = '<span>Gesture Mode</span>';
            }
        }
    });

    activateCursorModeBtn.addEventListener("click", switchToPointingMode);
    endCursorModeBtn.addEventListener("click", switchToGestureMode);

    if (modeBadge) {
        modeBadge.addEventListener("click", () => {
            if (modeBadge.classList.contains("gesture-badge")) {
                switchToPointingMode();
            } else if (modeBadge.classList.contains("pointing-badge")) {
                switchToGestureMode();
            }
        });

        modeBadge.style.cursor = "pointer";

        modeBadge.addEventListener("mouseenter", () => {
            modeBadge.style.opacity = "0.8";
            modeBadge.style.transform = "scale(1.05)";
        });

        modeBadge.addEventListener("mouseleave", () => {
            modeBadge.style.opacity = "1";
            modeBadge.style.transform = "scale(1)";
        });
    }
});
