/* 模板库：页面全部 HTML 模板块（纯函数：不取数、不发请求、无状态）
   通用 / 球队 / 球员 / 比赛 / 荣誉 / 首页 六组；块清单见 docs/template-map.md */
"use strict";

/* ---------- 通用块 ---------- */
function sectionHeadHTML(mark, zh, en, subZh, subEn){
  const sub = (subEn !== undefined) ? L(subZh, subEn) : (subZh || "");
  return '<h2><span class="mark">' + mark + '</span>' + L(zh, en) +
    (sub ? ' <span>' + sub + '</span>' : '') + '</h2>';
}
/* ---------- 球队页「比赛」区：近 10 场 / 未来赛程 切换 ---------- */
function matchesSectionHTML(resultsHTML, fixturesHTML){
  return sectionHeadHTML("06", "比赛", "Matches", "全部赛事（实时）", "All competitions (live)") +
    '<div class="mt-tabbar">' +
      '<button type="button" data-view="results" class="on">' + L("近 10 场", "Last 10") + '</button>' +
      '<button type="button" data-view="fixtures">' + L("未来赛程", "Fixtures") + '</button>' +
    '</div>' +
    '<div id="mt-results" class="mt-pane">' + resultsHTML + '</div>' +
    '<div id="mt-fixtures" class="mt-pane" hidden>' + fixturesHTML + '</div>';
}
function infoGridHTML(items){
  return '<div class="info-grid">' + items.map(it =>
    '<div class="info-item"><span>' + it.label + '</span><b>' + it.value + '</b></div>').join("") + '</div>';
}
function chipHTML(innerHTML){ return '<span class="chip">' + innerHTML + '</span>'; }
function emptyNoteHTML(zh, en){ return '<div class="honor-empty">' + L(zh, en) + '</div>'; }
function loadingNoteHTML(zh, en){ return '<div class="roster-loading">' + L(zh, en) + '</div>'; }

/* ---------- 球员块 ---------- */
function playerAvatarHTML(name, no, size, initialName){
  const ph = (typeof PLAYER_PHOTOS !== "undefined") ? PLAYER_PHOTOS[name] : null;
  const cls = size === "lg" ? "legend-avatar" : "pavatar";
  if(ph){
    const note = esc(ph.note || "官方定妆照");
    const img = '<img src="' + ph.src + '" alt="' + esc(name) + '" loading="lazy" decoding="async">';
    if(ph.page){
      return '<a class="' + cls + ' avatar-photo" href="' + ph.page + '" target="_blank" rel="noopener" title="' + note + '">' + img + '</a>';
    }
    return '<span class="' + cls + ' avatar-photo" title="' + note + '">' + img + '</span>';
  }
  return '<span class="' + cls + '">' + (size === "lg" ? esc((initialName || name).slice(0,1)) : no) + '</span>';
}
/* 国籍 → ESPN 国旗兜底（ESPN 名单缺 citizenship 时用） */
const NAT_FLAG = { "中国": "chn", "科索沃": "kos" };
function flagOf(p){
  if(!p) return "";
  if(p.flag) return p.flag;
  const code = NAT_FLAG[p.nat];
  return code ? "https://a.espncdn.com/i/teamlogos/countries/500/" + code + ".png" : "";
}
function playerRowHTML(p){
  return '<tr class="expandable" data-pl="' + esc(p.id) + '">' +
    '<td><span class="pno">' + (p.no || "-") + '</span></td>' +
    '<td><div class="pname">' + '<span class="pavatar">' + (p.no || "—") + '</span>' + esc(isEN() ? (p.en || p.name) : (p.name || p.en)) + '</div></td>' +
    '<td><span class="nat-cell">' + (flagOf(p) ? '<img class="nat-flag" src="' + esc(flagOf(p)) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') + esc(dNat(p.nat) || "-") + '</span></td>' +
    '<td>' + (p.age || "-") + '</td>' +
    '<td><span class="pos pos-' + esc(p.pos) + '">' + esc(dPos(p.pos)) + '</span></td>' +
    '<td class="num">' + p.ap + '</td><td class="num">' + p.g + '</td><td class="num">' + p.as + '</td>' +
    '<td class="num">' + p.yc + '</td><td class="num">' + p.rc + '</td>' +
  '</tr>';
}
/* 阵容结构：平均年龄 / 位置分布 / 国籍分布（数据来自名单） */
function squadStructureHTML(list){
  if(!list || !list.length) return "";
  const ages = list.map(p => parseInt(p.age, 10)).filter(n => n > 0);
  const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  const nat = {}, pos = {};
  list.forEach(p => { const k = p.nat || "-"; nat[k] = (nat[k] || 0) + 1; });
  list.forEach(p => { const k = p.pos || "-"; pos[k] = (pos[k] || 0) + 1; });
  const natTop = Object.keys(nat).sort((a, b) => nat[b] - nat[a]).slice(0, 6);
  const posOrder = ["门将", "后卫", "中场", "前锋"];
  const posKeys = Object.keys(pos).sort((a, b) => {
    const ia = posOrder.indexOf(a), ib = posOrder.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const bar = (label, count, max) => '<div class="sq-bar"><span class="sq-lbl">' + esc(label) + '</span>' +
    '<span class="sq-track"><i style="width:' + Math.max(4, Math.round(count / max * 100)) + '%"></i></span><b class="num">' + count + '</b></div>';
  const maxNat = Math.max.apply(null, natTop.map(k => nat[k]).concat([1]));
  const maxPos = Math.max.apply(null, posKeys.map(k => pos[k]).concat([1]));
  return '<div class="squad-structure">' +
    '<div class="sq-col sq-age"><h4>' + L("平均年龄", "Average age") + '</h4><div class="sq-avg num">' + (avgAge ? avgAge.toFixed(1) : "-") + '<small>' + L("岁", "yrs") + '</small></div></div>' +
    '<div class="sq-col"><h4>' + L("位置分布", "By position") + '</h4>' + posKeys.map(k => bar(dPos(k) || k, pos[k], maxPos)).join("") + '</div>' +
    '<div class="sq-col"><h4>' + L("国籍分布", "By nationality") + '</h4>' + natTop.map(k => bar(dNat(k) || k, nat[k], maxNat)).join("") + '</div>' +
  '</div>';
}
function rosterTableHTML(list, posFilter){
  const order = ["门将","后卫","中场","前锋"];
  const groups = order.map(pos => ({
    pos: pos,
    list: list.filter(p => p.pos === pos && (!posFilter || posFilter === pos)).sort((a,b) => (a.no || 99) - (b.no || 99))
  })).filter(g => g.list.length);
  const other = list.filter(p => order.indexOf(p.pos) < 0);
  if(other.length) groups.push({ pos:"其他", list: other });
  const tot = groups.reduce((acc,g) => { g.list.forEach(p => { acc.ap += p.ap; acc.g += p.g; acc.as += p.as; }); return acc; }, { ap:0, g:0, as:0 });
  if(!groups.length) return emptyNoteHTML("暂无球员名单数据。", "No squad data available.");
  return '<div class="tbl-wrap"><table class="ptable">' +
    '<thead><tr><th>' + L("号码", "No.") + '</th><th>' + L("球员", "Player") + '</th><th>' + L("国籍", "Nation") + '</th><th>' + L("年龄", "Age") + '</th><th>' + L("位置", "Position") + '</th>' +
    '<th class="r">' + L("出场", "Apps") + '</th><th class="r">' + L("进球", "Goals") + '</th><th class="r">' + L("助攻", "Assists") + '</th>' +
    '<th class="r">' + L("黄牌", "YC") + '</th><th class="r">' + L("红牌", "RC") + '</th></tr></thead><tbody>' +
    groups.map(g =>
      '<tr class="group-row"><td colspan="10">' + esc(dPos(g.pos)) + '</td></tr>' +
      g.list.map(playerRowHTML).join("")
    ).join("") +
    '<tr class="total-row"><td colspan="5">' + L("总计（当前显示 " + groups.reduce((n,g) => n + g.list.length, 0) + " 人）", "Total (" + groups.reduce((n,g) => n + g.list.length, 0) + " shown)") + '</td>' +
    '<td class="num">' + tot.ap + '</td><td class="num">' + tot.g + '</td><td class="num">' + tot.as + '</td><td colspan="2"></td></tr>' +
    '</tbody></table></div>';
}
function posTabsHTML(){
  return ['<button data-pos="" class="active">' + L("全部", "All") + '</button>']
    .concat(["门将","后卫","中场","前锋"].map(p => '<button data-pos="' + p + '">' + dPos(p) + '</button>')).join("");
}

/* ---------- 荣誉块 ---------- */
const HONOR_LANE_COLORS = ["#0f1416", "#2f6fb0", "#1b7a4b", "#b4761a"];
/* 荣誉时间线：按类别分泳道，按年份打点（数据来自 team-heritage 的 items[].years） */
function honorsTimelineHTML(honors){
  if(!honors || !honors.length) return "";
  const lanes = honors.map((cat, i) => ({
    label: isEN() ? (cat.catEn || cat.cat) : cat.cat,
    color: HONOR_LANE_COLORS[i % HONOR_LANE_COLORS.length],
    points: (cat.items || []).reduce((acc, it) => {
      const nm = isEN() ? (it.nameEn || it.name) : it.name;
      String(it.years || "").split(/[、,，;；]/).forEach(s => {
        const y = parseInt(s.trim(), 10);
        if(y >= 1850 && y <= 2100) acc.push({ year: y, label: nm });
      });
      return acc;
    }, [])
  })).filter(l => l.points.length);
  if(!lanes.length) return "";
  return '<div class="chart-block honors-timeline"><div class="chart-title">' + L("荣誉时间线", "Honours timeline") + '</div>' +
    '<div class="ch-scroll">' + honoursTimelineSVG(lanes) + '</div></div>';
}
function honorsGridHTML(honors){
  return honorsTimelineHTML(honors) + '<div class="honor-grid">' +
    honors.map(cat =>
      '<div class="honor-block">' +
        '<h3>' + esc(isEN() ? (cat.catEn || cat.cat) : cat.cat) + '</h3>' +
        cat.items.map(it =>
          it.count > 0
            ? '<div class="honor-row"><div class="honor-count">' + it.count + '<small>' + L("次", "x") + '</small></div>' +
              '<div class="honor-info"><b>' + esc(isEN() ? (it.nameEn || it.name) : it.name) + '</b><span>' + esc(isEN() ? (it.years || "").split("、").join(", ").replace(" 等", ", etc.") : it.years) + '</span></div></div>'
            : '<div class="honor-row"><div class="honor-count">0<small>' + L("次", "x") + '</small></div>' +
              '<div class="honor-info"><b>' + esc(isEN() ? (it.nameEn || it.name) : it.name) + '</b><span>' + esc(isEN() ? (it.noteEn || L("暂无夺冠记录", "No titles")) : (it.note || L("暂无夺冠记录", "No titles"))) + '</span></div></div>'
        ).join("") +
      '</div>'
    ).join("") +
  '</div>';
}

/* ---------- 名宿卡（统一无头像：姓名 + 效力期 + 出场数据 + 效力期间荣誉） ---------- */
/* 荣誉名归一化：去数量/括号/标点/通用后缀，便于与俱乐部荣誉表比对 */
const HONOUR_ALIAS = { "西班牙杯": "国王杯", "西班牙国王杯": "国王杯", "欧洲联盟杯": "欧联杯", "欧洲冠军杯": "欧冠", "欧洲冠军联赛": "欧冠", "英格兰超级联赛": "英超", "西班牙足球甲级联赛": "西甲" };
function honourKey(s){
  let t = String(s || "").toLowerCase()
    .replace(/^\d+\s*[×x]\s*/, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[×\s·・、,，.。:：;；\-–—/]/g, "")
    .replace(/冠军|联赛|赛事|奖杯|锦标赛|超级/g, "");
  if(HONOUR_ALIAS[t]) t = HONOUR_ALIAS[t];
  return t;
}
/* 个人奖项名集合（来自 Translator.awardCN，中英双向） */
function awardKeys(){
  const a = (typeof Translator !== "undefined" && Translator.awardCN) || {};
  const keys = new Set();
  Object.keys(a).forEach(k => { [k, a[k]].forEach(v => { const n = honourKey(v); if(n && n.length >= 2) keys.add(n); }); });
  return keys;
}
/* 个人荣誉：名宿荣誉里属于个人奖项的部分（俱乐部冠军另由「效力期间球队冠军」列出） */
function tenureAwards(l){
  const raw = isEN() ? (l.honorsEn || l.honors || "") : (l.honors || l.honorsEn || "");
  const items = String(raw).split(/[；;]/)[0].split(/[、,]/).map(s => s.trim()).filter(Boolean);
  const aw = awardKeys();
  return items.filter(it => { const k = honourKey(it); return k && aw.has(k); });
}
function legendStatsOf(l, four){
  return four
    ? [{ v:l.ap, zh:"出场", en:"Apps" }, { v:l.lg, zh:"联赛进球", en:"League goals" },
       { v:l.cp, zh:"杯赛进球", en:"Cup goals" }, { v:l.as, zh:"助攻", en:"Assists" }]
    : [
        (l.ap !== "" && l.ap !== undefined && l.ap !== null) ? { v:l.ap, zh:"联赛出场", en:"League apps" } : null,
        (l.lg !== "" && l.lg !== undefined && l.lg !== null) ? { v:l.lg, zh:"联赛进球", en:"League goals" } : null
      ].filter(Boolean);
}
/* 效力年数（period 形如 "2011–2021" / "2008–2013、2015–"；开放式用当前年补齐） */
function periodSpans(period){
  const now = new Date().getFullYear();
  return String(period || "").split(/[、,]/).map(seg => {
    const m = seg.match(/(\d{4})\s*[–\-—~]\s*(\d{4})?/);
    if(!m) return null;
    const a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : now;
    return b >= a ? [a, b] : null;
  }).filter(Boolean);
}
function tenureYears(period){
  return periodSpans(period).reduce((sum, s) => sum + (s[1] - s[0]), 0);
}
/* 效力期间球队冠军：俱乐部荣誉表各项的年份 ∩ 球员效力期 */
function shortHonourName(s){ return String(s || "").split("/").pop().trim(); }
function tenureTrophies(period, honors){
  const spans = periodSpans(period);
  if(!spans.length || !honors) return [];
  const out = [];
  (honors || []).forEach(cat => (cat.items || []).forEach(it => {
    const ys = String(it.years || "").split(/[、,，;；]/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    const n = ys.filter(y => spans.some(sp => y >= sp[0] && y <= sp[1])).length;
    if(n > 0) out.push({ name: it.name, en: it.nameEn || it.name, count: n });
  }));
  return out;
}
function legendCardHTML(l, opts, honors){
  const stats = legendStatsOf(l, !!(opts && opts.fourStats));
  const trophies = tenureTrophies(l.period, honors);
  const awards = tenureAwards(l);
  const yrs = tenureYears(l.period);
  const wiki = l.wiki || l.en;
  const chips = arr => '<div class="legend-chips">' + arr.map(c => '<span>' + esc(c) + '</span>').join("") + '</div>';
  const trophyChips = trophies.map(t => (t.count > 1 ? t.count + "×" : "") + shortHonourName(isEN() ? t.en : t.name));
  return '<div class="legend-card">' +
    '<div class="legend-head">' +
      '<div class="legend-name"><b>' + esc(isEN() ? (l.en || l.name) : l.name) + '</b>' +
        (isEN() ? '' : '<small>' + esc(l.en || "") + '</small>') + '</div>' +
      (l.period ? '<span class="legend-era">' + esc(l.period) + (yrs ? ' · ' + L(yrs + " 年", yrs + " yrs") : '') + '</span>' : '') +
    '</div>' +
    (stats.length ? '<div class="legend-stats' + (stats.length === 2 ? ' two' : '') + '">' +
      stats.map(s => '<div><b>' + esc(s.v) + '</b><span>' + L(s.zh, s.en) + '</span></div>').join("") + '</div>' : '') +
    (trophyChips.length ? '<div class="legend-block"><h5>' + L("效力期间球队冠军", "Club trophies in era") + '</h5>' + chips(trophyChips) + '</div>' : '') +
    (awards.length ? '<div class="legend-block"><h5>' + L("个人荣誉", "Individual honours") + '</h5>' + chips(awards) + '</div>' : '') +
    (wiki ? '<div class="legend-foot"><a class="legend-wiki" href="https://en.wikipedia.org/wiki/' + encodeURIComponent(wiki) + '" target="_blank" rel="noopener">' + L("维基百科", "Wikipedia") + ' ↗</a></div>' : '') +
  '</div>';
}
function legendGridHTML(legends, opts, honors){
  return '<div class="legend-grid">' + legends.map(l => legendCardHTML(l, opts, honors)).join("") + '</div>';
}

/* ---------- 比赛块 ---------- */
function resLabel(res){ return L(RES_CN[res], res); }
function haBadgeHTML(home){
  return '<span class="ha ha-' + (home ? "H" : "A") + '">' + L(home ? "主" : "客", home ? "H" : "A") + '</span>';
}
function trendPillsHTML(chrono){
  return chrono.map(r => {
    const res = resultOf(r);
    return '<span class="tp res-' + res + '" title="' + esc(r.date + " " + L(r.home ? "主" : "客", r.home ? "H" : "A") + " vs " + dOpp(r.opp) + " " + r.gf + ":" + r.ga) + '">' + resLabel(res) + '</span>';
  }).join("");
}
function resultRowHTML(r){
  const res = resultOf(r);
  const attrs = r.id ? ' class="expandable" data-ev="' + esc(r.id) + '" data-lg="' + esc(r.leagueSlug || "") + '" title="' + esc(L("点击查看赛况与数据", "Click for match details")) + '"' : '';
  return '<tr' + attrs + '>' +
    '<td class="num">' + r.date + ' ' + weekday(r.date) + '</td>' +
    '<td>' + esc(dComp(r.comp)) + '</td>' +
    '<td>' + esc(dOpp(r.opp)) + '</td>' +
    '<td>' + haBadgeHTML(r.home) + '</td>' +
    '<td class="score">' + r.gf + ' : ' + r.ga + '</td>' +
    '<td><span class="res res-' + res + '">' + resLabel(res) + '</span></td>' +
  '</tr>';
}
function fixtureRowHTML(f){
  const attrs = f.id ? ' class="expandable" data-ev="' + esc(f.id) + '" data-lg="' + esc(f.leagueSlug || "") + '" title="' + esc(L("点击查看赛前赔率与近况", "Click for pre-match odds and form")) + '"' : '';
  return '<tr' + attrs + '>' +
    '<td class="num">' + f.date.slice(5) + '</td>' +
    '<td>' + weekday(f.date) + '</td>' +
    '<td>' + esc(dComp(f.comp)) + '</td>' +
    '<td>' + esc(dOpp(f.opp)) + '</td>' +
    '<td>' + haBadgeHTML(f.home) + '</td>' +
    '<td class="num">' + f.time + '</td>' +
    '<td>' + esc(dVenueName(f.stadium)) + '</td>' +
  '</tr>';
}
function monthSepHTML(ym, n){
  return '<tr class="monthsep"><td colspan="7">' + monthLabel(ym) + '<em>' + n + ' ' + L("场", "matches") + '</em></td></tr>';
}
/* 图表配色：取队色中较深者，但避开近黑（黑多边形叠加会糊） */
function chartColor(t){
  const d = displayColors({ colors: (t && t.colors) || ["#0f1416", "#4d5a61"] });
  return (typeof hexLum === "function" && hexLum(d.cacc) < 0.16) ? d.c2 : d.cacc;
}
/* 球队页「过去十场」两张图：累计积分走势 + 进/失球（chrono 由远及近） */
function resultsChartsHTML(chrono){
  if(!chrono || chrono.length < 2) return "";
  let acc = 0;
  const pts = chrono.map(r => {
    const res = resultOf(r);
    acc += res === "W" ? 3 : (res === "D" ? 1 : 0);
    return { short: dOpp(r.opp) || r.opp || "", res: res, pts: acc, label: (r.date || "") + " " + (dOpp(r.opp) || r.opp || "") + " " + (r.gf + "-" + r.ga) };
  });
  const groups = chrono.map(r => ({ short: dOpp(r.opp) || r.opp || "", a: r.gf || 0, b: r.ga || 0, label: (dOpp(r.opp) || r.opp || "") }));
  return '<div class="chart-grid">' +
    '<div class="chart-block"><div class="chart-title">' + L("近 10 场走势 · 累计积分", "Last 10 — points trend") + '</div><div class="ch-scroll">' + lineChartSVG(pts) + '</div></div>' +
    '<div class="chart-block"><div class="chart-title">' + L("近 10 场进 / 失球", "Last 10 — goals for / against") + '</div><div class="ch-scroll">' + groupedBarsSVG(groups) + '</div>' +
      '<div class="ch-legend"><span><i class="lg-a"></i>' + L("进球", "For") + '</span><span><i class="lg-b"></i>' + L("失球", "Against") + '</span></div></div>' +
  '</div>';
}
function resultsSectionHTML(list){
  const sum = resultSummary(list);
  return '<div class="hint-line"><span class="hint-chip">' + L("点击任意比赛可查看进球、红黄牌与数据对比", "Click any match for goals, cards and stats") + '</span></div>' +
    '<div class="summary">' +
      '<div class="sum-item"><b style="color:var(--w)">' + sum.counts.W + '</b><span>' + L("胜", "Won") + '</span></div>' +
      '<div class="sum-item"><b style="color:var(--d)">' + sum.counts.D + '</b><span>' + L("平", "Drawn") + '</span></div>' +
      '<div class="sum-item"><b style="color:var(--l)">' + sum.counts.L + '</b><span>' + L("负", "Lost") + '</span></div>' +
      '<div class="sum-item"><b>' + (sum.counts.W * 3 + sum.counts.D) + '</b><span>' + L("近10场积分", "Points") + '</span></div>' +
      '<div><div class="trend">' + trendPillsHTML(sum.chrono) + '<span class="trend-note">' + L("← 由远及近", "← oldest to newest") + '</span></div></div>' +
    '</div>' +
    resultsChartsHTML(sum.chrono) +
    '<div class="tbl-wrap"><table class="rtable">' +
      '<thead><tr><th>' + L("日期", "Date") + '</th><th>' + L("赛事", "Competition") + '</th><th>' + L("对手", "Opponent") + '</th><th>' + L("主/客", "H/A") + '</th><th>' + L("比分", "Score") + '</th><th>' + L("结果", "Result") + '</th></tr></thead><tbody>' +
      list.map(resultRowHTML).join("") +
    '</tbody></table></div>';
}
function fixturesSectionHTML(list){
  const months = [...new Set(list.map(f => f.date.slice(0,7)))].sort();
  const comps = [...new Set(list.map(f => f.comp))];
  return '<div class="hint-line"><span class="hint-chip">' + L("点击任意比赛可查看赛前赔率与近况", "Click any fixture for odds and form") + '</span></div>' +
    '<div class="filter-line">' +
      '<span class="sel"><select id="fx-month"><option value="">' + L("全部月份", "All months") + '</option>' + months.map(m => '<option value="' + m + '">' + monthLabel(m) + '</option>').join("") + '</select></span>' +
      '<span class="sel"><select id="fx-comp"><option value="">' + L("全部赛事", "All competitions") + '</option>' + comps.map(c => '<option value="' + esc(c) + '">' + esc(dComp(c)) + '</option>').join("") + '</select></span>' +
      '<span class="count" id="fx-count"></span>' +
    '</div>' +
    '<div id="fixtures-body"></div>';
}
function fixturesTableHTML(list, month, comp){
  const filtered = list.filter(f =>
    (!month || f.date.slice(0,7) === month) && (!comp || f.comp === comp)
  );
  if(!filtered.length) return emptyNoteHTML("当前筛选条件下没有剩余赛程。", "No fixtures match the current filters.");
  let lastMonth = "", rows = "";
  filtered.forEach(f => {
    const ym = f.date.slice(0,7);
    if(ym !== lastMonth){
      lastMonth = ym;
      const n = filtered.filter(x => x.date.slice(0,7) === ym).length;
      rows += monthSepHTML(ym, n);
    }
    rows += fixtureRowHTML(f);
  });
  return '<div class="tbl-wrap"><table class="ftable">' +
    '<thead><tr><th>' + L("日期", "Date") + '</th><th>' + L("星期", "Day") + '</th><th>' + L("赛事", "Competition") + '</th><th>' + L("对手", "Opponent") + '</th><th>' + L("主/客", "H/A") + '</th><th>' + L("开球时间", "Kick-off") + '</th><th>' + L("球场", "Venue") + '</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>';
}

/* ---------- 球队块：图片辅助 ---------- */
function capLabel(zh){
  if(!isEN()) return zh;
  const m = { "球场外观":"Exterior", "内景":"Interior", "航拍":"Aerial", "看台氛围":"Crowd", "全景":"Panorama", "夜景":"Night", "球场实拍":"Stadium",
    "赛日夜晚":"Matchday night", "远眺":"Distant view", "比赛日":"Matchday", "草皮细节":"Pitch detail", "赛前":"Pre-match", "看台":"Stand",
    "内景全景":"Interior panorama", "高处俯瞰":"Elevated view", "球场全景":"Stadium view", "远景":"Distant view", "外观":"Exterior" };
  return m[zh] || zh;
}
function photoCaption(src){
  const s = String(src).toLowerCase();
  if(/aerial|luftbild|from the air|from above/.test(s)) return "航拍";
  if(/panorama|panoramic/.test(s)) return "全景";
  if(/interior|inside|inneres|pitch|field|rasen/.test(s)) return "内景";
  if(/night|nacht/.test(s)) return "夜景";
  if(/exterior|outside|facade|fassade|entrance|eingang/.test(s)) return "外观";
  if(/stand|tribune|tribuna|kop|curva|seat/.test(s)) return "看台";
  return "球场实拍";
}
function crestFallbackSVG(t){
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<circle cx="50" cy="50" r="48" fill="' + t.colors[1] + '"/>' +
    '<circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="2.5" opacity=".85"/>' +
    '<text x="50" y="59" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#ffffff">' + t.initials + '</text>' +
    '</svg>');
}
function crestImgHTML(o){
  return '<img class="crest-img" src="' + o.src + '" width="' + o.size + '" height="' + o.size + '" alt="' + esc(o.alt) + '"' +
    (o.lazy ? ' loading="lazy" decoding="async"' : '') +
    ' onerror="' + (o.fallbackSVG ? "this.onerror=null;this.src='" + o.fallbackSVG + "'" : "this.style.visibility='hidden'") + '">';
}
/* WGS-84 → BD-09（百度坐标系）；境外坐标原样返回 */
const _X_PI = Math.PI * 3000 / 180, _PI = Math.PI, _A = 6378245.0, _EE = 0.00669342162296594323;
function _outOfChina(lng, lat){ return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271); }
function _tLat(x, y){ let r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*_PI) + 20*Math.sin(2*x*_PI)) * 2/3; r += (20*Math.sin(y*_PI) + 40*Math.sin(y/3*_PI)) * 2/3; r += (160*Math.sin(y/12*_PI) + 320*Math.sin(y*_PI/30)) * 2/3; return r; }
function _tLng(x, y){ let r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x)); r += (20*Math.sin(6*x*_PI) + 20*Math.sin(2*x*_PI)) * 2/3; r += (20*Math.sin(x*_PI) + 40*Math.sin(x/3*_PI)) * 2/3; r += (150*Math.sin(x/12*_PI) + 300*Math.sin(x/30*_PI)) * 2/3; return r; }
function wgs84ToGcj02(lng, lat){
  if(_outOfChina(lng, lat)) return [lng, lat];
  let dLat = _tLat(lng - 105, lat - 35), dLng = _tLng(lng - 105, lat - 35);
  const rl = lat / 180 * _PI; let m = Math.sin(rl); m = 1 - _EE * m * m; const s = Math.sqrt(m);
  dLat = (dLat * 180) / ((_A * (1 - _EE)) / (m * s) * _PI);
  dLng = (dLng * 180) / (_A / s * Math.cos(rl) * _PI);
  return [lng + dLng, lat + dLat];
}
function wgs84ToBd09(lng, lat){
  if(_outOfChina(lng, lat)) return [lng, lat];
  const g = wgs84ToGcj02(lng, lat);
  const z = Math.sqrt(g[0]*g[0] + g[1]*g[1]) + 0.00002 * Math.sin(g[1] * _X_PI);
  const th = Math.atan2(g[1], g[0]) + 0.000003 * Math.cos(g[0] * _X_PI);
  return [z * Math.cos(th) + 0.0065, z * Math.sin(th) + 0.006];
}
function mapHTML(m){
  if(!m) return "";
  const nm = m.title || "";
  if(m.noCoords){
    const q = encodeURIComponent(nm);
    return '<div class="map-side" style="margin-top:18px;max-width:460px">' +
      '<a class="btn-link" href="https://uri.amap.com/search?keyword=' + q + '&src=footydex" target="_blank" rel="noopener">' + L("在高德地图搜索该球场", "Search on Amap") + '</a>' +
      '<a class="btn-link" href="https://api.map.baidu.com/geocoder?address=' + q + '&output=html&src=footydex" target="_blank" rel="noopener" style="margin-top:10px">' + L("在百度地图搜索该球场", "Search on Baidu Maps") + '</a>' +
    '</div>' +
    '<p class="photo-note">' + L("该球场暂未收录地图坐标，可先通过上方链接定位。", "No coordinates stored for this stadium yet — use the links above.") + '</p>';
  }
  const lat = m.lat, lon = m.lon;
  const inChina = !_outOfChina(lon, lat);
  const g = inChina ? wgs84ToGcj02(lon, lat) : [lon, lat];
  const glat = g[1].toFixed(6), glng = g[0].toFixed(6);
  const provider = inChina ? "amap" : "bing";
  const attr = inChina ? "© 高德地图" : "© Bing Maps";
  const bd = wgs84ToBd09(lon, lat);
  const bdLng = bd[0].toFixed(6), bdLat = bd[1].toFixed(6);
  const baidu = "https://api.map.baidu.com/marker?location=" + bdLat + "," + bdLng + "&title=" + encodeURIComponent(nm) + "&content=" + encodeURIComponent(nm) + "&output=html&src=footydex";
  const amap = "https://uri.amap.com/marker?position=" + lon + "," + lat + "&name=" + encodeURIComponent(nm) + "&coordinate=wgs84&src=footydex&callnative=1";
  return '<div class="map-wrap">' +
      '<div class="map-frame tmap" data-provider="' + provider + '" data-lat="' + glat + '" data-lon="' + glng + '" data-zoom="16" role="application" aria-label="' + nm + '">' +
        '<div class="tmap-layer"><div class="tmap-tiles"></div><div class="tmap-pin"></div></div>' +
        '<div class="tmap-ctl"><button type="button" class="tmap-zoom" data-d="1" aria-label="' + L("放大", "Zoom in") + '">+</button><button type="button" class="tmap-zoom" data-d="-1" aria-label="' + L("缩小", "Zoom out") + '">−</button></div>' +
        '<span class="tmap-attr">' + attr + '</span>' +
      '</div>' +
      '<div class="map-side">' +
        (m.showCoordsItem ? '<div class="info-item"><span>' + L("地图坐标", "Coordinates") + '</span><b>' + lat + ', ' + lon + '</b></div>' : '') +
        '<div class="info-item"><span>' + L("定位说明", "Location") + '</span><b>' + m.locFirst + '<br>' + m.cityCountry + '</b></div>' +
        '<a class="btn-link" href="' + amap + '" target="_blank" rel="noopener">' + L("在高德地图打开", "Open in Amap") + '</a>' +
        '<a class="btn-link" href="' + baidu + '" target="_blank" rel="noopener">' + L("在百度地图打开", "Open in Baidu Maps") + '</a>' +
      '</div>' +
    '</div>';
}
function galleryHTML(shots, noteHTML){
  if(!shots || !shots.length) return noteHTML || "";
  return '<div class="gallery" id="gallery">' +
    shots.map(s => '<figure class="gal">' +
      '<span class="badge2">' + esc(s.badge) + '</span>' +
      '<img src="' + s.src + '" alt="' + esc(s.alt) + '" loading="lazy" decoding="async" onerror="imgFail(this)">' +
      '<figcaption>' +
        '<b>' + esc(s.bold) + '</b>' +
        '<span>' + esc(s.by) + ' · ' + esc(s.lic) + ' · <a href="' + s.page + '" target="_blank" rel="noopener">Wikimedia Commons</a></span>' +
      '</figcaption>' +
    '</figure>').join("") +
  '</div>' + (noteHTML || "");
}

/* ---------- 球队块：球队页模板 ---------- */
const NAV_SECTIONS = [
  ["sec-overview", "概览", "Overview"], ["sec-stadium", "主场", "Stadium"], ["sec-players", "球员", "Squad"],
  ["sec-legends", "名宿", "Legends"], ["sec-honors", "荣誉", "Honours"], ["sec-matches", "比赛", "Matches"]
];
function navHTML(keys){
  return '<nav class="sec-nav" id="sec-nav"><div class="sec-nav-in">' +
    NAV_SECTIONS.filter(x => keys.indexOf(x[0]) >= 0)
      .map(x => '<button data-target="' + x[0] + '">' + L(x[1], x[2]) + '</button>').join("") +
    '<span class="nav-ink" id="nav-ink" style="width:0"></span></div></nav>';
}
function liveBarHTML(){
  return '<div class="live-bar" id="live-bar"><span class="live-dot"></span><span id="live-text">' +
    L("正在同步实时数据…", "Syncing live data…") + '</span><button id="live-refresh">' + L("刷新", "Refresh") + '</button></div>';
}
function heroStatsHTML(t, results, rosterCount){
  const sum = resultSummary(results || []);
  const honorTotal = (t.honors || []).reduce((n, cat) => n + cat.items.reduce((m, it) => m + it.count, 0), 0);
  const roster = rosterCount || (t.players ? t.players.length : 0);
  const stats = [
    [sum.counts.W + L("胜", "W") + sum.counts.D + L("平", "D") + sum.counts.L + L("负", "L"), L("近10场战绩", "Last 10")],
    [honorTotal ? honorTotal : roster, honorTotal ? L("主要冠军奖杯", "Major trophies") : L("登记球员", "Registered players")]
  ];
  if(honorTotal) stats.push([roster, L("登记球员", "Registered players")]);
  return stats.map(x => '<div class="th-stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>').join("");
}
function teamHeroHTML(vm){
  return '<div class="team-hero">' +
    '<span class="th-crest">' + vm.crestHTML + '</span>' +
    '<h2>' + esc(vm.name) + (isEN() ? '' : '<small>' + esc(vm.en) + '</small>') + '</h2>' +
    '<div class="chips">' + vm.chips.join("") + '</div>' +
    '<div class="th-stats" id="hero-stats">' + heroStatsHTML(vm.heroT, vm.heroResults, vm.heroRoster) + '</div>' +
  '</div>';
}
function teamTemplateHTML(vm){
  return '<div style="--c1:' + vm.colors.c1 + ';--c2:' + vm.colors.c2 + ';--cacc:' + vm.colors.cacc + '">' +
    teamHeroHTML(vm) +

    navHTML(["sec-overview","sec-stadium","sec-players","sec-legends","sec-honors","sec-matches"]) +
    liveBarHTML() +

    '<section class="panel" id="sec-overview">' +
      sectionHeadHTML("01", "球队概览", "Club overview", "基础信息", "Key facts") +
      infoGridHTML(vm.overviewItems) +
      (vm.recordHTML || '') +
      vm.overviewDesc +
      (vm.newsHTML || '') +
      (vm.statsHTML || '') +
      (vm.tacticsHTML || '') +
      (vm.leagueAvgHTML || '') +
    '</section>' +

    '<section class="panel" id="sec-stadium">' +
      sectionHeadHTML("02", "主场信息", "Stadium", vm.stadiumTitle) +
      infoGridHTML(vm.stadiumItems) +
      vm.stadiumDesc +
      vm.mapHTML +
      vm.galleryHTML +
      (vm.stadiumNote || '') +
    '</section>' +

    '<section class="panel" id="sec-players">' +
      sectionHeadHTML("03", "现役球员", "Squad", "ESPN 实时登记名单", "Live registered squad · ESPN") +
      '<div class="pos-tabs" id="pos-tabs"></div>' +
      '<div id="squad-structure"></div>' +
      '<div id="players-body">' + loadingNoteHTML("正在同步球员名单…", "Loading squad…") + '</div>' +
      '<p class="photo-note">' + vm.playersNote + '</p>' +
    '</section>' +

    '<section class="panel" id="sec-legends">' +
      sectionHeadHTML("04", "传奇球员 / 队史名宿", "Club legends", "效力时期 · 出场记录 · 主要成就", "Era · appearances · honours") +
      vm.legendsHTML +
    '</section>' +

    '<section class="panel" id="sec-honors">' +
      sectionHeadHTML("05", "历史荣誉", "Honours", "按赛事分类 · 夺冠次数与年份", "By competition · titles and years") +
      vm.honorsHTML +
    '</section>' +

    '<section class="panel" id="sec-matches">' +
      matchesSectionHTML(
        '<div id="sec-results">' + vm.resultsHTML + '</div>',
        '<div id="sec-fixtures">' + vm.fixturesHTML + '</div>'
      ) +
    '</section>' +
  '</div>';
}

/* ---------- 首页块 ---------- */
function leagueBlockHTML(lg, teams, open){
  const promoted = teams.filter(t => t.promoted).length;
  return '<section class="league-block' + (open ? ' open' : '') + '" data-league="' + lg.id + '">' +
    '<button class="league-head" data-toggle="' + lg.id + '">' +
      '<span class="lg-name">' + esc(dLeague(lg.cn)) + '</span>' +
      '<span class="lg-meta">' + esc(isEN() ? (LEAGUE_COUNTRY_EN[lg.country] || lg.country) : lg.country) + ' · <b class="num">' + teams.length + '</b> ' + L("支球队", "clubs") + '</span>' +
      (promoted ? '<span class="lg-promoted">' + L("升班马 " + promoted + " 支", promoted + " promoted") + '</span>' : '') +
      '<span class="chev">▾</span>' +
    '</button>' +
    '<div class="league-body"><div class="team-grid">' + teams.map(teamCardHTML).join("") + '</div></div>' +
  '</section>';
}
function resultCountHTML(n, q){
  return isEN()
    ? '<b>' + n + '</b> clubs across <b>' + LEAGUES.length + '</b> leagues' + (q ? ' (keyword: ' + esc(q) + ')' : '')
    : '共 <b>' + n + '</b> 支球队 · ' + LEAGUES.length + ' 个联赛' + (q ? '（关键词：' + esc(q) + '）' : '');
}
function quickChipsHTML(items, activeVal){
  return items.map(c =>
    '<button data-league="' + esc(c.val) + '"' + (activeVal === c.val ? ' class="on"' : '') + '>' + esc(c.label) + '</button>'
  ).join("");
}
function optionsHTML(values, allLabel, labelFn){
  return '<option value="">' + allLabel + '</option>' +
    values.map(v => '<option value="' + esc(v) + '">' + esc(labelFn ? labelFn(v) : v) + '</option>').join("");
}

/* ---------- 球队卡片（原 home.js 迁入） ---------- */
function formPillsHTML(t){
  const last = teamResultsOf(t).slice(0, 5).reverse();
  if(!last.length) return '';
  return '<span class="form">' + last.map(r => {
    const res = resultOf(r);
    return '<i class="' + res.toLowerCase() + '">' + L(RES_CN[res], res) + '</i>';
  }).join("") + '</span>';
}

function nextMatchHTML(t){
  const f = teamFixturesOf(t)[0];
  if(!f) return '<span class="card-next">' + L("暂无后续赛程", "No upcoming fixtures") + '</span>';
  return '<span class="card-next"><b>' + esc(f.date.slice(5)) + ' ' + esc(dComp(f.comp)) + '</b>' +
    L(f.home ? "主场" : "客场", f.home ? "Home" : "Away") + ' vs ' + esc(dOpp(f.opp)) + '</span>';
}

/* 收藏球队仪表盘卡片（首页置顶「我的球队」） */
function favCardHTML(t){
  const cur = editorialOf(t);
  const src = cur ? (CRESTS[cur.id] || "") : (t.logo || "");
  const d = displayColors({ colors: t.colors });
  const rank = leagueRankOf(t);
  const fixtures = teamFixturesOf(t);
  const f = fixtures[0];
  let next = '<span class="fav-none">' + L("暂无后续赛程", "No upcoming fixtures") + '</span>';
  if(f){
    const days = Math.ceil((new Date(f.date + "T12:00:00").getTime() - Date.now()) / 86400000);
    const cd = days <= 0 ? L("即将开始", "soon") : (days === 1 ? L("明天", "tomorrow") : L(days + " 天后", "in " + days + "d"));
    next = '<span class="fav-next"><b>' + esc(f.date.slice(5)) + ' · ' + esc(dComp(f.comp)) + '</b> ' +
      L(f.home ? "主" : "客", f.home ? "H" : "A") + ' vs ' + esc(dOpp(f.opp)) + '<i class="fav-cd">' + esc(cd) + '</i></span>';
  }
  const roster = (LIVE.rosters && LIVE.rosters[t.espnId]) || [];
  let top = null;
  roster.forEach(p => { const g = parseInt(p.g, 10) || 0; if(!top || g > top.g) top = { name: isEN() ? (p.en || p.name) : (p.name || p.en), g: g }; });
  return '<article class="fav-card" data-id="' + esc(t.id) + '" style="--c1:' + d.c1 + ';--c2:' + d.c2 + ';--cacc:' + d.cacc + '" tabindex="0" role="button">' +
    '<button class="fav-star on" data-fav="' + esc(t.id) + '" title="' + esc(L("取消收藏", "Unfavorite")) + '">★</button>' +
    '<div class="fav-head">' +
      '<span class="crest">' + crestImgHTML({ src: src, size: 46, alt: dTeam(t) + L("队徽", " crest"), lazy: true }) + '</span>' +
      '<div><h3>' + esc(dTeam(t)) + '</h3>' +
        '<div class="chips"><span class="chip">' + esc(dLeague(t.league)) + '</span>' + (rank ? '<span class="chip">' + esc(L("第 " + rank.rank + " 名", ordinal(rank.rank))) + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="fav-rows">' +
      '<div class="fav-row"><span class="fav-lbl">' + L("近 5 场", "Last 5") + '</span>' + (formPillsHTML(t) || '<span class="fav-none">-</span>') + '</div>' +
      '<div class="fav-row"><span class="fav-lbl">' + L("下一场", "Next") + '</span>' + next + '</div>' +
      (top && top.g ? '<div class="fav-row"><span class="fav-lbl">' + L("最佳射手", "Top scorer") + '</span><span class="fav-top">' + esc(top.name) + ' <b class="num">' + top.g + '</b></span></div>' : '') +
    '</div>' +
  '</article>';
}
function teamCardHTML(t){
  const cur = editorialOf(t);
  const src = cur ? (CRESTS[cur.id] || "") : (t.logo || "");
  const d = displayColors({ colors: t.colors });
  const style = '--c1:' + d.c1 + ';--c2:' + d.c2 + ';--cacc:' + d.cacc;
  const meta = [
    dLeague(t.league),
    [dCountryName(t.country), dCityName(t.city)].filter(Boolean).join(" · ")
  ].filter(Boolean);
  /* 主场名永远单独一行（所有队一视同仁，精选队也一样） */
  const metaSub = dVenueName(t.venue);
  const results = teamResultsOf(t), fixtures = teamFixturesOf(t);
  const foot = (results.length || fixtures.length) ? ('<div class="card-foot">' + formPillsHTML(t) + nextMatchHTML(t) + '</div>') : '';
  const badge = t.promoted ? '<span class="promoted-tag">' + L("升班马", "Promoted") + '</span>' : '';
  const rank = leagueRankOf(t);
  const rankBubble = rank
    ? '<span class="rank-bubble" title="' + esc(L("联赛第 " + rank.rank + " 名", "League rank: " + ordinal(rank.rank))) + '">' + esc(L("第 " + rank.rank, ordinal(rank.rank))) + '</span>'
    : '';
  const favOn = (typeof isFav === "function") && isFav(t.id);
  const favStar = '<button class="fav-star' + (favOn ? " on" : "") + '" data-fav="' + esc(t.id) + '" title="' + esc(L(favOn ? "取消收藏" : "收藏", favOn ? "Unfavorite" : "Favorite")) + '">' + (favOn ? "★" : "☆") + '</button>';
  return '<article class="team-card" data-id="' + esc(t.id) + '" style="' + style + '" tabindex="0" role="button">' +
    rankBubble + favStar +
    '<div class="card-top">' +
      '<span class="crest">' + crestImgHTML({ src: src, size: 56, alt: dTeam(t) + L("队徽", " crest"), lazy: true }) + '</span>' +
      '<div>' +
        '<h3>' + esc(dTeam(t)) + '<i>' + esc(t.initials) + '</i>' + badge + '</h3>' +
        '<div class="chips">' + meta.map(m => '<span class="chip">' + esc(m) + '</span>').join("") + '</div>' +
        (metaSub ? '<div class="chips chips-sub"><span class="chip">' + esc(metaSub) + '</span></div>' : '') +
      '</div>' +
    '</div>' + foot +
  '</article>';
}

/* ---------- 详情块：球队赛季数据 / 比赛详情 / 球员详情 ---------- */
function blockTitleHTML(zh, en, noteZh, noteEn){
  return '<h3 class="sub-title">' + L(zh, en) + (noteZh ? ' <span>' + L(noteZh, noteEn) + '</span>' : '') + '</h3>';
}
function statGridHTML(items){
  return '<div class="stat-grid">' + items.map(it =>
    '<div class="stat-item"><span>' + it.label + '</span><b>' + it.value + '</b></div>').join("") + '</div>';
}
function statGroupsHTML(groups){
  return groups.filter(g => g.items && g.items.length).map(g =>
    '<div class="stat-group">' +
      '<h4 class="stat-group-title">' + L(g.zh, g.en) + '</h4>' +
      statGridHTML(g.items) +
    '</div>').join("");
}
function commentaryRowsHTML(list){
  return list.map(c => {
    const raw = (!isEN() && !c.zh) ? ' <i class="news-raw">' + L("原文", "EN") + '</i>' : '';
    return '<div class="md-cm"><i class="num">' + esc(c.time || "") + '</i><span>' + esc(c.zh || c.text) + raw + '</span></div>';
  }).join("");
}
/* 本队 vs 联赛平均（54 项） */
function leagueCompareHTML(stats, avg){
  if(!stats || !avg) return "";
  const rows = [];
  TEAM_STAT_GROUPS.forEach(g => g.fields.forEach(f => {
    const v = parseFloat(stats[f.key]), a = avg[f.key];
    if(isNaN(v) || a === undefined || isNaN(a)) return;
    let diff = v - a;
    if(f.fmt === "pct100") diff = diff * 100;
    rows.push({ group: L(g.zh, g.en), label: L(f.zh, f.en), v: fmtStatVal(stats[f.key], f.fmt), a: fmtStatVal(a, f.fmt), diff: diff });
  }));
  if(!rows.length) return "";
  let last = "", body = "";
  rows.forEach(r => {
    if(r.group !== last){ last = r.group; body += '<div class="lga-group">' + esc(r.group) + '</div>'; }
    const flat = Math.abs(r.diff) < 0.05;
    const sign = r.diff > 0 ? "+" : "";
    body += '<div class="lga-row"><span class="lga-lbl">' + esc(r.label) + '</span>' +
      '<b class="num">' + r.v + '</b>' +
      '<span class="lga-avg num">' + r.a + '</span>' +
      '<b class="lga-diff num ' + (flat ? "flat" : (r.diff > 0 ? "up" : "down")) + '">' + sign + r.diff.toFixed(1) + '</b></div>';
  });
  return '<div class="chart-block league-avg">' +
    '<button type="button" class="lga-toggle" id="lga-toggle" aria-expanded="false">' +
      '<span class="lga-t-title">' + L("本队 vs 联赛平均", "Club vs league average") + '<i>' + L(rows.length + " 项数据", rows.length + " stats") + '</i></span>' +
      '<span class="lga-t-cue">' + L("展开", "Show") + '<b class="chev">▾</b></span>' +
    '</button>' +
    '<div id="lga-body" class="collapse"><div>' +
      '<div class="lga-head"><span></span><b>' + L("本队", "Club") + '</b><span>' + L("均值", "Avg") + '</span><b>' + L("差值", "Diff") + '</b></div>' +
      body +
    '</div></div></div>';
}
function matchDetailHTML(d){
  if(d.loading) return '<div class="match-detail">' + loadingNoteHTML("正在加载比赛详情…", "Loading match details…") + '</div>';
  if(d.empty) return '<div class="match-detail">' + emptyNoteHTML("暂无该场比赛详情。", "No match details available.") + '</div>';
  const sc = (d.score && d.score.home && d.score.home.name && d.score.away && d.score.away.name) ? d.score : null;
  const team = x => '<div class="md-team' + (x.our ? ' md-our' : '') + '">' +
    (x.logo ? '<img src="' + x.logo + '" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">' : '') +
    '<b>' + x.name + '</b></div>';
  return '<div class="match-detail"><div class="md-inner">' +
    (sc ? '<div class="md-score">' + team(sc.home) +
      '<div class="md-num num"><b>' + sc.home.score + '</b><i>:</i><b>' + sc.away.score + '</b></div>' +
      team(sc.away) + '</div>' +
      (sc.status ? '<div class="md-status">' + esc(sc.status) + '</div>' : '') : '') +
    (d.events.length ? '<div class="md-rule"></div><div class="md-events">' + d.events.join("") + '</div>' : '') +
    (d.stats.length ? '<div class="md-rule"></div><div class="md-stats">' + d.stats.map(s => {
      const total = (s.hv != null && s.av != null) ? (s.hv + s.av) : 0;
      const hp = total > 0 ? Math.round(s.hv / total * 100) : 0;
      return '<div class="md-stat"><div class="md-stat-row"><b class="md-h num">' + s.h + '</b><em>' + s.label + '</em><b class="md-a num">' + s.a + '</b></div>' +
        '<div class="md-bar"><i style="width:' + hp + '%"></i></div></div>';
    }).join("") + '</div>' : '') +
    (d.leaders && d.leaders.length
      ? '<div class="md-rule"></div>' + blockTitleHTML("本场数据领先者", "Match leaders") +
        '<div class="md-leaders">' + d.leaders.map(l =>
          '<div class="md-leader">' +
            '<span class="ml-h"><b>' + l.home.name + '</b><i class="num">' + l.home.value + '</i></span>' +
            '<em>' + l.label + '</em>' +
            '<span class="ml-a"><i class="num">' + l.away.value + '</i><b>' + l.away.name + '</b></span>' +
          '</div>').join("") + '</div>'
      : '') +
    (d.lineups && d.lineups.home && d.lineups.away && (d.lineups.home.roster || []).length
      ? '<div class="md-rule"></div>' + blockTitleHTML("首发阵型", "Formations") +
        '<div class="md-pitches">' + formationBlockHTML(d.lineups.home) + formationBlockHTML(d.lineups.away) + '</div>' +
        '<div class="md-rule"></div>' + blockTitleHTML("首发阵容", "Lineups") +
        '<div class="md-lineups">' + lineupTeamHTML(d.lineups.home) + lineupTeamHTML(d.lineups.away) + '</div>'
      : '') +
    (d.commentary && d.commentary.length
      ? '<div class="md-rule"></div>' + blockTitleHTML("文字直播", "Live commentary", "最新在前 · 机器翻译", "Newest first") +
        '<div class="md-commentary" id="md-commentary">' + commentaryRowsHTML(d.commentary) + '</div>'
      : '') +
    (d.info ? '<p class="photo-note md-info">' + d.info + '</p>' : '') +
  '</div></div>';
}
function playerDetailHTML(d){
  return '<div class="player-detail">' +
    (d.bio.length ? blockTitleHTML("球员资料", "Player profile") + statGridHTML(d.bio) : '') +
    (d.stats.length ? blockTitleHTML("赛季数据", "Season stats") + statGridHTML(d.stats) : '') +
    '<div id="pl-splits-' + esc(d.id) + '"></div>' +
    '<div id="pl-log-' + esc(d.id) + '">' + loadingNoteHTML("正在加载比赛日志…", "Loading match log…") + '</div>' +
  '</div>';
}
function playerSplitsHTML(d){
  if(!d || !d.rows.length) return "";
  return blockTitleHTML("各赛事数据", "By competition") +
    '<div class="tbl-wrap"><table class="ptable log-table"><thead><tr>' +
      '<th>' + L("赛事", "Competition") + '</th>' +
      d.cols.map(c => '<th class="r">' + L(c.zh, c.en) + '</th>').join("") +
    '</tr></thead><tbody>' +
    d.rows.map(r => '<tr><td>' + esc(dComp(cleanCompName(r.compRaw)) || r.compRaw) + '</td>' +
      r.vals.map(v => '<td class="num">' + esc(v != null ? String(v) : "-") + '</td>').join("") + '</tr>').join("") +
    '</tbody></table></div>';
}
function playerLogHTML(log){
  if(!log.rows.length) return emptyNoteHTML("暂无比赛日志。", "No match log available.");
  const resHTML = r => '<span class="res res-' + r.resRaw + '">' + L(r.resRaw === "W" ? "胜" : r.resRaw === "L" ? "负" : "平", r.resRaw) + '</span>' + (r.score ? ' ' + r.score : "");
  const oppHTML = r => isEN() ? esc(r.oppEn) : esc(zhTeamName(r.oppEn) || r.oppEn);
  return blockTitleHTML("逐场比赛", "Match log") +
    '<div class="tbl-wrap"><table class="ptable log-table"><thead><tr>' +
      '<th>' + L("日期", "Date") + '</th><th>' + L("赛事", "Competition") + '</th><th>' + L("对手", "Opponent") + '</th><th>' + L("结果", "Result") + '</th>' +
      log.cols.map((l, i) => '<th class="r">' + logLabel(log.names[i], l) + '</th>').join("") +
    '</tr></thead><tbody>' +
    log.rows.map(r => '<tr>' +
      '<td class="num">' + esc(r.date) + '</td><td>' + esc(dComp(r.compRaw)) + '</td><td>' + oppHTML(r) + '</td><td>' + resHTML(r) + '</td>' +
      r.cells.map(c => '<td class="num">' + esc(c) + '</td>').join("") +
    '</tr>').join("") +
    '</tbody></table></div>';
}


/* ---------- 首发阵容（比赛详情） ---------- */
function lineupPlayerHTML(p){
  const st = {};
  (p.stats || []).forEach(s => { st[s.name] = s.value; });
  const mark = [];
  if(st.totalGoals > 0) mark.push('<em class="lu-g">' + L(st.totalGoals + " 球", st.totalGoals + "G") + '</em>');
  if(st.goalAssists > 0) mark.push('<em class="lu-a">' + L(st.goalAssists + " 助", st.goalAssists + "A") + '</em>');
  if(st.yellowCards > 0) mark.push('<i class="lu-yc" title="' + esc(L("黄牌", "Yellow card")) + '"></i>');
  if(st.redCards > 0) mark.push('<i class="lu-rc" title="' + esc(L("红牌", "Red card")) + '"></i>');
  if(p.subbedOut) mark.push('<i class="lu-out" title="' + esc(L("被换下", "Subbed off")) + '">↓</i>');
  if(p.subbedIn) mark.push('<i class="lu-in" title="' + esc(L("替补登场", "Subbed on")) + '">↑</i>');
  return '<span class="lu-p"><i class="num">' + esc(p.jersey || "") + '</i><b>' + esc(zhName((p.athlete && p.athlete.displayName) || "")) + '</b>' + mark.join("") + '</span>';
}
/* 首发阵型图（把首发按阵型摆到球场上） */
/* 战术雷达（球队页）：6 项 0-100 绝对刻度 */
function tacticalRadarHTML(stats){
  if(!stats) return "";
  const axesDef = [
    { zh:"控球率", en:"Possession", key:"possessionPct", pct:false },
    { zh:"传球成功率", en:"Pass accuracy", key:"passPct", pct:true },
    { zh:"长传成功率", en:"Long-ball acc.", key:"longballPct", pct:true },
    { zh:"传中成功率", en:"Cross accuracy", key:"crossPct", pct:true },
    { zh:"对抗成功率", en:"Duels won", key:"duelWinPct", pct:true },
    { zh:"进球转化率", en:"Conversion", key:"goalConversion", pct:true }
  ];
  const axes = axesDef.map(d => {
    let v = parseFloat(stats[d.key]);
    if(isNaN(v)) return null;
    if(d.pct) v = v * 100;
    return { label: L(d.zh, d.en), value: Math.max(0, Math.min(100, v)) };
  }).filter(Boolean);
  if(axes.length < 3) return "";
  return '<div class="chart-block tactical-radar"><div class="chart-title">' + L("战术雷达", "Tactical radar") + '</div>' +
    tacticalRadarSVG(axes, "var(--cacc,#0f1416)") + '</div>';
}
/* 定位球与进攻方式（球队页） */
function attackPatternsHTML(stats){
  if(!stats) return "";
  const num = k => parseInt(stats[k], 10) || 0;
  const foot = [
    { zh:"右脚", en:"Right foot", v:num("rightFootedShots") },
    { zh:"左脚", en:"Left foot", v:num("leftFootedShots") },
    { zh:"头球", en:"Header", v:num("shotsHeaded") }
  ];
  const goals = [
    { zh:"点球", en:"Penalty", v:num("penaltyKickGoals") },
    { zh:"定位球", en:"Free kick", v:num("freeKickGoals") },
    { zh:"头球", en:"Header", v:num("headedGoals") }
  ];
  const maxF = Math.max.apply(null, foot.map(x => x.v).concat([1]));
  const maxG = Math.max.apply(null, goals.map(x => x.v).concat([1]));
  const bar = (x, max) => '<div class="sq-bar"><span class="sq-lbl">' + esc(L(x.zh, x.en)) + '</span>' +
    '<span class="sq-track"><i style="width:' + Math.max(3, Math.round(x.v / max * 100)) + '%"></i></span><b class="num">' + x.v + '</b></div>';
  return '<div class="chart-block attack-patterns"><div class="chart-title">' + L("定位球与进攻方式", "Set pieces & attack") + '</div>' +
    '<div class="ap-cols">' +
      '<div class="ap-col"><h5>' + L("射门脚法", "Shots by foot") + '</h5>' + foot.map(x => bar(x, maxF)).join("") + '</div>' +
      '<div class="ap-col"><h5>' + L("进球方式", "Goals by type") + '</h5>' + goals.map(x => bar(x, maxG)).join("") + '</div>' +
    '</div>' +
    '<div class="ap-stats">' +
      '<div class="ap-stat"><b class="num">' + num("totalCrosses") + '</b><span>' + L("传中", "Crosses") + '</span></div>' +
      '<div class="ap-stat"><b class="num">' + fmtStatVal(stats.crossPct, "pct100") + '</b><span>' + L("传中成功率", "Cross acc.") + '</span></div>' +
      '<div class="ap-stat"><b class="num">' + num("bigChanceCreated") + '</b><span>' + L("绝佳机会", "Big chances") + '</span></div>' +
    '</div>' +
  '</div>';
}
function fpPosAbbr(p){ return String((p.position && (p.position.abbreviation || p.position.name)) || "").toUpperCase(); }
function fpPosName(p){ return String((p.position && p.position.name) || "").toUpperCase(); }
function fpIsGK(p){ return fpPosAbbr(p) === "G" || fpPosAbbr(p) === "GK" || /GOALKEEPER/.test(fpPosName(p)); }
function fpSide(p){
  const s = fpPosAbbr(p);
  if(/(^|-)L(-|$)/.test(s) || /^L/.test(s)) return "L";
  if(/(^|-)R(-|$)/.test(s) || /^R/.test(s)) return "R";
  return "C";
}
/* 位置深度：数值越大越靠前（用于按 formation 分行） */
function fpDepth(p){
  const ab = fpPosAbbr(p), nm = fpPosName(p);
  if(/GOALKEEPER/.test(nm)) return 0;
  if(/STRIKER|FORWARD/.test(nm) || /(^|\W)(ST|CF|FW)(\W|$)/.test(ab)) return 9;
  if(/WING/.test(nm) || /(^|\W)(LW|RW|LF|RF)(\W|$)/.test(ab)) return 8;
  if(/ATTACKING MID/.test(nm) || /(^|\W)(AM|CAM)(\W|$)/.test(ab)) return 7;
  if(/WIDE MID/.test(nm) || /(^|\W)(LM|RM)(\W|$)/.test(ab)) return 6.5;
  if(/MIDFIELD/.test(nm) || /(^|\W)(CM|M)(\W|$)/.test(ab)) return 6;
  if(/DEFENSIVE MID/.test(nm) || /(^|\W)(DM|CDM)(\W|$)/.test(ab)) return 5;
  if(/BACK|DEFENDER/.test(nm) || /(^|\W)(CB|CD|LB|RB|LWB|RWB|SW|D)(\W|$)/.test(ab)) return 3;
  return 5.5;
}
function formationBlockHTML(r){
  if(!r || !(r.roster || []).length) return "";
  const starters = (r.roster || []).filter(p => p.starter);
  if(!starters.length) return "";
  const gk = starters.filter(fpIsGK)[0];
  const outfield = starters.filter(p => !fpIsGK(p));
  let rows = String(r.formation || "").split(/[^0-9]+/).map(n => parseInt(n, 10)).filter(n => n > 0);
  if(!rows.length || rows.reduce((a, b) => a + b, 0) !== outfield.length) rows = null;
  const nmOf = p => zhName((p.athlete && p.athlete.displayName) || "");
  const players = [];
  if(gk) players.push({ name: nmOf(gk), no: gk.jersey || "", row: -1, side: "C" });
  if(rows){
    const sorted = outfield.slice().sort((a, b) => fpDepth(a) - fpDepth(b));
    let idx = 0;
    rows.forEach((cnt, ri) => {
      sorted.slice(idx, idx + cnt).forEach(p => players.push({ name: nmOf(p), no: p.jersey || "", row: ri, side: fpSide(p) }));
      idx += cnt;
    });
  } else {
    const lineOf = p => { const ab = fpPosAbbr(p); if(/^(CD|CB|LB|RB|LWB|RWB|SW|DEF|D)/.test(ab)) return 0; if(/^(AM|LM|RM|CM|DM|CDM|CAM|MID|M)/.test(ab)) return 1; return 2; };
    outfield.forEach(p => players.push({ name: nmOf(p), no: p.jersey || "", row: lineOf(p), side: fpSide(p) }));
    rows = [1, 1, 1];
  }
  return '<div class="fp-team"><h4>' + esc(zhTeamName((r.team && r.team.displayName) || "")) + (r.formation ? '<span>' + esc(r.formation) + '</span>' : '') + '</h4>' +
    formationPitchSVG(players, rows.length) + '</div>';
}
function lineupTeamHTML(r){
  const line = p => {
    const ab = String((p.position && (p.position.abbreviation || p.position.name)) || "").toUpperCase();
    if(ab === "G" || ab === "GK") return "G";
    if(/^(CD|CB|LB|RB|LWB|RWB|SW|DEF|D)/.test(ab)) return "D";
    if(/^(AM|LM|RM|CM|DM|CDM|CAM|MID|M)/.test(ab)) return "M";
    if(/^(F|FW|ST|CF|LW|RW|SS|ATT)/.test(ab)) return "F";
    return "M";
  };
  const labels = { G: L("门将", "GK"), D: L("后卫", "DF"), M: L("中场", "MF"), F: L("前锋", "FW") };
  const starters = (r.roster || []).filter(p => p.starter);
  const subs = (r.roster || []).filter(p => !p.starter);
  const lines = ["G", "D", "M", "F"].map(k => {
    const list = starters.filter(p => line(p) === k);
    return list.length ? '<div class="lu-line"><em>' + labels[k] + '</em><span>' + list.map(lineupPlayerHTML).join("") + '</span></div>' : '';
  }).join("");
  return '<div class="lu-team">' +
    '<h4>' + esc(zhTeamName((r.team && r.team.displayName) || "")) + (r.formation ? '<span>' + esc(r.formation) + '</span>' : '') + '</h4>' +
    lines +
    (subs.length ? '<div class="lu-line lu-subs"><em>' + L("替补", "Subs") + '</em><span>' + subs.map(lineupPlayerHTML).join("") + '</span></div>' : '') +
  '</div>';
}

/* ---------- 赛前信息（赔率 + 近况） ---------- */
/* 比赛天气（WMO code → 中文/英文） */
const WMO = {
  0:["晴","Clear"],1:["晴间多云","Mainly clear"],2:["多云","Partly cloudy"],3:["阴","Overcast"],
  45:["雾","Fog"],48:["雾凇","Rime fog"],51:["毛毛雨","Light drizzle"],53:["小雨","Drizzle"],55:["中雨","Dense drizzle"],
  56:["冻雨","Freezing drizzle"],57:["冻雨","Freezing drizzle"],61:["小雨","Light rain"],63:["中雨","Rain"],65:["大雨","Heavy rain"],
  66:["冻雨","Freezing rain"],67:["冻雨","Freezing rain"],71:["小雪","Light snow"],73:["中雪","Snow"],75:["大雪","Heavy snow"],
  77:["米雪","Snow grains"],80:["阵雨","Light showers"],81:["阵雨","Showers"],82:["强阵雨","Violent showers"],
  85:["阵雪","Snow showers"],86:["强阵雪","Heavy snow showers"],95:["雷阵雨","Thunderstorm"],96:["雷阵雨伴冰雹","Thunderstorm, hail"],99:["雷阵雨伴冰雹","Thunderstorm, hail"]
};
function weatherHTML(w){
  if(!w || w.tmax == null) return "";
  const d = WMO[w.code] || ["—", "—"];
  return '<div class="pm-weather">' +
    '<span class="pm-w-desc">' + esc(L(d[0], d[1])) + '</span>' +
    '<b class="num">' + Math.round(w.tmin) + '~' + Math.round(w.tmax) + '°C</b>' +
    (w.pop != null ? '<span>' + L("降水 ", "Rain ") + Math.round(w.pop) + '%</span>' : '') +
    (w.wind != null ? '<span>' + L("风 ", "Wind ") + Math.round(w.wind) + ' km/h</span>' : '') +
  '</div>';
}
function preMatchHTML(d){
  if(d.loading) return '<div class="pre-match">' + loadingNoteHTML("正在加载赛前信息…", "Loading pre-match info…") + '</div>';
  if(d.empty) return '<div class="pre-match">' + emptyNoteHTML("暂无赛前信息。", "No pre-match info available.") + '</div>';
  return '<div class="pre-match"><div class="md-inner">' +
    (d.title ? '<div class="pm-title">' + d.title + '</div>' : '') +
    '<div id="pm-weather"></div>' +
    (d.odds ? '<div class="pm-odds">' +
      '<div class="pm-item"><span>' + d.odds.homeName + '</span><b class="num">' + d.odds.home + '</b></div>' +
      '<div class="pm-item"><span>' + L("平局", "Draw") + '</span><b class="num">' + d.odds.draw + '</b></div>' +
      '<div class="pm-item"><span>' + d.odds.awayName + '</span><b class="num">' + d.odds.away + '</b></div>' +
    '</div>' +
    (d.odds.ou ? '<div class="pm-ou"><span>' + L("大小球 ", "Total ") + esc(d.odds.ou) + '</span><b>' + L("大 ", "Over ") + d.odds.over + ' · ' + L("小 ", "Under ") + d.odds.under + '</b></div>' : '') +
    (d.odds.spread ? '<div class="pm-meta">' + L("让球 ", "Spread ") + esc(d.odds.spread) + (d.odds.favName ? ' · ' + L("热门 ", "Favourite ") + d.odds.favName : '') + '</div>' : '') +
    (d.odds.openFavName ? '<div class="pm-meta pm-moved">' + L("开盘热门 ", "Opening favourite ") + d.odds.openFavName + '</div>' : '') +
    (d.odds.provider ? '<p class="photo-note md-info">' + L("赛前赔率 · ", "Pre-match odds · ") + esc(d.odds.provider) + L("（参考）", " (reference)") + '</p>' : '') : '') +
    (d.form && d.form.length ? '<div class="md-rule"></div><div class="pm-form">' + d.form.map(t =>
      '<div class="pm-form-team"><b>' + t.name + '</b>' + t.pills + '</div>').join("") + '</div>' : '') +
    (d.id ? '<div class="md-rule"></div>' + blockTitleHTML("历史交战", "Head-to-head", "近 10 场 · 任意赛事", "Last 10 · any competition") +
      '<div id="h2h-' + esc(d.id) + '">' + loadingNoteHTML("正在加载历史交战…", "Loading head-to-head…") + '</div>' : '') +
  '</div></div>';
}
function h2hHTML(rows){
  if(!rows || !rows.length) return emptyNoteHTML("暂无历史交战记录。", "No head-to-head history available.");
  return '<div class="h2h-list">' + rows.map(r =>
    '<div class="h2h-row">' +
      '<i class="num">' + esc(r.date) + '</i>' +
      (r.comp ? '<em>' + esc(r.comp) + '</em>' : '') +
      '<span>' + r.home + ' <b class="num">' + r.hs + '-' + r.as + '</b> ' + r.away + '</span>' +
      (r.res ? '<b class="res res-' + r.res + '">' + L(RES_CN[r.res], r.res) + '</b>' : '') +
    '</div>').join("") + '</div>';
}

/* ---------- 联赛榜单（射手榜 / 助攻榜） ---------- */
/* 赛季下拉选择器（选项由 fillSeasonSelect 异步填充） */
function seasonSelectHTML(selectId){
  return '<div class="season-row"><label for="' + selectId + '">' + L("赛季", "Season") + '</label>' +
    '<span class="sel"><select class="season-select" id="' + selectId + '" disabled><option>' + esc(L("加载中…", "Loading…")) + '</option></select></span></div>';
}
function leadersTabsHTML(active){
  return LEAGUES.map(lg => '<button data-lg="' + lg.id + '"' + (lg.id === active ? ' class="on"' : '') + '>' + esc(dLeague(lg.cn)) + '</button>').join("");
}
function leaderBoardHTML(title, cols, rows){
  if(!rows || !rows.length) return '<div class="lb-block"><h3 class="lb-title">' + title + '</h3>' + emptyNoteHTML("暂无榜单数据。", "No leaderboard data yet.") + '</div>';
  const head = '<h3 class="lb-title">' + title + '<span>' + L("前 " + rows.length + " 名", "Top " + rows.length) + '</span></h3>';
  return '<div class="lb-block">' + head +
    '<div class="tbl-wrap"><table class="lb-table"><thead><tr>' +
      '<th class="c">#</th><th>' + L("球员", "Player") + '</th><th>' + L("球队", "Club") + '</th>' +
      cols.map(c => '<th class="r">' + c.label + '</th>').join("") +
    '</tr></thead><tbody>' +
    rows.map((r, i) => '<tr' + (i < 3 ? ' class="lb-top"' : '') + '>' +
      '<td class="lb-rank num">' + (i + 1) + '</td>' +
      '<td class="lb-player">' + esc(isEN() ? r.en : r.name) + (r.no ? ' <i>' + esc(r.no) + '</i>' : '') + '</td>' +
      '<td class="lb-club">' + esc(isEN() ? r.teamEn : r.team) + '</td>' +
      cols.map(c => '<td class="lb-val num">' + c.get(r) + '</td>').join("") +
    '</tr>').join("") +
    '</tbody></table></div></div>';
}
function leadersBoardsHTML(d){
  return '<div class="lb-grid">' +
    leaderBoardHTML(L("射手榜", "Top scorers"), [
      { label: L("进球", "Goals"), get: r => esc(String(r.value)) }
    ], d.goals) +
    leaderBoardHTML(L("助攻榜", "Assists"), [
      { label: L("助攻", "Assists"), get: r => esc(String(r.value)) }
    ], d.assists) +
  '</div>';
}
function leadersPageHTML(active, year){
  const cur = new Date().getFullYear();
  const isCur = !year || year === cur;
  const note = isCur
    ? L("射手榜 · 助攻榜 · ESPN 实时", "Top scorers · assists · live from ESPN")
    : L("射手榜 · 助攻榜 · " + seasonLabel(active, year) + " 赛季", "Top scorers · assists · " + seasonLabel(active, year) + " season");
  return '<button class="back" id="leaders-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("联赛榜单", "League leaders") + '<small>' + esc(note) + '</small></h2></div>' +
    '<div class="quick lb-tabs">' + leadersTabsHTML(active) + '</div>' +
    seasonSelectHTML("leaders-season") +
    '<div id="leaders-body">' + loadingNoteHTML("正在加载榜单…", "Loading leaderboard…") + '</div>';
}

/* ---------- 联赛页（积分榜 / 球员榜 / 纪律榜 三页签） ---------- */
const LEAGUE_TABS = [["table", "积分榜", "Standings"], ["leaders", "球员榜", "Players"], ["cards", "纪律榜", "Cards"]];
function leagueTabsHTML(active, tab){
  return LEAGUES.map(lg =>
    '<button data-lg="' + lg.id + '"' + (lg.id === active ? ' class="on"' : '') + '>' + esc(dLeague(lg.cn)) + '</button>'
  ).join("");
}
function leagueTabBarHTML(tab){
  return '<div class="lg-tabbar">' + LEAGUE_TABS.map(t =>
    '<button type="button" data-tab="' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + L(t[1], t[2]) + '</button>'
  ).join("") + '</div>';
}
function leaguePageHTML(lg, tab, year){
  const label = LEAGUE_TABS.filter(t => t[0] === tab)[0] || LEAGUE_TABS[0];
  const cardsOnly = tab === "cards";
  const note = cardsOnly ? L("仅统计当季", "Current season only") : "";
  return '<button class="back" id="league-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero">' +
      '<h2>' + esc(dLeague(lg.cn)) + L(label[1], " " + label[2]) +
        '<small id="league-note">' + esc(note) + '</small></h2>' +
      '<div class="quick lb-tabs">' + leagueTabsHTML(lg.id, tab) + '</div>' +
      leagueTabBarHTML(tab) +
      (cardsOnly ? "" : seasonSelectHTML("league-season")) +
    '</div>' +
    '<div id="league-body"></div>';
}

/* ---------- 联赛积分榜（整页） ---------- */
function teamCrestHTML(t, size){
  const cur = (typeof editorialOf === "function") ? editorialOf(t) : null;
  const src = cur ? (CRESTS[cur.id] || t.logo || "") : (t.logo || "");
  if(!src) return "";
  return crestImgHTML({ src: src, size: size || 24, alt: dTeam(t) + L("队徽", " crest"), lazy: true, fallbackSVG: crestFallbackSVG(t) });
}
function standingsMoveHTML(s){
  if(!s.rankChange) return '<span class="st-move flat">–</span>';
  const up = s.rankChange > 0;
  return '<b class="st-move ' + (up ? "up" : "down") + '">' + (up ? "▲" : "▼") + Math.abs(s.rankChange) + '</b>';
}
function standingsTableHTML(rows){
  const hasDed = rows.some(r => r.s.deductions);
  const hasMove = rows.some(r => r.s.rankChange);
  return '<div class="tbl-wrap"><table class="st-table"><thead><tr>' +
    '<th class="c">#</th><th>' + L("球队", "Club") + '</th>' +
    '<th class="r">' + L("场次", "P") + '</th>' +
    '<th class="r st-hide-xs">' + L("胜", "W") + '</th><th class="r st-hide-xs">' + L("平", "D") + '</th><th class="r st-hide-xs">' + L("负", "L") + '</th>' +
    '<th class="r st-hide-sm">' + L("进/失", "GF/GA") + '</th>' +
    '<th class="r st-hide-sm">' + L("净胜", "GD") + '</th>' +
    '<th class="r st-hide-sm">' + L("场均", "PPG") + '</th>' +
    (hasDed ? '<th class="r st-hide-sm">' + L("扣分", "Ded") + '</th>' : '') +
    '<th class="r">' + L("积分", "Pts") + '</th>' +
    (hasMove ? '<th class="c">' + L("升降", "Chg") + '</th>' : '') +
    '</tr></thead><tbody>' +
    rows.map((r, i) => {
      const t = r.t, s = r.s, name = dTeam(t);
      let gd = (s.gd === "" || s.gd == null) ? "-" : String(s.gd);
      if(/^\d+$/.test(gd) && Number(gd) > 0) gd = "+" + gd;
      return '<tr class="st-row' + (i === 0 ? " st-lead" : "") + '" data-team="' + esc(t.id) + '" title="' + esc(L("查看 " + name, "View " + name)) + '">' +
        '<td class="c st-rank num">' + esc(String(s.rank || i + 1)) + '</td>' +
        '<td><div class="st-club">' + teamCrestHTML(t) + '<b>' + esc(name) + '</b>' + (t.promoted ? '<i class="st-promo">' + L("升班马", "Promoted") + '</i>' : '') + '</div></td>' +
        '<td class="r num">' + esc(String(s.gp || "-")) + '</td>' +
        '<td class="r num st-hide-xs">' + s.wins + '</td><td class="r num st-hide-xs">' + s.draws + '</td><td class="r num st-hide-xs">' + s.losses + '</td>' +
        '<td class="r num st-hide-sm">' + esc(String(s.gf || "-")) + '/' + esc(String(s.ga || "-")) + '</td>' +
        '<td class="r num st-hide-sm">' + esc(gd) + '</td>' +
        '<td class="r num st-hide-sm">' + esc(String(s.ppg || "-")) + '</td>' +
        (hasDed ? '<td class="r num st-hide-sm">' + (s.deductions ? "-" + s.deductions : "–") + '</td>' : '') +
        '<td class="r num st-pts">' + esc(String(s.points || "-")) + '</td>' +
        (hasMove ? '<td class="c">' + standingsMoveHTML(s) + '</td>' : '') +
      '</tr>';
    }).join("") +
    '</tbody></table></div>';
}
function standingsNoteText(rows, year, lgId){
  const cur = new Date().getFullYear();
  const isCur = !year || year === cur;
  const n = (rows && rows.length) || 0;
  if(isCur) return n ? L(n + " 队 · ESPN 实时", n + " clubs · live from ESPN") : L("ESPN 实时", "Live from ESPN");
  return n ? L(n + " 队 · " + seasonLabel(lgId, year) + " 赛季", n + " clubs · " + seasonLabel(lgId, year) + " season") : seasonLabel(lgId, year);
}
function standingsPageHTML(active, rows, year){
  const lg = LEAGUES.filter(l => l.id === active)[0] || LEAGUES[0];
  const body = (rows && rows.length) ? standingsTableHTML(rows) : loadingNoteHTML("正在加载积分榜…", "Loading standings…");
  return '<button class="back" id="table-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + esc(dLeague(lg.cn)) + L("积分榜", " Standings") + '<small id="table-note">' + esc(standingsNoteText(rows, year, active)) + '</small></h2></div>' +
    '<div class="quick lb-tabs">' + leadersTabsHTML(active) + '</div>' +
    seasonSelectHTML("table-season") +
    '<div id="table-body">' + body + '</div>';
}
/* ---------- 联赛纪律榜 ---------- */
function cardsTableHTML(rows){
  if(!rows || !rows.length) return emptyNoteHTML("暂无纪律数据。", "No discipline data available.");
  return '<div class="tbl-wrap"><table class="st-table"><thead><tr>' +
    '<th class="c">#</th><th>' + L("球队", "Club") + '</th>' +
    '<th class="r">' + L("黄牌", "YC") + '</th><th class="r">' + L("红牌", "RC") + '</th>' +
    '<th class="r">' + L("第二黄", "2Y") + '</th><th class="r">' + L("犯规", "Fouls") + '</th>' +
    '</tr></thead><tbody>' +
    rows.map((r, i) => '<tr class="st-row' + (i === 0 ? " st-lead" : "") + '" data-team="' + esc(r.t.id) + '">' +
      '<td class="c st-rank num">' + (i + 1) + '</td>' +
      '<td><div class="st-club">' + teamCrestHTML(r.t) + '<b>' + esc(dTeam(r.t)) + '</b></div></td>' +
      '<td class="r num">' + r.yc + '</td><td class="r num">' + r.rc + '</td>' +
      '<td class="r num">' + r.sec + '</td><td class="r num">' + r.fouls + '</td>' +
    '</tr>').join("") + '</tbody></table></div>';
}
function cardsPageHTML(active){
  return '<button class="back" id="cards-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("联赛纪律榜", "Discipline table") + '<small>' + L("黄牌 / 红牌 · 赛季累计", "Cards · season totals") + '</small></h2></div>' +
    '<div class="quick lb-tabs">' + leadersTabsHTML(active) + '</div>' +
    '<div id="cards-body"></div>';
}

/* ---------- 球员全局搜索（首页结果块） ---------- */
function playerSearchBlockHTML(matches, total){
  if(!matches || !matches.length) return "";
  return '<div class="pl-results">' +
    blockTitleHTML("球员", "Players", "匹配 " + total + " 名", total + " matched") +
    '<div class="pl-list">' + matches.map(p =>
      '<button class="pl-hit" data-player="' + esc(p.id) + '">' +
        (p.team ? '<span class="pl-crest">' + teamCrestHTML(p.team, 26) + '</span>' : '') +
        '<span class="pl-hit-name">' + esc(isEN() ? (p.en || p.name) : (p.name || p.en)) + (p.no ? ' <i class="num">' + esc(String(p.no)) + '</i>' : '') + '</span>' +
        '<span class="pl-hit-meta">' + esc([dPos(p.pos), dNat(p.nat)].filter(Boolean).join(" · ")) + '</span>' +
        (p.team ? '<span class="pl-hit-team">' + esc(dTeam(p.team)) + '</span>' : '') +
      '</button>').join("") +
    '</div></div>';
}

/* ---------- 球员主页 ---------- */
function playerProfileHTML(e){
  const bio = [];
  if(e.ht) bio.push({ label: L("身高", "Height"), value: esc(e.ht) });
  if(e.wt) bio.push({ label: L("体重", "Weight"), value: esc(e.wt) });
  if(e.dob) bio.push({ label: L("出生日期", "Born"), value: esc(e.dob) });
  const birth = [e.bc && (isEN() ? e.bc : (zhCity(e.bc) || e.bc)), e.bs, e.bco && (isEN() ? e.bco : (zhCountry(e.bco) || e.bco))].filter(Boolean).join(" · ");
  if(birth) bio.push({ label: L("出生地", "Birthplace"), value: esc(birth) });
  return bio.length ? blockTitleHTML("球员资料", "Player profile") + statGridHTML(bio) : '';
}
/* 赛季数据（当前赛季用名单字段，历史赛季用 core 数据） */
const PLAYER_STAT_FIELDS = [
  ["appearances","出场","Apps"],["starts","首发","Starts"],["minutes","出场分钟","Minutes"],["subIns","替补登场","Subbed in"],
  ["totalGoals","进球","Goals"],["goalAssists","助攻","Assists"],["totalShots","射门","Shots"],["shotsOnTarget","射正","On target"],
  ["shotPct","射正率","Shot acc.","pct"],["bigChanceCreated","绝佳机会","Big chances"],["bigChanceMissed","错失绝佳机会","Big chances missed"],
  ["headedGoals","头球进球","Headed goals"],["penaltyKickGoals","点球进球","Penalty goals"],["offsides","越位","Offsides"],
  ["totalPasses","传球","Passes"],["accuratePasses","精准传球","Acc. passes"],["passPct","传球成功率","Pass acc.","pct"],
  ["touches","触球","Touches"],["touchesInOppBox","禁区触球","Touches in box"],["progressiveCarries","推进带球","Prog. carries"],
  ["totalTackles","抢断","Tackles"],["interceptions","拦截","Interceptions"],["totalClearance","解围","Clearances"],
  ["blockedShots","封堵射门","Blocked shots"],["duelsWon","对抗成功","Duels won"],["duelsLost","对抗失败","Duels lost"],
  ["recoveries","争回球权","Recoveries"],
  ["foulsCommitted","犯规","Fouls"],["foulsSuffered","被犯规","Fouled"],["yellowCards","黄牌","YC"],["redCards","红牌","RC"],
  ["saves","扑救","Saves"],["goalsConceded","失球","Conceded"],["cleanSheet","零封","Clean sheets"]
];
/* 赛事 slug → 中/英名（球员生涯赛季用） */
const LG_NAME = {
  "eng.1":["英超","Premier League"], "esp.1":["西甲","LaLiga"], "ger.1":["德甲","Bundesliga"],
  "ita.1":["意甲","Serie A"], "fra.1":["法甲","Ligue 1"], "chn.1":["中超","CSL"],
  "uefa.champions":["欧冠","Champions League"], "uefa.europa":["欧联杯","Europa League"],
  "uefa.champions_qual":["欧冠资格赛","UCL qualifying"], "uefa.euro":["欧洲杯","Euro"],
  "uefa.euroq":["欧预赛","Euro qualifying"], "uefa.nations":["欧国联","Nations League"],
  "uefa.super_cup":["欧洲超级杯","UEFA Super Cup"], "eng.fa":["足总杯","FA Cup"],
  "eng.league_cup":["联赛杯","League Cup"], "eng.charity":["社区盾","Community Shield"],
  "eng.fa_qual":["足总杯资格赛","FA Cup qualifying"],
  "ger.dfb_pokal":["德国杯","DFB-Pokal"], "ger.super_cup":["德国超级杯","German Super Cup"],
  "fifa.world":["世界杯","World Cup"], "fifa.cwc":["世俱杯","Club World Cup"],
  "fifa.worldq.uefa":["世预赛","World Cup qualifying"], "fifa.friendly":["国际友谊赛","International friendly"],
  "club.friendly":["俱乐部友谊赛","Club friendly"], "nor.1":["挪威超","Eliteserien"],
  "aut.1":["奥地利超","Austrian Bundesliga"], "jpn.world_challenge":["日本世界挑战赛","World Challenge"],
  "uefa.euro.u19":["U19 欧洲杯","U19 Euro"], "fifa.world.u20":["U20 世界杯","U20 World Cup"]
};
function lgName(slug){ const m = LG_NAME[slug]; return m ? L(m[0], m[1]) : slug; }
function playerSeasonStatsHTML(map){
  const stats = PLAYER_STAT_FIELDS.filter(f => map && map[f[0]] !== undefined && map[f[0]] !== null && map[f[0]] !== "")
    .map(f => {
      let v = map[f[0]];
      if(f[3] === "pct") v = Math.round(parseFloat(v) * 100) + "%";
      return { label: L(f[1], f[2]), value: esc(String(v)) };
    });
  return stats.length ? statGridHTML(stats) : emptyNoteHTML("该赛季暂无数据。", "No stats for this season.");
}
function playerSeasonFromRoster(e){
  return playerSeasonStatsHTML({
    appearances: e.ap, totalGoals: e.g, goalAssists: e.as, totalShots: e.shots, shotsOnTarget: e.sot,
    offsides: e.off, foulsCommitted: e.fc, foulsSuffered: e.fa, yellowCards: e.yc, redCards: e.rc,
    saves: e.sv, goalsConceded: e.gc
  });
}
function playerSeasonBlockHTML(e){
  return blockTitleHTML("赛季数据", "Season stats") +
    '<div class="season-row"><label for="player-season">' + L("赛季", "Season") + '</label>' +
      '<span class="sel"><select class="season-select" id="player-season" disabled><option>' + esc(L("加载中…", "Loading…")) + '</option></select></span></div>' +
    '<div id="player-season-body">' + playerSeasonFromRoster(e) + '</div>';
}
function playerPageHTML(e){
  const t = e.team;
  const name = isEN() ? (e.en || e.name) : (e.name || e.en);
  const meta = [
    e.no ? L("号码 " + e.no, "No. " + e.no) : "",
    e.pos ? dPos(e.pos) : "", e.age ? L(e.age + " 岁", e.age + " yrs") : ""
  ].filter(Boolean);
  const flagChip = e.nat ? '<span class="chip pl-flag-chip">' +
    (flagOf(e) ? '<img src="' + esc(flagOf(e)) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : "") + esc(dNat(e.nat)) + '</span>' : "";
  const chipsHTML = meta.map(m => '<span class="chip">' + esc(m) + '</span>').join("") + flagChip;
  return '<button class="back" id="player-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="player-hero">' +
      (t ? '<a class="pl-hero-crest" href="#team/' + esc(t.id) + '">' + teamCrestHTML(t, 64) + '</a>' : '') +
      '<div class="pl-hero-main">' +
        '<h2>' + esc(name) + '<button class="favp-star" id="fav-player" data-favp="' + esc(e.id) + '" title="' + esc(L("关注", "Follow")) + '">☆ ' + L("关注", "Follow") + '</button></h2>' +
        (chipsHTML ? '<div class="pl-hero-meta">' + chipsHTML + '</div>' : '') +
        (t ? '<a class="pl-hero-team" href="#team/' + esc(t.id) + '">' + esc(dTeam(t)) + '</a>' : '') +
      '</div>' +
    '</div>' +
    '<div class="player-detail">' +
      '<div id="player-profile">' + playerProfileHTML(e) + '</div>' +
      playerSeasonBlockHTML(e) +
      '<div id="pl-splits-' + esc(e.id) + '"></div>' +
      '<div id="pl-log-' + esc(e.id) + '">' + loadingNoteHTML("正在加载比赛日志…", "Loading match log…") + '</div>' +
    '</div>';
}

/* ---------- 球队对比 ---------- */
function comparePickerHTML(slot, t){
  const label = slot === "a" ? L("球队一", "Team A") : L("球队二", "Team B");
  const inner = t
    ? '<span class="cmp-pk-crest">' + teamCrestHTML(t, 30) + '</span><b>' + esc(dTeam(t)) + '</b><i>' + esc(dLeague(t.league)) + '</i>'
    : '<span class="cmp-pk-ph">' + L("选择球队", "Pick a club") + '</span>';
  return '<div class="cmp-pick" data-slot="' + slot + '">' +
    '<button class="cmp-pk-btn' + (t ? "" : " empty") + '" data-open="' + slot + '" title="' + esc(label) + '">' + inner + '</button>' +
    '<div class="cmp-pk-menu" hidden>' +
      '<input class="cmp-pk-input" type="text" placeholder="' + esc(L("搜索球队", "Search clubs")) + '" autocomplete="off">' +
      '<div class="cmp-pk-list"></div>' +
    '</div>' +
  '</div>';
}
function compareFormPills(rs){
  if(!rs.length) return "";
  return '<span class="form">' + rs.map(r => {
    const res = resultOf(r);
    return '<i class="' + res.toLowerCase() + '">' + L(RES_CN[res], res) + '</i>';
  }).join("") + '</span>';
}
function compareRecentOf(t, n){
  const rs = teamResultsOf(t).slice(0, n || 10);
  let w = 0, d = 0, l = 0;
  rs.forEach(r => { const res = resultOf(r); if(res === "W") w++; else if(res === "D") d++; else l++; });
  return { rs: rs, txt: L(w + "胜" + d + "平" + l + "负", w + "W " + d + "D " + l + "L") };
}
function compareBaseRowsHTML(a, b){
  const ra = leagueRankOf(a), rb = leagueRankOf(b);
  const rows = [
    { zh:"联赛", en:"League", va:dLeague(a.league), vb:dLeague(b.league) },
    { zh:"联赛排名", en:"League rank", va: ra ? L("第 " + ra.rank + " 名", ordinal(ra.rank)) : "-", vb: rb ? L("第 " + rb.rank + " 名", ordinal(rb.rank)) : "-" },
    { zh:"场次", en:"Played", va: ra ? ra.gp : "-", vb: rb ? rb.gp : "-" },
    { zh:"积分", en:"Points", va: ra ? ra.points : "-", vb: rb ? rb.points : "-" },
    { zh:"胜 / 平 / 负", en:"W / D / L", va: ra ? ra.wins + " / " + ra.draws + " / " + ra.losses : "-", vb: rb ? rb.wins + " / " + rb.draws + " / " + rb.losses : "-" },
    { zh:"进 / 失球", en:"Goals for / against", va: ra ? ra.gf + " / " + ra.ga : "-", vb: rb ? rb.gf + " / " + rb.ga : "-" },
    { zh:"净胜", en:"Goal difference", va: ra ? ra.gd : "-", vb: rb ? rb.gd : "-" },
    { zh:"场均积分", en:"Points / game", va: ra && ra.ppg !== "" ? ra.ppg : "-", vb: rb && rb.ppg !== "" ? rb.ppg : "-" }
  ];
  return rows.map(r => '<div class="cmp-row plain"><div class="cmp-line">' +
    '<b class="cmp-v cmp-va">' + esc(String(r.va)) + '</b>' +
    '<span class="cmp-lbl">' + L(r.zh, r.en) + '</span>' +
    '<b class="cmp-v cmp-vb">' + esc(String(r.vb)) + '</b>' +
  '</div></div>').join("");
}
function cmpNum(v){
  if(v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function compareStatRowHTML(f, sa, sb, cA, cB){
  const va = sa ? sa[f.key] : undefined, vb = sb ? sb[f.key] : undefined;
  const hasA = statHasValue(f, va), hasB = statHasValue(f, vb);
  const na = hasA ? cmpNum(va) : null, nb = hasB ? cmpNum(vb) : null;
  const max = Math.max(na === null ? 0 : na, nb === null ? 0 : nb);
  let wa = 0, wb = 0;
  if(max > 0){ wa = Math.round(((na || 0) / max) * 100); wb = Math.round(((nb || 0) / max) * 100); }
  return '<div class="cmp-row">' +
    '<div class="cmp-line">' +
      '<b class="cmp-v cmp-va">' + (hasA ? fmtStatVal(va, f.fmt) : "-") + '</b>' +
      '<span class="cmp-lbl">' + L(f.zh, f.en) + '</span>' +
      '<b class="cmp-v cmp-vb">' + (hasB ? fmtStatVal(vb, f.fmt) : "-") + '</b>' +
    '</div>' +
    '<div class="cmp-bars">' +
      '<span class="cmp-track a"><i style="width:' + wa + '%;background:' + cA + '"></i></span>' +
      '<span class="cmp-track b"><i style="width:' + wb + '%;background:' + cB + '"></i></span>' +
    '</div>' +
  '</div>';
}
function compareRadarHTML(a, b, sa, sb){
  if(!sa || !sb) return "";
  const defs = [
    { key:"totalGoals", zh:"进球", en:"Goals" },
    { key:"avgGoals", zh:"场均进球", en:"Goals / game" },
    { key:"shotsOnTarget", zh:"射正", en:"On target" },
    { key:"goalAssists", zh:"助攻", en:"Assists" },
    { key:"possessionPct", zh:"控球率", en:"Possession" },
    { key:"passPct", zh:"传球成功率", en:"Pass accuracy" },
    { key:"totalTackles", zh:"抢断", en:"Tackles" },
    { key:"cleanSheet", zh:"零封", en:"Clean sheets" }
  ];
  const axes = defs.map(d => ({ label: L(d.zh, d.en), a: cmpNum(sa[d.key]) || 0, b: cmpNum(sb[d.key]) || 0 }))
    .filter(ax => ax.a > 0 || ax.b > 0);
  if(axes.length < 3) return "";
  const cA = chartColor(a);
  const cB = chartColor(b);
  return '<div class="cmp-group"><h4 class="cmp-group-title">' + L("数据雷达", "Profile radar") + '</h4>' +
    radarChartSVG(axes, cA, cB) +
    '<div class="ch-legend"><span><i style="background:' + cA + '"></i>' + esc(dTeam(a)) + '</span><span><i style="background:' + cB + '"></i>' + esc(dTeam(b)) + '</span></div>' +
  '</div>';
}
function compareStatsHTML(a, b, sa, sb){
  if(!sa && !sb) return emptyNoteHTML("赛季数据暂时不可用。", "Season stats unavailable.");
  const cA = chartColor(a);
  const cB = chartColor(b);
  return compareRadarHTML(a, b, sa, sb) + TEAM_STAT_GROUPS.map(g => {
    const fields = g.fields.filter(f => (sa && statHasValue(f, sa[f.key])) || (sb && statHasValue(f, sb[f.key])));
    if(!fields.length) return "";
    return '<div class="cmp-group"><h4 class="cmp-group-title">' + L(g.zh, g.en) + '</h4>' +
      fields.map(f => compareStatRowHTML(f, sa, sb, cA, cB)).join("") + '</div>';
  }).join("");
}
function compareBaseSectionHTML(a, b){
  const fa = compareRecentOf(a), fb = compareRecentOf(b);
  return compareBaseRowsHTML(a, b) +
    '<div class="cmp-row plain"><div class="cmp-line">' +
      '<b class="cmp-v cmp-va">' + esc(fa.txt) + '</b>' +
      '<span class="cmp-lbl">' + L("近 10 场", "Last 10") + '</span>' +
      '<b class="cmp-v cmp-vb">' + esc(fb.txt) + '</b>' +
    '</div><div class="cmp-forms"><span class="cmp-form a">' + compareFormPills(fa.rs) + '</span><span class="cmp-form b">' + compareFormPills(fb.rs) + '</span></div></div>';
}
function compareBodyHTML(a, b){
  if(!a || !b) return emptyNoteHTML("选择两支球队开始对比。", "Pick two clubs to compare.");
  return '<div class="cmp-base" id="cmp-base">' + compareBaseSectionHTML(a, b) + '</div>' +
    '<div class="cmp-group"><h4 class="cmp-group-title">' + L("历史交战", "Head-to-head") + '</h4>' +
      '<div id="cmp-h2h">' + loadingNoteHTML("正在加载交战记录…", "Loading head-to-head…") + '</div></div>' +
    '<div id="cmp-stats">' + loadingNoteHTML("正在加载赛季数据…", "Loading season stats…") + '</div>';
}
function comparePageHTML(a, b){
  return '<button class="back" id="compare-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("球队对比", "Compare clubs") + '<small>' + L("基础数据 + 赛季 33 项", "Basics + 33 season stats") + '</small></h2></div>' +
    '<div class="cmp-head">' + comparePickerHTML("a", a) +
      '<button class="cmp-swap" id="cmp-swap" title="' + esc(L("交换", "Swap")) + '">⇄</button>' +
      comparePickerHTML("b", b) + '</div>' +
    '<div class="cmp-body">' + compareBodyHTML(a, b) + '</div>';
}

/* ---------- 球场实拍图墙 ---------- */
function stadiumTabsHTML(active){
  const all = '<button data-lg=""' + (!active ? ' class="on"' : '') + '>' + L("全部", "All") + '</button>';
  return all + LEAGUES.map(lg => '<button data-lg="' + lg.id + '"' + (lg.id === active ? ' class="on"' : '') + '>' + esc(dLeague(lg.cn)) + '</button>').join("");
}
function stadiumCardHTML(s){
  const name = dVenueName(s.venue) || s.venueEn || "";
  const nameEn = s.venueEn || "";
  const city = [dCityName(s.city), dCountryName(s.country)].filter(Boolean).join(" · ");
  const teams = s.teams.map(t => '<a class="st-team" href="#team/' + esc(t.id) + '">' + teamCrestHTML(t, 20) + '<b>' + esc(dTeam(t)) + '</b></a>').join("");
  const photo = s.photo
    ? '<img src="' + s.photo.src + '" alt="' + esc(name) + '" loading="lazy" decoding="async" onerror="imgFail(this)">'
    : '<div class="st-noimg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="10" ry="6.5"/><path d="M12 5.5v13M2 12h20"/></svg><span>' + L("暂无实拍图", "No photo yet") + '</span></div>';
  const credit = s.photo
    ? '<div class="st-credit">' + L("图：", "Photo: ") + esc(s.photo.by || L("未署名", "Unknown")) + (s.photo.lic ? ' · ' + esc(s.photo.lic) : '') + (s.photo.page ? ' · <a href="' + esc(s.photo.page) + '" target="_blank" rel="noopener">Wikimedia Commons</a>' : '') + '</div>'
    : '';
  const links = [];
  if(s.lat != null && s.lon != null){
    links.push('<a class="st-link" href="https://www.openstreetmap.org/?mlat=' + s.lat + '&mlon=' + s.lon + '#map=16/' + s.lat + '/' + s.lon + '" target="_blank" rel="noopener">OpenStreetMap</a>');
    links.push('<a class="st-link" href="https://www.google.com/maps/search/?api=1&query=' + s.lat + ',' + s.lon + '" target="_blank" rel="noopener">Google Maps</a>');
  }
  return '<article class="st-card">' +
    '<div class="st-photo">' + photo + (s.count > 1 ? '<span class="st-count">' + s.count + ' ' + L("张", "photos") + '</span>' : '') + '</div>' +
    '<div class="st-body">' +
      '<h3>' + esc(name) + (nameEn && nameEn !== name ? ' <small>' + esc(nameEn) + '</small>' : '') + '</h3>' +
      (city ? '<div class="st-meta">' + esc(city) + '</div>' : '') +
      (teams ? '<div class="st-teams">' + teams + '</div>' : '') +
      (links.length ? '<div class="st-links">' + links.join("") + '</div>' : '') +
    '</div>' +
    credit +
  '</article>';
}
function stadiumWallHTML(active){
  return '<button class="back" id="stadiums-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("球场图墙", "Stadium wall") + '<small id="st-count"></small></h2></div>' +
    '<div class="quick lb-tabs" id="st-tabs">' + stadiumTabsHTML(active) + '</div>' +
    '<div class="st-searchwrap"><input id="st-search" type="text" placeholder="' + esc(L("搜索球场、城市或球队", "Search stadium, city or club")) + '" autocomplete="off"></div>' +
    '<div class="st-grid" id="st-grid"></div>' +
    '<div id="st-empty" hidden></div>';
}

/* ---------- 赛程 / 比赛日 ---------- */
/* 单场比赛 = 一张独立小卡：联赛 · 场地 / 队名（含联赛排名）· 时间或比分 / 近 5 场状态 */
function schedCardHTML(m){
  const home = isEN() ? m.homeEn : (zhTeam(m.homeEn) || m.homeEn);
  const away = isEN() ? m.awayEn : (zhTeam(m.awayEn) || m.awayEn);
  const teamName = (name, id, fav) => {
    const ref = findTeam(id);
    const star = fav ? '<i class="sched-star">★</i>' : "";
    const rank = (typeof schedRankOf === "function") ? schedRankOf(id) : null;
    const rankHTML = rank ? '<sup class="sched-rank num">' + rank + '</sup>' : "";
    return ref
      ? '<a class="sched-team' + (fav ? " fav" : "") + '" href="#team/' + esc(ref.id) + '">' + esc(name) + rankHTML + star + '</a>'
      : '<span class="sched-team">' + esc(name) + rankHTML + star + '</span>';
  };
  const formHTML = id => {
    const f = (typeof schedFormOf === "function") ? schedFormOf(id) : [];
    if(!f.length) return "";
    return '<span class="sched-form">' + f.map(x =>
      '<i class="' + x.r + '" title="' + esc(x.date + " " + L(x.r === "W" ? "胜" : x.r === "L" ? "负" : "平", x.r) + " " + x.gf + "-" + x.ga) + '"></i>'
    ).join("") + '</span>';
  };
  const center = m.state === "pre"
    ? '<span class="sched-time">' + esc(schedLocalTime(m.ts)) + '</span>'
    : '<span class="sched-score' + (m.state === "in" ? " live" : "") + '">' + esc(m.hs || "0") + "–" + esc(m.as || "0") + '</span>' +
      (m.state === "in" ? '<i class="sched-live">' + esc(m.status) + '</i>' : '');
  return '<div class="sched-card">' +
    '<div class="sched-card-top"><span>' + esc(dComp(m.comp)) + '</span>' +
      (m.stadium ? '<span class="sched-venue" title="' + esc(m.stadium) + '">' + esc(m.stadium) + '</span>' : '') + '</div>' +
    '<div class="sched-card-main">' +
      '<div class="sched-side">' + teamName(home, m.homeId, isFav(m.homeId)) + formHTML(m.homeId) + '</div>' +
      '<div class="sched-mid">' + center + '</div>' +
      '<div class="sched-side away">' + teamName(away, m.awayId, isFav(m.awayId)) + formHTML(m.awayId) + '</div>' +
    '</div>' +
  '</div>';
}
/* 多天窗口：每天一个组头（日期 + 星期 + 今天标记 + 场次数），下面是当天的比赛卡网格 */
const SCHED_WD_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const SCHED_WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function schedDayLabel(iso){
  const d = new Date(iso + "T12:00:00");
  return isEN()
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : (d.getMonth() + 1) + "月" + d.getDate() + "日";
}
function schedDayHeadHTML(iso, count, isToday){
  const d = new Date(iso + "T12:00:00");
  const wd = isEN() ? SCHED_WD_EN[d.getDay()] : SCHED_WD_ZH[d.getDay()];
  return '<div class="sched-day' + (isToday ? " today" : "") + '">' +
    '<b>' + esc(schedDayLabel(iso)) + '</b>' +
    '<span>' + esc(wd) + '</span>' +
    (isToday ? '<i class="sched-today-tag">' + L("今天", "Today") + '</i>' : '') +
    '<em class="num">' + count + '</em>' +
  '</div>';
}
function scheduleWindowHTML(map, start, days, favOnly){
  const out = [];
  for(let i = 0; i < days; i++){
    const iso = schedShift(start, i);
    let list = Object.keys(map[iso] || {}).map(k => map[iso][k]);
    if(favOnly) list = list.filter(m => isFav(m.homeId) || isFav(m.awayId));
    list.sort((a, b) => a.ts - b.ts);
    out.push(schedDayHeadHTML(iso, list.length, iso === schedDateISO(0)));
    if(!list.length){
      out.push('<div class="sched-day-empty">' + (favOnly
        ? L("收藏的球队该日没有比赛。", "None of your clubs play on this day.")
        : L("无比赛", "No matches")) + '</div>');
      continue;
    }
    out.push('<div class="sched-cards">' + list.map(schedCardHTML).join("") + '</div>');
  }
  return out.join("");
}
/* 自定义日历弹层：原生 input[type=date] 的弹层由浏览器绘制、无法美化，故自绘月历 */
const SCHED_WD_EN2 = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
function schedCalTitle(y, m){
  return isEN()
    ? new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : (y + " 年 " + m + " 月");
}
function schedCalHTML(ym, startISO, hasSet){
  const p = ym.split("-");
  const y = parseInt(p[0], 10), m = parseInt(p[1], 10);
  const todayISO = schedDateISO(0);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;   /* 周一为 0 */
  const dim = new Date(y, m, 0).getDate();
  const cells = [];
  for(let i = lead; i > 0; i--) cells.push({ dt: new Date(y, m - 1, 1 - i), out: true });
  for(let d = 1; d <= dim; d++) cells.push({ dt: new Date(y, m - 1, d), out: false });
  let k = 1;
  while(cells.length % 7) cells.push({ dt: new Date(y, m, k++), out: true });
  const isoOf = dt => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  return '<div class="sched-cal-head">' +
      '<button type="button" class="sched-cal-nav" data-nav="-1" aria-label="' + L("上个月", "Previous month") + '">‹</button>' +
      '<b>' + esc(schedCalTitle(y, m)) + '</b>' +
      '<button type="button" class="sched-cal-nav" data-nav="1" aria-label="' + L("下个月", "Next month") + '">›</button>' +
    '</div>' +
    '<div class="sched-cal-wd">' + SCHED_WD_EN2.map((en, i) => '<span>' + esc(L(SCHED_WD_ZH[(i + 1) % 7], en)) + '</span>').join("") + '</div>' +
    '<div class="sched-cal-grid" id="sched-cal-grid">' + cells.map(c => {
      const iso = isoOf(c.dt);
      const cls = "sched-cal-day" + (c.out ? " out" : "") + (iso === todayISO ? " today" : "") +
        (iso === startISO ? " sel" : "") + (hasSet[iso] ? " has" : "");
      return '<button type="button" class="' + cls + '" data-date="' + iso + '" aria-selected="' + (iso === startISO ? "true" : "false") + '">' + c.dt.getDate() + '</button>';
    }).join("") + '</div>';
}
function schedulePageHTML(start, days){
  days = days || SCHED_DAYS;
  const end = schedShift(start, days - 1);
  const isToday = start === schedDateISO(0);
  const range = schedDayLabel(start) + " – " + schedDayLabel(end);
  const rangeLabel = esc(range) + (isToday ? ' · ' + L("今天起 " + days + " 天", "next " + days + " days") : "");
  const startD = new Date(start + "T12:00:00");
  const startLabel = schedDayLabel(start) + (isEN() ? "" : " " + SCHED_WD_ZH[startD.getDay()]);
  return '<button class="back" id="sched-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("赛程与赛果", "Fixtures & results") + '<small>' + rangeLabel + '</small></h2></div>' +
    '<div class="sched-nav">' +
      '<button class="sched-arrow" id="sched-prev" aria-label="' + L("前 " + days + " 天", "Previous " + days + " days") + '">‹</button>' +
      '<div class="sched-pick">' +
        '<button type="button" class="sched-date" id="sched-date-btn" aria-haspopup="dialog" aria-expanded="false">' +
          '<span id="sched-date-label">' + esc(startLabel) + '</span><i class="chev">▾</i>' +
        '</button>' +
        '<div class="sched-cal" id="sched-cal" role="dialog" aria-label="' + L("选择起始日期", "Pick a start date") + '" hidden></div>' +
      '</div>' +
      '<button class="sched-arrow" id="sched-next" aria-label="' + L("后 " + days + " 天", "Next " + days + " days") + '">›</button>' +
      '<button class="sched-today-btn" id="sched-today"' + (isToday ? " disabled" : "") + '>' + L("今天", "Today") + '</button>' +
      '<button class="sched-today-btn' + (SCHED.favOnly ? " on" : "") + '" id="sched-fav">' + L("只看收藏", "Favourites") + '</button>' +
    '</div>' +
    '<div id="sched-body"></div>';
}

/* ---------- 球队新闻 ---------- */
function newsListHTML(items){
  return '<div class="news-list">' + items.map(it => {
    const title = isEN() ? it.headline : (it.zh || it.headline);
    const raw = (!isEN() && !it.zh) ? ' <i class="news-raw">' + L("原文", "EN") + '</i>' : '';
    return '<a class="news-row" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
      '<span class="news-title">' + esc(title) + raw + '</span>' +
      '<span class="news-meta">' + esc(newsRelTime(it.ts)) + ' · ESPN</span>' +
    '</a>';
  }).join("") + '</div>';
}
/* ---------- 主/客场战绩 ---------- */
function recordBlockHTML(){
  return '<div class="record-block" id="team-record-wrap"><h3 class="sub-title">' + L("主 / 客场战绩", "Home / away record") + '<span>' + L("联赛", "League") + '</span></h3>' +
    '<div id="team-record">' + loadingNoteHTML("正在加载…", "Loading…") + '</div></div>';
}
function recordTableHTML(rec){
  const n = v => (v === undefined || v === null) ? "-" : v;
  const row = (label, r) => '<tr><td class="rec-lbl">' + label + '</td>' +
    '<td class="num">' + ((r.w || 0) + (r.d || 0) + (r.l || 0)) + '</td>' +
    '<td class="num">' + n(r.w) + '</td><td class="num">' + n(r.d) + '</td><td class="num">' + n(r.l) + '</td>' +
    '<td class="num">' + n(r.gf) + '</td><td class="num">' + n(r.ga) + '</td></tr>';
  return '<div class="tbl-wrap"><table class="rec-table"><thead><tr><th></th>' +
    '<th class="num">' + L("场次", "P") + '</th><th class="num">' + L("胜", "W") + '</th><th class="num">' + L("平", "D") + '</th><th class="num">' + L("负", "L") + '</th>' +
    '<th class="num">' + L("进", "GF") + '</th><th class="num">' + L("失", "GA") + '</th></tr></thead><tbody>' +
    row(L("主场", "Home"), rec.home) + row(L("客场", "Away"), rec.away) + row(L("总计", "Total"), rec.overall) +
    '</tbody></table></div>';
}
function newsBlockHTML(){
  return '<div class="news-block" id="team-news-wrap"><h3 class="sub-title">' + L("球队新闻", "Club news") + '<span>' + L("来自 ESPN", "via ESPN") + '</span></h3>' +
    '<div id="team-news">' + loadingNoteHTML("正在加载新闻…", "Loading news…") + '</div></div>';
}
/* 联赛新闻聚合页 */
function newsFeedHTML(items){
  return '<div class="news-feed">' + items.map(it => {
    const title = isEN() ? it.headline : (it.zh || it.headline);
    const raw = (!isEN() && !it.zh) ? ' <i class="news-raw">' + L("原文", "EN") + '</i>' : '';
    const teams = (it.teams || []).slice(0, 3).map(t => {
      const ref = findTeam("espn:" + t.id);
      const nm = isEN() ? t.en : (ref ? dTeam(ref) : (zhTeam(t.en) || t.en));
      return nm ? '<span class="news-team">' + esc(nm) + '</span>' : "";
    }).join("");
    return '<a class="news-item" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
      '<span class="news-item-title">' + esc(title) + raw + '</span>' +
      '<span class="news-item-foot">' + teams + '<span class="news-meta">' + esc(newsRelTime(it.ts)) + ' · ESPN</span></span>' +
    '</a>';
  }).join("") + '</div>';
}
function newsPageHTML(active){
  return '<button class="back" id="news-back">' + L("← 返回全部球队", "← All clubs") + '</button>' +
    '<div class="leaders-hero"><h2>' + L("联赛新闻", "League news") + '<small>' + L("来自 ESPN · 中文机翻", "via ESPN · machine translated") + '</small></h2></div>' +
    '<div class="quick lb-tabs">' + leadersTabsHTML(active) + '</div>' +
    '<div id="news-body"></div>';
}
