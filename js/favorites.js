/* 收藏球队模块：localStorage ft-favs（球队 id 数组），首页置顶「我的球队」+ 星标开关 */
"use strict";
const FAV_KEY = "ft-favs";
let FAVS = null;
function favRead(){
  if(FAVS) return FAVS;
  try { FAVS = JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch(e){ FAVS = []; }
  if(!Array.isArray(FAVS)) FAVS = [];
  return FAVS;
}
function isFav(id){ return !!id && favRead().indexOf(id) >= 0; }
function favWrite(){ try { localStorage.setItem(FAV_KEY, JSON.stringify(FAVS)); } catch(e){} }
function toggleFav(id){
  if(!id) return false;
  favRead();
  const i = FAVS.indexOf(id);
  if(i >= 0) FAVS.splice(i, 1); else FAVS.unshift(id);
  favWrite();
  return i < 0;
}
function favTeams(){
  return favRead().map(id => (LIVE.allTeams || []).filter(t => t.id === id)[0]).filter(Boolean);
}
function bindFavStars(scope){
  (scope || document).querySelectorAll(".fav-star").forEach(btn => {
    if(btn.dataset.favBound) return;
    btn.dataset.favBound = "1";
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleFav(btn.dataset.fav);
      btn.classList.toggle("on", on);
      btn.textContent = on ? "★" : "☆";
      btn.title = L(on ? "取消收藏" : "收藏", on ? "Unfavorite" : "Favorite");
      renderFavSection();
      updateTeamFavBtn();
    });
  });
}
function renderFavSection(){
  const holder = document.getElementById("fav-section");
  if(!holder) return;
  const teams = favTeams();
  if(!teams.length){ holder.hidden = true; holder.innerHTML = ""; return; }
  holder.hidden = false;
  holder.innerHTML = '<div class="fav-block">' +
    '<h3 class="sub-title">' + L("我的球队", "My clubs") + '<span>' + L(teams.length + " 支", teams.length + " clubs") + '</span></h3>' +
    '<div class="fav-grid">' + teams.map(favCardHTML).join("") + '</div></div>';
  holder.querySelectorAll(".fav-card").forEach(card => {
    card.addEventListener("click", () => openTeam(card.dataset.id));
    card.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openTeam(card.dataset.id); } });
  });
  bindFavStars(holder);
}

/* ---------- 关注球员（localStorage ft-fav-players） ---------- */
const FAVP_KEY = "ft-fav-players";
let FAVPS = null;
function favpRead(){
  if(FAVPS) return FAVPS;
  try { FAVPS = JSON.parse(localStorage.getItem(FAVP_KEY) || "[]"); } catch(e){ FAVPS = []; }
  if(!Array.isArray(FAVPS)) FAVPS = [];
  return FAVPS;
}
function isFavPlayer(id){ return !!id && favpRead().indexOf(String(id)) >= 0; }
function toggleFavPlayer(id){
  if(!id) return false;
  favpRead();
  id = String(id);
  const i = FAVPS.indexOf(id);
  if(i >= 0) FAVPS.splice(i, 1); else FAVPS.unshift(id);
  try { localStorage.setItem(FAVP_KEY, JSON.stringify(FAVPS)); } catch(e){}
  return i < 0;
}
function favPlayers(){
  return favpRead().map(id => (typeof playerById === "function") ? playerById(id) : null).filter(Boolean);
}
function bindFavPlayerStars(scope){
  (scope || document).querySelectorAll(".favp-star").forEach(btn => {
    if(btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const on = toggleFavPlayer(btn.dataset.favp);
      btn.classList.toggle("on", on);
      btn.textContent = on ? L("★ 已关注", "★ Following") : L("☆ 关注", "☆ Follow");
      btn.title = L(on ? "取消关注" : "关注", on ? "Unfollow" : "Follow");
      renderFavPlayers();
    });
  });
}
function renderFavPlayers(){
  const holder = document.getElementById("fav-players");
  if(!holder) return;
  const list = favPlayers();
  if(!list.length){ holder.hidden = true; holder.innerHTML = ""; return; }
  holder.hidden = false;
  holder.innerHTML = '<div class="fav-block">' +
    '<h3 class="sub-title">' + L("关注的球员", "Followed players") + '<span>' + L(list.length + " 名", list.length + " players") + '</span></h3>' +
    '<div class="pl-list">' + list.map(p => {
      const t = p.team;
      return '<button class="pl-hit" data-player="' + esc(p.id) + '">' +
        (t ? '<span class="pl-crest">' + teamCrestHTML(t, 26) + '</span>' : '') +
        '<span class="pl-hit-name">' + esc(isEN() ? (p.en || p.name) : (p.name || p.en)) + (p.no ? ' <i class="num">' + esc(String(p.no)) + '</i>' : '') + '</span>' +
        '<span class="pl-hit-meta">' + esc([dPos(p.pos), (p.g ? L(p.g + " 球", p.g + " goals") : "")].filter(Boolean).join(" · ")) + '</span>' +
        (t ? '<span class="pl-hit-team">' + esc(dTeam(t)) + '</span>' : '') +
      '</button>';
    }).join("") + '</div></div>';
  holder.querySelectorAll(".pl-hit").forEach(btn => {
    btn.addEventListener("click", () => { location.hash = "player/" + btn.dataset.player; });
  });
}
function updatePlayerFavBtn(){
  const btn = document.getElementById("fav-player");
  if(!btn) return;
  const h = location.hash;
  const id = h.indexOf("#player/") === 0 ? decodeURIComponent(h.slice(8)) : "";
  const on = id && isFavPlayer(id);
  btn.hidden = !id;
  btn.dataset.favp = id || "";
  btn.classList.toggle("on", !!on);
  btn.textContent = on ? L("★ 已关注", "★ Following") : L("☆ 关注", "☆ Follow");
  btn.title = L(on ? "取消关注" : "关注", on ? "Unfollow" : "Follow");
}
function updateTeamFavBtn(){
  const btn = document.getElementById("fav-team");
  if(!btn) return;
  const h = location.hash;
  const id = h.indexOf("#team/") === 0 ? decodeURIComponent(h.slice(6)) : "";
  const on = id && isFav(id);
  btn.hidden = !id;
  btn.dataset.fav = id || "";
  btn.classList.toggle("on", !!on);
  btn.textContent = on ? "★" : "☆";
  btn.title = L(on ? "取消收藏" : "收藏", on ? "Unfavorite" : "Favorite");
  /* 绑定一次点击：球队页这个按钮用的是 .back/.fav-btn 类，不在 bindFavStars 的 .fav-star 选择器里，
     之前只更新外观、没人绑行为，所以点它没反应 */
  if(!btn.dataset.favBound){
    btn.dataset.favBound = "1";
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const tid = btn.dataset.fav;
      if(!tid) return;
      const nowOn = toggleFav(tid);
      btn.classList.toggle("on", nowOn);
      btn.textContent = nowOn ? "★" : "☆";
      btn.title = L(nowOn ? "取消收藏" : "收藏", nowOn ? "Unfavorite" : "Favorite");
      /* 同步首页卡片上的同一队星标（首页此时可能是隐藏的，不会被重绘） */
      document.querySelectorAll('.fav-star[data-fav="' + tid + '"]').forEach(b => {
        b.classList.toggle("on", nowOn);
        b.textContent = nowOn ? "★" : "☆";
      });
      renderFavSection();
    });
  }
}
