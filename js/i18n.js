/* 界面双语模块：语言状态(LANG, localStorage ft-lang) / isEN / L / setLang / 语言按钮 */
"use strict";
/* =========================================================
   多语言（中文 / English）
   ========================================================= */
let LANG = "zh";
try { LANG = localStorage.getItem("ft-lang") || "zh"; } catch(e) {}
function isEN(){ return LANG === "en"; }
function L(zh, en){ return isEN() ? en : zh; }

function applyLangButtons(){
  const wrap = document.getElementById("lang-switch");
  if(!wrap) return;
  let active = null;
  wrap.querySelectorAll("button").forEach(b => {
    const on = b.dataset.lang === LANG;
    b.classList.toggle("on", on);
    if(on) active = b;
  });
  const thumb = document.getElementById("lang-thumb");
  if(thumb && active){
    if(!thumb.style.width){ thumb.style.transition = "none"; requestAnimationFrame(() => { thumb.style.transition = ""; }); }
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.transform = "translateX(" + active.offsetLeft + "px)";
  }
}

let LANG_ANIM = false;
function setLang(lang, animate){
  const next = (lang === "en") ? "en" : "zh";
  if(animate && next !== LANG && !LANG_ANIM){
    LANG_ANIM = true;
    const root = document.documentElement;
    root.classList.add("lang-anim");
    setTimeout(() => {
      setLang(next, false);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.remove("lang-anim");
        LANG_ANIM = false;
      }));
    }, 170);
    return;
  }
  LANG = next;
  try { localStorage.setItem("ft-lang", LANG); } catch(e) {}
  applyLangButtons();
  const en = isEN();
  const brandName = document.querySelector(".brand-name");
  if(brandName) brandName.textContent = "FootyDex";
  document.title = "FootyDex";
  const badge = document.getElementById("src-badge");
  if(badge) badge.textContent = L("实时数据 · ESPN", "Live data · ESPN");
  const search = document.getElementById("search");
  if(search) search.placeholder = L("搜索球队、球员、城市、联赛或国家", "Search clubs, players, cities, leagues or countries");
  const clearSearch = document.getElementById("clear-search");
  if(clearSearch) clearSearch.title = L("清空", "Clear");
  const reset = document.getElementById("reset");
  if(reset) reset.textContent = L("重置筛选", "Reset filters");
  const leagueHome = document.getElementById("league-home");
  if(leagueHome) leagueHome.textContent = L("联赛", "League");
  const compareHome = document.getElementById("compare-home");
  if(compareHome) compareHome.textContent = L("对比", "Compare");
  const compareTeam = document.getElementById("compare-team");
  if(compareTeam) compareTeam.textContent = L("对比", "Compare");
  const stadiumsHome = document.getElementById("stadiums-home");
  if(stadiumsHome) stadiumsHome.textContent = L("球场", "Stadiums");
  const scheduleHome = document.getElementById("schedule-home");
  if(scheduleHome) scheduleHome.textContent = L("赛程", "Fixtures");
  const newsHome = document.getElementById("news-home");
  if(newsHome) newsHome.textContent = L("新闻", "News");
  const syncBtn = document.getElementById("sync-refresh");
  if(syncBtn) syncBtn.textContent = L("重新同步", "Re-sync");
  const syncRetry = document.getElementById("sync-retry");
  if(syncRetry) syncRetry.textContent = L("重试", "Retry");
  const heroH1 = document.querySelector(".hero h1");
  if(heroH1) heroH1.innerHTML = L("找到你的球队，<br>从队徽到赛程一次看完", "Find your club,<br>crest to fixtures in one page");
  const back = document.getElementById("back-btn");
  if(back) back.textContent = L("← 返回全部球队", "← All clubs");
  const empty = document.getElementById("grid-empty");
  if(empty) empty.textContent = L("没有找到匹配的球队，换个关键词试试", "No clubs matched — try another keyword");
  const foot = document.querySelector("footer");
  if(foot) foot.innerHTML = L(
    "FootyDex · 示例演示页面，球队 / 球员 / 赛程数据为示意用途，请以官方信息为准。<br>球场照片来自 Wikimedia Commons（自由授权，已逐张标注作者与协议）；球员头像为俱乐部官方定妆照，队徽与定妆照版权归各俱乐部 / 联赛所有，仅供演示；地图定位来自百度地图。",
    "FootyDex · demo page. Club, player and fixture data are for demonstration only — refer to official sources.<br>Stadium photos from Wikimedia Commons (free licences, credits shown per photo); crests belong to their clubs; maps by Baidu.");
  buildFilterOptions();
  renderQuickChips();
  renderGrid();
  if(typeof updateTeamFavBtn === "function") updateTeamFavBtn();
  if(typeof updatePlayerFavBtn === "function") updatePlayerFavBtn();
  if(typeof refreshSyncBar === "function") refreshSyncBar();
  renderTicker();
  const h = location.hash;
  if(h.indexOf("#team/") === 0) renderTeam(decodeURIComponent(h.slice(6)));
  else if(h.indexOf("#league/") === 0){ const p = parseLeagueHash(h); renderLeague(p.lg || "eng.1", p.tab, p.year); }
  else if(h.indexOf("#leaders/") === 0){ const p = hashLeagueSeason(h, "#leaders/"); renderLeaders(p.lg || "eng.1", p.year); }
  else if(h.indexOf("#table/") === 0){ const p = hashLeagueSeason(h, "#table/"); renderTable(p.lg || "eng.1", p.year); }
  else if(h.indexOf("#player/") === 0) renderPlayer(decodeURIComponent(h.slice(8)));
  else if(h.indexOf("#compare") === 0){ const p = parseCompareHash(h); renderCompare(p.a, p.b); }
  else if(h.indexOf("#stadiums") === 0) renderStadiums(decodeURIComponent(h.slice(10)));
  else if(h.indexOf("#schedule") === 0) renderSchedule(decodeURIComponent(h.slice(10)));
  else if(h.indexOf("#news") === 0) renderNewsPage(decodeURIComponent(h.slice(6)).split("/")[0]);
  else if(h.indexOf("#cards") === 0) renderCards(decodeURIComponent(h.slice(7)).split("/")[0]);
}

/* 字体就绪/窗口尺寸变化时重新定位语言切换指示块 */
if(typeof document !== "undefined" && document.fonts && document.fonts.ready){
  document.fonts.ready.then(() => { try { applyLangButtons(); } catch(e) {} });
}
addEventListener("resize", () => { try { applyLangButtons(); } catch(e) {} });
