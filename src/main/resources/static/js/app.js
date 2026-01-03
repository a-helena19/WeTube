document.addEventListener("DOMContentLoaded", function() {
    console.log("🎬 APP.JS LOADED AND DOM READY!");

    let videos;
    const API = "/api/videos";

    const player = document.getElementById("player");
    const grid = document.getElementById("grid");
    const titleEl = document.getElementById("title");
    const channelEl = document.getElementById("channel");
    const viewsEl = document.getElementById("views");
    const publishedEl = document.getElementById("published");

    console.log("Player element:", player);
    console.log("Grid element:", grid);

    const fallbackVideos = [
        {
            id: 1,
            title: "Big Buck Bunny",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            thumbnailUrl: "https://peach.blender.org/wp-content/uploads/bbb-splash.png",
            creatorName: "Blender Foundation",
            viewCount: 15000000,
            createdAt: "2024-01-15T10:30:00"
        },
        {
            id: 2,
            title: "Elephant Dream",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg",
            creatorName: "Orange Open Movie",
            viewCount: 8900000,
            createdAt: "2024-02-20T14:45:00"
        }
    ];


    // Check for Thymeleaf data first
    if (window.videoData !== undefined) {
        console.log("Found Thymeleaf data:", window.videoData);
        videos = window.videoData;

        // FIX: If Thymeleaf data is empty array, use fallback
        if (!videos || videos.length === 0) {
            console.log("Thymeleaf data is empty, using fallback videos");
            videos = fallbackVideos;
        }

        initializePlayer();
    } else {
        console.log("No Thymeleaf data, checking for inline script...");
        const videoDataElement = document.getElementById('videoData');
        if (videoDataElement && videoDataElement.textContent) {
            try {
                videos = JSON.parse(videoDataElement.textContent);
                console.log("Parsed inline video data:", videos.length, "videos");

                // FIX: If parsed data is empty, use fallback
                if (!videos || videos.length === 0) {
                    console.log("Parsed data is empty, using fallback videos");
                    videos = fallbackVideos;
                }

                initializePlayer();
            } catch(e) {
                console.error("Could not parse video data", e);
                fetchAPI();
            }
        } else {
            console.log("No inline data, fetching from API");
            fetchAPI();
        }
    }

    function initializePlayer() {
        console.log("initializePlayer called with", videos.length, "videos");
        if (!videos.length) {
            console.error("No videos to initialize!");
            return;
        }
        console.log("Setting first video:", videos[0].title);
        setVideo(videos[0]);
        renderGrid(videos.slice(1));
    }

    function fetchAPI() {
        console.log("Fetching from API:", API);
        fetch(API)
            .then(r => {
                console.log("API response status:", r.status);
                return r.json();
            })
            .then(data => {
                console.log("API returned:", data);
                videos = data;
                if (!videos.length) {
                    console.log("Database empty, using fallback videos");
                    videos = fallbackVideos;
                }
                initializePlayer();
            })
            .catch(err => {
                console.error("API fetch failed:", err);
                console.log("Using fallback videos");
                videos = fallbackVideos;
                initializePlayer();
            });
    }

    function fmtViews(v){
        if (v >= 1e6) return (v/1e6).toFixed(1)+"M views";
        if (v >= 1e3) return Math.round(v/1e3)+"K views";
        return v+" views";
    }

    function setVideo(v){
        if (!v) {
            console.error("setVideo called with null video!");
            return;
        }
        console.log("Setting video:", v.title);
        console.log("Video URL:", v.videoUrl || v.cloudinaryUrl);

        player.src = v.videoUrl || v.cloudinaryUrl;
        titleEl.textContent = v.title;
        channelEl.textContent = v.creatorName || v.channelName;
        viewsEl.textContent = fmtViews(v.viewCount || v.views || 0);
        publishedEl.textContent = formatDate(v.createdAt) || "";

        // Try to play the video
        player.load();
    }

    function renderGrid(videos){
        console.log("Rendering grid with", videos.length, "videos");
        grid.innerHTML = "";
        videos.forEach(v => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${v.thumbnailUrl}" alt="${v.title}">
                <div>
                    <div class="cardTitle">${v.title}</div>
                    <div class="cardSub">${v.creatorName || v.channelName}</div>
                </div>
            `;
            card.onclick = () => {
                console.log("Card clicked:", v.title);
                setVideo(v);
            };
            grid.appendChild(card);
        });
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }
});