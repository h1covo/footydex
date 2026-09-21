/* 球员主页模块：离线索引秒开（hero + 赛季数据），各赛事数据 / 逐场比赛按需联网 */
"use strict";
function bindPlayerBack(){
  const back = document.getElementById("player-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
}
/* 名单里的详细资料（身高/体重/生日/射门…）按需补拉一次，成功后只刷新资料块 */
function enrichPlayerProfile(e){
  const t = e.team;
  if(!t || !t.espnId || typeof fetchRoster !== "function") return;
  const full = (LIVE.rosters[t.espnId] || []).filter(x => String(x.id) === e.id)[0];
  if(full && (full.dob || full.ht)) return;
  if(LIVE.rostersAt[t.espnId] && (Date.now() - LIVE.rostersAt[t.espnId] < ROSTER_TTL)) return;
  fetchRoster(t.espnId, t.leagueId).then(list => {
    if(!list || !list.length) return;
    LIVE.rosters[t.espnId] = list;
    LIVE.rostersAt[t.espnId] = Date.now();
    if(location.hash.indexOf("#player/" + e.id) !== 0) return;
    const p = list.filter(x => String(x.id) === e.id)[0];
    const holder = document.getElementById("player-profile");
    if(p && holder) holder.innerHTML = playerProfileHTML(Object.assign({}, e, p));
    if(p && p.flag){
      const chip = document.querySelector(".pl-flag-chip");
      if(chip && !chip.querySelector("img")) chip.insertAdjacentHTML("afterbegin", '<img src="' + esc(p.flag) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">');
    }
  }).catch(() => {});
}
/* 球员职业生涯赛季（跨联赛：leagues/all/athletes/{id}/seasons） */
const PLAYER_CAREER = {};
const LG_PRIO = { "eng.1":3, "esp.1":3, "ger.1":3, "ita.1":3, "fra.1":3, "chn.1":3, "uefa.champions":2, "uefa.europa":1 };
async function playerCareerSeasons(e){
  if(PLAYER_CAREER[e.id]) return PLAYER_CAREER[e.id];
  const j = await fetchJson("https://sports.core.api.espn.com/v2/sports/soccer/leagues/all/athletes/" + e.id + "/seasons?limit=100", 12000, 1);
  const byYear = {};
  ((j && j.items) || []).forEach(it => {
    const m = String(it.$ref || "").match(/leagues\/([^/]+)\/seasons\/(\d+)/);
    if(!m) return;
    const lg = m[1], y = parseInt(m[2], 10), p = LG_PRIO[lg] || 0;
    if(!byYear[y]) byYear[y] = { year: y, comps: [] };
    if(!byYear[y].comps.some(c => c.lg === lg)) byYear[y].comps.push({ lg: lg, p: p });
  });
  const list = Object.keys(byYear).map(y => byYear[y]).sort((a, b) => b.year - a.year);
  list.forEach(x => x.comps.sort((a, b) => b.p - a.p || a.lg.localeCompare(b.lg)));
  PLAYER_CAREER[e.id] = list;
  return list;
}
/* 球员赛季数据（core API，任意赛季 / 任意赛事；比名单字段全） */
const PLAYER_SEASON_CACHE = {};
async function loadPlayerSeasonStats(e, sel){
  const holder = document.getElementById("player-season-body");
  if(!holder) return;
  let lg = "", y = 0;
  const parts = String(sel || "").split(":");
  if(parts.length === 2){ lg = parts[0]; y = parseInt(parts[1], 10); }
  else { y = parseInt(parts[0], 10); }
  const cur = new Date().getFullYear();
  if(!y) y = cur;
  if(!lg){
    const career = await playerCareerSeasons(e);
    const entry = career.filter(x => x.year === y)[0];
    lg = entry ? entry.comps[0].lg : ((typeof leagueIdOf === "function" && e.team) ? leagueIdOf(e.team) : "");
  }
  if(!lg){ holder.innerHTML = emptyNoteHTML("该赛季暂无数据。", "No stats for this season."); return; }
  const ck = e.id + ":" + lg + ":" + y;
  if(PLAYER_SEASON_CACHE[ck]){ holder.innerHTML = playerSeasonStatsHTML(PLAYER_SEASON_CACHE[ck]); return; }
  holder.innerHTML = loadingNoteHTML("正在加载赛季数据…", "Loading season stats…");
  try {
    const j = await fetchJson("https://sports.core.api.espn.com/v2/sports/soccer/leagues/" + lg + "/seasons/" + y + "/types/1/athletes/" + e.id + "/statistics", 12000, 1);
    const map = {};
    ((j && j.splits && j.splits.categories) || []).forEach(c => (c.stats || []).forEach(x => { map[x.name] = x.value != null ? x.value : x.displayValue; }));
    PLAYER_SEASON_CACHE[ck] = map;
    if(location.hash.indexOf("#player/" + e.id) === 0){
      holder.innerHTML = playerSeasonStatsHTML(map);
      if(typeof loadPlayerLog === "function" && e.team) loadPlayerLog(e.team, e.id, "pl-log-" + e.id, y);
    }
  } catch(err) { holder.innerHTML = emptyNoteHTML("该赛季暂无数据。", "No stats for this season."); }
}
async function fillPlayerSeasonSelect(e){
  const sel = document.getElementById("player-season");
  if(!sel || !e.team) return "";
  const list = await playerCareerSeasons(e);
  if(!list.length) return "";
  sel.innerHTML = list.map(x => '<optgroup label="' + esc(seasonLabel(x.comps[0].lg, x.year)) + '">' +
    x.comps.map(c => '<option value="' + c.lg + ":" + x.year + '">' + esc(lgName(c.lg)) + '</option>').join("") + '</optgroup>').join("");
  sel.disabled = false;
  const def = list[0].comps[0].lg + ":" + list[0].year;
  sel.value = def;
  sel.addEventListener("change", () => { loadPlayerSeasonStats(e, sel.value); });
  return def;
}
function renderPlayer(pid){
  const wrap = document.getElementById("player-content");
  if(!wrap) return;
  const e = (typeof playerById === "function") ? playerById(pid) : null;
  if(!e){
    wrap.innerHTML = '<button class="back" id="player-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
      emptyNoteHTML("未找到该球员。", "Player not found.");
    bindPlayerBack();
    return;
  }
  wrap.innerHTML = playerPageHTML(e);
  bindPlayerBack();
  if(typeof updatePlayerFavBtn === "function") updatePlayerFavBtn();
  if(typeof bindFavPlayerStars === "function") bindFavPlayerStars(wrap);
  fillPlayerSeasonSelect(e).then(def => { if(def) loadPlayerSeasonStats(e, def); });
  const t = e.team;
  if(t){
    if(typeof loadPlayerSplits === "function") loadPlayerSplits(t, e.id, "pl-splits-" + e.id);
    if(typeof loadPlayerLog === "function") loadPlayerLog(t, e.id, "pl-log-" + e.id, new Date().getFullYear());
    enrichPlayerProfile(e);
  }
}
