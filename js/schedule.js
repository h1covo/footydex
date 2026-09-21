/* 赛程/比赛日模块：按「多天窗口」看 6 大联赛 + 欧冠 + 欧联的赛程与赛果
   取数策略：本地聚合（LIVE.data 优先 + TEAM_SNAPSHOT.data 兜底）—— 零请求、秒开、离线可用。
   注：ESPN 足球 scoreboard 不支持日期区间（会返回 400），逐天拉 10 天 × 8 联赛 = 80 请求实测 ~7s，故不用。 */
"use strict";
const SCHED_LEAGUES = [
  { id: "eng.1", cn: "英超" }, { id: "esp.1", cn: "西甲" }, { id: "ger.1", cn: "德甲" },
  { id: "ita.1", cn: "意甲" }, { id: "fra.1", cn: "法甲" }, { id: "chn.1", cn: "中超" },
  { id: "uefa.champions", cn: "欧冠" }, { id: "uefa.europa", cn: "欧联杯" }
];
const SCHED_DAYS = 10;                 /* 窗口长度（天） */
const SCHED = { favOnly: false };

function schedDateISO(offsetDays){
  const d = new Date(Date.now() + (offsetDays || 0) * 86400000);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function schedShift(iso, days){
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function schedLocalTime(ts){
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
/* 反查对手球队 id：先按中文名精确匹配，再用词典反查英文名（查不到就只显示名字，不生成链接） */
function schedOppId(zhName){
  if(!zhName) return "";
  const all = LIVE.allTeams || [];
  const hit = all.filter(t => t.name === zhName)[0];
  if(hit) return hit.id;
  const en = (typeof Translator !== "undefined" && Translator.enOfTeam) ? Translator.enOfTeam(zhName) : "";
  const hit2 = en ? all.filter(t => t.en === en)[0] : null;
  return hit2 ? hit2.id : "";
}
/* 联赛排名：LIVE.standings 优先，快照 standings 兜底；无数据返回 null */
function schedRankOf(teamId){
  if(!teamId) return null;
  const espn = String(teamId).replace(/^espn:/, "");
  const live = (LIVE.standings || {})[espn];
  if(live && live.rank) return parseInt(live.rank, 10) || null;
  const snap = (window.TEAM_SNAPSHOT && window.TEAM_SNAPSHOT.standings) || {};
  const s = snap[espn];
  return (s && s.rank) ? (parseInt(s.rank, 10) || null) : null;
}
/* 近 5 场：返回 [{r:"W"|"D"|"L", date, gf, ga}]，最旧在左、最新在右 */
function schedFormOf(teamId){
  if(!teamId) return [];
  const key = /^espn:/.test(teamId) ? teamId : ("espn:" + teamId);
  const snap = (window.TEAM_SNAPSHOT && window.TEAM_SNAPSHOT.data) || {};
  const rec = (LIVE.data && LIVE.data[key]) || snap[key];
  const rs = (rec && rec.results) || [];
  return rs.slice(0, 5).map(r => {
    const gf = parseInt(r.gf, 10), ga = parseInt(r.ga, 10);
    if(isNaN(gf) || isNaN(ga)) return null;
    return { r: gf > ga ? "W" : (gf < ga ? "L" : "D"), date: r.date, gf: gf, ga: ga };
  }).filter(Boolean).reverse();
}
/* 把「以某队为主视角」的赛程条目（快照/同步的形状）转成赛程行需要的形状 */
function schedFromTeamFixture(ownerId, f){
  if(!f || !f.id || !f.date) return null;
  const owner = findTeam(ownerId);
  const ownerEn = owner ? (owner.en || "") : "";
  const oppId = schedOppId(f.opp);
  const home = !!f.home;
  return {
    id: String(f.id), ts: f.ts || new Date(f.date + "T12:00:00").getTime(),
    comp: f.comp || "", state: f.state || "pre", status: "",
    stadium: f.stadium || "",
    homeEn: home ? ownerEn : (f.opp || ""),
    awayEn: home ? (f.opp || "") : ownerEn,
    homeId: home ? ownerId : oppId,
    awayId: home ? oppId : ownerId,
    hs: home ? f.gf : f.ga,
    as: home ? f.ga : f.gf
  };
}
/* 本地赛程表：{ "YYYY-MM-DD": { matchId: match } }
   LIVE.data（进站同步，较新）覆盖快照；同一场在双方各出现一次，按 id 去重 */
function localSchedMap(){
  const src = {};
  const snap = (window.TEAM_SNAPSHOT && window.TEAM_SNAPSHOT.data) || {};
  Object.keys(snap).forEach(k => { src[k] = snap[k]; });
  Object.keys(LIVE.data || {}).forEach(k => { src[k] = LIVE.data[k]; });
  const map = {};
  Object.keys(src).forEach(k => {
    /* 快照与 LIVE.data 的键都已是 "espn:<id>"；兼容裸 id 写法 */
    const ownerId = /^espn:/.test(k) ? k : ("espn:" + k);
    const rec = src[k] || {};
    /* fixtures + results 都要聚合：比赛踢完会从 fixtures 移到 results，
       只读 fixtures 会让当天的比赛在同步完成后凭空消失（本页标题即「赛程与赛果」） */
    (rec.fixtures || []).concat(rec.results || []).forEach(f => {
      const m = schedFromTeamFixture(ownerId, f);
      if(!m) return;
      const day = f.date;
      if(!map[day]) map[day] = {};
      if(map[day][m.id]) return;              /* 去重：同一场只留一条 */
      map[day][m.id] = m;
    });
  });
  return map;
}
/* 自定义日历弹层：打开 / 关闭 / 月导航 / 选日 / 点外部关闭 / Esc / 方向键 / PgUp·PgDn
   原生 input[type=date] 的弹层由浏览器绘制、CSS 改不动，故自绘。 */
let SCHED_CLEANUP = null;
function bindSchedCal(start){
  const btn = document.getElementById("sched-date-btn");
  const cal = document.getElementById("sched-cal");
  if(!btn || !cal) return;
  const map = localSchedMap();
  const hasSet = {};
  Object.keys(map).forEach(d => { if(Object.keys(map[d]).length) hasSet[d] = 1; });
  let ym = start.slice(0, 7);
  const draw = () => { cal.innerHTML = schedCalHTML(ym, start, hasSet); };
  const shiftMonth = delta => {
    const d = new Date(ym + "-01T12:00:00");
    d.setMonth(d.getMonth() + delta);
    ym = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  };
  const open = on => {
    cal.hidden = !on;
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    if(on){ draw(); const sel = cal.querySelector(".sched-cal-day.sel"); if(sel) sel.focus(); }
  };
  btn.addEventListener("click", e => { e.stopPropagation(); open(cal.hidden); });
  const onCalClick = e => {
    e.stopPropagation();
    const nav = e.target.closest(".sched-cal-nav");
    if(nav){ shiftMonth(parseInt(nav.dataset.nav, 10)); draw(); return; }
    const day = e.target.closest(".sched-cal-day");
    if(day && day.dataset.date){ open(false); location.hash = "schedule/" + day.dataset.date; }
  };
  cal.addEventListener("click", onCalClick);
  const onDoc = e => { if(!cal.hidden && !cal.contains(e.target) && !btn.contains(e.target)) open(false); };
  document.addEventListener("click", onDoc);
  const onKey = e => {
    if(cal.hidden) return;
    if(e.key === "Escape"){ e.preventDefault(); open(false); btn.focus(); return; }
    if(e.key === "PageUp" || e.key === "PageDown"){ e.preventDefault(); shiftMonth(e.key === "PageUp" ? -1 : 1); draw(); return; }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if(step === undefined) return;
    e.preventDefault();
    const days = [...cal.querySelectorAll(".sched-cal-day")];
    const cur = cal.querySelector(".sched-cal-day.sel");
    const i = cur ? days.indexOf(cur) : 0;
    const j = i + step;
    if(j < 0 || j >= days.length){
      shiftMonth(j < 0 ? -1 : 1);
      draw();
      const nd = [...cal.querySelectorAll(".sched-cal-day")];
      const t = nd[j < 0 ? nd.length - 1 : 0];
      if(t) t.focus();
      return;
    }
    if(days[j]) days[j].focus();
  };
  document.addEventListener("keydown", onKey);
  if(SCHED_CLEANUP) SCHED_CLEANUP();
  SCHED_CLEANUP = () => {
    document.removeEventListener("click", onDoc);
    document.removeEventListener("keydown", onKey);
  };
}
function renderSchedule(iso){
  const wrap = document.getElementById("schedule-content");
  if(!wrap) return;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso : schedDateISO(0);
  wrap.innerHTML = schedulePageHTML(start, SCHED_DAYS);
  const bind = (id, ev, fn) => { const el = document.getElementById(id); if(el) el.addEventListener(ev, fn); };
  bind("sched-back", "click", () => { location.hash = ""; });
  bind("sched-prev", "click", () => { location.hash = "schedule/" + schedShift(start, -SCHED_DAYS); });
  bind("sched-next", "click", () => { location.hash = "schedule/" + schedShift(start, SCHED_DAYS); });
  bind("sched-today", "click", () => { location.hash = "schedule"; });
  bind("sched-fav", "click", () => { SCHED.favOnly = !SCHED.favOnly; renderSchedule(start); });
  bindSchedCal(start);
  const holder = document.getElementById("sched-body");
  if(holder) holder.innerHTML = scheduleWindowHTML(localSchedMap(), start, SCHED_DAYS, SCHED.favOnly);
}
