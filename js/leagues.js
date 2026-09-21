/* 联赛模块：6 大联赛配置 / 精选队-ESPN 映射 / ESPN 球队列表拉取 / 升降级 / 球队查找 */
"use strict";
const LEAGUES = [
  { id:"eng.1", cn:"英超", country:"英格兰" },
  { id:"esp.1", cn:"西甲", country:"西班牙" },
  { id:"ger.1", cn:"德甲", country:"德国" },
  { id:"ita.1", cn:"意甲", country:"意大利" },
  { id:"fra.1", cn:"法甲", country:"法国" },
  { id:"chn.1", cn:"中超", country:"中国" }
];

const EDITORIAL_BY_ESPN = {};   // ESPN id -> 人工资料球队 id（稍后填充）

/* 精选队 id -> ESPN id（原 ESPN_IDS） */
const ESPN_IDS = { mancity:"382", liverpool:"364", realmadrid:"86", barcelona:"83", bayern:"132", inter:"110", psg:"160", shanghaiport:"15515" };

Object.keys(ESPN_IDS).forEach(cid => { EDITORIAL_BY_ESPN[String(ESPN_IDS[cid])] = cid; });

/* 球队配色人工校正（ESPN 官方色数据不准时使用；键 = ESPN id，值 = [主色, 副色]）
   上海申花：ESPN 标注为红色 C60000，实际为申花蓝（队徽主蓝 #1048A0 同色系，方案 B 明亮版） */
const TEAM_COLOR_FIX = { "977": ["#2F7BD0", "#123C7A"] };
function teamColors(espnId, color, altColor){
  const fix = TEAM_COLOR_FIX[String(espnId)];
  return fix ? fix.slice() : [color, altColor];
}

/* ---------- 六大联赛球队列表 ---------- */
function mapEspnTeam(t, lg, dictTeam, prevIds){
  return {
    id: "espn:" + t.espnId, espnId: String(t.espnId),
    editorialId: EDITORIAL_BY_ESPN[String(t.espnId)] || null,
    name: zhTeam(t.en), en: t.en, initials: (dictTeam && dictTeam.abbr) || t.abbr || "",
    league: lg.cn, leagueId: lg.id,
    country: dictTeam && dictTeam.country ? zhCountry(dictTeam.country) : (lg.country || ""),
    city: dictTeam && dictTeam.city ? zhCity(dictTeam.city) : "",
    venue: dictTeam && dictTeam.venue ? zhVenue(dictTeam.venue) : "",
    venueEn: (dictTeam && dictTeam.venue) || "",
    colors: teamColors(t.espnId, t.color, t.altColor),
    logo: t.logo || (dictTeam && dictTeam.logo) || "",
    promoted: !!(prevIds && prevIds.length && prevIds.indexOf(String(t.espnId)) < 0)
  };
}

function buildTeamsFromDict(){
  const cur = (ZH.meta && ZH.meta.teams) || [];
  const prev = (ZH.meta && ZH.meta.prevSeason) || {};
  const list = [];
  cur.forEach(t => {
    const lg = LEAGUES.filter(l => l.id === t.league)[0] || { id:t.league, cn:t.leagueCN || t.league, country:"" };
    list.push(mapEspnTeam({
      espnId: t.espnId, en: t.en, abbr: t.abbr,
      color: "#" + (t.color || "888888"), altColor: "#" + (t.altColor || "444444"), logo: t.logo
    }, lg, t, prev[t.league]));
  });
  return list;
}

async function fetchLeagueTeamsOnce(lg){
  const url = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lg.id + "/teams";
  for(let i = 0; i < 3; i++){
    try {
      const r = await fetch(url, { cache:"no-store" });
      if(r.ok) return await r.json();
    } catch(e) {}
    await new Promise(res => setTimeout(res, 600 * (i + 1)));
  }
  return null;
}

async function loadLeagueTeams(){
  const parts = await Promise.all(LEAGUES.map(lg => fetchLeagueTeamsOnce(lg)));
  const dictTeams = (ZH.meta && ZH.meta.teams) || [];
  const prevSeason = (ZH.meta && ZH.meta.prevSeason) || {};
  const list = [];
  parts.forEach((j, i) => {
    if(!j) return;
    const lg = LEAGUES[i];
    const arr = (j.sports && j.sports[0] && j.sports[0].leagues[0] && j.sports[0].leagues[0].teams) || [];
    arr.forEach(x => {
      const t = x.team;
      const dictTeam = dictTeams.filter(d => String(d.espnId) === String(t.id))[0] || null;
      list.push(mapEspnTeam({
        espnId: String(t.id), en: t.displayName, abbr: t.abbreviation,
        color: "#" + (t.color || "888888"), altColor: "#" + (t.alternateColor || "444444"),
        logo: (t.logos && t.logos[0] && t.logos[0].href) || ""
      }, lg, dictTeam, prevSeason[lg.id]));
    });
  });
  if(list.length){ LIVE.allTeams = list; }
  else if(!LIVE.allTeams.length){ LIVE.allTeams = buildTeamsFromDict(); }
  return LIVE.allTeams;
}

function findTeam(id){
  if(id && id.indexOf("espn:") === 0){
    const eid = id.slice(5);
    const t = LIVE.allTeams.filter(x => x.espnId === eid)[0];
    if(t) return t;
    const cur = TEAMS.filter(x => String(ESPN_IDS[x.id]) === eid)[0];
    if(cur) return { id: id, espnId: eid, editorialId: cur.id, name: cur.name, en: cur.en, initials: cur.initials, league: cur.league, leagueId: "", country: cur.country, city: cur.city, venue: cur.stadium.name, colors: cur.colors, logo: "", promoted: false };
    return null;
  }
  const cur = TEAMS.filter(x => x.id === id)[0];
  if(cur) return { id: id, espnId: String(ESPN_IDS[cur.id] || ""), editorialId: cur.id, name: cur.name, en: cur.en, initials: cur.initials, league: cur.league, leagueId: "", country: cur.country, city: cur.city, venue: cur.stadium.name, colors: cur.colors, logo: "", promoted: false };
  return null;
}

/* 赛季标签：中超按日历年，其余按跨年（ESPN 用起始年，2026 = 2026-27） */
function seasonLabel(lgId, year){
  year = parseInt(year, 10);
  if(!year) return "";
  if(lgId === "chn.1") return String(year);
  return year + "-" + String(year + 1).slice(2);
}
/* 解析 #leaders/<lg>/<year> 或 #table/<lg>/<year> 的路由参数 */
function hashLeagueSeason(h, prefix){
  const parts = decodeURIComponent(h.slice(prefix.length)).split("/");
  return { lg: parts[0] || "", year: parts[1] || "" };
}
/* 解析 #league/<lg>/<tab>/<year>；tab 缺省 table */
function parseLeagueHash(h){
  const parts = decodeURIComponent(h.slice("#league/".length)).split("/");
  const tabs = ["table", "leaders", "cards"];
  const lg = parts[0] || "";
  const tab = tabs.indexOf(parts[1]) >= 0 ? parts[1] : "table";
  const year = (tabs.indexOf(parts[1]) >= 0 ? parts[2] : parts[1]) || "";
  return { lg: lg, tab: tab, year: year };
}
