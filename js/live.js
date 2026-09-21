/* 实时同步模块：ESPN 拉取 / 本地缓存(ft-sync-v1) / 全量预同步 / 同步条 */
"use strict";
const LIVE = {
  data: {}, timer: null,
  allTeams: [],          // 六大联赛全部球队（实时）
  rosters: {},           // ESPN id -> 球员名单（实时）
  rostersAt: {},
  standings: {},         // ESPN id -> 联赛排名/战绩
  standingsAt: 0,
  standingsFetching: null,
  teamLeague: {}         // ESPN id -> 联赛 id（积分榜来源，赛季数据/日志接口用）
};

function normalizeEvent(e, espnId){
  const c = e.competitions && e.competitions[0];
  if(!c) return null;
  const comps = c.competitors || [];
  const me = comps.filter(x => String(x.team.id) === String(espnId))[0];
  const opp = comps.filter(x => String(x.team.id) !== String(espnId))[0];
  if(!me || !opp) return null;
  const state = (c.status && c.status.type) ? c.status.type.state : "pre";
  const num = s => (s && s.displayValue !== undefined && s.displayValue !== null) ? parseInt(s.displayValue, 10) : null;
  const leagueName = (e.league && e.league.name) || "";
  return {
    ts: new Date(e.date).getTime(),
    date: fmtDate(e.date),
    time: fmtTime(e.date),
    comp: Translator.compCN[leagueName] || leagueName || "赛事",
    opp: zhTeam(opp.team.displayName) || opp.team.displayName || opp.team.name || "对手",
    home: me.homeAway === "home",
    gf: num(me.score), ga: num(opp.score),
    stadium: (c.venue && (zhVenue(c.venue.fullName) || c.venue.fullName)) || "待定",
    state: state,
    id: e.id,
    leagueSlug: (e.league && e.league.slug) || ""
  };
}

/* 杯赛合并：按日期去重（ESPN/既有数据优先），再排序 */
function cupMergeList(list, cupList, desc){
  const seen = {};
  list.forEach(x => { seen[x.date] = 1; });
  (cupList || []).forEach(x => { if(!seen[x.date]){ seen[x.date] = 1; list.push(x); } });
  list.sort(desc ? ((a, b) => b.ts - a.ts) : ((a, b) => a.ts - b.ts));
  return list;
}

async function fetchLiveSchedule(vt){
  let espnId = String((vt && vt.espnId) || vt || "");
  if(ESPN_IDS[espnId]) espnId = String(ESPN_IDS[espnId]);
  else if(espnId.indexOf("espn:") === 0) espnId = espnId.slice(5);
  if(!espnId) return null;
  const year = new Date().getFullYear();
  const base = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/" + espnId + "/schedule?season=";
  const get = u => fetchJson(u, 12000, 1).then(j => j || { events: [] });
  const [cur, fix, cupAll] = await Promise.all([
    get(base + year),
    get(base + year + "&fixture=true"),
    (typeof fetchCupMatches === "function") ? fetchCupMatches().catch(() => []) : Promise.resolve([])
  ]);
  const seen = {}, all = [];
  const pushAll = p => (p.events || []).forEach(e => { if(e && e.id && !seen[e.id]){ seen[e.id] = 1; all.push(e); } });
  pushAll(cur); pushAll(fix);
  const split = () => {
    const results = [], fixtures = [];
    all.forEach(e => {
      const n = normalizeEvent(e, espnId);
      if(!n) return;
      if(n.state === "post") results.push(n);
      else if(n.state === "pre") fixtures.push(n);
    });
    return { results: results, fixtures: fixtures };
  };
  let { results, fixtures } = split();
  /* 本赛季完赛不足 10 场才补上赛季（省 ~586KB/队） */
  if(results.length < 10){
    pushAll(await get(base + (year - 1)));
    const s2 = split();
    results = s2.results; fixtures = s2.fixtures;
  }
  /* 合并杯赛（足协杯 / 亚冠精英 / 亚冠2） */
  const cup = (vt && vt.name && typeof cupMatchesOf === "function") ? cupMatchesOf(vt, cupAll) : { results: [], fixtures: [] };
  cupMergeList(results, cup.results, true);
  cupMergeList(fixtures, cup.fixtures, false);
  return { results: results.slice(0, 10), fixtures: fixtures.slice(0, 30), at: new Date() };
}

/* 缓存路径：把杯赛数据渐进合并进已有缓存（返回是否有变化） */
async function mergeCupsInto(teamId, vt){
  if(!vt || !vt.name || typeof fetchCupMatches !== "function" || typeof cupMatchesOf !== "function") return false;
  const d = LIVE.data[teamId];
  if(!d) return false;
  const cupAll = await fetchCupMatches().catch(() => []);
  const cup = cupMatchesOf(vt, cupAll);
  if(!cup.results.length && !cup.fixtures.length) return false;
  const sig = x => (x.results || []).map(v => v.date).join(",") + "|" + (x.fixtures || []).map(v => v.date).join(",");
  const before = sig(d);
  cupMergeList(d.results = d.results || [], cup.results, true);
  cupMergeList(d.fixtures = d.fixtures || [], cup.fixtures, false);
  d.results = d.results.slice(0, 10);
  d.fixtures = d.fixtures.slice(0, 30);
  return sig(d) !== before;
}

function applyLive(teamId){
  const vt = findTeam(teamId);
  const d = LIVE.data[teamId];
  if(!vt || !d) return;
  const cur = editorialOf(vt) || {};
  const rs = document.getElementById("sec-results");
  if(rs) rs.innerHTML = resultsSectionHTML(d.results);
  const fs = document.getElementById("sec-fixtures");
  if(fs){ fs.innerHTML = fixturesSectionHTML(d.fixtures); bindFixtures(d.fixtures); }
  const hs = document.getElementById("hero-stats");
  if(hs) hs.innerHTML = heroStatsHTML(cur, d.results, (LIVE.rosters[vt.espnId] || []).length);
}

async function loadLive(teamId, manual){
  const bar = document.getElementById("live-bar");
  const text = document.getElementById("live-text");
  const vt = findTeam(teamId);
  if(!vt || !vt.espnId){
    if(text) text.textContent = L("该球队暂不支持实时同步", "Live sync is not available for this club");
    if(bar) bar.classList.add("offline");
    return;
  }
  if(bar) bar.classList.remove("offline");
  const cached = LIVE.data[teamId];
  if(!manual && cached && cached.at && (Date.now() - new Date(cached.at).getTime() < teamTtl(vt))){
    applyLive(teamId);
    if(text) text.textContent = L("实时数据 · 来源 ESPN/赛事官方 · 近 " + cached.results.length + " 场 / 未来 " + cached.fixtures.length + " 场 · 同步于 ", "Live data · ESPN & official sources · " + cached.results.length + " past / " + cached.fixtures.length + " upcoming · synced ") + new Date(cached.at).toLocaleTimeString("zh-CN", { hour12:false });
    /* 缓存路径也补齐杯赛（足协杯 / 亚冠）：合并后重绘 */
    mergeCupsInto(teamId, vt).then(changed => { if(changed && LIVE.data[teamId] === cached) applyLive(teamId); });
    return;
  }
  if(bar) bar.classList.add("loading");
  if(text && manual) text.textContent = L("正在刷新…", "Refreshing…");
  try {
    const d = await fetchLiveSchedule(vt);
    if(!d || (!d.results.length && !d.fixtures.length)) throw new Error("empty");
    LIVE.data[teamId] = d;
    applyLive(teamId);
    if(bar) bar.classList.remove("loading", "offline");
    if(text) text.textContent = L("实时数据 · 来源 ESPN/赛事官方 · 近 " + d.results.length + " 场 / 未来 " + d.fixtures.length + " 场 · 更新于 ", "Live data · ESPN & official sources · " + d.results.length + " past / " + d.fixtures.length + " upcoming · updated ") + d.at.toLocaleTimeString("zh-CN", { hour12:false });
  } catch(err) {
    if(bar){ bar.classList.remove("loading"); bar.classList.add("offline"); }
    if(text) text.textContent = L("实时数据获取失败（网络不可用）", "Live data unavailable (offline)");
  }
}


/* ---------- 联赛排名（ESPN 各联赛积分榜，随同步刷新） ---------- */
function parseStandingsEntries(entries, lgId, out){
  (entries || []).forEach(e => {
    const st = {};
    (e.stats || []).forEach(s => { st[s.name] = s.displayValue; });
    const rank = parseInt(st.rank, 10);
    if(e.team && e.team.id && rank){
      const gp = parseInt(st.gamesPlayed, 10) || 0;
      const pts = parseInt(st.points, 10) || 0;
      out[String(e.team.id)] = {
        rank: rank, gp: st.gamesPlayed || "", points: st.points || "",
        wins: parseInt(st.wins, 10) || 0, draws: parseInt(st.ties, 10) || 0, losses: parseInt(st.losses, 10) || 0,
        gf: st.pointsFor != null ? st.pointsFor : "", ga: st.pointsAgainst != null ? st.pointsAgainst : "",
        gd: st.pointDifferential != null ? st.pointDifferential : "", rankChange: parseInt(st.rankChange, 10) || 0,
        ppg: gp ? Math.round((pts / gp) * 100) / 100 : "", deductions: parseInt(st.deductions, 10) || 0
      };
      LIVE.teamLeague[String(e.team.id)] = lgId;
    }
  });
  return out;
}
async function fetchStandings(){
  const year = new Date().getFullYear();
  const parts = await Promise.all(LEAGUES.map(lg =>
    fetchJson("https://site.web.api.espn.com/apis/v2/sports/soccer/" + lg.id + "/standings?season=" + year, 12000, 1)
  ));
  const out = {};
  parts.forEach((p, i) => {
    const entries = p && p.children && p.children[0] && p.children[0].standings && p.children[0].standings.entries;
    parseStandingsEntries(entries, LEAGUES[i].id, out);
  });
  return out;
}

/* ---------- 历史赛季（积分榜 / 榜单 / 球队赛季数据） ---------- */
const HIST_KEY = "ft-hist-v1";
const HIST_TTL = 7 * 24 * 3600 * 1000;
function histCacheRead(){ try { return JSON.parse(localStorage.getItem(HIST_KEY) || "{}"); } catch(e){ return {}; } }
function histCacheWrite(c){ try { localStorage.setItem(HIST_KEY, JSON.stringify(c)); } catch(e){} }
const SEASONS_CACHE = {};
const SEASONS_TTL = 30 * 24 * 3600 * 1000;
/* ESPN 权威赛季列表（各联赛范围不同：英超 2001–、西德意法 2000–、中超 2016–） */
async function leagueSeasons(lgId){
  if(SEASONS_CACHE[lgId]) return SEASONS_CACHE[lgId];
  const cache = histCacheRead();
  const key = "seasons:" + lgId;
  if(cache[key] && (Date.now() - cache[key].at < SEASONS_TTL) && cache[key].years && cache[key].years.length){
    SEASONS_CACHE[lgId] = cache[key].years; return SEASONS_CACHE[lgId];
  }
  let years = null;
  try {
    const j = await fetchJson("https://sports.core.api.espn.com/v2/sports/soccer/leagues/" + lgId + "/seasons?limit=200", 12000, 1);
    if(j && j.items && j.items.length){
      years = j.items.map(it => { const m = String(it.$ref || "").match(/seasons\/(\d+)/); return m ? parseInt(m[1], 10) : 0; }).filter(Boolean);
      years.sort((a, b) => b - a);
    }
  } catch(e) {}
  if(!years || !years.length){
    const cur = new Date().getFullYear();
    years = [];
    for(let y = cur; y >= cur - 10; y--) years.push(y);
  }
  SEASONS_CACHE[lgId] = years;
  cache[key] = { at: Date.now(), years: years };
  histCacheWrite(cache);
  return years;
}
/* 填充赛季下拉（异步取 ESPN 赛季列表），切换时跳转对应路由 */
async function fillSeasonSelect(selectId, route, lgId, year, mid){
  const sel = document.getElementById(selectId);
  if(!sel) return;
  const years = await leagueSeasons(lgId);
  if(!years || !years.length) return;
  sel.innerHTML = years.map(y => '<option value="' + y + '"' + (y === year ? " selected" : "") + '>' + esc(seasonLabel(lgId, y)) + '</option>').join("");
  sel.disabled = false;
  if(!sel.dataset.bound){
    sel.dataset.bound = "1";
    sel.addEventListener("change", () => { location.hash = route + "/" + lgId + (mid ? "/" + mid : "") + "/" + sel.value; });
  }
}
/* 某赛季积分榜：返回按名次排序的行 [{id, espnId, en, logo, s}]（含当年已降级球队） */
async function fetchStandingsFor(lgId, year){
  const key = "standings:" + lgId + ":" + year;
  const cache = histCacheRead();
  if(cache[key] && (Date.now() - cache[key].at < HIST_TTL) && cache[key].rows) return cache[key].rows;
  const p = await fetchJson("https://site.web.api.espn.com/apis/v2/sports/soccer/" + lgId + "/standings?season=" + year, 12000, 1);
  const entries = p && p.children && p.children[0] && p.children[0].standings && p.children[0].standings.entries;
  const rows = (entries || []).map(e => {
    const st = {};
    (e.stats || []).forEach(s => { st[s.name] = s.displayValue; });
    const rank = parseInt(st.rank, 10);
    if(!e.team || !e.team.id || !rank) return null;
    const gp = parseInt(st.gamesPlayed, 10) || 0, pts = parseInt(st.points, 10) || 0;
    return {
      id: "espn:" + e.team.id, espnId: String(e.team.id),
      en: e.team.displayName || "", logo: (e.team.logos && e.team.logos[0] && e.team.logos[0].href) || "",
      s: {
        rank: rank, gp: st.gamesPlayed || "", points: st.points || "",
        wins: parseInt(st.wins, 10) || 0, draws: parseInt(st.ties, 10) || 0, losses: parseInt(st.losses, 10) || 0,
        gf: st.pointsFor != null ? st.pointsFor : "", ga: st.pointsAgainst != null ? st.pointsAgainst : "",
        gd: st.pointDifferential != null ? st.pointDifferential : "", rankChange: parseInt(st.rankChange, 10) || 0,
        ppg: gp ? Math.round((pts / gp) * 100) / 100 : "", deductions: parseInt(st.deductions, 10) || 0
      }
    };
  }).filter(Boolean).sort((a, b) => a.s.rank - b.s.rank);
  cache[key] = { at: Date.now(), rows: rows };
  histCacheWrite(cache);
  return rows;
}
function ensureStandings(force){
  if(!force && LIVE.standingsAt && (Date.now() - LIVE.standingsAt < SYNC_TTL)) return Promise.resolve();
  if(LIVE.standingsFetching) return LIVE.standingsFetching;
  LIVE.standingsFetching = fetchStandings().then(s => {
    LIVE.standingsFetching = null;
    if(s && Object.keys(s).length){ LIVE.standings = s; LIVE.standingsAt = Date.now(); saveSyncCache(); applyRankCurrent(); renderGrid(); }
  }).catch(() => { LIVE.standingsFetching = null; });
  return LIVE.standingsFetching;
}
/* ---------- 主/客场战绩（ESPN 球队 record，1 请求/队，缓存 12h） ---------- */
const RECORD_KEY = "ft-record-v1";
const RECORD_TTL = 12 * 3600 * 1000;
function recordCacheRead(){ try { return JSON.parse(localStorage.getItem(RECORD_KEY) || "{}"); } catch(e){ return {}; } }
function recordCacheWrite(c){ try { localStorage.setItem(RECORD_KEY, JSON.stringify(c)); } catch(e){} }
async function fetchTeamRecord(vt){
  if(!vt || !vt.espnId) return null;
  const lg = leagueIdOf(vt);
  if(!lg) return null;
  const cache = recordCacheRead();
  const c = cache[vt.espnId];
  if(c && (Date.now() - c.at < RECORD_TTL) && c.rec) return c.rec;
  try {
    const j = await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lg + "/teams/" + vt.espnId, 12000, 1);
    const item = j && j.team && j.team.record && j.team.record.items && j.team.record.items[0];
    if(item && item.stats){
      const m = {};
      item.stats.forEach(s => { m[s.name] = s.value; });
      const rec = {
        overall: { w: m.wins, d: m.ties, l: m.losses, gf: m.pointsFor, ga: m.pointsAgainst },
        home: { w: m.homeWins, d: m.homeTies, l: m.homeLosses, gf: m.homePointsFor, ga: m.homePointsAgainst },
        away: { w: m.awayWins, d: m.awayTies, l: m.awayLosses, gf: m.awayPointsFor, ga: m.awayPointsAgainst }
      };
      cache[vt.espnId] = { at: Date.now(), rec: rec };
      recordCacheWrite(cache);
      return rec;
    }
  } catch(e) {}
  return null;
}
function renderTeamRecord(vt, holderId){
  const holder = document.getElementById(holderId);
  const wrap = document.getElementById("team-record-wrap");
  if(!holder || !vt || !vt.espnId){ if(wrap) wrap.hidden = true; return; }
  fetchTeamRecord(vt).then(rec => {
    if(!rec){ if(wrap) wrap.hidden = true; holder.innerHTML = ""; return; }
    holder.innerHTML = recordTableHTML(rec);
  }).catch(() => { if(wrap) wrap.hidden = true; holder.innerHTML = ""; });
}
function leagueRankOf(vt){ return (vt && vt.espnId && LIVE.standings[String(vt.espnId)]) || null; }
function applyRankCurrent(){
  if(location.hash.indexOf("#team/") !== 0) return;
  const vt = findTeam(decodeURIComponent(location.hash.slice(6)));
  if(vt) applyRank(vt);
}
/* 排名数据晚于球队页到达时就地补上（不重绘整页） */
function applyRank(vt){
  const rank = leagueRankOf(vt);
  if(!rank) return;
  const chipText = L("联赛第 " + rank.rank, ordinal(rank.rank) + " in league");
  const chips = document.querySelector("#team-content .team-hero .chips");
  if(chips && ![...chips.children].some(c => c.textContent === chipText)){
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = chipText;
    chips.insertBefore(span, chips.children[1] || null);
  }
  const grid = document.querySelector("#sec-overview .info-grid");
  if(grid){
    const leagueLabel = L("所属联赛", "League");
    let anchor = [...grid.querySelectorAll(".info-item")].filter(it => it.querySelector("span") && it.querySelector("span").textContent === leagueLabel)[0] || null;
    rankOverviewItems(rank).forEach(it => {
      if([...grid.querySelectorAll(".info-item span")].some(s => s.textContent === it.label)) return;
      const div = document.createElement("div");
      div.className = "info-item";
      div.innerHTML = "<span>" + esc(it.label) + "</span><b>" + it.value + "</b>";
      if(anchor && anchor.nextSibling) grid.insertBefore(div, anchor.nextSibling);
      else grid.appendChild(div);
      anchor = div;
    });
  }
}

/* ---------- 球员名单装载 ---------- */
async function loadRoster(vt, posTabsId, bodyId, mark){
  const body = document.getElementById(bodyId);
  const tabs = document.getElementById(posTabsId);
  if(!body) return;
  let list = LIVE.rosters[vt.espnId];
  const fresh = LIVE.rostersAt[vt.espnId] && (Date.now() - LIVE.rostersAt[vt.espnId] < ROSTER_TTL);
  if(!list || !fresh){
    body.innerHTML = loadingNoteHTML("正在从 ESPN 同步登记球员…", "Loading squad from ESPN…");
    try {
      list = await fetchRoster(vt.espnId, vt.leagueId);
      LIVE.rosters[vt.espnId] = list;
      LIVE.rostersAt[vt.espnId] = Date.now();
    } catch(e) {
      if(!list){ body.innerHTML = emptyNoteHTML("球员名单获取失败，请检查网络后重试。", "Could not load the squad — check your connection and retry."); return; }
    }
  }
  function render(pos){
    body.innerHTML = rosterTableHTML(list, pos || "");
  }
  render("");
  const sq = document.getElementById("squad-structure");
  if(sq) sq.innerHTML = squadStructureHTML(list);
  if(tabs){
    tabs.innerHTML = posTabsHTML();
    tabs.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        render(btn.dataset.pos);
      });
    });
  }
}

function stopLiveTimer(){ if(LIVE.timer){ clearInterval(LIVE.timer); LIVE.timer = null; } }

/* =========================================================
   进站全量预同步（112 支球队：战绩 / 赛程 / 球员名单）
   ========================================================= */
const SYNC_TTL = 30 * 60 * 1000;      // （兼容保留）旧缓存标记
const TEAM_TTL = 6 * 3600 * 1000;     // 赛程数据 TTL：6 小时
const MATCHDAY_TTL = 30 * 60 * 1000;  // 比赛日（昨天/今天/明天有比赛）TTL：30 分钟
const ROSTER_TTL = 12 * 3600 * 1000;  // 名单 TTL：12 小时（进球队页才拉）
const CACHE_MAX = 24 * 3600 * 1000;   // 本地缓存最长保留：24 小时
const SYNC_KEY = "ft-sync-v1";

function todayStr(offset){
  const d = new Date(Date.now() + (offset || 0) * 86400000);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function teamTtl(t){
  const d = LIVE.data[t.id];
  if(d){
    const near = [todayStr(-1), todayStr(0), todayStr(1)];
    if((d.results || []).concat(d.fixtures || []).some(x => near.indexOf(x.date) >= 0)) return MATCHDAY_TTL;
  }
  return TEAM_TTL;
}
function staleTeams(force){
  return LIVE.allTeams.filter(t => {
    if(force) return true;
    const d = LIVE.data[t.id];
    if(!d || !d.at) return true;
    return (Date.now() - new Date(d.at).getTime()) >= teamTtl(t);
  });
}

function saveSyncCache(){
  try {
    const payload = { at: Date.now(), data: {}, rosters: {}, rostersV: 2, rostersAt: LIVE.rostersAt, standings: LIVE.standings, standingsAt: LIVE.standingsAt };
    Object.keys(LIVE.data).forEach(k => {
      const d = LIVE.data[k];
      if(d && d.results && d.fixtures) payload.data[k] = { results: d.results, fixtures: d.fixtures, at: d.at ? new Date(d.at).getTime() : Date.now() };
    });
    Object.keys(LIVE.rosters).forEach(k => { payload.rosters[k] = LIVE.rosters[k]; });
    localStorage.setItem(SYNC_KEY, JSON.stringify(payload));
  } catch(e) {}
}

function applySnapshot(snap){
  if(!snap) return false;
  let n = 0;
  Object.keys(snap.data || {}).forEach(k => {
    const d = snap.data[k];
    if(d && (d.results || d.fixtures)){
      LIVE.data[k] = { results: d.results || [], fixtures: d.fixtures || [], at: new Date(snap.at) };
      n++;
    }
  });
  Object.keys(snap.rosters || {}).forEach(k => { LIVE.rosters[k] = snap.rosters[k]; });
  // 精选球队：快照以 espn:id 存储，同时映射到精选 id
  Object.keys(ESPN_IDS).forEach(cid => {
    const key = "espn:" + ESPN_IDS[cid];
    if(LIVE.data[key] && !LIVE.data[cid]) LIVE.data[cid] = LIVE.data[key];
  });
  LIVE.syncAt = snap.at;
  if(snap.standings){ LIVE.standings = snap.standings; LIVE.standingsAt = snap.at || 0; }
  return n > 0;
}

function loadSyncCache(){
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if(!raw) return false;
    const p = JSON.parse(raw);
    if(!p || !p.at || (Date.now() - p.at) > CACHE_MAX) return false;
    Object.keys(p.data || {}).forEach(k => {
      const d = p.data[k];
      LIVE.data[k] = { results: d.results || [], fixtures: d.fixtures || [], at: new Date(d.at || p.at) };
    });
    /* 名单缓存带版本：旧缓存（无 flag 字段）不覆盖快照名单 */
    if((p.rostersV || 0) >= 2){
      Object.keys(p.rosters || {}).forEach(k => { LIVE.rosters[k] = p.rosters[k]; });
      LIVE.rostersAt = p.rostersAt || {};
    }
    LIVE.standings = p.standings || {};
    LIVE.standingsAt = p.standingsAt || 0;
    LIVE.syncAt = p.at;
    return true;
  } catch(e) { return false; }
}

/* ---------- 同步调度：可见优先 + 后台补齐 + 失败重试 ---------- */
const SYNC_CONC = 6;      // 每波并发（实测全量冷同步 6 与 12 无差：5617ms vs 6060ms，属请求数受限而非并发受限，故保守取 6）
const SYNC_HEAD = 18;     // 无可见联赛时，先同步的队数
const SYNC = { queue: [], queued: {}, running: false, done: 0, total: 0, errors: {}, headIds: {}, headSilent: false };

function waitVisible(maxMs){
  if(!document.hidden) return Promise.resolve();
  return new Promise(res => {
    let t = null;
    const done = () => { if(t) clearTimeout(t); document.removeEventListener("visibilitychange", done); res(); };
    document.addEventListener("visibilitychange", done);
    t = setTimeout(done, maxMs || 120000);
  });
}
function syncFailedCount(){ return Object.keys(SYNC.errors).length; }

function syncUI(show, done, total, label){
  const bar = document.getElementById("syncbar");
  if(!bar) return;
  if(show === false){ bar.hidden = true; return; }
  bar.hidden = false;
  bar.classList.toggle("done", done >= total && total > 0 && !SYNC.running);
  const t = document.getElementById("sync-text");
  const c = document.getElementById("sync-count");
  const f = document.getElementById("sync-fill");
  if(t && label) t.textContent = label;
  if(c) c.textContent = done + " / " + total;
  if(f) f.style.width = (total ? Math.round(done / total * 100) : 0) + "%";
  const retry = document.getElementById("sync-retry");
  if(retry) retry.hidden = SYNC.running || syncFailedCount() === 0;
}

function syncEnqueue(teams, front){
  (teams || []).forEach(t => {
    if(!t || !t.id || SYNC.queued[t.id]) return;
    SYNC.queued[t.id] = 1;
    if(front) SYNC.queue.unshift(t); else SYNC.queue.push(t);
  });
}
async function syncOneTeam(t){
  try {
    const d = await fetchLiveSchedule(t);
    if(d && (d.results.length || d.fixtures.length)){ LIVE.data[t.id] = d; delete SYNC.errors[t.espnId]; }
    else SYNC.errors[t.espnId] = 1;
  } catch(e){ SYNC.errors[t.espnId] = 1; }
  delete SYNC.queued[t.id];
  SYNC.done++;
  /* 优先队（当前筛选 / 已展开联赛）全部同步完 → 收起同步条，其余后台静默补齐
     （全量约 6s，但用户关心的那几支通常 1s 内就好，不必盯着进度条） */
  if(SYNC.headIds[t.id]){
    delete SYNC.headIds[t.id];
    if(!SYNC.headSilent && !Object.keys(SYNC.headIds).length){
      SYNC.headSilent = true;
      if(!syncFailedCount()) syncUI(false);
    }
  }
}

function syncFinishUI(){
  const failed = syncFailedCount();
  const msg = failed
    ? L("已更新 " + SYNC.done + " 支球队 · " + failed + " 支未更新", "Updated " + SYNC.done + " clubs · " + failed + " failed")
    : L("数据已更新 · 战绩 / 赛程（名单进球队页时同步）", "Updated · results / fixtures (squads load on club pages)");
  /* 优先队已静默收起时，只在有失败（需要用户点「重试」）时才重新露出同步条 */
  if(SYNC.headSilent){
    if(failed) syncUI(true, SYNC.done, SYNC.total, msg);
    else syncUI(false);
  } else {
    syncUI(true, SYNC.done, SYNC.total, msg);
  }
  if(!failed){
    setTimeout(() => { const b = document.getElementById("syncbar"); if(b && !LIVE.syncing) b.hidden = true; }, 6000);
  }
  /* 赛程页是本地聚合（零请求），同步完成后重绘一次以反映最新赛程 */
  if(location.hash.indexOf("#schedule") === 0 && typeof renderSchedule === "function"){
    const iso = decodeURIComponent(location.hash.slice(10)) || "";
    renderSchedule(iso);
  }
}

function refreshSyncBar(){
  const b = document.getElementById("syncbar");
  if(!b || b.hidden) return;
  const failed = syncFailedCount();
  const msg = failed
    ? L("已更新 " + SYNC.done + " 支球队 · " + failed + " 支未更新", "Updated " + SYNC.done + " clubs · " + failed + " failed")
    : (LIVE.syncing ? L("正在同步实时数据…", "Syncing live data…") : L("数据已更新 · 战绩 / 赛程（名单进球队页时同步）", "Updated · results / fixtures (squads load on club pages)"));
  syncUI(true, SYNC.done, SYNC.total, msg);
}
async function syncPump(){
  if(SYNC.running) return;
  SYNC.running = true;
  LIVE.syncing = true;
  ensureStandings(false);
  syncUI(true, SYNC.done, SYNC.total, L("正在同步实时数据…", "Syncing live data…"));
  let lastFlush = 0;
  /* 节流：全量重绘 112 张卡 + 序列化约 10MB 落盘，每波都做一次是纯浪费 → 最多每 500ms 一次 */
  const flush = force => {
    const now = Date.now();
    if(!force && now - lastFlush < 500) return;
    lastFlush = now;
    renderGrid();
    saveSyncCache();
    if(!SYNC.headSilent) syncUI(true, SYNC.done, SYNC.total);
  };
  try {
    /* 滑动窗口：始终保持 SYNC_CONC 个请求在飞，任一完成立刻补位
       （原实现是固定波次 await Promise.all(wave)，慢请求或重试会占着槽位空转） */
    const worker = async () => {
      while(SYNC.queue.length){
        if(document.hidden) await waitVisible(120000);
        const t = SYNC.queue.shift();
        if(!t) break;
        await syncOneTeam(t);
        flush(false);
      }
    };
    await Promise.all(Array.from({ length: SYNC_CONC }, worker));
  } finally {
    SYNC.running = false;
    LIVE.syncing = false;
    LIVE.syncAt = Date.now();
    saveSyncCache();
    renderGrid();
    syncFinishUI();
  }
}

/* 同步全部过期队（渐进：可见联赛在前，其余后台补齐；不阻塞） */
function syncAllTeams(force){
  if(!LIVE.allTeams.length) return;
  const list = staleTeams(force);
  if(!list.length){ LIVE.syncAt = Date.now(); markDataReady(); return; }
  const prio = t => {
    if(typeof state !== "undefined" && state.league && t.league === state.league) return 0;
    if(typeof state !== "undefined" && state.open && state.open[t.leagueId]) return 1;
    return 2;
  };
  const queue = list.slice().sort((a, b) => prio(a) - prio(b));
  const visible = queue.filter(t => prio(t) <= 1);
  const head = visible.length ? visible : queue.slice(0, SYNC_HEAD);
  const tail = queue.filter(t => head.indexOf(t) < 0);
  if(!SYNC.running){ SYNC.done = 0; SYNC.total = queue.length; SYNC.headSilent = false; }
  else SYNC.total += queue.length;
  /* 记录优先队：这些同步完就收起同步条（其余后台静默补齐） */
  head.forEach(t => { SYNC.headIds[t.id] = 1; });
  syncEnqueue(head, false);
  syncEnqueue(tail, false);
  syncPump();
}

/* 展开某联赛：把该联赛尚未同步的队提到队列最前 */
function syncLeague(lgId){
  if(!LIVE.allTeams.length) return;
  const stale = staleTeams(false).filter(t => t.leagueId === lgId);
  if(!stale.length) return;
  const ids = {};
  stale.forEach(t => { ids[t.id] = 1; });
  const inQueue = SYNC.queue.filter(t => ids[t.id]);
  if(inQueue.length){
    SYNC.queue = inQueue.concat(SYNC.queue.filter(t => !ids[t.id]));
    syncPump();
  }
}

/* 只重试失败的球队 */
function syncRetryFailed(){
  const teams = LIVE.allTeams.filter(t => SYNC.errors[t.espnId]);
  if(!teams.length) return;
  SYNC.errors = {};
  SYNC.done = 0;
  SYNC.total = teams.length;
  syncEnqueue(teams, true);
  syncPump();
}

function markDataReady(){
  const age = LIVE.syncAt ? Math.round((Date.now() - LIVE.syncAt) / 60000) : 0;
  syncUI(true, LIVE.allTeams.length, LIVE.allTeams.length, L("数据已就绪（" + age + " 分钟前同步，6 小时内无需再同步）· 点「重新同步」可强制更新", "Data ready (synced " + age + " min ago; valid 6h) · hit Re-sync to refresh"));
  setTimeout(() => { const b = document.getElementById("syncbar"); if(b && !LIVE.syncing) b.hidden = true; }, 4500);
}

/* ---------- 首页：全队实时数据（卡片近况 / 下一场 / 比分条） ---------- */
async function loadHomeLive(){
  syncAllTeams();
}

/* ---------- 联赛战绩条目（球队页概览：排名/战绩/进失球） ---------- */
function rankOverviewItems(rank){
  const items = [{ label: L("联赛排名", "League rank"), value: L("第 " + rank.rank + " 名", ordinal(rank.rank)) + (rank.rankChange ? (rank.rankChange > 0 ? " ↑" + rank.rankChange : " ↓" + Math.abs(rank.rankChange)) : "") }];
  if(typeof rank.wins === "number") items.push({ label: L("联赛战绩", "League record"), value: L(rank.wins + " 胜 " + rank.draws + " 平 " + rank.losses + " 负", rank.wins + "W " + rank.draws + "D " + rank.losses + "L") });
  if(rank.gf !== undefined && rank.gf !== "") items.push({ label: L("进 / 失球", "Goals for / against"), value: rank.gf + " / " + rank.ga + (rank.gd ? L("（净胜 " + rank.gd + "）", " (GD " + rank.gd + ")") : "") });
  if(rank.ppg) items.push({ label: L("场均积分", "Points / game"), value: esc(String(rank.ppg)) });
  if(rank.deductions) items.push({ label: L("扣分", "Deductions"), value: "-" + rank.deductions });
  return items;
}

/* ---------- 球队所属联赛（赛季数据/日志接口路径） ---------- */
function leagueIdOf(vt){
  if(!vt) return "";
  return vt.leagueId || (LIVE.teamLeague && LIVE.teamLeague[String(vt.espnId)]) || "";
}

/* ---------- 球队赛季数据（core API，12 小时缓存） ---------- */
const TSTATS_KEY = "ft-tstats-v1";
const TSTATS_TTL = 12 * 3600 * 1000;
const TEAM_STAT_GROUPS = [
  { zh:"进攻", en:"Attack", fields:[
    { key:"totalGoals", zh:"进球", en:"Goals" },
    { key:"avgGoals", zh:"场均进球", en:"Goals / game", fmt:"dec2" },
    { key:"totalShots", zh:"射门", en:"Shots" },
    { key:"shotsOnTarget", zh:"射正", en:"On target" },
    { key:"goalConversion", zh:"进球转化率", en:"Conversion", fmt:"pct100" },
    { key:"bigChanceCreated", zh:"绝佳机会", en:"Big chances" },
    { key:"avgExpectedGoals", zh:"预期进球 xG", en:"xG", fmt:"dec2", xg:true },
    { key:"goalAssists", zh:"助攻", en:"Assists" },
    { key:"penaltyKickGoals", zh:"点球进球", en:"Penalty goals" },
    { key:"penaltyKickPct", zh:"点球命中率", en:"Penalty conv.", fmt:"pct100" },
    { key:"penaltyKicksMissed", zh:"点球罚失", en:"Penalties missed" },
    { key:"freeKickGoals", zh:"定位球进球", en:"Free-kick goals" },
    { key:"headedGoals", zh:"头球进球", en:"Headed goals" },
    { key:"offsides", zh:"越位", en:"Offsides" }
  ]},
  { zh:"组织", en:"Build-up", fields:[
    { key:"possessionPct", zh:"控球率", en:"Possession", fmt:"pct" },
    { key:"passPct", zh:"传球成功率", en:"Pass accuracy", fmt:"pct100" },
    { key:"totalPasses", zh:"传球总数", en:"Passes" },
    { key:"accuratePasses", zh:"精准传球", en:"Accurate passes" },
    { key:"accurateThroughBalls", zh:"精准直塞", en:"Through balls" },
    { key:"throughBallPct", zh:"直塞成功率", en:"Through-ball acc.", fmt:"pct100" },
    { key:"totalCrosses", zh:"传中", en:"Crosses" },
    { key:"crossPct", zh:"传中成功率", en:"Cross accuracy", fmt:"pct100" },
    { key:"longballPct", zh:"长传成功率", en:"Long-ball accuracy", fmt:"pct100" }
  ]},
  { zh:"防守", en:"Defence", fields:[
    { key:"totalTackles", zh:"抢断", en:"Tackles" },
    { key:"effectiveTackles", zh:"有效抢断", en:"Effective tackles" },
    { key:"interceptions", zh:"拦截", en:"Interceptions" },
    { key:"totalClearance", zh:"解围", en:"Clearances" },
    { key:"blockedShots", zh:"封堵射门", en:"Blocked shots" },
    { key:"duelWinPct", zh:"对抗成功率", en:"Duels won", fmt:"pct100" },
    { key:"duelsWon", zh:"对抗成功", en:"Duels won (n)" },
    { key:"duelsLost", zh:"对抗失败", en:"Duels lost" },
    { key:"recoveries", zh:"争回球权", en:"Recoveries" },
    { key:"foulsCommitted", zh:"犯规", en:"Fouls" },
    { key:"foulsSuffered", zh:"被犯规", en:"Fouled" }
  ]},
  { zh:"门将", en:"Goalkeeping", fields:[
    { key:"saves", zh:"扑救", en:"Saves" },
    { key:"savePct", zh:"扑救率", en:"Save %", fmt:"pct100" },
    { key:"shotsFaced", zh:"面对射门", en:"Shots faced" },
    { key:"goalsConceded", zh:"失球", en:"Conceded" },
    { key:"cleanSheet", zh:"零封", en:"Clean sheets" },
    { key:"bigChanceSaves", zh:"重大机会扑救", en:"Big-chance saves" },
    { key:"punches", zh:"击出", en:"Punches" },
    { key:"crossesCaught", zh:"接高球", en:"Crosses caught" },
    { key:"penaltyKicksSaved", zh:"扑出点球", en:"Penalties saved" },
    { key:"penaltyKickSavePct", zh:"点球扑救率", en:"Penalty save %", fmt:"pct100" },
    { key:"avgExpectedGoalsConceded", zh:"预期失球 xGA", en:"xGA", fmt:"dec2", xg:true }
  ]},
  { zh:"纪律", en:"Discipline", fields:[
    { key:"yellowCards", zh:"黄牌", en:"Yellow cards" },
    { key:"redCards", zh:"红牌", en:"Red cards" },
    { key:"secondYellow", zh:"第二黄", en:"Second yellows" },
    { key:"suspensions", zh:"停赛", en:"Suspensions" },
    { key:"handBalls", zh:"手球", en:"Handballs" }
  ]},
  { zh:"主客 / 综合", en:"Home/away", fields:[
    { key:"homeGoals", zh:"主场进球", en:"Home goals" },
    { key:"awayGoals", zh:"客场进球", en:"Away goals" },
    { key:"winPct", zh:"胜率", en:"Win %", fmt:"pct100" },
    { key:"avgGoalDifferential", zh:"场均净胜", en:"Goal diff / game", fmt:"dec2" }
  ]}
];
function fmtStatVal(v, fmt){
  if(v === undefined || v === null || v === "") return "-";
  if(fmt === "pct") return parseFloat(v).toFixed(1).replace(/\.0$/, "") + "%";
  if(fmt === "pct100") return Math.round(parseFloat(v) * 100) + "%";
  if(fmt === "dec2") return parseFloat(v).toFixed(2);
  if(fmt === "dec1") return parseFloat(v).toFixed(1);
  return esc(String(v));
}
/* xG 类字段：ESPN 对中超等联赛恒返回 0（无数据），此时不显示该行，避免误导 */
function statHasValue(f, v){
  if(v === undefined || v === null || v === "") return false;
  if(f.xg && !parseFloat(v)) return false;
  return true;
}
function tstatsCacheRead(){ try { return JSON.parse(localStorage.getItem(TSTATS_KEY) || "{}"); } catch(e){ return {}; } }
function tstatsCacheWrite(c){ try { localStorage.setItem(TSTATS_KEY, JSON.stringify(c)); } catch(e){} }
/* 拉取/读取球队赛季数据（12h 缓存），返回原始 stats map；对比页与球队页共用；year 省略为当前赛季 */
async function ensureTeamStats(vt, year){
  if(!vt || !vt.espnId) return null;
  await ensureStandings();
  const lg = leagueIdOf(vt);
  if(!lg) return null;
  const y = parseInt(year, 10) || new Date().getFullYear();
  const ck = vt.espnId + ":" + y + ":v2";
  const cache = tstatsCacheRead();
  let stats = (cache[ck] && (Date.now() - cache[ck].at < TSTATS_TTL)) ? cache[ck].stats : null;
  if(!stats){
    try {
      const j = await fetchJson("https://sports.core.api.espn.com/v2/sports/soccer/leagues/" + lg + "/seasons/" + y + "/types/1/teams/" + vt.espnId + "/statistics", 12000, 1);
      if(j){
        const map = {};
        ((j.splits && j.splits.categories) || []).forEach(c => (c.stats || []).forEach(x => { map[x.name] = x; }));
        stats = {};
        Object.keys(map).forEach(k => { stats[k] = map[k].value != null ? map[k].value : map[k].displayValue; });
        if(Object.keys(stats).length){ cache[ck] = { at: Date.now(), stats: stats }; tstatsCacheWrite(cache); }
      }
    } catch(e) {}
  }
  return (stats && Object.keys(stats).length) ? stats : null;
}
/* 联赛各队赛季数据均值（复用各队缓存，最多 20 请求 / 12h 缓存） */
async function ensureLeagueStats(lgId, year){
  const y = parseInt(year, 10) || new Date().getFullYear();
  const key = "lgavg:" + lgId + ":" + y;
  const cache = histCacheRead();
  if(cache[key] && (Date.now() - cache[key].at < 12 * 3600 * 1000) && cache[key].avg) return cache[key].avg;
  const teams = (LIVE.allTeams || []).filter(t => t.leagueId === lgId && t.espnId);
  const maps = [];
  let i = 0;
  async function worker(){
    while(i < teams.length){
      const t = teams[i++];
      const s = await ensureTeamStats(t, y);
      if(s) maps.push(s);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  if(maps.length < 4) return null;
  const avg = {};
  TEAM_STAT_GROUPS.forEach(g => g.fields.forEach(f => {
    let sum = 0, n = 0;
    maps.forEach(m => { const v = parseFloat(m[f.key]); if(!isNaN(v)){ sum += v; n++; } });
    if(n) avg[f.key] = sum / n;
  }));
  cache[key] = { at: Date.now(), avg: avg };
  histCacheWrite(cache);
  return avg;
}
async function loadTeamStats(vt, year){
  const body = document.getElementById("team-stats-body");
  const wrap = document.getElementById("team-stats-wrap");
  if(!body || !vt || !vt.espnId) return;
  const y = parseInt(year, 10) || new Date().getFullYear();
  const lg = leagueIdOf(vt);
  if(lg){
    leagueSeasons(lg).then(years => {
      const sel = document.getElementById("team-season");
      if(!sel || !years || !years.length) return;
      sel.innerHTML = years.map(x => '<option value="' + x + '"' + (x === y ? " selected" : "") + '>' + esc(seasonLabel(lg, x)) + '</option>').join("");
      sel.disabled = false;
      if(!sel.dataset.bound){
        sel.dataset.bound = "1";
        sel.addEventListener("change", () => { loadTeamStats(vt, sel.value); });
      }
    });
  }
  body.innerHTML = loadingNoteHTML("正在加载赛季数据…", "Loading season stats…");
  const stats = await ensureTeamStats(vt, y);
  if(!stats){ body.innerHTML = emptyNoteHTML("该赛季暂无数据。", "No stats for this season."); return; }
  const groups = TEAM_STAT_GROUPS.map(g => ({
    zh: g.zh, en: g.en,
    items: g.fields.filter(f => statHasValue(f, stats[f.key]))
      .map(f => ({ label: L(f.zh, f.en), value: fmtStatVal(stats[f.key], f.fmt) }))
  }));
  if(!groups.some(g => g.items.length)){ body.innerHTML = emptyNoteHTML("该赛季暂无数据。", "No stats for this season."); return; }
  const nonEmpty = groups.filter(g => g.items.length);
  const main = nonEmpty.slice(0, 4), more = nonEmpty.slice(4);
  body.innerHTML = statGroupsHTML(main) +
    (more.length ? '<div id="team-stats-more" class="collapse"><div>' + statGroupsHTML(more) + '</div></div>' +
      '<button type="button" class="stats-more-btn" id="team-stats-toggle" aria-expanded="false">' + L("更多数据", "More stats") + '</button>' : '');
  if(more.length){
    const btn = document.getElementById("team-stats-toggle");
    const box = document.getElementById("team-stats-more");
    if(btn && box) btn.addEventListener("click", () => {
      const open = box.classList.toggle("open");
      btn.textContent = open ? L("收起", "Show less") : L("更多数据", "More stats");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  const tac = document.getElementById("team-tactics");
  if(tac) tac.innerHTML = tacticalRadarHTML(stats) + attackPatternsHTML(stats);
  const lga = document.getElementById("team-league-avg");
  if(lga && lg){
    lga.innerHTML = loadingNoteHTML("正在加载联赛平均…", "Loading league average…");
    ensureLeagueStats(lg, y).then(avg => {
      if(!lga) return;
      lga.innerHTML = leagueCompareHTML(stats, avg);
      const btn = document.getElementById("lga-toggle");
      const box = document.getElementById("lga-body");
      if(btn && box) btn.addEventListener("click", () => {
        const open = box.classList.toggle("open");
        btn.classList.toggle("on", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        const cue = btn.querySelector(".lga-t-cue");
        if(cue) cue.innerHTML = (open ? L("收起", "Hide") : L("展开", "Show")) + '<b class="chev">▾</b>';
      });
    });
  }
}

/* ---------- 比赛详情（点击战绩行懒加载） ---------- */
const MATCH_DETAILS = {};
const MATCH_STAT_FIELDS = [
  { key:"possessionPct", zh:"控球率", en:"Possession", fmt:"pct" },
  { key:"totalShots", zh:"射门", en:"Shots" },
  { key:"shotsOnTarget", zh:"射正", en:"On target" },
  { key:"passPct", zh:"传球成功率", en:"Pass accuracy", fmt:"pct100" },
  { key:"wonCorners", zh:"角球", en:"Corners" },
  { key:"offsides", zh:"越位", en:"Offsides" },
  { key:"foulsCommitted", zh:"犯规", en:"Fouls" },
  { key:"yellowCards", zh:"黄牌", en:"Yellow" },
  { key:"redCards", zh:"红牌", en:"Red" },
  { key:"saves", zh:"扑救", en:"Saves" },
  { key:"effectiveTackles", zh:"抢断", en:"Tackles" },
  { key:"interceptions", zh:"拦截", en:"Interceptions" }
];
const LEADER_LABELS = {
  totalShots:["射门","Shots"], accuratePasses:["传球","Passes"], defensiveInterventions:["防守","Defence"],
  saves:["扑救","Saves"], totalGoals:["进球","Goals"], goalAssists:["助攻","Assists"], tackles:["抢断","Tackles"],
  duelsWon:["对抗","Duels"], possessionPct:["控球","Possession"]
};
function zhName(n){ try { return isEN() ? n : (Translator.player(n) || n); } catch(e){ return n; } }
function zhTeamName(n){ try { return isEN() ? n : (Translator.team(n) || n); } catch(e){ return n; } }
function buildMatchDetail(j, vt){
  const evs = (j.keyEvents || []).filter(e => /goal|card|substitution/i.test((e.type && e.type.text) || ""));
  const events = evs.map(e => {
    const min = (e.clock && e.clock.displayValue) || "";
    const t = ((e.type && e.type.text) || "").toLowerCase();
    const ps = (e.participants || []).map(p => p.athlete && p.athlete.displayName).filter(Boolean);
    const assist = ps[1] ? L("（助攻：", " (assist: ") + esc(zhName(ps[1])) + L("）", ")") : "";
    let label = L("事件", "Event"), body = "";
    if(/substitution/.test(t)){ label = L("换人", "Sub"); body = esc(zhName(ps[0] || "")) + L(" 换下 ", " for ") + esc(zhName(ps[1] || "")); }
    else if(/second yellow|red/.test(t)){ label = L("红牌", "Red"); body = esc(zhName(ps[0] || "")); }
    else if(/yellow/.test(t)){ label = L("黄牌", "Yellow"); body = esc(zhName(ps[0] || "")); }
    else if(/own goal/.test(t)){ label = L("乌龙", "OG"); body = esc(zhName(ps[0] || "")); }
    else if(/penalty/.test(t)){ label = L("点球", "Pen"); body = esc(zhName(ps[0] || "")) + assist; }
    else { label = L("进球", "Goal"); body = esc(zhName(ps[0] || "")) + assist; }
    const cls = /substitution/.test(t) ? " md-sub" : " md-key";
    return '<div class="md-event' + cls + '"><b class="md-min num">' + esc(min) + '</b><span class="md-tag">' + label + '</span><span class="md-body">' + body + '</span></div>';
  });
  const teams = ((j.boxscore && j.boxscore.teams) || []);
  const statMap = t => { const m = {}; ((t && t.statistics) || []).forEach(x => { m[x.name] = x.displayValue != null ? x.displayValue : x.value; }); return m; };
  const hs = statMap(teams.filter(t => t.homeAway === "home")[0]);
  const as = statMap(teams.filter(t => t.homeAway === "away")[0]);
  const stats = MATCH_STAT_FIELDS.filter(f => hs[f.key] !== undefined || as[f.key] !== undefined).map(f => {
    const hv = parseFloat(hs[f.key]), av = parseFloat(as[f.key]);
    return { label: L(f.zh, f.en), h: fmtStatVal(hs[f.key], f.fmt), a: fmtStatVal(as[f.key], f.fmt),
      hv: isNaN(hv) ? null : hv, av: isNaN(av) ? null : av };
  });
  /* 比分牌（来自 header.competitions） */
  const hc = (j.header && j.header.competitions && j.header.competitions[0]) || {};
  const comps = hc.competitors || [];
  const ourId = vt ? String(vt.espnId || "") : "";
  const side = x => ({
    name: esc(zhTeamName((x.team && x.team.displayName) || "")),
    logo: (x.team && x.team.logos && x.team.logos[0] && x.team.logos[0].href) || "",
    score: x.score != null ? String(x.score) : "",
    winner: !!x.winner,
    our: !!(ourId && x.team && String(x.team.id) === ourId)
  });
  const score = {
    home: side(comps.filter(x => x.homeAway === "home")[0] || {}),
    away: side(comps.filter(x => x.homeAway === "away")[0] || {}),
    status: (hc.status && hc.status.type && hc.status.type.detail) || ""
  };
  const gi = j.gameInfo || {};
  const referee = ((gi.officials || [])[0] || {}).displayName || "";
  const info = ((gi.venue && gi.venue.fullName) ? L("场地：", "Venue: ") + esc(gi.venue.fullName) : "") +
    (gi.attendance ? L(" · 上座：", " · Attendance: ") + gi.attendance.toLocaleString() : "") +
    (referee ? L(" · 主裁：", " · Referee: ") + esc(referee) : "");
  const rosters = j.rosters || [];
  const lineups = {
    home: rosters.filter(r => r.homeAway === "home")[0] || null,
    away: rosters.filter(r => r.homeAway === "away")[0] || null
  };
  /* 本场数据领先者（summary.leaders：每队各项第一名） */
  const leaders = (() => {
    const ld = j.leaders || [];
    if(!ld.length) return [];
    const hid = String(((comps.filter(x => x.homeAway === "home")[0] || {}).team || {}).id || "");
    const aid = String(((comps.filter(x => x.homeAway === "away")[0] || {}).team || {}).id || "");
    const byTeam = {};
    ld.forEach(t => { if(t.team && t.team.id) byTeam[String(t.team.id)] = t; });
    const H = byTeam[hid], A = byTeam[aid];
    if(!H || !A) return [];
    return (H.leaders || []).map(c => {
      const ac = (A.leaders || []).filter(x => x.name === c.name)[0] || {};
      const hv = (c.leaders || [])[0] || {}, av = (ac.leaders || [])[0] || {};
      const lab = LEADER_LABELS[c.name] || [c.displayName || c.name, c.displayName || c.name];
      const side = o => ({ name: esc(zhName((o.athlete && o.athlete.displayName) || "")), value: esc(String(o.displayValue != null ? o.displayValue : (o.value != null ? o.value : ""))) });
      return { label: L(lab[0], lab[1]), home: side(hv), away: side(av) };
    }).filter(l => l.home.value !== "" || l.away.value !== "");
  })();
  const commentary = (j.commentary || []).slice().reverse().slice(0, 8).map(c => ({
    time: (c.time && c.time.displayValue) || "", text: String(c.text || "")
  })).filter(c => c.text);
  return { events: events, stats: stats, info: info, score: score, lineups: lineups, leaders: leaders, commentary: commentary };
}
async function loadMatchDetail(tr, vt){
  const evId = tr.dataset.ev;
  const lg = tr.dataset.lg || leagueIdOf(vt);
  if(!evId || !lg) return;
  const next = tr.nextElementSibling;
  if(next && next.classList.contains("md-row")){ next.hidden = !next.hidden; return; }
  const row = document.createElement("tr");
  row.className = "md-row";
  const td = document.createElement("td");
  td.colSpan = 6;
  td.innerHTML = matchDetailHTML({ loading: true, events: [], stats: [], info: "" });
  row.appendChild(td);
  tr.parentNode.insertBefore(row, tr.nextSibling);
  const key = evId + ":" + (vt.espnId || "");
  let d = MATCH_DETAILS[key];
  if(!d){
    try {
      const j = await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lg + "/summary?event=" + evId, 12000, 1);
      if(j){ d = buildMatchDetail(j, vt); MATCH_DETAILS[key] = d; }
    } catch(e) {}
  }
  td.innerHTML = d ? matchDetailHTML(d) : matchDetailHTML({ empty: true, events: [], stats: [], info: "" });
  if(d && d.commentary && d.commentary.length && !isEN()) translateCommentary(d, td);
}
/* 文字直播机器翻译（MyMemory，缓存复用 news.js 的 translateZh） */
async function translateCommentary(d, td){
  const holder = td.querySelector("#md-commentary");
  if(!holder) return;
  const list = d.commentary;
  let i = 0;
  async function worker(){ while(i < list.length){ const c = list[i++]; c.zh = (await translateZh(c.text)) || ""; } }
  await Promise.all([worker(), worker(), worker()]);
  if(holder.isConnected) holder.innerHTML = commentaryRowsHTML(list);
}

/* ---------- 球员详情（点击名单行懒加载：档案 + 赛季数据 + 逐场日志） ---------- */
const PLAYER_LOGS = {};
const LOG_LABELS = {
  totalGoals:["进球","G"], goalAssists:["助攻","A"], yellowCards:["黄牌","YC"], redCards:["红牌","RC"],
  saves:["扑救","SV"], goalsConceded:["失球","GA"], cleanSheet:["零封","CS"], foulsCommitted:["犯规","FC"],
  foulsSuffered:["被犯规","FA"], totalShots:["射门","SH"], shotsOnTarget:["射正","SOG"], offsides:["越位","OFF"],
  appearances:["出场","APP"], subIns:["替补","SUB"], starts:["首发","STRT"], minutes:["分钟","MIN"]
};
function logLabel(name, fallback){
  const m = LOG_LABELS[name];
  return m ? L(m[0], m[1]) : esc(fallback || name || "");
}
function buildPlayerLog(j){
  const labels = j.labels || [], names = j.names || [], evs = j.events || {};
  const rows = [];
  (j.seasonTypes || []).forEach(st => (st.categories || []).forEach(c => (c.events || []).forEach(x => {
    const m = evs[x.eventId];
    if(!m) return;
    const hs = parseInt(m.homeTeamScore, 10), as = parseInt(m.awayTeamScore, 10);
    const home = m.atVs !== "@";
    const mine = home ? hs : as, theirs = home ? as : hs;
    const rowStats = {};
    names.forEach((nm, i) => { rowStats[nm] = (x.stats || [])[i]; });
    rows.push({
      date: (m.gameDate || "").slice(0, 10),
      compRaw: (Translator.compCN[m.leagueName] || m.leagueName || m.leagueAbbreviation || ""),
      oppEn: (m.opponent && m.opponent.displayName) || "",
      resRaw: (m.gameResult === "W" ? "W" : m.gameResult === "L" ? "L" : "D"),
      score: (isNaN(mine) || isNaN(theirs) ? "" : mine + "-" + theirs),
      stats: rowStats,
      cells: (x.stats || []).map(v => String(v))
    });
  })));
  return { cols: labels, names: names, rows: rows.slice(0, 20) };
}
async function loadPlayerLog(vt, pid, holderId, year){
  const holder = document.getElementById(holderId);
  if(!holder) return;
  const lg = leagueIdOf(vt);
  if(!lg){ holder.innerHTML = emptyNoteHTML("暂无比赛日志。", "No match log available."); return; }
  const cur = new Date().getFullYear();
  const y = parseInt(year, 10) || cur;
  const ck = pid + ":" + y;
  let log = PLAYER_LOGS[ck];
  if(!log){
    try {
      const url = "https://site.web.api.espn.com/apis/common/v3/sports/soccer/" + lg + "/athletes/" + pid + "/gamelog" + (y === cur ? "" : "?season=" + y);
      const j = await fetchJson(url, 12000, 1);
      if(j){ log = buildPlayerLog(j); PLAYER_LOGS[ck] = log; }
    } catch(e) {}
  }
  holder.innerHTML = log ? playerLogHTML(log) : emptyNoteHTML("暂无比赛日志。", "No match log available.");
}
function togglePlayerDetail(vt, tr){
  const next = tr.nextElementSibling;
  if(next && next.classList.contains("pd-row")){ next.hidden = !next.hidden; return; }
  const pid = tr.dataset.pl;
  const p = (LIVE.rosters[vt.espnId] || []).filter(x => String(x.id) === String(pid))[0];
  if(!p) return;
  const bio = [];
  if(p.ht) bio.push({ label: L("身高", "Height"), value: esc(p.ht) });
  if(p.wt) bio.push({ label: L("体重", "Weight"), value: esc(p.wt) });
  if(p.dob) bio.push({ label: L("出生日期", "Born"), value: esc(p.dob) });
  const birth = [p.bc && (isEN() ? p.bc : (zhCity(p.bc) || p.bc)), p.bs, p.bco && (isEN() ? p.bco : (zhCountry(p.bco) || p.bco))].filter(Boolean).join(" · ");
  if(birth) bio.push({ label: L("出生地", "Birthplace"), value: esc(birth) });
  const statPairs = [
    ["出场","Apps",p.ap],["进球","Goals",p.g],["助攻","Assists",p.as],
    ["射门","Shots",p.shots],["射正","On target",p.sot],["越位","Offsides",p.off],
    ["犯规","Fouls",p.fc],["被犯规","Fouled",p.fa],["黄牌","YC",p.yc],["红牌","RC",p.rc],
    ["扑救","Saves",p.sv],["失球","Conceded",p.gc]
  ].filter(x => x[2] !== undefined && x[2] !== null && x[2] !== "")
   .map(x => ({ label: L(x[0], x[1]), value: esc(String(x[2])) }));
  const row = document.createElement("tr");
  row.className = "pd-row";
  const td = document.createElement("td");
  td.colSpan = 10;
  td.innerHTML = playerDetailHTML({ id: pid, bio: bio, stats: statPairs });
  row.appendChild(td);
  tr.parentNode.insertBefore(row, tr.nextSibling);
  loadPlayerLog(vt, pid, "pl-log-" + pid);
  loadPlayerSplits(vt, pid, "pl-splits-" + pid);
}

/* ---------- 球员各赛事数据（common v3 overview） ---------- */
const PLAYER_SPLITS = {};
function cleanCompName(name){
  return h2hComp(name);
}
function buildPlayerSplits(j){
  const st = j.statistics || {};
  const names = st.names || [];
  const idx = n => names.indexOf(n);
  const cols = [
    { key:"starts", zh:"首发", en:"Starts" },
    { key:"totalGoals", zh:"进球", en:"Goals" },
    { key:"goalAssists", zh:"助攻", en:"Assists" },
    { key:"totalShots", zh:"射门", en:"Shots" },
    { key:"shotsOnTarget", zh:"射正", en:"On target" }
  ].filter(c => idx(c.key) >= 0);
  const rows = [];
  (st.splits || []).forEach(sp => {
    const vals = sp.stats || [];
    rows.push({ compRaw: sp.displayName || "", vals: cols.map(c => vals[idx(c.key)]) });
  });
  return { cols: cols, rows: rows };
}
async function loadPlayerSplits(vt, pid, holderId){
  const holder = document.getElementById(holderId);
  if(!holder) return;
  const lg = leagueIdOf(vt);
  if(!lg) return;
  let d = PLAYER_SPLITS[pid];
  if(!d){
    try {
      const j = await fetchJson("https://site.web.api.espn.com/apis/common/v3/sports/soccer/" + lg + "/athletes/" + pid + "/overview", 12000, 1);
      if(j){ d = buildPlayerSplits(j); PLAYER_SPLITS[pid] = d; }
    } catch(e) {}
  }
  holder.innerHTML = d ? playerSplitsHTML(d) : "";
}

/* ---------- 赛前信息（未来比赛：赔率 + 近况） ---------- */
const PRE_MATCHES = {};
function usToDec(ml){
  const n = parseInt(ml, 10);
  if(isNaN(n)) return "";
  return n > 0 ? (1 + n / 100).toFixed(2) : (1 + 100 / Math.abs(n)).toFixed(2);
}
function buildPreMatch(j, vt){
  const hc = (j.header && j.header.competitions && j.header.competitions[0]) || {};
  const comps = hc.competitors || [];
  const home = comps.filter(x => x.homeAway === "home")[0] || {};
  const away = comps.filter(x => x.homeAway === "away")[0] || {};
  const nm = x => esc(zhTeamName((x.team && x.team.displayName) || ""));
  const o = (j.odds || []).filter(x => (x.homeTeamOdds && x.homeTeamOdds.moneyLine != null) || (x.awayTeamOdds && x.awayTeamOdds.moneyLine != null) || (x.drawOdds && x.drawOdds.moneyLine != null))[0] || null;
  let odds = null;
  if(o){
    const h = usToDec(o.homeTeamOdds && o.homeTeamOdds.moneyLine);
    const d = usToDec(o.drawOdds && o.drawOdds.moneyLine);
    const a = usToDec(o.awayTeamOdds && o.awayTeamOdds.moneyLine);
    if(h || d || a) odds = {
      homeName: nm(home), awayName: nm(away), home: h || "-", draw: d || "-", away: a || "-",
      ou: o.overUnder != null ? String(o.overUnder) : "",
      over: usToDec(o.overOdds), under: usToDec(o.underOdds),
      provider: (o.provider && o.provider.name) || ""
    };
    if(odds){
      const p = (j.pickcenter || [])[0] || {};
      const ho = p.homeTeamOdds || {}, ao = p.awayTeamOdds || {};
      const fav = ho.favorite ? nm(home) : (ao.favorite ? nm(away) : "");
      const openFav = ho.favoriteAtOpen ? nm(home) : (ao.favoriteAtOpen ? nm(away) : "");
      if(p.spread != null) odds.spread = p.spread > 0 ? "+" + p.spread : String(p.spread);
      odds.favName = fav;
      odds.openFavName = (openFav && openFav !== fav) ? openFav : "";
    }
  }
  const form = ((j.lastFiveGames) || []).slice(0, 2).map(g => {
    const pills = (g.events || []).slice(0, 5).map(e => {
      const r = String(e.gameResult || "").toUpperCase();
      const cls = r === "W" ? "w" : r === "L" ? "l" : "d";
      return '<i class="' + cls + '">' + L(RES_CN[r] || "-", r || "-") + '</i>';
    }).join("");
    return { name: esc(zhTeamName((g.team && g.team.displayName) || "")), pills: '<span class="form">' + pills + '</span>' };
  });
  return {
    odds: odds, form: form, title: nm(home) + ' <i>vs</i> ' + nm(away),
    date: (hc.date || "").slice(0, 10),
    venue: ((j.gameInfo && j.gameInfo.venue && j.gameInfo.venue.fullName) || ""),
    homeId: String((home.team && home.team.id) || ""),
    awayId: String((away.team && away.team.id) || ""),
    ourId: vt ? String(vt.espnId || "") : "",
    series: (((j.seasonseries || [])[0] || {}).events || [])
  };
}
async function loadPreMatch(tr, vt){
  const evId = tr.dataset.ev;
  const lg = tr.dataset.lg || leagueIdOf(vt);
  if(!evId || !lg) return;
  const next = tr.nextElementSibling;
  if(next && next.classList.contains("pm-row")){ next.hidden = !next.hidden; return; }
  const row = document.createElement("tr");
  row.className = "pm-row";
  const td = document.createElement("td");
  td.colSpan = 7;
  td.innerHTML = preMatchHTML({ loading: true });
  row.appendChild(td);
  tr.parentNode.insertBefore(row, tr.nextSibling);
  let d = PRE_MATCHES[evId];
  if(!d){
    try {
      const j = await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lg + "/summary?event=" + evId, 12000, 1);
      if(j){ d = buildPreMatch(j, vt); PRE_MATCHES[evId] = d; }
    } catch(e) {}
  }
  if(d) d.id = evId;
  td.innerHTML = d ? preMatchHTML(d) : preMatchHTML({ empty: true });
  if(d) loadH2H(d);
  if(d) loadMatchWeather(d, td);
}

/* ---------- 比赛天气（Open-Meteo，免费免 key） ---------- */
async function loadMatchWeather(d, td){
  const holder = td.querySelector("#pm-weather");
  if(!holder) return;
  const coords = d.venue ? (window.VENUE_COORDS || {})[d.venue] : null;
  if(!coords || !d.date){ holder.remove(); return; }
  try {
    const j = await fetchJson("https://api.open-meteo.com/v1/forecast?latitude=" + coords[0] + "&longitude=" + coords[1] +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=" + d.date + "&end_date=" + d.date, 10000, 1);
    const dl = j && j.daily;
    if(!dl || !dl.time || !dl.time.length){ holder.remove(); return; }
    holder.innerHTML = weatherHTML({
      code: dl.weather_code && dl.weather_code[0],
      tmax: dl.temperature_2m_max && dl.temperature_2m_max[0],
      tmin: dl.temperature_2m_min && dl.temperature_2m_min[0],
      pop: dl.precipitation_probability_max && dl.precipitation_probability_max[0],
      wind: dl.wind_speed_10m_max && dl.wind_speed_10m_max[0]
    });
  } catch(e) { holder.remove(); }
}

/* ---------- 历史交战（近 10 场，任意赛事；缓存 7 天） ---------- */
const H2H_CACHE = {};
const H2H_KEY = "ft-h2h-v1";
const H2H_TTL = 7 * 24 * 3600 * 1000;
function h2hCacheRead(){ try { return JSON.parse(localStorage.getItem(H2H_KEY) || "{}"); } catch(e){ return {}; } }
function h2hCacheWrite(c){ try { localStorage.setItem(H2H_KEY, JSON.stringify(c)); } catch(e){} }
function h2hComp(name){
  const base = String(name || "").replace(/^\d{4}([/-]\d{2,4})?\s+/, "").trim();
  const zh = Translator.compCN[base];
  if(zh) return dComp(zh);
  const rules = [
    [/champions league/i, "欧冠"], [/europa league/i, "欧联杯"], [/conference league/i, "欧协联"],
    [/premier league/i, "英超"], [/fa cup/i, "足总杯"], [/league cup|carabao|carling|capital one|efl cup/i, "联赛杯"],
    [/community shield/i, "社区盾"], [/la ?liga/i, "西甲"], [/copa del rey/i, "国王杯"], [/supercopa/i, "西班牙超级杯"],
    [/bundesliga/i, "德甲"], [/dfb[- ]?pokal|german cup/i, "德国杯"], [/serie a/i, "意甲"], [/coppa italia/i, "意大利杯"],
    [/ligue 1/i, "法甲"], [/coupe de france/i, "法国杯"], [/super league/i, "中超"]
  ];
  for(const r of rules) if(r[0].test(base)) return dComp(r[1]);
  return base;
}
function h2hScore(x){
  if(!x || x.score == null) return "";
  if(typeof x.score === "object") return x.score.displayValue != null ? String(x.score.displayValue) : String(x.score.value != null ? x.score.value : "");
  return String(x.score);
}
function h2hRow(id, date, comp, h, a, ourId){
  const hs = h2hScore(h), as = h2hScore(a);
  const our = String((h.team && h.team.id) || "") === ourId ? "h" : (String((a.team && a.team.id) || "") === ourId ? "a" : "");
  let res = "";
  if(our && hs !== "" && as !== ""){
    const m = parseInt(hs, 10), n = parseInt(as, 10);
    if(!isNaN(m) && !isNaN(n)) res = (m === n) ? "D" : ((our === "h" ? m > n : n > m) ? "W" : "L");
  }
  return { id: String(id), date: (date || "").slice(0, 10), comp: h2hComp(comp),
    home: esc(zhTeamName((h.team && h.team.displayName) || "")), away: esc(zhTeamName((a.team && a.team.displayName) || "")),
    hs: esc(hs), as: esc(as), res: res };
}
function h2hDedupeSort(rows){
  const seen = {}, out = [];
  rows.forEach(r => { if(r && r.id && !seen[r.id]){ seen[r.id] = 1; out.push(r); } });
  out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}
async function fetchTeamSeason(teamId, year){
  try {
    return await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/all/teams/" + teamId + "/schedule?season=" + year, 12000, 1);
  } catch(e) {}
  return null;
}
async function loadH2H(d){
  const holder = document.getElementById("h2h-" + d.id);
  if(!holder || !d.homeId || !d.awayId) return;
  const key = d.homeId + ":" + d.awayId;
  const cache = h2hCacheRead();
  let rows = H2H_CACHE[key] || ((cache[key] && (Date.now() - cache[key].at < H2H_TTL)) ? cache[key].rows : null);
  if(!rows){
    rows = h2hDedupeSort((d.series || []).map(e => {
      const cs = e.competitors || [];
      return h2hRow(e.id, e.date, e.competitionName, cs.filter(x => x.homeAway === "home")[0] || {}, cs.filter(x => x.homeAway === "away")[0] || {}, d.ourId);
    }));
    if(rows.length < 10){
      let year = rows.length ? parseInt(rows[rows.length - 1].date.slice(0, 4), 10) - 1 : new Date().getFullYear() - 1;
      for(let i = 0; i < 6 && rows.length < 10; i++, year--){
        const sc = await fetchTeamSeason(d.homeId, year);
        if(sc) (sc.events || []).forEach(e => {
          const c = e.competitions && e.competitions[0];
          if(!c) return;
          const cs = c.competitors || [];
          if(!cs.some(x => String(x.team.id) === d.awayId)) return;
          rows.push(h2hRow(e.id, e.date, (e.league && e.league.name) || "", cs.filter(x => x.homeAway === "home")[0] || {}, cs.filter(x => x.homeAway === "away")[0] || {}, d.ourId));
        });
        rows = h2hDedupeSort(rows).slice(0, 10);
      }
    }
    rows = rows.slice(0, 10);
    H2H_CACHE[key] = rows;
    cache[key] = { at: Date.now(), rows: rows };
    h2hCacheWrite(cache);
  }
  holder.innerHTML = h2hHTML(rows);
}
/* 对比页历史交战：扫 A 队近若干赛季赛程，筛出对 B 队的比赛（结果以 A 队视角，缓存 7 天） */
async function loadCompareH2H(a, b){
  const holder = document.getElementById("cmp-h2h");
  if(!holder || !a || !b || !a.espnId || !b.espnId) return;
  const key = "cmp:" + a.espnId + ":" + b.espnId;
  const cache = h2hCacheRead();
  let rows = H2H_CACHE[key] || ((cache[key] && (Date.now() - cache[key].at < H2H_TTL)) ? cache[key].rows : null);
  if(!rows){
    rows = [];
    const cur = new Date().getFullYear();
    for(let year = cur; year >= cur - 7 && rows.length < 10; year--){
      const sc = await fetchTeamSeason(a.espnId, year);
      if(sc) (sc.events || []).forEach(e => {
        const c = e.competitions && e.competitions[0];
        if(!c) return;
        const cs = c.competitors || [];
        if(!cs.some(x => String(x.team.id) === String(b.espnId))) return;
        rows.push(h2hRow(e.id, e.date, (e.league && e.league.name) || "",
          cs.filter(x => x.homeAway === "home")[0] || {}, cs.filter(x => x.homeAway === "away")[0] || {}, String(a.espnId)));
      });
      rows = h2hDedupeSort(rows).slice(0, 10);
    }
    H2H_CACHE[key] = rows;
    cache[key] = { at: Date.now(), rows: rows };
    h2hCacheWrite(cache);
  }
  holder.innerHTML = h2hHTML(rows);
}
