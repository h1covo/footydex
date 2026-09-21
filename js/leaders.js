/* 联赛榜单模块：射手榜 / 助攻榜（ESPN site statistics，6 小时缓存） */
"use strict";
const LEADERS_KEY = "ft-leaders-v1";
const LEADERS_TTL = 6 * 3600 * 1000;
const LEADERS_CACHE = {};
function leadersCacheRead(){ try { return JSON.parse(localStorage.getItem(LEADERS_KEY) || "{}"); } catch(e){ return {}; } }
function leadersCacheWrite(c){ try { localStorage.setItem(LEADERS_KEY, JSON.stringify(c)); } catch(e){} }

function buildLeaders(j){
  const stats = j.stats || [];
  const pick = name => {
    const cat = stats.filter(s => s.name === name)[0];
    if(!cat) return [];
    return (cat.leaders || []).map(e => {
      const a = e.athlete || {}, team = a.team || {};
      const en = a.displayName || a.shortName || "";
      return {
        id: String(a.id || ""), en: en, name: zhPlayer(en) || en,
        teamEn: team.displayName || "", team: zhTeam(team.displayName || "") || (team.displayName || ""),
        no: a.jersey || "", value: e.value != null ? e.value : (e.displayValue || "")
      };
    });
  };
  return { goals: pick("goalsLeaders"), assists: pick("assistsLeaders"), at: Date.now() };
}
async function loadLeaders(lgId, year){
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  const isCur = y === cur;
  if(isCur){
    const cache = leadersCacheRead();
    const d = LEADERS_CACHE[lgId] || ((cache[lgId] && (Date.now() - cache[lgId].at < LEADERS_TTL)) ? cache[lgId].data : null);
    if(d) return d;
  } else {
    const hc = histCacheRead();
    const hkey = "leaders:" + lgId + ":" + y;
    if(hc[hkey] && (Date.now() - hc[hkey].at < HIST_TTL) && hc[hkey].data) return hc[hkey].data;
  }
  try {
    const url = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lgId + "/statistics" + (isCur ? "" : "?season=" + y);
    const j = await fetchJson(url, 12000, 1);
    if(j){
      const d = buildLeaders(j);
      if(isCur){
        LEADERS_CACHE[lgId] = d;
        const cache = leadersCacheRead();
        cache[lgId] = { at: Date.now(), data: d };
        leadersCacheWrite(cache);
      } else {
        const hc = histCacheRead();
        hc["leaders:" + lgId + ":" + y] = { at: Date.now(), data: d };
        histCacheWrite(hc);
      }
      return d;
    }
  } catch(e) {}
  return null;
}

function renderLeaders(lgId, year){
  const wrap = document.getElementById("leaders-content");
  if(!wrap) return;
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  wrap.innerHTML = leadersPageHTML(active, y);
  const back = document.getElementById("leaders-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll(".lb-tabs button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "leaders/" + b.dataset.lg; });
  });
  fillSeasonSelect("leaders-season", "leaders", active, y);
  renderLeadersBody(active, y, "leaders-body");
}

function renderLeadersBody(lgId, year, holderId){
  const holder = document.getElementById(holderId);
  if(!holder) return;
  holder.innerHTML = loadingNoteHTML("正在加载榜单…", "Loading leaderboard…");
  loadLeaders(lgId, year).then(d => {
    const h = document.getElementById(holderId);
    if(!h) return;
    if(location.hash.indexOf("#league/" + lgId) !== 0 && location.hash.indexOf("#leaders/" + lgId) !== 0) return;
    h.innerHTML = d ? leadersBoardsHTML(d)
      : emptyNoteHTML("榜单获取失败，请检查网络后重试。", "Could not load the leaderboard — check your connection and retry.");
  });
}
/* 合并页调度：页签 → 对应 body 渲染 */
function renderLeague(lgId, tab, year){
  const wrap = document.getElementById("league-content");
  if(!wrap) return;
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  const t = ["table", "leaders", "cards"].indexOf(tab) >= 0 ? tab : "table";
  wrap.innerHTML = leaguePageHTML(LEAGUES.filter(l => l.id === active)[0], t, y);
  const back = document.getElementById("league-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll(".lb-tabs button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "league/" + b.dataset.lg + "/" + t + "/" + y; });
  });
  wrap.querySelectorAll(".lg-tabbar button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "league/" + active + "/" + b.dataset.tab + "/" + y; });
  });
  fillSeasonSelect("league-season", "league", active, y, t);
  if(t === "table") renderTableBody(active, y, "league-body");
  else if(t === "leaders") renderLeadersBody(active, y, "league-body");
  else renderCardsBody(active, "league-body");
}
