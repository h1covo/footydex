/* 入口模块：吸顶滚动条 / 路由(#team/...) / 初始化 */
"use strict";
/* =========================================================
   路由与初始化
   ========================================================= */
function openTeam(id){ location.hash = "team/" + id; }

function hideAllViews(){
  $("#view-home").hidden = true;
  $("#view-team").hidden = true;
  $("#view-league").hidden = true;
  $("#view-leaders").hidden = true;
  $("#view-table").hidden = true;
  $("#view-player").hidden = true;
  $("#view-compare").hidden = true;
  $("#view-stadiums").hidden = true;
  $("#view-schedule").hidden = true;
  $("#view-news").hidden = true;
  $("#view-cards").hidden = true;
}
function route(){
  const h = location.hash;
  if(h.indexOf("#league/") === 0){
    const p = parseLeagueHash(h);
    stopLiveTimer();
    hideAllViews();
    $("#view-league").hidden = false;
    renderLeague(p.lg || "eng.1", p.tab, p.year);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#leaders/") === 0){
    const p = hashLeagueSeason(h, "#leaders/");
    location.replace("#league/" + (p.lg || "eng.1") + "/leaders" + (p.year ? "/" + p.year : ""));
    return;
  }
  if(h.indexOf("#table/") === 0){
    const p = hashLeagueSeason(h, "#table/");
    location.replace("#league/" + (p.lg || "eng.1") + "/table" + (p.year ? "/" + p.year : ""));
    return;
  }
  if(h.indexOf("#player/") === 0){
    const pid = decodeURIComponent(h.slice(8)) || "";
    stopLiveTimer();
    hideAllViews();
    $("#view-player").hidden = false;
    renderPlayer(pid);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#compare") === 0){
    const p = parseCompareHash(h);
    stopLiveTimer();
    hideAllViews();
    $("#view-compare").hidden = false;
    renderCompare(p.a, p.b);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#stadiums") === 0){
    const lg = decodeURIComponent(h.slice(10)) || "";
    stopLiveTimer();
    hideAllViews();
    $("#view-stadiums").hidden = false;
    renderStadiums(lg);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#schedule") === 0){
    const date = decodeURIComponent(h.slice(10)) || "";
    stopLiveTimer();
    hideAllViews();
    $("#view-schedule").hidden = false;
    renderSchedule(date);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#news") === 0){
    const lg = decodeURIComponent(h.slice(6)).split("/")[0] || "";
    stopLiveTimer();
    hideAllViews();
    $("#view-news").hidden = false;
    renderNewsPage(lg);
    window.scrollTo({ top:0 });
    return;
  }
  if(h.indexOf("#cards") === 0){
    const lg = decodeURIComponent(h.slice(7)).split("/")[0] || "";
    location.replace("#league/" + (lg || "eng.1") + "/cards");
    return;
  }
  if(h.indexOf("#team/") === 0){
    const id = decodeURIComponent(h.slice(6));
    if(findTeam(id)){
      hideAllViews();
      $("#view-team").hidden = false;
      renderTeam(id);
      window.scrollTo({ top:0 });
      return;
    }
  }
  stopLiveTimer();
  hideAllViews();
  $("#view-home").hidden = false;
}

function init(){
  if(!LIVE.allTeams.length) LIVE.allTeams = buildTeamsFromDict();
  buildFilterOptions();
  renderQuickChips();

  /* ① 本地快照秒开（无网络请求） */
  if(window.TEAM_SNAPSHOT) applySnapshot(window.TEAM_SNAPSHOT);
  renderGrid();
  buildTicker();

  /* ② 球队列表 → 本地缓存 → 必要时后台渐进更新 */
  loadLeagueTeams().then(() => {
    buildFilterOptions();
    loadSyncCache();
    ensureStandings();
    renderGrid();
    if(!staleTeams(false).length) markDataReady();
    else syncAllTeams();
  });

  const langWrap = document.getElementById("lang-switch");
  if(langWrap) langWrap.querySelectorAll("button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang, true)));
  applyLangButtons();
  if(isEN()) setLang("en");

  const syncRefresh = document.getElementById("sync-refresh");
  if(syncRefresh) syncRefresh.addEventListener("click", () => {
    LIVE.data = {}; LIVE.rosters = {}; LIVE.rostersAt = {}; LIVE.syncAt = 0;
    if(typeof SYNC !== "undefined"){ SYNC.errors = {}; SYNC.done = 0; SYNC.total = 0; }
    if(typeof clearCupCache === "function") clearCupCache();
    if(typeof buildTicker === "function") buildTicker();
    try { localStorage.removeItem(SYNC_KEY); } catch(e) {}
    syncAllTeams(true);
  });
  const syncRetry = document.getElementById("sync-retry");
  if(syncRetry) syncRetry.addEventListener("click", () => { if(typeof syncRetryFailed === "function") syncRetryFailed(); });

  const search = $("#search");
  search.addEventListener("input", () => {
    state.q = search.value;
    $("#clear-search").hidden = !state.q;
    renderGrid();
  });
  $("#clear-search").addEventListener("click", () => {
    search.value = ""; state.q = ""; $("#clear-search").hidden = true; renderGrid(); search.focus();
  });
  document.addEventListener("keydown", e => {
    if(e.key === "/" && document.activeElement !== search){ e.preventDefault(); search.focus(); }
    if(e.key === "Escape"){ $("#lightbox").hidden = true; }
  });

  $("#f-league").addEventListener("change", e => { state.league = e.target.value; buildFilterOptions(); renderGrid(); });
  $("#f-country").addEventListener("change", e => { state.country = e.target.value; buildFilterOptions(); renderGrid(); });
  $("#f-city").addEventListener("change", e => { state.city = e.target.value; renderGrid(); });
  $("#reset").addEventListener("click", () => {
    state.q = ""; state.league = ""; state.country = ""; state.city = "";
    search.value = ""; $("#clear-search").hidden = true;
    buildFilterOptions(); renderGrid();
  });

  $("#back-btn").addEventListener("click", () => { location.hash = ""; });
  const leagueHome = document.getElementById("league-home");
  if(leagueHome) leagueHome.addEventListener("click", () => {
    const cur = LEAGUES.filter(l => l.cn === state.league)[0];
    location.hash = "league/" + (cur ? cur.id : "eng.1") + "/table";
  });
  const compareHome = document.getElementById("compare-home");
  if(compareHome) compareHome.addEventListener("click", () => { location.hash = "compare"; });
  const stadiumsHome = document.getElementById("stadiums-home");
  if(stadiumsHome) stadiumsHome.addEventListener("click", () => { location.hash = "stadiums"; });
  const scheduleHome = document.getElementById("schedule-home");
  if(scheduleHome) scheduleHome.addEventListener("click", () => { location.hash = "schedule"; });
  const newsHome = document.getElementById("news-home");
  if(newsHome) newsHome.addEventListener("click", () => { location.hash = "news"; });
  if(typeof bindFavStars === "function") bindFavStars(document);
  const compareTeam = document.getElementById("compare-team");
  if(compareTeam) compareTeam.addEventListener("click", () => {
    const h = location.hash;
    if(h.indexOf("#team/") === 0){
      const id = decodeURIComponent(h.slice(6));
      if(findTeam(id)) location.hash = "compare/" + encodeURIComponent(id) + "/-";
    }
  });
  $("#lightbox").addEventListener("click", () => { $("#lightbox").hidden = true; });

  addEventListener("scroll", () => {
    const tk = document.getElementById("ticker");
    if(tk) tk.classList.toggle("scrolled", scrollY > 8);
  }, { passive:true });

  window.addEventListener("hashchange", route);
  route();
}

init();
