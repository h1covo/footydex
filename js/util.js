/* 工具模块：转义 / 颜色 / 日期 / 队徽图(CRESTS) / 球场照片表(PHOTOS) / 球员头像表 */
"use strict";
/* =========================================================
   工具函数
   ========================================================= */
const $ = s => document.querySelector(s);

function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* 韧性请求：超时（默认 12s）+ 重试（默认 1 次，~400ms 退避）；失败返回 null，不抛错 */
function fetchJson(url, timeout, retries){
  const to = timeout || 12000;
  const tries = (retries == null ? 1 : retries) + 1;
  function once(){
    const ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    const timer = setTimeout(() => { if(ctl) ctl.abort(); }, to);
    return fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(j => { clearTimeout(timer); return j; });
  }
  let p = once();
  for(let i = 0; i < tries - 1; i++){
    p = p.then(j => (j != null) ? j : new Promise(res => setTimeout(res, 400)).then(once));
  }
  return p;
}

/* 球队配色对比度处理：主色过浅时与副色互换，并给出用于小色块的重色 */
function hexLum(hex){
  const c = String(hex || "#000000").replace("#","");
  if(c.length < 6) return 0;
  const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255;
}
function displayColors(t){
  let c1 = t.colors[0], c2 = t.colors[1];
  if(hexLum(c1) > 0.72){ const tmp = c1; c1 = c2; c2 = tmp; }
  const cacc = hexLum(c1) <= hexLum(c2) ? c1 : c2;
  return { c1: c1, c2: c2, cacc: cacc };
}

function weekday(dateStr){
  const w = ["周日","周一","周二","周三","周四","周五","周六"];
  const we = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const d = new Date(dateStr + "T12:00:00");
  return isEN() ? we[d.getDay()] : w[d.getDay()];
}
function monthLabel(ym){ const [y,m]=ym.split("-"); return isEN() ? (["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m,10)-1] + " " + y) : (y + "年" + parseInt(m,10) + "月"); }

/* ---------- 队徽（官方队徽图片，加载失败时回退为圆形字母徽） ---------- */
const CRESTS = {
  mancity:"crests/mancity.png",
  liverpool:"crests/liverpool.png",
  realmadrid:"crests/realmadrid.png",
  barcelona:"crests/barcelona.png",
  bayern:"crests/bayern.png",
  inter:"crests/inter.png",
  psg:"crests/psg.png",
  shanghaiport:"crests/shanghaiport.svg"
};


/* ---------- 球场实拍照片（来源：Wikimedia Commons，均为自由授权，已标注作者与协议） ---------- */
const PHOTOS = {
  mancity:[
    {src:"stadium-photos/The_Etihad_Stadium.jpg",cap:"球场外观 · 黄昏时分的伊蒂哈德",by:"JMS",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:The_Etihad_Stadium.jpg"},
    {src:"stadium-photos/Etihad_Stadium_and_Sport_City,_Manchester,_from_the_air_geograph_4887123.jpg",cap:"航拍 · 伊蒂哈德与体育城",by:"Mike Pennington",lic:"CC BY-SA 2.0",page:"https://commons.wikimedia.org/wiki/File:Etihad_Stadium_and_Sport_City,_Manchester,_from_the_air_(geograph_4887123).jpg"},
    {src:"stadium-photos/Etihad_Stadium_Tour_31322231307.jpg",cap:"内景 · 蓝月看台与草皮",by:"Daniel",lic:"CC BY 2.0",page:"https://commons.wikimedia.org/wiki/File:Etihad_Stadium_Tour_(31322231307).jpg"},
    {src:"stadium-photos/Etihad_Stadium_East_Stand_at_the_end_of_the_Match_-_geograph.org.uk_-_7381619.jpg",cap:"赛日夜晚 · 东看台散场",by:"Paul Collins",lic:"CC BY-SA 2.0",page:"https://commons.wikimedia.org/wiki/File:Etihad_Stadium_East_Stand_at_the_end_of_the_Match_-_geograph.org.uk_-_7381619.jpg"}
  ],
  liverpool:[
    {src:"stadium-photos/Kop_of_Anfield_Liverpool.jpg",cap:"球场外观 · 科普看台",by:"Polo metz",lic:"CC BY 1.0",page:"https://commons.wikimedia.org/wiki/File:Kop_of_Anfield_Liverpool.jpg"},
    {src:"stadium-photos/Anfield_stadium_Liverpool_panorama_view_from_main_stand.jpg",cap:"内景 · 主看台视角全景",by:"Yurificacion",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Anfield_stadium_(Liverpool)_panorama_view_from_main_stand.jpg"},
    {src:"stadium-photos/Anfield,_20_October_2012.jpg",cap:"看台氛围 · 比赛中的安菲尔德",by:"Ivan PC",lic:"CC BY 2.0",page:"https://commons.wikimedia.org/wiki/File:Anfield,_20_October_2012.jpg"},
    {src:"stadium-photos/Anfield_Stadium_from_tower_of_St_Hilarys,_Wallasey.jpg",cap:"远眺 · 从威勒尔塔楼远望",by:"Rodhullandemu",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Anfield_Stadium_from_tower_of_St_Hilary%27s,_Wallasey.jpg"}
  ],
  realmadrid:[
    {src:"stadium-photos/Estadio_Santiago_Bernabéu_Lateral_Este.jpg",cap:"球场外观 · 东立面",by:"Roberto",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Estadio_Santiago_Bernab%C3%A9u_(Lateral_Este).jpg"},
    {src:"stadium-photos/Estadio_Santiago_Bernabéu_interior.jpg",cap:"内景 · 满座的伯纳乌",by:"Sofíaa1999",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Estadio_Santiago_Bernab%C3%A9u_interior.jpg"},
    {src:"stadium-photos/La_afición_3495456206.jpg",cap:"看台氛围 · 皇马球迷",by:"Jan S0L0",lic:"CC BY-SA 2.0",page:"https://commons.wikimedia.org/wiki/File:La_afici%C3%B3n_(3495456206).jpg"}
  ],
  barcelona:[
    {src:"stadium-photos/Camp_Nou_-_Exterior_01.JPG",cap:"球场外观 · 诺坎普外景",by:"Little Savage",lic:"CC BY-SA 3.0",page:"https://commons.wikimedia.org/wiki/File:Camp_Nou_-_Exterior_01.JPG"},
    {src:"stadium-photos/Barcelona_v_Sporting_de_Gijón_3_7986553481.jpg",cap:"内景 · 「不只是一家俱乐部」看台",by:"Daniel",lic:"CC BY 2.0",page:"https://commons.wikimedia.org/wiki/File:Barcelona_v_Sporting_de_Gij%C3%B3n_(3)_(7986553481).jpg"},
    {src:"stadium-photos/FC_Barcelona-_Camp_Nou_on_a_matchday_Ank_Kumar_02.jpg",cap:"比赛日 · 球迷入场",by:"Ank Kumar",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:FC_Barcelona-_Camp_Nou_on_a_matchday_(Ank_Kumar)_02.jpg"},
    {src:"stadium-photos/Camp_Nou_-_FC_Barcelona,_SP.jpg",cap:"草皮细节 · 草坪上的队徽",by:"Stefano Vigorelli",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Camp_Nou_-_FC_Barcelona,_SP.jpg"}
  ],
  bayern:[
    {src:"stadium-photos/Allianz_Arena_München_2018.jpg",cap:"航拍 · 安联球场与周边",by:"Ubahnverleih",lic:"CC0",page:"https://commons.wikimedia.org/wiki/File:Allianz_Arena_M%C3%BCnchen_2018.jpg"},
    {src:"stadium-photos/Allianz_Arena_2012.jpg",cap:"内景 · 看台与草皮",by:"David Cano",lic:"CC BY-SA 2.0",page:"https://commons.wikimedia.org/wiki/File:Allianz_Arena_2012.jpg"},
    {src:"stadium-photos/Allianz_Arena_25-11-2023_01.jpg",cap:"赛前 · 草皮布置中的安联",by:"SonoGrazy",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Allianz_Arena_(25-11-2023)_01.jpg"}
  ],
  inter:[
    {src:"stadium-photos/Stadio_Giuseppe_Meazza_1.jpg",cap:"球场外观 · 8号门入口",by:"Orledio",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Stadio_Giuseppe_Meazza_1.jpg"},
    {src:"stadium-photos/StadioGiuseppeMeazza2013.JPG",cap:"内景 · 梅阿查看台与草皮",by:"Oscar",lic:"Public domain",page:"https://commons.wikimedia.org/wiki/File:StadioGiuseppeMeazza2013.JPG"},
    {src:"stadium-photos/Curva_Interista.JPG",cap:"看台 · 北看台（库尔瓦·诺德）",by:"Scheggia.agm",lic:"Public domain",page:"https://commons.wikimedia.org/wiki/File:Curva_Interista.JPG"},
    {src:"stadium-photos/San_Siro_by_Night.jpg",cap:"夜景 · 圣西罗之夜",by:"funky1opti",lic:"Public domain",page:"https://commons.wikimedia.org/wiki/File:San_Siro_by_Night.jpg"}
  ],
  psg:[
    {src:"stadium-photos/Parc_des_Princes_@_Paris_16_32835075813.jpg",cap:"球场外观 · 街景中的王子公园",by:"Guilhem Vellut",lic:"CC BY 2.0",page:"https://commons.wikimedia.org/wiki/File:Parc_des_Princes_@_Paris_16_(32835075813).jpg"},
    {src:"stadium-photos/Le_Parc_des_Princes_durant_lEuro_2016.jpg",cap:"内景 · 2016 欧洲杯比赛日",by:"Passion-tango",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Le_Parc_des_Princes_durant_l%27Euro_2016.jpg"},
    {src:"stadium-photos/Paris_Parc_des_Princes_1.jpg",cap:"内景全景 · 王子公园",by:"Валерий Дед",lic:"CC BY 3.0",page:"https://commons.wikimedia.org/wiki/File:Paris_Parc_des_Princes_1.jpg"},
    {src:"stadium-photos/Parc_des_Princes_@_Ballon_de_Paris_@_Parc_André_Citroën_@_Paris_28822113445.jpg",cap:"高处俯瞰 · 从巴黎热气球眺望",by:"Guilhem Vellut",lic:"CC BY 2.0",page:"https://commons.wikimedia.org/wiki/File:Parc_des_Princes_@_Ballon_de_Paris_@_Parc_Andr%C3%A9_Citro%C3%ABn_@_Paris_(28822113445).jpg"}
  ],
  shanghaiport:[
    {src:"stadium-photos/Pudong_Football_Stadium_in_Pudong_District,_Shanghai,_China.jpg",cap:"球场外观 · 浦东足球场正门",by:"IDontHaveSkype",lic:"CC BY-SA 4.0",page:"https://commons.wikimedia.org/wiki/File:Pudong_Football_Stadium_in_Pudong_District,_Shanghai,_China.jpg"},
    {src:"stadium-photos/Pudong_Football_Stadium.jpg",cap:"球场全景 · 「白色碗」",by:"RPeterGD",lic:"CC0",page:"https://commons.wikimedia.org/wiki/File:Pudong_Football_Stadium.jpg"},
    {src:"stadium-photos/Shanghai_Port_vs_Beijing_Guoan_2025-05-01.jpg",cap:"比赛日 · 上海海港 vs 北京国安",by:"IDontHaveSkype",lic:"CC0",page:"https://commons.wikimedia.org/wiki/File:Shanghai_Port_vs_Beijing_Guoan_2025-05-01.jpg"},
    {src:"stadium-photos/A_distant_view_of_Pudong_Football_Stadium.jpg",cap:"远景 · 城市中的浦东足球场",by:"Luodingyu",lic:"CC0",page:"https://commons.wikimedia.org/wiki/File:A_distant_view_of_Pudong_Football_Stadium.jpg"}
  ]
};

/* ---------- 球员头像（Wikimedia Commons 自由授权实拍照片） ---------- */
const PLAYER_PHOTOS = {
"阿尔弗雷多·迪斯蒂法诺":{src:"player-avatars/p001.png",note:""},
"阿坎吉":{src:"player-avatars/p002.png",note:""},
"阿劳霍":{src:"player-avatars/p003.png",note:""},
"阿利松":{src:"player-avatars/p004.png",note:""},
"阿切尔比":{src:"player-avatars/p005.png",note:""},
"阿什拉夫":{src:"player-avatars/p006.png",note:""},
"埃德森":{src:"player-avatars/p007.png",note:""},
"埃里克·加西亚":{src:"player-avatars/p008.png",note:""},
"奥尔莫":{src:"player-avatars/p009.png",note:""},
"奥尔特加":{src:"player-avatars/p010.png",note:""},
"奥利塞":{src:"player-avatars/p011.png",note:""},
"奥斯卡":{src:"player-avatars/p012.png",note:""},
"巴尔德":{src:"player-avatars/p013.png",note:""},
"巴尔韦德":{src:"player-avatars/p014.png",note:""},
"巴雷拉":{src:"player-avatars/p015.png",note:""},
"巴斯托尼":{src:"player-avatars/p016.png",note:""},
"保莱塔":{src:"player-avatars/p017.png",note:""},
"贝拉尔多":{src:"player-avatars/p018.png",note:""},
"贝林厄姆":{src:"player-avatars/p019.png",note:""},
"比塞克":{src:"player-avatars/p020.png",note:""},
"伯纳多·席尔瓦":{src:"player-avatars/p021.png",note:""},
"博尼":{src:"player-avatars/p022.png",note:""},
"大卫·席尔瓦":{src:"player-avatars/p023.png",note:""},
"戴维斯":{src:"player-avatars/p024.png",note:""},
"德容":{src:"player-avatars/p025.png",note:""},
"登贝莱":{src:"player-avatars/p026.png",note:""},
"迪马尔科":{src:"player-avatars/p027.png",note:""},
"迪亚斯":{src:"player-avatars/p028.png",note:""},
"杜埃":{src:"player-avatars/p029.png",note:""},
"多库":{src:"player-avatars/p030.png",note:""},
"恩德里克":{src:"player-avatars/p031.png",note:""},
"法比安·鲁伊斯":{src:"player-avatars/p032.png",note:""},
"范戴克":{src:"player-avatars/p033.png",note:""},
"菲利普·拉姆":{src:"player-avatars/p034.png",note:""},
"费兰·托雷斯":{src:"player-avatars/p035.png",note:""},
"弗拉泰西":{src:"player-avatars/p036.png",note:""},
"弗朗茨·贝肯鲍尔":{src:"player-avatars/p037.png",note:""},
"弗林蓬":{src:"player-avatars/p038.png",note:""},
"福登":{src:"player-avatars/p039.png",note:""},
"盖德·穆勒":{src:"player-avatars/p040.png",note:""},
"格雷茨卡":{src:"player-avatars/p041.png",note:""},
"格纳布里":{src:"player-avatars/p042.png",note:""},
"格瓦迪奥尔":{src:"player-avatars/p043.png",note:""},
"贡萨洛·拉莫斯":{src:"player-avatars/p044.png",note:""},
"哈兰德":{src:"player-avatars/p045.png",note:""},
"哈维尔·萨内蒂":{src:"player-avatars/p046.png",note:""},
"何塞普·马丁内斯":{src:"player-avatars/p047.png",note:""},
"赫拉芬贝赫":{src:"player-avatars/p048.png",note:""},
"赫伊森":{src:"player-avatars/p049.png",note:""},
"胡尔克":{src:"player-avatars/p050.png",note:""},
"胡桑诺夫":{src:"player-avatars/p051.png",note:""},
"基米希":{src:"player-avatars/p052.png",note:""},
"基耶萨":{src:"player-avatars/p053.png",note:""},
"加克波":{src:"player-avatars/p054.png",note:""},
"加维":{src:"player-avatars/p055.png",note:""},
"蒋光太":{src:"player-avatars/p056.png",note:""},
"金玟哉":{src:"player-avatars/p057.png",note:""},
"卡马文加":{src:"player-avatars/p058.png",note:""},
"卡瓦哈尔":{src:"player-avatars/p059.png",note:""},
"凯恩":{src:"player-avatars/p060.png",note:""},
"凯尔凯兹":{src:"player-avatars/p061.png",note:""},
"柯蒂斯·琼斯":{src:"player-avatars/p062.png",note:""},
"科纳特":{src:"player-avatars/p063.png",note:""},
"科瓦契奇":{src:"player-avatars/p064.png",note:""},
"克里斯蒂亚诺·罗纳尔多":{src:"player-avatars/p065.png",note:""},
"克里斯滕森":{src:"player-avatars/p066.png",note:""},
"克瓦拉茨赫利亚":{src:"player-avatars/p067.png",note:""},
"肯尼·达格利什":{src:"player-avatars/p068.png",note:""},
"孔德":{src:"player-avatars/p069.png",note:""},
"库尔图瓦":{src:"player-avatars/p070.png",note:""},
"拉菲尼亚":{src:"player-avatars/p071.png",note:""},
"拉什福德":{src:"player-avatars/p072.png",note:""},
"莱默尔":{src:"player-avatars/p073.png",note:""},
"莱万多夫斯基":{src:"player-avatars/p074.png",note:""},
"赖因德斯":{src:"player-avatars/p075.png",note:""},
"劳塔罗·马丁内斯":{src:"player-avatars/p076.png",note:""},
"里奥·梅西":{src:"player-avatars/p077.png",note:""},
"卢宁":{src:"player-avatars/p078.png",note:""},
"鲁本·迪亚斯":{src:"player-avatars/p079.png",note:""},
"罗德里":{src:"player-avatars/p080.png",note:""},
"罗德里戈":{src:"player-avatars/p081.png",note:""},
"罗纳尔迪尼奥":{src:"player-avatars/p082.png",note:""},
"吕迪格":{src:"player-avatars/p083.png",note:""},
"马尔基尼奥斯":{src:"player-avatars/p084.png",note:""},
"马尔穆什":{src:"player-avatars/p085.png",note:""},
"马马尔达什维利":{src:"player-avatars/p086.png",note:""},
"马斯坦托诺":{src:"player-avatars/p087.png",note:""},
"麦卡利斯特":{src:"player-avatars/p088.png",note:""},
"门德斯":{src:"player-avatars/p089.png",note:""},
"门迪":{src:"player-avatars/p090.png",note:""},
"米利唐":{src:"player-avatars/p091.png",note:""},
"姆巴佩":{src:"player-avatars/p092.png",note:""},
"姆希塔良":{src:"player-avatars/p093.png",note:""},
"穆西亚拉":{src:"player-avatars/p094.png",note:""},
"努里":{src:"player-avatars/p095.png",note:""},
"诺伊尔":{src:"player-avatars/p096.png",note:""},
"帕利尼亚":{src:"player-avatars/p097.png",note:""},
"帕乔":{src:"player-avatars/p098.png",note:""},
"帕瓦尔":{src:"player-avatars/p099.png",note:""},
"佩德里":{src:"player-avatars/p100.png",note:""},
"恰尔汗奥卢":{src:"player-avatars/p101.png",note:""},
"琼阿梅尼":{src:"player-avatars/p102.png",note:""},
"若昂·内维斯":{src:"player-avatars/p103.png",note:""},
"萨福诺夫":{src:"player-avatars/p104.png",note:""},
"塞尔吉奥·阿圭罗":{src:"player-avatars/p105.png",note:""},
"舍瓦利耶":{src:"player-avatars/p106.png",note:""},
"什琴斯尼":{src:"player-avatars/p107.png",note:""},
"史蒂文·杰拉德":{src:"player-avatars/p108.png",note:""},
"索博斯洛伊":{src:"player-avatars/p109.png",note:""},
"索默":{src:"player-avatars/p110.png",note:""},
"塔":{src:"player-avatars/p111.png",note:""},
"特尔施特根":{src:"player-avatars/p112.png",note:""},
"图拉姆":{src:"player-avatars/p113.png",note:""},
"维蒂尼亚":{src:"player-avatars/p114.png",note:""},
"维尔茨":{src:"player-avatars/p115.png",note:""},
"维尼修斯":{src:"player-avatars/p116.png",note:""},
"文森特·孔帕尼":{src:"player-avatars/p117.png",note:""},
"乌尔比希":{src:"player-avatars/p118.png",note:""},
"谢尔基":{src:"player-avatars/p119.png",note:""},
"亚马尔":{src:"player-avatars/p120.png",note:""},
"颜骏凌":{src:"player-avatars/p121.png",note:""},
"伊恩·拉什":{src:"player-avatars/p122.png",note:""},
"伊萨克":{src:"player-avatars/p123.png",note:""},
"于帕梅卡诺":{src:"player-avatars/p124.png",note:""},
"约翰·克鲁伊夫":{src:"player-avatars/p125.png",note:""},
"扎伊尔-埃梅里":{src:"player-avatars/p126.png",note:""},
"张琳芃":{src:"player-avatars/p127.png",note:""},
"兹拉坦·伊布拉希莫维奇":{src:"player-avatars/p128.png",note:""},
};


function fmtDate(iso){ const d = new Date(iso); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function fmtTime(iso){ const d = new Date(iso); return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0"); }

/* 英文序数（联赛排名用）：1st / 2nd / 3rd / 4th … */
function ordinal(n){ const s = ["th","st","nd","rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

/* 图片加载失败兜底：就地换成占位块（避免灰块/破图）。用于球场实拍图等外链/本地图 */
function imgFail(img){
  if(!img || !img.parentNode) return;
  const ph = document.createElement("div");
  ph.className = "img-fallback";
  ph.setAttribute("aria-hidden", "true");
  ph.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="12" cy="12" rx="10" ry="6.5"/><path d="M12 5.5v13M2 12h20"/></svg>' +
    '<span>' + (typeof L === "function" ? L("图片暂不可用", "Photo unavailable") : "") + '</span>';
  img.parentNode.replaceChild(ph, img);
}
