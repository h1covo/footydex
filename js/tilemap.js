/* 交互式瓦片地图（国内高德 / 国外 Bing，免 key）：拖拽平移 / 滚轮（点击后）与按钮缩放 */
"use strict";
const TMAP_TS = 256, TMAP_MINZ = 4, TMAP_MAXZ = 18;
function tmapQuadkey(x, y, z){
  let q = "";
  for(let i = z; i > 0; i--){
    let d = 0; const m = 1 << (i - 1);
    if(x & m) d += 1;
    if(y & m) d += 2;
    q += d;
  }
  return q;
}
/* 高德瓦片仅覆盖国内，国外用 Bing（两者同为 Web Mercator 瓦片） */
function tmapTileURL(provider, x, y, z){
  if(provider === "bing"){
    const s = (((x + y) % 4) + 4) % 4;
    return "https://ecn.t" + s + ".tiles.virtualearth.net/tiles/r" + tmapQuadkey(x, y, z) + ".jpeg?g=1";
  }
  const s = (((x + y) % 4) + 4) % 4 + 1;
  return "https://webrd0" + s + ".is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=" + x + "&y=" + y + "&z=" + z;
}
function tmapLonToX(lon, z){ return (lon + 180) / 360 * Math.pow(2, z); }
function tmapLatToY(lat, z){ const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z); }
function tmapXToLon(x, z){ return x / Math.pow(2, z) * 360 - 180; }
function tmapYToLat(y, z){ const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }
function tmapTouchDist(e){ const a = e.touches[0], b = e.touches[1]; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
function tmapInit(el){
  if(el.dataset.tmapBound) return;
  el.dataset.tmapBound = "1";
  const pin = { lat: parseFloat(el.dataset.lat), lon: parseFloat(el.dataset.lon) };
  const provider = el.dataset.provider || "amap";
  const center = { lat: pin.lat, lon: pin.lon };
  let zoom = Math.max(TMAP_MINZ, Math.min(TMAP_MAXZ, parseInt(el.dataset.zoom, 10) || 16));
  const layer = el.querySelector(".tmap-layer");
  const tiles = el.querySelector(".tmap-tiles");
  const pinEl = el.querySelector(".tmap-pin");
  let dx = 0, dy = 0, dragging = false, lastX = 0, lastY = 0, wheelArmed = false;
  function render(){
    const W = el.clientWidth, H = el.clientHeight;
    const cx = tmapLonToX(center.lon, zoom) * TMAP_TS, cy = tmapLatToY(center.lat, zoom) * TMAP_TS;
    const px = cx - W / 2, py = cy - H / 2;
    const x0 = Math.floor(px / TMAP_TS), y0 = Math.floor(py / TMAP_TS);
    const x1 = Math.floor((px + W) / TMAP_TS), y1 = Math.floor((py + H) / TMAP_TS);
    const n = Math.pow(2, zoom);
    const out = [];
    for(let ty = y0; ty <= y1; ty++){
      if(ty < 0 || ty >= n) continue;
      for(let tx = x0; tx <= x1; tx++){
        const wx = ((tx % n) + n) % n;
        const url = tmapTileURL(provider, wx, ty, zoom);
        out.push('<img class="tmap-tile" src="' + url + '" style="left:' + (tx * TMAP_TS - px) + 'px;top:' + (ty * TMAP_TS - py) + 'px" alt="" draggable="false">');
      }
    }
    tiles.innerHTML = out.join("");
    pinEl.style.left = (tmapLonToX(pin.lon, zoom) * TMAP_TS - px) + "px";
    pinEl.style.top = (tmapLatToY(pin.lat, zoom) * TMAP_TS - py) + "px";
    layer.style.transform = "translate(0,0)";
  }
  function moveBy(mx, my){
    const cx = tmapLonToX(center.lon, zoom) * TMAP_TS + mx;
    const cy = tmapLatToY(center.lat, zoom) * TMAP_TS + my;
    center.lon = tmapXToLon(cx / TMAP_TS, zoom);
    center.lat = tmapYToLat(cy / TMAP_TS, zoom);
    render();
  }
  function setZoom(z){
    z = Math.max(TMAP_MINZ, Math.min(TMAP_MAXZ, z));
    if(z === zoom) return;
    zoom = z;
    render();
  }
  function endDrag(){
    if(!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    const mx = dx, my = dy;
    dx = 0; dy = 0;
    if(mx || my) moveBy(-mx, -my);
  }
  el.addEventListener("mousedown", e => {
    if(e.button) return;
    wheelArmed = true;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    el.classList.add("dragging");
    e.preventDefault();
  });
  window.addEventListener("mousemove", e => {
    if(!dragging) return;
    dx += e.clientX - lastX; dy += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    layer.style.transform = "translate(" + dx + "px," + dy + "px)";
  });
  window.addEventListener("mouseup", endDrag);
  let tLast = null, tDist = 0;
  el.addEventListener("touchstart", e => {
    wheelArmed = true;
    if(e.touches.length === 1) tLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    else if(e.touches.length === 2) tDist = tmapTouchDist(e);
  }, { passive: true });
  el.addEventListener("touchmove", e => {
    if(e.touches.length === 1 && tLast){
      dx += e.touches[0].clientX - tLast.x; dy += e.touches[0].clientY - tLast.y;
      tLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      layer.style.transform = "translate(" + dx + "px," + dy + "px)";
      e.preventDefault();
    } else if(e.touches.length === 2){
      const d = tmapTouchDist(e);
      if(tDist && Math.abs(d - tDist) > 40){ setZoom(zoom + (d > tDist ? 1 : -1)); tDist = d; }
      e.preventDefault();
    }
  }, { passive: false });
  el.addEventListener("touchend", () => { tLast = null; tDist = 0; endDrag(); });
  el.addEventListener("wheel", e => {
    if(!wheelArmed) return;
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? 1 : -1));
  }, { passive: false });
  el.querySelectorAll(".tmap-zoom").forEach(b => {
    b.addEventListener("click", e => { e.stopPropagation(); setZoom(zoom + parseInt(b.dataset.d, 10)); });
  });
  el.tmapRender = render;
  render();
}
function initTileMaps(scope){
  (scope || document).querySelectorAll(".tmap").forEach(tmapInit);
}
addEventListener("resize", () => {
  document.querySelectorAll(".tmap").forEach(el => { if(el.tmapRender) el.tmapRender(); });
});
