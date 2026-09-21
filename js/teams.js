/* 球队页模块：单条流水线（人工资料 / ESPN+词典+队史 → 数据归一 → 统一模板 teamTemplateHTML）+ 页面绑定 */
"use strict";
let NAV_RESIZE = null, NAV_IO = null;

/* 取数：该队是否有人工资料（teams-data.js 的 TEAMS） */
function editorialOf(vt){ return (vt && vt.editorialId) ? (TEAMS.filter(x => x.id === vt.editorialId)[0] || null) : null; }

/* ---------- 球队页公共绑定（导航 / 实时同步 / 名单 / 灯箱） ---------- */
function bindTeamPage(vt){
  const liveRefresh = $("#live-refresh");
  if(liveRefresh) liveRefresh.addEventListener("click", () => loadLive(vt.id, true));
  loadLive(vt.id);
  stopLiveTimer();
  LIVE.timer = setInterval(() => { if(!document.hidden && location.hash.indexOf("#team/") === 0) loadLive(vt.id); }, 300000);

  loadRoster(vt, "pos-tabs", "players-body");

  const mtTabs = document.querySelectorAll(".mt-tabbar button");
  mtTabs.forEach(b => b.addEventListener("click", () => {
    mtTabs.forEach(x => x.classList.toggle("on", x === b));
    $("#mt-results").hidden = b.dataset.view !== "results";
    $("#mt-fixtures").hidden = b.dataset.view !== "fixtures";
    if(typeof buildTicker === "function") buildTicker();   /* 重算 --stick-top（切换后高度变化） */
  }));

  const resSec = document.getElementById("sec-results");
  if(resSec) resSec.addEventListener("click", e => {
    const tr = e.target.closest("tr.expandable[data-ev]");
    if(tr) loadMatchDetail(tr, vt);
  });
  const fxSec = document.getElementById("sec-fixtures");
  if(fxSec) fxSec.addEventListener("click", e => {
    const tr = e.target.closest("tr.expandable[data-ev]");
    if(tr) loadPreMatch(tr, vt);
  });
  const plBody = document.getElementById("players-body");
  if(plBody) plBody.addEventListener("click", e => {
    const tr = e.target.closest("tr.expandable[data-pl]");
    if(tr) togglePlayerDetail(vt, tr);
  });

  const lb = $("#lightbox");
  const gal = $("#gallery");
  if(gal) gal.querySelectorAll(".gal").forEach(fig => {
    fig.addEventListener("click", e => {
      if(e.target.closest("a")) return;
      $("#lightbox-body").innerHTML = fig.innerHTML;
      lb.hidden = false;
    });
  });

  const sections = [...document.querySelectorAll("#view-team .panel")];
  const navBtns = $("#sec-nav").querySelectorAll("button");
  function moveNavInk(){
    const b = document.querySelector("#sec-nav button.active");
    const ink = document.getElementById("nav-ink");
    if(b && ink){ ink.style.width = b.offsetWidth + "px"; ink.style.transform = "translateX(" + b.offsetLeft + "px)"; }
  }
  navBtns.forEach(b => b.addEventListener("click", () => {
    navBtns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    moveNavInk();
  }));
  navBtns.forEach(btn => btn.addEventListener("click", () => {
    const el = document.getElementById(btn.dataset.target);
    if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  }));
  if(navBtns[0]) navBtns[0].classList.add("active");
  moveNavInk();
  if(NAV_RESIZE) removeEventListener("resize", NAV_RESIZE);
  NAV_RESIZE = moveNavInk;
  addEventListener("resize", NAV_RESIZE);
  if(NAV_IO) NAV_IO.disconnect();
  if(window.IntersectionObserver){
    NAV_IO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(en.isIntersecting){
          navBtns.forEach(b => b.classList.toggle("active", b.dataset.target === en.target.id));
          moveNavInk();
        }
      });
    }, { rootMargin:"-38% 0px -55% 0px" });
    sections.forEach(s => NAV_IO.observe(s));
  }
}

/* =========================================================
   球队页单流水线：teamDataOf（唯一按来源区分处，输出同构）
   → teamViewModel（统一组装，模板只按字段有无渲染）
   ========================================================= */

/* ---------- 取数适配：人工资料（精选 8 队） ---------- */
function editorialTeamData(t){
  const st = t.stadium;
  const venue = esc(isEN() ? st.en : st.name);
  const countryCity = esc(isEN() ? (LEAGUE_COUNTRY_EN[t.country] || t.country) : t.country) + ' · ' + esc(isEN() ? enOfCity(t.city) : t.city);
  const photos = PHOTOS[t.id] || [];
  return {
    colors: displayColors(t),
    crest: { src: CRESTS[t.id], size: 110, alt: t.name + "队徽", lazy: true, fallbackSVG: crestFallbackSVG(t) },
    name: isEN() ? t.en : t.name,
    en: t.en,
    chips: [
      esc(dLeague(t.league)),
      countryCity,
      L("成立于 " + t.founded + " 年", "Founded " + t.founded),
      L("主场 ", "Stadium ") + venue,
      L("容量 ", "Capacity ") + st.capacity.toLocaleString()
    ],
    heroT: t, heroResults: t.results, heroRoster: undefined,
    playersNote: L("球员名单与出场 / 进球 / 助攻数据来自 ESPN（实时同步），中文名来自本地词典；头像暂以号码圆徽显示。",
      "Squad and stats (apps / goals / assists) are synced live from ESPN; headshots are shown as number badges for now."),
    overviewItems: [
      { label: L("全称", "Full name"), value: isEN() ? esc(t.en) : esc(t.name) + '（' + esc(t.en) + '）' },
      { label: L("成立年份", "Founded"), value: L(t.founded + " 年", t.founded) },
      { label: L("所属联赛", "League"), value: esc(dLeague(t.league)) },
      { label: L("国家 / 城市", "Country / City"), value: countryCity },
      { label: L("主场", "Stadium"), value: venue },
      { label: L("主场容量", "Capacity"), value: st.capacity.toLocaleString() + ' ' + L("人", "seats") }
    ],
    overviewDesc: isEN() ? '<p class="photo-note">Editorial introduction for this club is currently Chinese only.</p>' : '<p class="desc">' + esc(t.desc) + '</p>',
    stadiumTitle: venue,
    stadiumItems: [
      { label: L("球场名称", "Name"), value: venue },
      { label: L("所在国家 / 城市", "Country / City"), value: countryCity },
      { label: L("启用年份 / 容量", "Opened / Capacity"), value: st.opened + ' · ' + st.capacity.toLocaleString() },
      { label: L("草皮尺寸", "Pitch"), value: esc(st.pitch) },
      { label: L("地图坐标", "Coordinates"), value: st.lat + ', ' + st.lon },
      { label: L("具体地址", "Address"), value: esc(isEN() ? (st.addressEn || st.address) : st.address) }
    ],
    stadiumDesc: isEN() ? '<p class="photo-note">Stadium description is currently Chinese only.</p>' : '<p class="desc">' + esc(st.desc) + '</p>',
    map: { lat: st.lat, lon: st.lon, title: esc(st.en), locFirst: st.lat + ', ' + st.lon, cityCountry: esc(isEN() ? enOfCity(t.city) : t.city) + (isEN() ? ", " + (LEAGUE_COUNTRY_EN[t.country] || t.country) : "，" + t.country), showCoordsItem: false, gmap: "https://www.google.com/maps?q=" + st.lat + "," + st.lon, osm: "https://www.openstreetmap.org/?mlat=" + st.lat + "&mlon=" + st.lon + "#map=16/" + st.lat + "/" + st.lon },
    gallery: photos.map(p => { const seg = capLabel(p.cap.split(" · ")[0]); return { src:p.src, badge:seg, alt:st.en + " · " + p.cap, bold:isEN() ? (seg + ' · ' + st.en) : p.cap, by:p.by, lic:p.lic, page:p.page }; }),
    galleryNote: "",
    stadiumNote: '<p class="photo-note">' + L("以上均为球场实拍照片，来自 Wikimedia Commons，按 CC 协议使用并标注作者；点击可放大查看。",
      "All photos are real stadium shots from Wikimedia Commons, used under CC licences with credits; click to enlarge.") + '</p>',
    legends: t.legends, legendOpts: { fourStats: true },
    honors: honorsFor(t, t.honors),
    results: t.results, markResults: "06",
    fixtures: t.fixtures, markFixtures: "07",
    refreshHeritage: false
  };
}

/* ---------- 取数适配：ESPN + 词典 + 队史 ---------- */
/* 中超球队只保留 1994 职业化之后的荣誉（去掉前身「省市队」时期的冠军） */
function honorsFor(vt, honors){
  if(!honors || !honors.length) return honors;
  if(!vt || vt.leagueId !== "chn.1") return honors;
  const out = honors.map(cat => {
    const items = (cat.items || []).map(it => {
      const years = String(it.years || "").split(/[、,，;；]/).map(s => s.trim()).filter(Boolean);
      const kept = years.filter(y => parseInt(y, 10) >= 1994);
      if(!kept.length) return null;
      return Object.assign({}, it, { years: kept.join("、"), count: kept.length });
    }).filter(Boolean);
    return items.length ? Object.assign({}, cat, { items: items }) : null;
  }).filter(Boolean);
  return out.length ? out : null;
}
function espnTeamData(vt){
  const d = displayColors({ colors: vt.colors });
  const logo = vt.logo || "";
  const venueName = dVenue(vt);
  const venueQ = encodeURIComponent([isEN() ? (vt.venueEn || vt.venue) : vt.venue, isEN() ? (vt.cityEn || vt.city) : vt.city, isEN() ? (vt.countryEn || vt.country) : vt.country].filter(Boolean).join(" "));
  const gmap = "https://www.google.com/maps/search/?api=1&query=" + venueQ;
  const osm = "https://www.openstreetmap.org/search?query=" + venueQ;
  const live = LIVE.data[vt.id];
  const countryName = dCountryName(vt.country), cityName = dCityName(vt.city);
  const countryCity = esc(countryName || "-") + (cityName ? ' · ' + esc(cityName) : '');
  const c = (window.VENUE_COORDS || {})[vt.venueEn];
  const shotsRaw = ((window.STADIUM_PHOTOS || {})[vt.venueEn] || []);
  const shots = shotsRaw.map(p => { const cap = capLabel(photoCaption(p.src)); return { src:p.src, badge:cap, alt:venueName + " · " + cap, bold:cap + ' · ' + venueName, by:p.by || L("未署名", "Unknown"), lic:p.lic || "", page:p.page }; });
  const galleryNote = shotsRaw.length
    ? '<p class="photo-note">' + L("以上均为球场实拍照片，来自 Wikimedia Commons，按 CC 协议使用并标注作者；点击可放大查看。", "Real stadium photos from Wikimedia Commons, used under CC licences with credits; click to enlarge.") + '</p>'
    : '<p class="photo-note">' + L("该球场暂未收录实拍图库。", "No stadium photos stored for this ground yet.") + '</p>';
  const her = heritageOf(vt);
  return {
    colors: d,
    crest: { src: logo, size: 110, alt: dTeam(vt) },
    name: dTeam(vt),
    en: vt.en,
    chips: [
      esc(dLeague(vt.league)),
      countryName ? esc(countryName) + (cityName ? ' · ' + esc(cityName) : '') : '',
      venueName ? L("主场 ", "Stadium ") + esc(venueName) : '',
      vt.promoted ? L("本赛季升班马", "Promoted this season") : ''
    ].filter(Boolean),
    heroT: {}, heroResults: live ? live.results : [], heroRoster: (LIVE.rosters[vt.espnId] || []).length,
    playersNote: L("球员名单与出场 / 进球 / 助攻数据来自 ESPN（实时同步），中文名来自本地词典；头像暂以号码圆徽显示。",
      "Squad and stats are synced live from ESPN; headshots are shown as number badges for now."),
    overviewItems: [
      { label: L("全称", "Full name"), value: esc(dTeam(vt)) + (isEN() ? '' : '（' + esc(vt.en) + '）') },
      { label: L("所属联赛", "League"), value: esc(dLeague(vt.league)) },
      { label: L("国家 / 城市", "Country / City"), value: countryCity },
      { label: L("主场", "Stadium"), value: esc(venueName || L("待补充", "TBC")) },
      { label: L("球队缩写", "Abbreviation"), value: esc(vt.initials || "-") },
      { label: L("本赛季", "This season"), value: (vt.promoted ? L("升班马 · 由次级联赛升入", "Promoted from the lower division") : L("征战 ", "Playing in ") + esc(dLeague(vt.league))) }
    ],
    overviewDesc: '<p class="desc">' + (isEN()
      ? esc(vt.en) + ' play in the ' + esc(dLeague(vt.league)) + '. Everything on this page — squad, last ten results and upcoming fixtures — is synced live from ESPN; crest and club colours come from ESPN too.'
      : esc(vt.name) + '目前参加' + esc(vt.league) + '。本页资料由 ESPN 实时同步：登记球员名单、近十场战绩与未来赛程均为最新数据；队徽与球队主色来自 ESPN 官方资料。') + '</p>',
    stadiumTitle: esc(venueName || L("待补充", "TBC")),
    stadiumItems: [
      { label: L("球场名称", "Name"), value: esc(venueName || L("待补充", "TBC")) },
      { label: L("所在国家 / 城市", "Country / City"), value: countryCity },
      { label: L("所属球队", "Club"), value: esc(dTeam(vt)) },
      { label: L("赛事主场", "Home of"), value: esc(dLeague(vt.league)) }
    ],
    stadiumDesc: '<p class="desc">' + (isEN()
      ? esc(venueName || "The stadium") + ' is the home ground of ' + esc(vt.en) + (cityName ? ", located in " + esc(cityName) : "") + '.'
      : esc(venueName || "该球场") + '是' + esc(vt.name) + '的主场，位于' + esc(cityName || "") + (countryName ? '，' + esc(countryName) : '') + '。') + '</p>',
    map: c ? { lat: c[0], lon: c[1], title: esc(venueName || "stadium"), showCoordsItem: true, locFirst: esc(venueName || ""), cityCountry: esc(dCityName(vt.city) || "") + (vt.country ? (isEN() ? ", " + esc(dCountryName(vt.country)) : "，" + esc(vt.country)) : ''), gmap: gmap, osm: "https://www.openstreetmap.org/?mlat=" + c[0] + "&mlon=" + c[1] + "#map=16/" + c[0] + "/" + c[1] } : { noCoords: true, gmap: gmap, osm: osm },
    gallery: shots,
    galleryNote: galleryNote,
    stadiumNote: "",
    legends: (her && her.legends && her.legends.length) ? her.legends : null,
    legendOpts: null,
    honors: her ? honorsFor(vt, her.honors) : null,
    results: null, markResults: null,
    fixtures: null, markFixtures: null,
    refreshHeritage: true
  };
}

/* ---------- 统一视图组装（模板只按字段有无渲染，不认识球队类别） ---------- */
function teamDataOf(vt){
  const ed = editorialOf(vt);
  return ed ? editorialTeamData(ed) : espnTeamData(vt);
}
function teamViewModel(vt){
  const d = teamDataOf(vt);
  const rank = leagueRankOf(vt);
  if(rank){
    d.chips.splice(1, 0, L("联赛第 " + rank.rank, ordinal(rank.rank) + " in league"));
    const li = d.overviewItems.findIndex(it => it.label === L("所属联赛", "League"));
    d.overviewItems.splice(li >= 0 ? li + 1 : d.overviewItems.length, 0, ...rankOverviewItems(rank));
  }
  return {
    colors: d.colors,
    crestHTML: crestImgHTML(d.crest),
    name: d.name, en: d.en,
    chips: d.chips.map(chipHTML),
    heroT: d.heroT, heroResults: d.heroResults, heroRoster: d.heroRoster,
    playersNote: d.playersNote,
    overviewItems: d.overviewItems,
    overviewDesc: d.overviewDesc,
    recordHTML: vt.espnId ? recordBlockHTML() : "",
    newsHTML: vt.espnId ? newsBlockHTML() : "",
    stadiumTitle: d.stadiumTitle,
    stadiumItems: d.stadiumItems,
    stadiumDesc: d.stadiumDesc,
    mapHTML: mapHTML(d.map),
    galleryHTML: galleryHTML(d.gallery, d.galleryNote),
    stadiumNote: d.stadiumNote,
    legendsHTML: (d.legends && d.legends.length) ? legendGridHTML(d.legends, d.legendOpts, d.honors)
      : emptyNoteHTML("该球队暂未收录队史名宿资料。", "No club legends data for this club yet."),
    honorsHTML: d.honors ? honorsGridHTML(d.honors)
      : emptyNoteHTML("该球队暂未收录历史荣誉资料。", "No honours data for this club yet."),
    resultsHTML: d.results ? resultsSectionHTML(d.results)
      : loadingNoteHTML("正在同步战绩…", "Loading results…"),
    fixturesHTML: d.fixtures ? fixturesSectionHTML(d.fixtures)
      : loadingNoteHTML("正在同步赛程…", "Loading fixtures…"),
    statsHTML: vt.espnId ? ('<div id="team-stats-wrap">' +
      '<div class="stats-head">' + blockTitleHTML("赛季数据", "Season stats", "联赛 · ESPN", "League · ESPN") + seasonSelectHTML("team-season") + '</div>' +
      '<div id="team-stats-body">' + loadingNoteHTML("正在加载赛季数据…", "Loading season stats…") + '</div></div>') : "",
    loadStats: !!vt.espnId,
    tacticsHTML: vt.espnId ? '<div id="team-tactics"></div>' : "",
    leagueAvgHTML: vt.espnId ? '<div id="team-league-avg"></div>' : "",
    refreshHeritage: d.refreshHeritage
  };
}

/* ---------- 入口：所有球队共用 ---------- */
function renderTeam(id){
  const vt = findTeam(id);
  if(!vt) return;
  const vm = teamViewModel(vt);
  if(!vm) return;
  $("#team-content").innerHTML = teamTemplateHTML(vm);
  bindTeamPage(vt);
  if(typeof updateTeamFavBtn === "function") updateTeamFavBtn();
  if(typeof initTileMaps === "function") initTileMaps(document);
  if(typeof renderTeamNews === "function") renderTeamNews(vt, "team-news");
  if(typeof renderTeamRecord === "function") renderTeamRecord(vt, "team-record");
  if(vm.loadStats) loadTeamStats(vt);
  if(vm.refreshHeritage) refreshHeritage(vt);
}
