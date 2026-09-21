/* 球场图墙模块：按主场聚合球队，离线渲染实拍图 + 坐标链接（无新增请求） */
"use strict";
const STAD = { lg:"", q:"" };
function stadiumList(){
  const photos = window.STADIUM_PHOTOS || {};
  const coords = window.VENUE_COORDS || {};
  const byVenue = {};
  (LIVE.allTeams || []).forEach(t => {
    const key = t.venueEn || t.venue || t.en;
    if(!key) return;
    let v = byVenue[key];
    if(!v){
      const c = coords[t.venueEn] || coords[t.venue] || null;
      v = byVenue[key] = {
        venueEn: t.venueEn || "", venue: t.venue || "", city: t.city, country: t.country,
        leagueId: t.leagueId, teams: [], lat: c ? c[0] : null, lon: c ? c[1] : null
      };
    }
    v.teams.push(t);
  });
  return Object.keys(byVenue).map(k => {
    const v = byVenue[k];
    const shots = photos[v.venueEn] || photos[v.venue] || [];
    v.photo = shots[0] || null;
    v.count = shots.length;
    return v;
  });
}
function stadiumFiltered(){
  const q = STAD.q.trim().toLowerCase();
  return stadiumList().filter(s => {
    if(STAD.lg && s.leagueId !== STAD.lg) return false;
    if(!q) return true;
    const hay = [s.venue, s.venueEn, s.city, s.country].concat(s.teams.map(t => (t.name || "") + " " + (t.en || ""))).join(" ").toLowerCase();
    return hay.indexOf(q) >= 0;
  }).sort((a, b) => (a.country || "").localeCompare(b.country || "", "zh") || (a.city || "").localeCompare(b.city || "", "zh") || (a.venueEn || "").localeCompare(b.venueEn || "", "en"));
}
function renderStadiumGrid(){
  const grid = document.getElementById("st-grid");
  if(!grid) return;
  const list = stadiumFiltered();
  const cnt = document.getElementById("st-count");
  if(cnt) cnt.textContent = L(list.length + " 座球场 · " + list.filter(s => s.photo).length + " 张实拍图", list.length + " grounds · " + list.filter(s => s.photo).length + " photos");
  grid.innerHTML = list.map(stadiumCardHTML).join("");
  const empty = document.getElementById("st-empty");
  if(empty){
    empty.hidden = list.length > 0;
    empty.innerHTML = list.length ? "" : emptyNoteHTML("没有匹配的球场，换个关键词试试。", "No grounds matched — try another keyword.");
  }
}
function renderStadiums(lgId){
  const wrap = document.getElementById("stadiums-content");
  if(!wrap) return;
  STAD.lg = LEAGUES.some(l => l.id === lgId) ? lgId : "";
  STAD.q = "";
  wrap.innerHTML = stadiumWallHTML(STAD.lg);
  const back = document.getElementById("stadiums-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll("#st-tabs button").forEach(b => {
    b.addEventListener("click", () => {
      STAD.lg = b.dataset.lg || "";
      wrap.querySelectorAll("#st-tabs button").forEach(x => x.classList.toggle("on", x === b));
      renderStadiumGrid();
    });
  });
  const inp = document.getElementById("st-search");
  if(inp) inp.addEventListener("input", () => { STAD.q = inp.value; renderStadiumGrid(); });
  renderStadiumGrid();
}
