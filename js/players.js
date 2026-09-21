/* 球员模块：ESPN 名单拉取（名单表 / 头像 / 页签已迁入 templates.js） */
"use strict";
const POS_CN = { G:"门将", D:"后卫", M:"中场", F:"前锋" };

async function fetchRoster(espnId, leagueId){
  const url = "https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + (leagueId || "all") + "/teams/" + espnId + "/roster?enable=roster";
  const r = await fetch(url, { cache:"no-store" });
  if(!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const out = [];
  (j.athletes || []).forEach(a => {
    if(!a || !a.fullName) return;
    const st = { ap:0, g:0, a:0, yc:0, rc:0, shots:0, sot:0, off:0, fc:0, fa:0, sv:0, gc:0, sub:0 };
    try {
      ((a.statistics.splits.categories) || []).forEach(c => (c.stats || []).forEach(x => {
        if(x.name === "appearances") st.ap = Math.round(x.value);
        if(x.name === "totalGoals") st.g = Math.round(x.value);
        if(x.name === "goalAssists") st.a = Math.round(x.value);
        if(x.name === "yellowCards") st.yc = Math.round(x.value);
        if(x.name === "redCards") st.rc = Math.round(x.value);
        if(x.name === "totalShots") st.shots = Math.round(x.value);
        if(x.name === "shotsOnTarget") st.sot = Math.round(x.value);
        if(x.name === "offsides") st.off = Math.round(x.value);
        if(x.name === "foulsCommitted") st.fc = Math.round(x.value);
        if(x.name === "foulsSuffered") st.fa = Math.round(x.value);
        if(x.name === "saves") st.sv = Math.round(x.value);
        if(x.name === "goalsConceded") st.gc = Math.round(x.value);
        if(x.name === "subIns") st.sub = Math.round(x.value);
      }));
    } catch(e) {}
    const bp = a.birthPlace || {};
    const htIn = parseInt(a.height, 10), wtLb = parseInt(a.weight, 10);
    out.push({
      id: String(a.id), en: a.fullName, name: zhPlayer(a.fullName),
      no: parseInt(a.jersey, 10) || 0,
      pos: POS_CN[(a.position && a.position.abbreviation) || ""] || "球员",
      nat: (ZH.playersNat && ZH.playersNat[a.fullName]) || zhCountry(a.citizenship || ""),
      age: a.age || "",
      headshot: (a.headshot && a.headshot.href) || "",
      flag: (a.flag && a.flag.href) || "",
      ht: htIn ? Math.round(htIn * 2.54) + " cm" : "",
      wt: wtLb ? Math.round(wtLb * 0.4536) + " kg" : "",
      dob: (a.dateOfBirth || "").slice(0, 10),
      bc: bp.city || "", bs: bp.state || "", bco: bp.country || "",
      ap: st.ap, g: st.g, as: st.a, yc: st.yc, rc: st.rc,
      shots: st.shots, sot: st.sot, off: st.off, fc: st.fc, fa: st.fa, sv: st.sv, gc: st.gc, sub: st.sub
    });
  });
  return out;
}

/* ---------- 球员全局索引（离线：快照名单 + 球队表，零请求） ---------- */
let PLAYER_INDEX = null;
function playerIndex(){
  if(PLAYER_INDEX) return PLAYER_INDEX;
  const byId = {};
  (LIVE.allTeams || []).forEach(t => { byId[t.espnId] = t; });
  const idx = [];
  Object.keys(LIVE.rosters || {}).forEach(eid => {
    const t = byId[eid] || null;
    (LIVE.rosters[eid] || []).forEach(p => {
      if(!p || !p.id) return;
      idx.push({
        id: String(p.id), en: p.en || "", name: p.name || p.en || "",
        no: p.no || 0, pos: p.pos || "", nat: p.nat || "", age: p.age || "", flag: p.flag || "",
        ap: p.ap, g: p.g, as: p.as, yc: p.yc, rc: p.rc,
        team: t, eid: eid
      });
    });
  });
  PLAYER_INDEX = idx;
  return idx;
}
function playerById(pid){
  pid = String(pid);
  const all = playerIndex();
  for(let i = 0; i < all.length; i++) if(all[i].id === pid) return all[i];
  return null;
}
/* ---------- 球员模糊搜索：归一化 / 拼音 / 编辑距离容错 ---------- */
function normText(s){ return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function compactLatin(s){ return normText(s).replace(/[^a-z0-9]/g, ""); }
function compactZh(s){ return String(s == null ? "" : s).replace(/[^\u4e00-\u9fa5]/g, ""); }
function zhPinyin(s){
  const m = (typeof window !== "undefined" && window.PINYIN_ZH) || null;
  if(!m) return "";
  let out = "";
  for(const ch of String(s || "")) if(ch >= "\u4e00" && ch <= "\u9fa5") out += (m[ch] || "");
  return out;
}
/* Damerau-Levenshtein（相邻字符调换算 1 次），带阈值：只关心是否 ≤ max，格子值饱和在 max+1 */
function editDistance(a, b, max){
  const n = a.length, m = b.length;
  if(Math.abs(n - m) > max) return max + 1;
  const cap = max + 1;
  let r0 = new Array(m + 1), r1 = new Array(m + 1), r2 = new Array(m + 1);
  for(let j = 0; j <= m; j++) r1[j] = j < cap ? j : cap;
  for(let i = 1; i <= n; i++){
    r2[0] = i < cap ? i : cap;
    const ca = a.charCodeAt(i - 1);
    for(let j = 1; j <= m; j++){
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      let v = r1[j - 1] + cost;
      if(r1[j] + 1 < v) v = r1[j] + 1;
      if(r2[j - 1] + 1 < v) v = r2[j - 1] + 1;
      if(i > 1 && j > 1 && ca === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1) && r0[j - 2] + 1 < v) v = r0[j - 2] + 1;
      r2[j] = v > cap ? cap : v;
    }
    const t = r0; r0 = r1; r1 = r2; r2 = t;
  }
  return r1[m];
}
/* 允许的编辑距离：中文按字数（2 字也容忍 1 个错字），拉丁按长度（3 字符内不放宽容错，避免噪音） */
function editBudget(len, zh){
  if(zh){ if(len <= 1) return 0; if(len <= 5) return 1; if(len <= 9) return 2; return 3; }
  if(len <= 3) return 0; if(len <= 5) return 1; if(len <= 9) return 2; return 3;
}
function isSubsequence(q, s){
  let i = 0;
  for(let j = 0; i < q.length && j < s.length; j++) if(s.charCodeAt(j) === q.charCodeAt(i)) i++;
  return i === q.length;
}
/* 单个候选串的匹配分：完全相等 > 前缀 > 子串 > 编辑距离容错 > 子序列 */
function scoreCandidate(q, cand, zh){
  if(!q || !cand) return 0;
  if(cand === q) return 100;
  if(cand.indexOf(q) === 0) return 90;
  if(cand.indexOf(q) > 0) return 80;
  const budget = editBudget(q.length, zh);
  if(budget){
    const d = editDistance(q, cand, budget);
    if(d <= budget) return 55 - d * 5;
  }
  if(q.length >= 4 && cand.length > q.length && isSubsequence(q, cand)) return 35;
  return 0;
}
/* 每个球员的可匹配串（整名 / 分节 / 拼音 / 英文单词），只算一次 */
function playerKeys(p){
  if(p._keys) return p._keys;
  const cands = [];
  const push = s => { if(s && cands.indexOf(s) < 0) cands.push(s); };
  const zh = p.name || "", en = p.en || "";
  const zhTok = zh.split(/[·・\s]+/).filter(Boolean);
  const enTok = en.split(/\s+/).filter(Boolean);
  push(compactZh(zh));
  zhTok.forEach(t => push(compactZh(t)));
  push(zhPinyin(zh));
  zhTok.forEach(t => { const py = zhPinyin(t); push(py); if(py.indexOf("v") >= 0) push(py.replace(/v/g, "u")); });
  push(compactLatin(en));
  enTok.forEach(t => push(compactLatin(t)));
  p._keys = cands;
  return cands;
}
function searchPlayers(q, teamFilter){
  const raw = (q || "").trim();
  if(!raw) return [];
  const qZh = compactZh(raw), qLatin = compactLatin(raw);
  if(!qZh && !qLatin) return [];
  const out = [];
  const all = playerIndex();
  for(let i = 0; i < all.length; i++){
    const p = all[i];
    if(teamFilter && !teamFilter(p.team)) continue;
    const keys = playerKeys(p);
    let best = 0;
    for(let k = 0; k < keys.length; k++){
      const key = keys[k];
      const isZhKey = key >= "\u4e00" && key <= "\u9fa5";
      let s = scoreCandidate(isZhKey ? qZh : qLatin, key, isZhKey);
      if(s > best) best = s;
      if(best >= 100) break;
    }
    if(best > 0) out.push({ p: p, s: best });
  }
  out.sort((a, b) => (b.s - a.s) || (a.p.name || a.p.en).localeCompare(b.p.name || b.p.en, "zh"));
  return out.map(x => x.p);
}
if(typeof module !== "undefined" && module.exports){
  module.exports = { searchPlayers: searchPlayers, _pure: { normText: normText, compactLatin: compactLatin, compactZh: compactZh, zhPinyin: zhPinyin, editDistance: editDistance, editBudget: editBudget, scoreCandidate: scoreCandidate, playerKeys: playerKeys } };
}


