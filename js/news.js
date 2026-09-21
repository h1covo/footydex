/* 球队新闻模块：ESPN 联赛新闻按队筛选（categories.teamId）+ MyMemory 中文翻译（永久缓存） */
"use strict";
const NEWS_KEY = "ft-news-v1";
const NEWS_ZH_KEY = "ft-news-zh-v1";
const NEWS_TTL = 30 * 60 * 1000;
const NEWS_LIMIT = 6;

function newsCacheRead(){ try { return JSON.parse(localStorage.getItem(NEWS_KEY) || "{}"); } catch(e){ return {}; } }
function newsCacheWrite(c){ try { localStorage.setItem(NEWS_KEY, JSON.stringify(c)); } catch(e){} }
function newsZhRead(){ try { return JSON.parse(localStorage.getItem(NEWS_ZH_KEY) || "{}"); } catch(e){ return {}; } }
function newsZhWrite(c){ try { localStorage.setItem(NEWS_ZH_KEY, JSON.stringify(c)); } catch(e){} }

/* ESPN 新闻 → 命中该队的条目（categories 里 type=team 的 teamId） */
function newsItemsFor(espnId, articles){
  const out = [];
  (articles || []).forEach(a => {
    const teams = (a.categories || []).filter(c => c.type === "team").map(c => String(c.teamId));
    if(teams.indexOf(String(espnId)) < 0) return;
    const web = (a.links && a.links.web) || {};
    out.push({
      id: String(a.id || a.nowId || a.headline || ""),
      headline: a.headline || "", desc: a.description || "",
      ts: a.published ? new Date(a.published).getTime() : 0,
      url: web.href || ""
    });
  });
  out.sort((x, y) => y.ts - x.ts);
  return out.slice(0, NEWS_LIMIT);
}
async function fetchTeamNews(lgId, espnId){
  const cache = newsCacheRead();
  const key = lgId + ":" + espnId;
  const c = cache[key];
  if(c && (Date.now() - c.at < NEWS_TTL) && c.items) return c.items;
  const j = await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lgId + "/news?limit=50", 12000, 1);
  const items = j ? newsItemsFor(espnId, j.articles) : [];
  cache[key] = { at: Date.now(), items: items };
  newsCacheWrite(cache);
  return items;
}
/* MyMemory 翻译（en→zh-CN），失败返回 null */
async function translateZh(text){
  const cache = newsZhRead();
  if(cache[text]) return cache[text];
  try {
    const j = await fetchJson("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=en|zh-CN", 12000, 1);
    const t = j && j.responseData && j.responseData.translatedText;
    if(t && !/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(t)){ cache[text] = t; newsZhWrite(cache); return t; }
  } catch(e) {}
  return null;
}
function newsRelTime(ts){
  if(!ts) return "";
  const m = Math.round((Date.now() - ts) / 60000);
  if(m < 60) return L(m + " 分钟前", m + " min ago");
  const h = Math.round(m / 60);
  if(h < 24) return L(h + " 小时前", h + "h ago");
  return L(Math.round(h / 24) + " 天前", Math.round(h / 24) + "d ago");
}
async function translateAll(items){
  const queue = items.slice();
  async function worker(){ while(queue.length){ const it = queue.shift(); it.zh = (await translateZh(it.headline)) || ""; } }
  await Promise.all([worker(), worker(), worker()]);
}
function renderTeamNews(vt, holderId){
  const holder = document.getElementById(holderId);
  const wrap = document.getElementById("team-news-wrap");
  if(!holder || !vt || !vt.espnId){ if(wrap) wrap.hidden = true; return; }
  const lg = vt.leagueId || leagueIdOf(vt);
  if(!lg){ if(wrap) wrap.hidden = true; return; }
  fetchTeamNews(lg, vt.espnId).then(items => {
    if(!items || !items.length){ if(wrap) wrap.hidden = true; holder.innerHTML = ""; return; }
    if(isEN()){ holder.innerHTML = newsListHTML(items); return; }
    translateAll(items).then(() => { holder.innerHTML = newsListHTML(items); });
  }).catch(() => { if(wrap) wrap.hidden = true; holder.innerHTML = ""; });
}

/* ---------- 联赛新闻聚合页（#news/<联赛>） ---------- */
const NEWS_PAGE_KEY = "ft-news-page-v1";
const NEWS_PAGE_LIMIT = 30;
function newsPageCacheRead(){ try { return JSON.parse(localStorage.getItem(NEWS_PAGE_KEY) || "{}"); } catch(e){ return {}; } }
function newsPageCacheWrite(c){ try { localStorage.setItem(NEWS_PAGE_KEY, JSON.stringify(c)); } catch(e){} }
function newsAllItems(articles){
  return (articles || []).map(a => {
    const teams = (a.categories || []).filter(c => c.type === "team");
    const web = (a.links && a.links.web) || {};
    return {
      id: String(a.id || a.nowId || a.headline || ""),
      headline: a.headline || "",
      ts: a.published ? new Date(a.published).getTime() : 0,
      url: web.href || "",
      teams: teams.map(c => ({ id: String(c.teamId), en: c.description || "" }))
    };
  }).sort((x, y) => y.ts - x.ts).slice(0, NEWS_PAGE_LIMIT);
}
async function fetchLeagueNews(lgId){
  const cache = newsPageCacheRead();
  const c = cache[lgId];
  if(c && (Date.now() - c.at < NEWS_TTL) && c.items) return c.items;
  const j = await fetchJson("https://site.web.api.espn.com/apis/site/v2/sports/soccer/" + lgId + "/news?limit=50", 12000, 1);
  const items = j ? newsAllItems(j.articles) : [];
  cache[lgId] = { at: Date.now(), items: items };
  newsPageCacheWrite(cache);
  return items;
}
function newsHashMatches(lgId){
  const h = location.hash;
  if(h.indexOf("#news") !== 0) return false;
  const p = decodeURIComponent(h.slice("#news/".length)).split("/")[0] || "eng.1";
  return p === lgId;
}
function renderNewsPage(lgId){
  const wrap = document.getElementById("news-content");
  if(!wrap) return;
  const active = LEAGUES.some(l => l.id === lgId) ? lgId : "eng.1";
  wrap.innerHTML = newsPageHTML(active);
  const back = document.getElementById("news-back");
  if(back) back.addEventListener("click", () => { location.hash = ""; });
  wrap.querySelectorAll(".lb-tabs button").forEach(b => {
    b.addEventListener("click", () => { location.hash = "news/" + b.dataset.lg; });
  });
  const holder = document.getElementById("news-body");
  if(holder) holder.innerHTML = loadingNoteHTML("正在加载新闻…", "Loading news…");
  fetchLeagueNews(active).then(items => {
    if(!newsHashMatches(active)) return;
    if(!items || !items.length){ if(holder) holder.innerHTML = emptyNoteHTML("该联赛暂无新闻。", "No news for this league."); return; }
    if(isEN()){ if(holder) holder.innerHTML = newsFeedHTML(items); return; }
    translateAll(items).then(() => { if(newsHashMatches(active) && holder) holder.innerHTML = newsFeedHTML(items); });
  }).catch(() => {
    if(newsHashMatches(active) && holder) holder.innerHTML = emptyNoteHTML("新闻获取失败，请检查网络后重试。", "Could not load news — check your connection and retry.");
  });
}
