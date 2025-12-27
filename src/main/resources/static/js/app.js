const API = "/api/videos"; // change if needed

const player = document.getElementById("player");
const grid = document.getElementById("grid");

const titleEl = document.getElementById("title");
const channelEl = document.getElementById("channel");
const viewsEl = document.getElementById("views");
const publishedEl = document.getElementById("published");

function fmtViews(v){
    if (v >= 1e6) return (v/1e6).toFixed(1)+"M views";
    if (v >= 1e3) return Math.round(v/1e3)+"K views";
    return v+" views";
}

function setVideo(v){
    if (!v) return;
    player.src = v.videoUrl;
    titleEl.textContent = v.title;
    channelEl.textContent = v.channelName;
    viewsEl.textContent = fmtViews(v.views || 0);
    publishedEl.textContent = v.published || "";
}

function renderGrid(videos){
    grid.innerHTML = "";
    videos.forEach(v => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
      <img src="${v.thumbnailUrl}" style="width:100%;aspect-ratio:16/9;object-fit:cover">
      <div style="padding:8px">
        <div style="font-weight:700;font-size:14px">${v.title}</div>
        <div style="font-size:12px;color:#6b7280">${v.channelName}</div>
      </div>
    `;
        card.onclick = () => setVideo(v);
        grid.appendChild(card);
    });
}

fetch(API)
    .then(r => r.json())
    .then(videos => {
        if (!videos.length) return;
        setVideo(videos[0]);
        renderGrid(videos.slice(1));
    })
    .catch(console.error);
