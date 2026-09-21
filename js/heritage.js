/* 队史荣誉 / 名宿模块：本地数据渲染 + 打开球队页后台刷新（localStorage ft-heritage-v1，12 小时） */
"use strict";
/* =========================================================
   队史荣誉：数据来自 data/team-heritage.js（维基百科抓取），打开球队页时后台自动刷新
   ========================================================= */
const HERITAGE_TTL = 12 * 3600 * 1000;
const HERITAGE_KEY = "ft-heritage-v1";
function heritageCache(){
  try { return JSON.parse(localStorage.getItem(HERITAGE_KEY) || "{}"); } catch(e){ return {}; }
}
function saveHeritageCache(c){ try { localStorage.setItem(HERITAGE_KEY, JSON.stringify(c)); } catch(e){} }
function heritageOf(vt){
  const h = (window.TEAM_HERITAGE || {})[String(vt.espnId)];
  return (h && h.honors && h.honors.length) ? h : null;
}
function hClean(s){
  return String(s)
    .replace(/<ref[\s\S]*?<\/ref>/gi, "").replace(/<ref[^>]*\/>/gi, "")
    .replace(/\{\{efn[\s\S]*?\}\}/gi, "").replace(/\{\{refn[\s\S]*?\}\}/gi, "")
    .replace(/<sup[\s\S]*?<\/sup>/gi, "").replace(/\[\[File:[^\]]*\]\]/gi, "")
    .replace(/\[\[([^\]|]*)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{lang\|[a-z-]+\|([^}|]*)[^}]*\}\}/gi, "$1")
    .replace(/\{\{[^}|]*\|([^}|]*)\}\}/g, "$1").replace(/\{\{[^}]*\}\}/g, "")
    .replace(/'''?/g, "").replace(/''/g, "").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim();
}
function hYears(cell){
  const out = [];
  hClean(cell).split(/,(?![^(]*\))/).flatMap(x => x.split(/、|;/)).forEach(tok => {
    const t = tok.replace(/\(.*?\)/g, "").trim();
    const m1 = t.match(/(\d{4})\s*[–\-—]\s*(\d{2})\b/);
    if(m1){ out.push(String(parseInt(m1[1].slice(0,2) + m1[2], 10))); return; }
    const m2 = t.match(/(\d{4})\s*[–\-—]\s*(\d{4})/);
    if(m2){ out.push(m2[2]); return; }
    const m3 = t.match(/\b(19\d{2}|20\d{2})\b/);
    if(m3) out.push(m3[1]);
  });
  return [...new Set(out)].sort();
}
function parseHonoursWikitext(wt){
  const lines = String(wt).split("\n");
  const entries = [];
  let type = "", comp = "", count = null, seasons = [];
  const flush = () => {
    if(comp && (count !== null || seasons.length)) entries.push({ type: type, comp: comp, count: count !== null ? count : seasons.length, years: seasons.slice() });
    comp = ""; count = null; seasons = [];
  };
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li].trim();
    if (!line) continue;
    if (line.startsWith("|-")) { flush(); continue; }
    if (line.startsWith("|}")) { flush(); break; }
    const h = line.match(/^={2,5}\s*(.+?)\s*={2,5}$/);
    if (h) { const t = hClean(h[1]); if (/domestic|league|cup|continental|european|world|global|international|regional|other|minor/i.test(t)) { flush(); type = t; } continue; }
    const rs = line.match(/^[!|]\s*rowspan\s*=\s*"?\d+"?\s*\|([\s\S]*)$/i);
    if (rs) { const t = hClean(rs[1]); if (t) { flush(); type = t; } continue; }
    if (line.startsWith("!")) {
      const cell = hClean(line.replace(/^!\s*(scope=(row|col)\|)?/i, "").replace(/^style="[^"]*"\s*\|/i, ""));
      if (!cell) continue;
      if (/^(type|competition|titles?|seasons?|honou?rs?|count|year)/i.test(cell)) continue;
      comp = cell; continue;
    }
    if (line.startsWith(";")) { const t = hClean(line.replace(/^;\s*/, "")); if (t) { flush(); type = t; } continue; }
    if (/^'''/.test(line) && !/Winners?|Champions?/i.test(line)) { const cell = hClean(line); if (cell) { flush(); comp = cell; } continue; }
    if (/^\*\*/.test(line)) {
      const w = hClean(line.replace(/^\*+\s*/, "")).match(/(?:Winners?|Champions?|Champion)\s*(?:\((\d+)\))?\s*[::]?\s*([\s\S]*)$/i);
      if (w) { const ys = hYears(w[2] || ""); if (ys.length) { count = w[1] ? parseInt(w[1], 10) : ys.length; seasons.push(...ys); } }
      continue;
    }
    if (/^\*[^*]/.test(line)) {
      const cell = hClean(line.replace(/^\*\s*/, ""));
      if (!cell) continue;
      if (/^(runners?-up|runner up|second place|third place|promoted|relegated|qualified)/i.test(cell)) continue;
      const w = cell.match(/(?:Winners?|Champions?|Champion)\s*(?:\((\d+)\))?\s*[::]?\s*([\s\S]*)$/i);
      if (w && /(19|20)\d{2}/.test(w[2] || "")) { const ys = hYears(w[2] || ""); if (ys.length) { count = w[1] ? parseInt(w[1], 10) : ys.length; seasons.push(...ys); } continue; }
      const ym = cell.match(/^([\s\S]*?)[:：]\s*((?:19|20)\d{2}[\s\S]*)$/);
      if (ym && !/(winners?|champions?)/i.test(ym[1])) { const ys = hYears(ym[2]); if (ys.length && ym[1].trim()) { flush(); comp = ym[1].trim(); count = ys.length; seasons.push(...ys); continue; } }
      flush(); comp = cell; continue;
    }
    if (line.startsWith("|")) {
      const body = line.replace(/^\|\s*/, "");
      const st = body.match(/^(?:style="[^"]*"|align="[^"]*"|style="[^"]*"\s*align="[^"]*"|align="[^"]*"\s*style="[^"]*")\s*\|([\s\S]*)$/i);
      const cell = hClean(st ? st[1] : body);
      if (!cell) continue;
      if (/^\d{1,3}$/.test(cell)) { count = parseInt(cell, 10); continue; }
      const ys = hYears(cell);
      if (ys.length && /\d{4}/.test(cell)) { seasons.push(...ys); continue; }
      if (!comp) comp = cell;
      continue;
    }
    if (!/^[!|*{}<]/.test(line) && /\[\[|\b(19|20)\d{2}\b/.test(line)) {
      const ys = hYears(line);
      if (ys.length) { seasons.push(...ys); continue; }
    }
  }
  flush();
  return entries;
}
function hClassify(type, name){
  const t = String(type || "").toLowerCase();
  if(/regional|minor|friendly|youth|reserve|other|pre-season/i.test(t)) return null;
  if(/serie c\b|serie d\b|3\. liga|regionalliga|league one|league two|national league|j3 league|segunda b\b|primera [bc]\b|torneo federal|liga nacional|third division|fourth division|tier [34]|\(ii+\)|\(iv\)|\(v\)|oberliga|amateurliga|kreisliga|bezirksliga|landesliga|verbandsliga|amateur champion|under 1[0-9]|youth|reserve|semi-final|fair play|friendly|runners?-up/i.test(name)) return null;
  if(/continental|europe|south america|africa|asia|north america|oceania/i.test(t)) return "洲际赛事";
  if(/world|global|international/i.test(t)) return "国际赛事";
  if(/cup|copa|coupe|pokal|coppa|trophy|trophée|shield|supercup|super cup|supercopa|supercoppa|supertaça|beker|toto|challenge cup|emir|king|president|crown prince|hazfi|senior|league cup/i.test(name)) return "国内杯赛";
  if(/league|liga|divis|championship|premiership|bundesliga|serie [abcd]|ligue|superliga|all?svenskan|eliteserien|veikkausliiga|ekstraklasa|eredivisie|primera|premier|super league|stars league|pro league|v\.league|j1|j2|j3|k league|mls|a-league|süper|1\. liga|first league|liga i\b|national\b|challenge league|football league/i.test(name)) return "联赛冠军";
  return "国内杯赛";
}
const HERITAGE_CAT_EN = { "联赛冠军": "League titles", "国内杯赛": "Domestic cups", "洲际赛事": "Continental competitions", "国际赛事": "International competitions" };
const HERITAGE_CAT_ORDER = ["联赛冠军", "国内杯赛", "洲际赛事", "国际赛事"];
async function refreshHeritage(vt){
  const her = (window.TEAM_HERITAGE || {})[String(vt.espnId)];
  if(!her || !her.wiki || !her.wiki.title) return;
  const cache = heritageCache();
  const c = cache[String(vt.espnId)];
  if(c && (Date.now() - c.at) < HERITAGE_TTL) return;
  try {
    const url = "https://en.wikipedia.org/w/api.php?action=parse&page=" + encodeURIComponent(her.wiki.title) +
      "&section=" + her.wiki.section + "&prop=wikitext&format=json&origin=*";
    const r = await fetch(url, { cache: "no-store" });
    if(!r.ok) return;
    const j = await r.json();
    const wt = j && j.parse && j.parse.wikitext && j.parse.wikitext["*"];
    if(!wt) return;
    const parsed = parseHonoursWikitext(wt);
    let changed = false;
    parsed.forEach(p => {
      const nameEn = String(p.comp || "").replace(/[:：]\s*$/, "").trim();
      if(!nameEn || !p.years.length) return;
      const cat = hClassify(p.type, nameEn);
      if(!cat) return;
      const nameZh = Translator.compCN[nameEn] || Translator.awardCN[nameEn];
      let item = null;
      her.honors.forEach(c => c.items.forEach(it => { if(it.nameEn === nameEn) item = it; }));
      const years = p.years.slice(0, 30);
      const yearsStr = years.length >= 30 ? years.slice(0, 24).join("、") + " 等" : years.join("、");
      if(item){
        if(item.count !== p.count || item.years !== yearsStr){ item.count = p.count; item.years = yearsStr; changed = true; }
      } else {
        if(!nameZh) return;   // 无中文译名的新条目不入库（避免中英混排与抓取垃圾）
        let block = her.honors.filter(c => c.cat === cat)[0];
        if(!block){ block = { cat: cat, catEn: HERITAGE_CAT_EN[cat], items: [] }; her.honors.push(block); }
        block.items.push({ name: nameZh, nameEn: nameEn, count: p.count, years: yearsStr });
        her.honors.sort((a, b) => HERITAGE_CAT_ORDER.indexOf(a.cat) - HERITAGE_CAT_ORDER.indexOf(b.cat));
        changed = true;
      }
    });
    cache[String(vt.espnId)] = { at: Date.now() };
    saveHeritageCache(cache);
    if(changed && location.hash.indexOf("#team/") === 0 && findTeam(vt.id) && String(findTeam(vt.id).espnId) === String(vt.espnId)){
      const sec = document.getElementById("sec-honors");
      if(sec) sec.innerHTML = sectionHeadHTML("05", "历史荣誉", "Honours", "按赛事分类 · 夺冠次数与年份", "By competition · titles and years") + honorsGridHTML(her.honors);
    }
  } catch(e) {}
}
