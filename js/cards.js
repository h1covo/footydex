/* 联赛纪律榜模块：黄/红牌排名（拉该联赛各队赛季数据，复用 ft-tstats-v1，12h 缓存） */
"use strict";
async function loadCards(lgId){
  const teams = (LIVE.allTeams || []).filter(t => t.leagueId === lgId && t.espnId);
  const out = [];
  let i = 0;
  async function worker(){
    while(i < teams.length){
      const t = teams[i++];
      const s = await ensureTeamStats(t);
      if(s) out.push({
        t: t,
        yc: parseInt(s.yellowCards, 10) || 0,
        rc: parseInt(s.redCards, 10) || 0,
        sec: parseInt(s.secondYellow, 10) || 0,
        fouls: parseInt(s.foulsCommitted, 10) || 0
      });
    }
  }
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  out.sort((a, b) => (b.yc + b.rc * 3) - (a.yc + a.rc * 3) || b.fouls - a.fouls);
  return out;
}
function bindCardRows(wrap){
  wrap.querySelectorAll("tr[data-team]").forEach(tr => {
    tr.addEventListener("click", () => { location.hash = "team/" + tr.dataset.team; });
  });
}
function renderCards(lgId){
  const wrap = document.getElementById("cards-content");
  if(!wrap) return;
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  wrap.innerHTML = cardsPageHTML(active);
  const back = document.getElementById("cards-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll(".lb-tabs button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "cards/" + b.dataset.lg; });
  });
  renderCardsBody(active, "cards-body");
}
function renderCardsBody(lgId, holderId){
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  const holder = document.getElementById(holderId);
  if(holder) holder.innerHTML = loadingNoteHTML("正在加载纪律数据…", "Loading discipline data…");
  loadCards(active).then(rows => {
    if(location.hash.indexOf("#league/" + active) !== 0 && location.hash.indexOf("#cards/" + active) !== 0) return;
    const h = document.getElementById(holderId);
    if(h) h.innerHTML = cardsTableHTML(rows);
    bindCardRows(h || document);
  }).catch(() => {
    const h = document.getElementById(holderId);
    if(h) h.innerHTML = emptyNoteHTML("纪律数据获取失败，请检查网络后重试。", "Could not load discipline data — check your connection and retry.");
  });
}
