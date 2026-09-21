/* 杯赛模块：足协杯（thecfa.cn，JSONP 绕 CORS）+ 亚冠精英/亚冠2（the-afc.com，CORS 直连）
   数据由 js/live.js 合并进球队页「比赛」区；内存缓存 30 分钟（与 ft-sync-v1 节奏一致）
   数据源：
   - 足协杯：https://data.thecfa.cn/gameplans.do?lid=<赛季ID>&year=<年>  （lid 每赛季不同，见 CFA_CUPS）
   - 亚冠：https://api.the-afc.com/sportdb-connector/api/v1/live/fixtures?competitionCodes=...&season=YYYYYYYY  */
"use strict";

const CUP_TTL = 30 * 60 * 1000;

/* 足协杯赛季配置（thecfa.cn 赛季 ID；新赛季在此追加/更新） */
const CFA_CUPS = [
  { lid: "202604221", year: 2026 },
  { lid: "20250409", year: 2025 }
];

/* 亚冠赛事（亚冠精英 + 亚冠2） */
const AFC_COMPS = [
  { code: "afc-champions-league-elite", cn: "亚冠精英联赛" },
  { code: "afc-champions-league-two", cn: "亚冠二级联赛" }
];

/* 亚冠赛季号：20262027 形式（7 月起算新赛季） */
function afcSeasonOf(d){
  const y = d.getFullYear();
  const start = (d.getMonth() >= 6) ? y : y - 1;
  return String(start) + String(start + 1);
}

const CUP = { at: 0, matches: null, loading: null };

/* JSONP：足协杯接口不支持 CORS，用 <script> 回调绕行 */
function cfaJsonp(url, timeout){
  return new Promise(resolve => {
    const cb = "__cfaCup" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    let done = false;
    const timer = setTimeout(() => finish([]), timeout || 15000);
    function finish(data){
      if(done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[cb]; } catch(e) { window[cb] = undefined; }
      if(s.parentNode) s.parentNode.removeChild(s);
      resolve(data);
    }
    window[cb] = data => finish(Array.isArray(data) ? data : []);
    s.onerror = () => finish([]);
    s.src = url + "&callback=" + cb;
    document.head.appendChild(s);
  });
}

function parseCfaMatch(m){
  const gt = String((m && m.gametime) || "").trim();
  if(!gt) return null;
  const ts = new Date(gt.replace(" ", "T")).getTime();
  if(isNaN(ts)) return null;
  const sc = String((m && m.score) || "").trim().match(/^(\d+)\s*:\s*(\d+)$/);
  return {
    src: "cfa", comp: "足协杯",
    ts: ts, date: gt.slice(0, 10), time: gt.slice(11, 16),
    home: String((m && m.hostteamname) || "").trim(), away: String((m && m.clientteamname) || "").trim(),
    homeAbbr: "", awayAbbr: "",
    gf: sc ? parseInt(sc[1], 10) : null, ga: sc ? parseInt(sc[2], 10) : null,
    state: sc ? "post" : "pre",
    stadium: String((m && m.stadium) || "").trim()
  };
}

function parseAfcMatch(m, compCN){
  const d = String((m && m.dateVenue) || "").trim();
  if(!d) return null;
  const tm = String((m && m.timeVenueUTC) || "00:00:00").slice(0, 8);
  const off = (m && m.stadium && m.stadium.offset) || "+00:00";
  const ts = new Date(d + "T" + tm + off).getTime();
  if(isNaN(ts)) return null;
  const played = m.status === "played" && m.result;
  return {
    src: "afc", comp: compCN,
    ts: ts, date: d, time: tm.slice(0, 5),
    home: String((m.homeTeam && m.homeTeam.name) || "").trim(), away: String((m.awayTeam && m.awayTeam.name) || "").trim(),
    homeAbbr: String((m.homeTeam && m.homeTeam.abbreviation) || "").trim().toUpperCase(),
    awayAbbr: String((m.awayTeam && m.awayTeam.abbreviation) || "").trim().toUpperCase(),
    gf: played ? m.result.homeGoals : null, ga: played ? m.result.awayGoals : null,
    state: played ? "post" : "pre",
    stadium: String((m.stadium && m.stadium.name) || "").trim()
  };
}

/* 拉取全部杯赛数据（缓存 30 分钟；force=true 强制刷新） */
async function fetchCupMatches(force){
  const now = Date.now();
  if(!force && CUP.matches && (now - CUP.at) < CUP_TTL) return CUP.matches;
  if(CUP.loading) return CUP.loading;
  CUP.loading = (async () => {
    const jobs = [];
    CFA_CUPS.forEach(c => jobs.push(
      cfaJsonp("https://data.thecfa.cn/gameplans.do?lid=" + c.lid + "&year=" + c.year)
        .then(list => (list || []).map(parseCfaMatch).filter(Boolean))
    ));
    const today = new Date();
    const from = new Date(today.getTime() - 150 * 86400000);
    const to = new Date(today.getTime() + 150 * 86400000);
    const iso = x => x.toISOString().slice(0, 10);
    const seasons = [];
    const s1 = afcSeasonOf(from), s2 = afcSeasonOf(to);
    seasons.push(s1); if(s2 !== s1) seasons.push(s2);
    AFC_COMPS.forEach(c => seasons.forEach(season => jobs.push(
      fetchJson("https://api.the-afc.com/sportdb-connector/api/v1/live/fixtures?competitionCodes=" + c.code +
        "&season=" + season + "&locale=en&source=opta&dateFrom=" + iso(from) + "&dateTo=" + iso(to), 15000, 1)
        .then(j => ((j && (j.data || j)) || []).map(m => parseAfcMatch(m, c.cn)).filter(Boolean))
    )));
    const lists = await Promise.all(jobs);
    const all = [];
    lists.forEach(l => l.forEach(x => all.push(x)));
    CUP.matches = all;
    CUP.at = Date.now();
    CUP.loading = null;
    return all;
  })();
  try { return await CUP.loading; }
  catch(e) { CUP.loading = null; return CUP.matches || []; }
}

function clearCupCache(){ CUP.at = 0; CUP.matches = null; CUP.loading = null; }

/* 队名匹配：中文名去空格/“队”后互相包含；亚冠比缩写与「去 FC 后缀后全等」的英文名 */
function cupNormCn(s){ return String(s || "").replace(/[\s·．\.]/g, "").replace(/队$/, ""); }
function cupWords(s){
  return String(s || "").toUpperCase().replace(/[^A-Z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w && !/^(FC|CF|SC|AFC|CLUB)$/.test(w)).join("");
}
function cupSideMatch(name, abbr, vt){
  if(abbr && vt.initials && abbr === String(vt.initials).toUpperCase()) return true;
  const n = cupNormCn(vt.name), c = cupNormCn(name);
  if(n && c && (c === n || c.indexOf(n) === 0 || n.indexOf(c) === 0)) return true;
  const en = cupWords(vt.en), ce = cupWords(name);
  if(en && ce && en === ce) return true;
  return false;
}

/* 某队的杯赛场次（转换为战绩/赛程统一格式；对手走词典翻译） */
function cupMatchesOf(vt, matches){
  const results = [], fixtures = [];
  (matches || []).forEach(m => {
    const isHome = cupSideMatch(m.home, m.homeAbbr, vt);
    const isAway = !isHome && cupSideMatch(m.away, m.awayAbbr, vt);
    if(!isHome && !isAway) return;
    const oppRaw = isHome ? m.away : m.home;
    const opp = (m.src === "afc") ? (zhTeam(oppRaw) || zhTeam(oppRaw + " FC") || oppRaw) : oppRaw;
    const item = {
      ts: m.ts, date: m.date, time: m.time, comp: m.comp, opp: opp,
      home: isHome,
      gf: isHome ? m.gf : m.ga, ga: isHome ? m.ga : m.gf,
      stadium: m.stadium || "待定", state: m.state
    };
    (m.state === "post" ? results : fixtures).push(item);
  });
  return { results: results, fixtures: fixtures };
}
