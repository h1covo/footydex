/* 联赛积分榜模块：整页积分榜（当前赛季复用 LIVE.standings；历史赛季按需拉取 + 7 天缓存） */
"use strict";
function standingsRowsOf(lgId){
  const st = LIVE.standings || {};
  return (LIVE.allTeams || [])
    .filter(t => t.leagueId === lgId && st[String(t.espnId)])
    .map(t => ({ t: t, s: st[String(t.espnId)] }))
    .sort((a, b) => (a.s.rank || 999) - (b.s.rank || 999));
}
/* 历史赛季球队对象：当前队直接用，已降级队用积分榜里的英文名 + logo 兜底 */
function histTeamObj(r, lgId){
  const known = findTeam(r.id);
  if(known) return known;
  const initials = (r.en || "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  return { id: r.id, espnId: r.espnId, en: r.en, name: zhTeam(r.en), logo: r.logo, leagueId: lgId, colors: ["#e9edee", "#4d5a61"], initials: initials || "?" };
}
function bindStandingsRows(wrap){
  wrap.querySelectorAll("tr[data-team]").forEach(tr => {
    tr.addEventListener("click", () => { location.hash = "team/" + tr.dataset.team; });
  });
}
function tableHashMatches(lgId, year){
  const h = location.hash;
  if(h.indexOf("#table/") !== 0) return false;
  const p = hashLeagueSeason(h, "#table/");
  if(p.lg !== lgId) return false;
  return (parseInt(p.year, 10) || new Date().getFullYear()) === year;
}
/* 合并页守卫：同时接受 #table/ 与 #league/ */
function leagueHashMatches(lgId, year){
  const h = location.hash;
  if(h.indexOf("#league/") === 0){
    const p = parseLeagueHash(h);
    if(p.lg !== lgId) return false;
    return (parseInt(p.year, 10) || new Date().getFullYear()) === year;
  }
  return tableHashMatches(lgId, year);
}
function renderTableBody(lgId, year, holderId){
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  const isCur = y === cur;
  const holder0 = document.getElementById(holderId);
  if(isCur){
    const rows = standingsRowsOf(active);
    if(holder0) holder0.innerHTML = rows.length ? standingsTableHTML(rows)
      : loadingNoteHTML("正在加载积分榜…", "Loading standings…");
    const note = document.getElementById("league-note") || document.getElementById("table-note");
    if(note) note.textContent = standingsNoteText(rows, y, active);
    bindStandingsRows(holder0 || document);
    if(!rows.length && typeof ensureStandings === "function"){
      ensureStandings().then(() => {
        if(!leagueHashMatches(active, y)) return;
        const holder = document.getElementById(holderId);
        if(!holder) return;
        const r = standingsRowsOf(active);
        holder.innerHTML = r.length ? standingsTableHTML(r)
          : emptyNoteHTML("积分榜暂时不可用，请检查网络后重试。", "Standings unavailable — check your connection and retry.");
        const note2 = document.getElementById("league-note") || document.getElementById("table-note");
        if(note2) note2.textContent = standingsNoteText(r, y, active);
        bindStandingsRows(holder);
      });
    }
  } else {
    if(holder0) holder0.innerHTML = loadingNoteHTML("正在加载该赛季积分榜…", "Loading season standings…");
    fetchStandingsFor(active, y).then(list => {
      if(!leagueHashMatches(active, y)) return;
      const h = document.getElementById(holderId);
      const r = (list || []).map(x => ({ t: histTeamObj(x, active), s: x.s }));
      if(h) h.innerHTML = r.length ? standingsTableHTML(r)
        : emptyNoteHTML("该赛季暂无积分榜数据。", "No standings for this season.");
      const note = document.getElementById("league-note") || document.getElementById("table-note");
      if(note) note.textContent = standingsNoteText(r, y, active);
      bindStandingsRows(h || document);
    }).catch(() => {
      if(!leagueHashMatches(active, y)) return;
      const h = document.getElementById(holderId);
      if(h) h.innerHTML = emptyNoteHTML("积分榜暂时不可用，请检查网络后重试。", "Standings unavailable — check your connection and retry.");
    });
  }
}
function renderTable(lgId, year){
  const wrap = document.getElementById("table-content");
  if(!wrap) return;
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  const isCur = y === cur;
  const rows = isCur ? standingsRowsOf(active) : null;
  wrap.innerHTML = standingsPageHTML(active, rows, y);
  const back = document.getElementById("table-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll(".lb-tabs button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "table/" + b.dataset.lg; });
  });
  fillSeasonSelect("table-season", "table", active, y);
  renderTableBody(active, y, "table-body");
}
