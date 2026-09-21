/* 首页模块：搜索 / 筛选 / 球队卡片 / 联赛块 / 快捷筛选 */
"use strict";
/* =========================================================
   首页（六大联赛 · 全部球队）双语版
   ========================================================= */
const state = { q:"", league:"", country:"", city:"", open:{ "eng.1":true } };

function fillSelectI18n(sel, values, allLabel, labelFn){
  sel.innerHTML = optionsHTML(values, allLabel, labelFn);
}

function allTeams(){ return LIVE.allTeams; }

function buildFilterOptions(){
  const list = allTeams();
  fillSelectI18n($("#f-league"), LEAGUES.map(l => l.cn), L("全部联赛", "All leagues"), dLeague);
  fillSelectI18n($("#f-country"), [...new Set(list.map(t => t.country).filter(Boolean))], L("全部国家", "All countries"), dCountryName);
  const cities = [...new Set(
    list.filter(t => (!state.country || t.country === state.country) && (!state.league || t.league === state.league))
        .map(t => t.city).filter(Boolean)
  )];
  fillSelectI18n($("#f-city"), cities, L("全部城市", "All cities"), dCityName);
  if(cities.indexOf(state.city) < 0) state.city = "";
  $("#f-city").value = state.city;
  $("#f-league").value = state.league;
  $("#f-country").value = state.country;
}


function filteredTeams(){
  const q = state.q.trim().toLowerCase();
  return allTeams().filter(t => {
    if(state.league && t.league !== state.league) return false;
    if(state.country && t.country !== state.country) return false;
    if(state.city && t.city !== state.city) return false;
    if(!q) return true;
    const hay = [t.name, t.en, dLeague(t.league), t.country, t.countryEn, t.city, t.cityEn, t.venue, t.venueEn, t.initials].join(" ").toLowerCase();
    return hay.indexOf(q) >= 0;
  });
}

function teamResultsOf(t){ const live = LIVE.data[t.id]; return (live && live.results.length) ? live.results : (t.results || []); }
function teamFixturesOf(t){ const live = LIVE.data[t.id]; return (live && live.fixtures.length) ? live.fixtures : (t.fixtures || []); }


function renderGrid(){
  const list = filteredTeams();
  renderPlayerHits();
  const wrap = $("#league-sections");
  $("#result-count").innerHTML = resultCountHTML(list.length, state.q);
  $("#grid-empty").hidden = list.length > 0;
  if(!wrap) return;
  const byLeague = {};
  list.forEach(t => { (byLeague[t.leagueId] = byLeague[t.leagueId] || []).push(t); });
  wrap.innerHTML = LEAGUES.map(lg => {
    const teams = (byLeague[lg.id] || []).sort((a, b) => a.en.localeCompare(b.en, "en"));
    if(!teams.length) return "";
    const open = state.q || state.league || state.country || state.city ? true : !!state.open[lg.id];
    return leagueBlockHTML(lg, teams, open);
  }).join("");
  wrap.querySelectorAll(".team-card").forEach(card => {
    card.addEventListener("click", () => openTeam(card.dataset.id));
    card.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openTeam(card.dataset.id); } });
  });
  wrap.querySelectorAll(".league-head").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggle;
      state.open[id] = !state.open[id];
      const block = btn.closest(".league-block");
      block.classList.toggle("open", state.open[id]);
      if(state.open[id] && typeof syncLeague === "function") syncLeague(id);
    });
  });
  if(typeof bindFavStars === "function") bindFavStars(wrap);
  if(typeof renderFavSection === "function") renderFavSection();
  if(typeof renderFavPlayers === "function") renderFavPlayers();
}

/* 首页搜索：球员结果块（离线索引，受现有联赛/国家/城市筛选约束） */
function renderPlayerHits(){
  const holder = document.getElementById("player-results");
  if(!holder) return;
  const q = state.q.trim();
  if(!q || typeof searchPlayers !== "function"){
    holder.hidden = true; holder.innerHTML = ""; return;
  }
  const teamFilter = t => {
    if(!t) return false;
    if(state.league && t.league !== state.league) return false;
    if(state.country && t.country !== state.country) return false;
    if(state.city && t.city !== state.city) return false;
    return true;
  };
  const all = searchPlayers(q, teamFilter);
  holder.hidden = !all.length;
  holder.innerHTML = all.length ? playerSearchBlockHTML(all.slice(0, 8), all.length) : "";
  holder.querySelectorAll(".pl-hit").forEach(btn => {
    btn.addEventListener("click", () => { location.hash = "player/" + btn.dataset.player; });
  });
}

function renderQuickChips(){
  const items = [{ label: L("全部", "All"), val:"" }].concat(LEAGUES.map(l => ({ label: dLeague(l.cn), val:l.cn })));
  $("#quick-chips").innerHTML = quickChipsHTML(items, state.league);
  $("#quick-chips").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      state.league = (state.league === b.dataset.league) ? "" : b.dataset.league;
      buildFilterOptions(); renderQuickChips(); renderGrid();
    });
  });
}
