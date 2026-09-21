/* 球队对比模块：选两队，基础数据 + 赛季 33 项镜像对比（赛季数据 12h 缓存，与球队页共用） */
"use strict";
const CMP = { a:"", b:"" };
function cmpHash(){
  if(!CMP.a && !CMP.b) return "compare";
  return "compare/" + (CMP.a ? encodeURIComponent(CMP.a) : "-") + "/" + (CMP.b ? encodeURIComponent(CMP.b) : "-");
}
function parseCompareHash(h){
  const rest = (h || "").slice("#compare".length).replace(/^\//, "");
  const parts = rest.split("/");
  const pick = x => (x && x !== "-") ? decodeURIComponent(x) : "";
  return { a: pick(parts[0]), b: pick(parts[1]) };
}
function pickCompareTeam(slot, id){
  if(slot === "a") CMP.a = id; else CMP.b = id;
  location.hash = cmpHash();
}
function renderPickerList(menu, slot, q){
  const list = menu.querySelector(".cmp-pk-list");
  q = (q || "").trim().toLowerCase();
  let teams = LIVE.allTeams || [];
  if(q) teams = teams.filter(t => ((t.name || "") + " " + (t.en || "") + " " + dLeague(t.league) + " " + (t.initials || "")).toLowerCase().indexOf(q) >= 0);
  if(!teams.length){ list.innerHTML = '<div class="cmp-pk-empty">' + L("无匹配球队", "No clubs") + '</div>'; return; }
  /* 按联赛分组、全部列出（原来只取前 8 支，导致多数球队选不到） */
  const order = LEAGUES.map(l => l.cn);
  const groups = {};
  teams.forEach(t => { const k = t.league || ""; (groups[k] = groups[k] || []).push(t); });
  const keys = Object.keys(groups).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  list.innerHTML = keys.map(k =>
    '<div class="cmp-pk-group">' + esc(dLeague(k)) + '<span class="num">' + groups[k].length + '</span></div>' +
    groups[k].slice().sort((a, b) => String(dTeam(a)).localeCompare(String(dTeam(b)), "zh")).map(t =>
      '<button class="cmp-pk-item" data-team="' + esc(t.id) + '">' +
        teamCrestHTML(t, 22) + '<b>' + esc(dTeam(t)) + '</b>' +
      '</button>').join("")
  ).join("");
  list.querySelectorAll(".cmp-pk-item").forEach(btn => {
    btn.addEventListener("mousedown", e => { e.preventDefault(); pickCompareTeam(slot, btn.dataset.team); });
  });
}
function bindComparePickers(){
  const wrap = document.getElementById("compare-content");
  if(!wrap) return;
  wrap.querySelectorAll(".cmp-pk-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const pick = btn.closest(".cmp-pick");
      const menu = pick.querySelector(".cmp-pk-menu");
      const open = menu.hidden;
      wrap.querySelectorAll(".cmp-pk-menu").forEach(m => { m.hidden = true; });
      if(open){
        menu.hidden = false;
        const input = menu.querySelector(".cmp-pk-input");
        input.value = "";
        renderPickerList(menu, pick.dataset.slot, "");
        input.focus();
      }
    });
  });
  wrap.querySelectorAll(".cmp-pk-input").forEach(inp => {
    inp.addEventListener("input", () => {
      const pick = inp.closest(".cmp-pick");
      renderPickerList(pick.querySelector(".cmp-pk-menu"), pick.dataset.slot, inp.value);
    });
  });
}
function renderCompare(aId, bId){
  const wrap = document.getElementById("compare-content");
  if(!wrap) return;
  const a = aId ? findTeam(aId) : null;
  const b = bId ? findTeam(bId) : null;
  CMP.a = a ? a.id : "";
  CMP.b = b ? b.id : "";
  wrap.innerHTML = comparePageHTML(a, b);
  const back = document.getElementById("compare-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  const swap = document.getElementById("cmp-swap");
  if(swap) swap.addEventListener("click", () => {
    const t = CMP.a; CMP.a = CMP.b; CMP.b = t;
    location.hash = cmpHash();
  });
  bindComparePickers();
  if(a && b){
    ensureStandings().then(() => {
      if(location.hash.indexOf("#compare") !== 0) return;
      const base = document.getElementById("cmp-base");
      if(base) base.innerHTML = compareBaseSectionHTML(a, b);
    }).catch(() => {});
    Promise.all([ensureTeamStats(a), ensureTeamStats(b)]).then(res => {
      if(location.hash.indexOf("#compare") !== 0) return;
      const holder = document.getElementById("cmp-stats");
      if(holder) holder.innerHTML = compareStatsHTML(a, b, res[0], res[1]);
    }).catch(() => {
      const holder = document.getElementById("cmp-stats");
      if(holder) holder.innerHTML = emptyNoteHTML("赛季数据暂时不可用。", "Season stats unavailable.");
    });
    if(typeof loadCompareH2H === "function") loadCompareH2H(a, b);
  }
}
