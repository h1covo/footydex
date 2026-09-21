/* 滚动条模块：昨天 + 今天热门比赛赛果（6 大联赛 + 欧冠 + 欧联，ESPN 各联赛记分板）
   进站秒显（localStorage 缓存）→ 后台 16 个小请求并行刷新；「重新同步」也会强制刷新 */
"use strict";

const TICKER_KEY = "ft-ticker-v1";
const TICKER_MAX = 14;
const TICKER_LEAGUES = [
  { id: "eng.1", cn: "英超" },
  { id: "esp.1", cn: "西甲" },
  { id: "ger.1", cn: "德甲" },
  { id: "ita.1", cn: "意甲" },
  { id: "fra.1", cn: "法甲" },
  { id: "chn.1", cn: "中超" },
  { id: "uefa.champions", cn: "欧冠" },
  { id: "uefa.europa", cn: "欧联杯" }
];

let TICKER_ITEMS = null;      // 当前展示数据（语言切换重绘用）
let TICKER_FETCHING = null;   // 进行中的拉取

function tickerDateStr(offsetDays){
  const d = new Date(Date.now() + offsetDays * 86400000);
  return "" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
}

/* 本地「昨天 00:00 ~ 今天 24:00」时间窗（用于过滤跨时区的场次） */
function tickerWindow(){
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const from = start.getTime() - 86400000;
  const to = start.getTime() + 2 * 86400000;
  return { from: from, to: to };
}

function tickerItemFromEvent(e, leagueCN){
  const c = e.competitions && e.competitions[0];
  if(!c) return null;
  const comps = c.competitors || [];
  const home = comps.filter(x => x.homeAway === "home")[0];
  const away = comps.filter(x => x.homeAway === "away")[0];
  if(!home || !away) return null;
  const st = (c.status && c.status.type) || {};
  const state = st.state || "pre";
  if(state === "pre") return null;   // 只展示赛果（已完赛 / 进行中）
  const ts = new Date(e.date).getTime();
  const sc = x => (x.score !== undefined && x.score !== null && x.score !== "") ? String(x.score) : "-";
  return {
    ts: ts,
    comp: leagueCN,
    homeEn: (home.team && (home.team.displayName || home.team.name)) || "",
    awayEn: (away.team && (away.team.displayName || away.team.name)) || "",
    hs: sc(home), as: sc(away),
    live: state === "in",
    status: state === "in" ? ((c.status && (c.status.displayClock || st.shortDetail)) || "进行中") : ""
  };
}

async function fetchHotMatches(){
  const days = [tickerDateStr(-1), tickerDateStr(0)];
  const win = tickerWindow();
  const jobs = [];
  TICKER_LEAGUES.forEach(lg => days.forEach(dt => {
    const url = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lg.id + "/scoreboard?dates=" + dt;
    jobs.push(
      fetchJson(url, 8000)
        .then(j => ((j && j.events) || []).map(e => tickerItemFromEvent(e, lg.cn)).filter(Boolean))
        .catch(() => [])
    );
  }));
  const lists = await Promise.all(jobs);
  const items = [];
  lists.forEach(l => l.forEach(x => { if(x.ts >= win.from && x.ts < win.to) items.push(x); }));
  items.sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || b.ts - a.ts);
  return items.slice(0, TICKER_MAX);
}

function tickerCacheRead(){
  try {
    const raw = localStorage.getItem(TICKER_KEY);
    if(!raw) return null;
    const p = JSON.parse(raw);
    return (p && p.items && p.items.length) ? p.items : null;
  } catch(e) { return null; }
}
function tickerCacheWrite(items){
  try { localStorage.setItem(TICKER_KEY, JSON.stringify({ at: Date.now(), items: items })); } catch(e) {}
}

function tickerHTML(items){
  return items.map(x => {
    const home = isEN() ? x.homeEn : Translator.team(x.homeEn);
    const away = isEN() ? x.awayEn : Translator.team(x.awayEn);
    const tag = x.live
      ? '<i class="live">' + esc(x.status || L("进行中", "LIVE")) + '</i>'
      : '<i class="ft">' + L("完场", "FT") + '</i>';
    return '<span class="tick">' + esc(Translator.dComp(x.comp)) + ' <b>' + esc(home) + '</b> <span class="sc">' +
      esc(x.hs) + '–' + esc(x.as) + '</span> <b>' + esc(away) + '</b> ' + tag + '</span>';
  }).join("");
}

function renderTicker(){
  const el = document.getElementById("ticker");
  const track = document.getElementById("ticker-track");
  if(!el || !track) return;
  const items = TICKER_ITEMS || [];
  if(!items.length){
    el.hidden = true;
    document.documentElement.style.setProperty("--stick-top", "0px");
    return;
  }
  const html = tickerHTML(items);
  track.innerHTML = html + html;
  el.hidden = false;
  /* 按内容宽度定速（约 110px/s，最少 10 秒一圈）：条目少时也不会慢悠悠 */
  const halfW = track.scrollWidth / 2;
  if(halfW > 0) track.style.animationDuration = Math.max(10, Math.round(halfW / 110)) + "s";
  document.documentElement.style.setProperty("--stick-top", el.offsetHeight + "px");
}

/* 进站：缓存秒显 + 后台刷新；重复调用不会重复拉取 */
function buildTicker(){
  if(!TICKER_ITEMS){
    const cached = tickerCacheRead();
    if(cached){ TICKER_ITEMS = cached; renderTicker(); }
  } else renderTicker();
  if(TICKER_FETCHING) return TICKER_FETCHING;
  TICKER_FETCHING = fetchHotMatches()
    .then(items => {
      TICKER_FETCHING = null;
      if(items && items.length){ TICKER_ITEMS = items; tickerCacheWrite(items); renderTicker(); }
      else if(!TICKER_ITEMS) renderTicker();
    })
    .catch(() => { TICKER_FETCHING = null; if(!TICKER_ITEMS) renderTicker(); });
  return TICKER_FETCHING;
}
