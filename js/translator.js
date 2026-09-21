/* 翻译器组件（浏览器 + Node 双用）
   - 词典：浏览器读 window.NAME_ZH（data/names-zh.js 提供）；Node 下自动加载 data/names-zh.js
   - 内容：词典访问 zh* / 运行时译名表 compCN·oppCN·venueCN / 中英反查 enOf* / 双语取值 d*
   - 页面内部继续使用旧函数名（本文件已定义），其余模块零改动
   - 对外调用：window.Translator（浏览器）/ require(".../js/translator.js")（Node）
   - 规则音译（Node 专用）：Translator.translit(name) -> { zh, src } */
"use strict";
/* =========================================================
   中文名词典 & 联赛配置
   ========================================================= */
const ZH = (typeof window !== "undefined" && window.NAME_ZH)
  ? window.NAME_ZH
  : (typeof require === "function"
    ? (function(){
        const fs = require("fs"), vm = require("vm");
        const src = fs.readFileSync(__dirname + "/../data/names-zh.js", "utf8");
        const sb = { window: {} };
        vm.createContext(sb); vm.runInContext(src, sb);
        return sb.window.NAME_ZH;
      })()
    : { players:{}, teams:{}, venues:{}, countries:{}, cities:{}, playersNat:{}, meta:{ teams:[], prevSeason:{} } });
function zhTeam(en){ return ZH.teams[en] || en; }
function zhPlayer(en){ return ZH.players[en] || en; }
function zhCountry(en){ return ZH.countries[en] || en; }
function zhVenue(en){ return ZH.venues[en] || en; }
function zhCity(en){ return (ZH.cities && ZH.cities[en]) || en || ''; }

/* 运行时译名表（原 compCN / oppCN / venueCN） */
const compCN = {
    "English Premier League":"英超","Spanish LALIGA":"西甲","Spanish LaLiga":"西甲","German Bundesliga":"德甲","Italian Serie A":"意甲","French Ligue 1":"法甲",
    "Chinese Super League":"中超","UEFA Champions League":"欧冠","UEFA Champions League Qualifying":"欧冠资格赛","UEFA Europa League":"欧联杯",
    "UEFA Europa Conference League":"欧协联","UEFA Super Cup":"欧洲超级杯","English FA Cup":"足总杯","English League Cup":"联赛杯","EFL Cup":"联赛杯",
    "English Carabao Cup":"联赛杯","English FA Community Shield":"社区盾","Spanish Copa del Rey":"国王杯","Spanish Supercopa":"西班牙超级杯",
    "German DFB Pokal":"德国杯","German Cup":"德国杯","German Super Cup":"德国超级杯","German Supercup":"德国超级杯","Italian Coppa Italia":"意大利杯",
    "Coppa Italia":"意大利杯","Italian Supercoppa":"意大利超级杯","French Coupe de France":"法国杯","Coupe de France":"法国杯",
    "French Super Cup":"法国超级杯","French Trophee des Champions":"法国超级杯","FIFA Club World Cup":"世俱杯","FIFA Intercontinental Cup":"洲际杯",
    "AFC Champions League Elite":"亚冠精英联赛","AFC Champions League Two":"亚冠二级联赛","Club Friendly":"友谊赛","Friendlies":"友谊赛","International Friendly":"国际友谊赛",
    "Trofeo Joan Gamper":"甘伯杯","Japanese J.League World Challenge":"日本J联赛世界挑战赛",
    "Emirates Cup":"酋长杯","UEFA Conference League":"欧协联","UEFA Conference League Qualifying":"欧协联资格赛",
    "English League Championship":"英冠","Spanish LALIGA 2":"西乙","German Bundesliga Promotion/Relegation Playoff":"德甲升降级附加赛",
    "German 2. Bundesliga":"德乙","Italian Serie B":"意乙","French Ligue 2":"法乙","French Ligue 1 Promotion/Relegation Playoffs":"法甲升降级附加赛",
    "English Championship":"英冠","German 3. Liga":"德丙","Italian Serie C":"意丙","French National":"法丙","English League One":"英甲",
    "English League Two":"英乙","English National League":"英格兰全国联赛","FIFA World Cup":"世界杯","UEFA European Championship":"欧洲杯",
    "European Cup Winners' Cup":"欧洲优胜者杯",
    "Sheriff of London Charity Shield":"伦敦郡长慈善盾",
    "European Super Cup":"欧洲超级杯",
    "Copa Federación de España":"西班牙足协杯",
    "Uhrencup":"钟表杯",
    "Cup of the Alps":"阿尔卑斯杯",
    "Coppa delle Alpi":"阿尔卑斯杯",
    "Fuji-Cup":"富士杯",
    "Championship":"英冠",
    "Southern League":"南部联赛",
    "Southern League Second Division":"南部联赛乙级",
    "Southern League First Division":"南部联赛甲级",
    "Southern League South":"南部联赛南区",
    "Southern League Cup":"南部联赛杯",
    "London Challenge Cup":"伦敦挑战杯",
    "Texaco Cup":"德士古杯",
    "Anglo-Italian Cup":"英意杯",
    "Anglo-Italian League Cup":"英意联赛杯",
    "Serie C2":"意丙2",
    "Serie C1":"意丙1",
    "Cantabrian Championship":"坎塔布里亚锦标赛",
    "Copa de la Reina":"王后杯",
    "Concurso España":"西班牙竞赛杯",
    "Segunda División play-offs":"西乙升级附加赛",
    "Segunda División B – Group 1":"西乙B第1组",
    "Copa Ramón Triana":"拉蒙·特里亚纳杯",
    "Easter Cup":"复活节杯",
    "International Football Cup (Intertoto Cup)":"国际足球杯（国际托托杯）",
    "Intertoto Cup":"国际托托杯",
    "Trofeo Bortolotti":"博尔托洛蒂杯",
    "Bahía de Cartagena Trophy":"卡塔赫纳湾杯",
    "German Under-19 Cup":"德国U19杯",
    "Lev Yashin Cup":"列夫·雅辛杯",
    "2. Bundesliga North":"德乙北区",
    "German Championship":"德国锦标赛",
    "DFB-Pokal (German Cup)":"德国杯",
    "DFB-Ligapokal (German League Cup)":"德国联赛杯",
    "DFL-Ligapokal":"德国联赛杯",
    "DFB-Ligapokal":"德国联赛杯",
    "DFL-Supercup (German Super Cup)":"德国超级杯",
    "DFB/DFL-Supercup":"德国超级杯",
    "DFB-Hallenpokal":"德国室内杯",
    "French Division 2":"法乙",
    "Ligue 2 (French 2nd Division)":"法乙",
    "French Division 1/Ligue 1 and Coupe de France":"法甲及法国杯",
    "FGSPF Burgundy Championnat":"FGSPF勃艮第锦标赛",
    "Joan Gamper Cup":"甘伯杯",
    "Coupe Drago":"德拉戈杯",
    "Alsace Champions":"阿尔萨斯冠军",
    "Dordogne Champions":"多尔多涅冠军",
    "UEFA-CONMEBOL Club Challenge":"欧足联-南美足联俱乐部挑战赛",
    "Sussex Senior Challenge Cup":"苏塞克斯高级挑战杯",
    "The Sussex Royal Ulster Rifles Charity Cup":"苏塞克斯皇家阿尔斯特步枪团慈善杯",
    "United League":"联合联赛",
    "London League":"伦敦联赛",
    "London League Second Division":"伦敦联赛乙级",
    "West London Alliance":"西伦敦联盟",
    "Middlesex Junior Cup":"米德尔塞克斯青年杯",
    "West Middlesex Cup":"西米德尔塞克斯杯",
    "Southern Professional Charity Cup":"南部职业慈善杯",
    "Ealing Hospital Cup":"伊灵医院杯",
    "London Charity Fund":"伦敦慈善基金",
    "London Combination":"伦敦组合联赛",
    "London War Cup":"伦敦战争杯",
    "Football League Centenary Trophy":"英格兰联赛百年纪念杯",
    "BBC Sports Personality Team of the Year Award":"BBC年度体育人物最佳团队奖",
    "Western League Division One Section A":"西部联赛甲级A组",
    "West London League":"西伦敦联赛",
    "West London Cup":"西伦敦杯",
    "London Fives Tournament":"伦敦五人制锦标赛",
    "Football Alliance":"足球联盟（英格兰）",
    "DDR-Liga Nord":"东德联赛北区",
    "DDR-Liga A":"东德联赛A区",
    "DDR-Liga B":"东德联赛B区",
    "II. DDR-Liga I":"东德乙级联赛I区",
    "FDGB-Pokal":"东德足协杯",
    "Copa Presidente FEF":"西班牙足协主席杯",
    "Trophee des Champions":"法国超级杯",
    "Trophée des champions (French Super Cup)":"法国超级杯",
    "Serie A (Tier 1)":"意甲（第一级别）",
    "Serie B (Tier 2)":"意乙（第二级别）",
    "Serie B (Tier 2) play-offs":"意乙升级附加赛",
    "Terza Divisione/Prima Divisione (Tier 1)":"第三级别/第一级别联赛",
    "Torneo Campana Mutilati":"坎帕尼亚伤残军人锦标赛",
    "Trofeo Sardegna":"撒丁岛杯",
    "Trofeo Goleador":"射手杯",
    "Challenge International du Nord":"北部国际挑战赛",
    "Coupe de France (French Cup)":"法国杯",
    "USFSA Championnat":"USFSA锦标赛",
    "Coupe Nationale":"全国杯",
    "Bayernliga":"巴伐利亚联赛",
    "Schwaben Cup":"施瓦本杯",
    "Promozione Emilia-Romagna":"艾米利亚-罗马涅推广联赛",
    "Seconda Divisione":"第二级别联赛",
    "Tercera División":"西丙",
    "Regional Championship":"地区锦标赛",
    "Belarusian Super Cup":"白俄罗斯超级杯",
    "Saarland Cup":"萨尔兰州杯",
    "Saxony Cup":"萨克森杯",
    "Coppa Italia Lega Pro":"意大利职业联赛杯",
    "FIFA U-20 World Cup":"U20世界杯",
    "Mitropa Cup":"米特罗帕杯",
    "Coupe d'Alsace":"阿尔萨斯杯",
    "Supercoppa di Serie C":"意丙超级杯",
    "UEFA Nations League":"欧洲国家联赛",
    "Polish Super Cup":"波兰超级杯",
    "Turkish Super Cup":"土耳其超级杯",
    "DDR-Oberliga":"东德高级联赛",
    "Coupe de la Réunion":"留尼汪杯",
    "Campeones Cup":"冠军杯",
    "Belgian Pro League":"比甲",
    "Belgian Super Cup":"比利时超级杯",
    "Chinese Super League Cup":"中超联赛杯",
    "Chinese FA Cup":"足协杯",
    "Croatian Cup":"克罗地亚杯",
    "Russian Top League":"俄超",
    "Russian Premier League":"俄超",
    "Soviet Cup":"苏联杯",
    "First League of Serbia and Montenegro":"塞尔维亚和黑山甲级联赛",
    "Serbia and Montenegro Cup":"塞尔维亚和黑山杯",
    "Qatar Stars League":"卡塔尔星联赛",
    "Copa Eva Duarte":"埃娃·杜阿尔特杯",
    "Copa del Generalísimo":"西班牙杯（佛朗哥时期）",
    "Polish Cup":"波兰杯",
    "Liga I":"罗甲",
    "Liga MX Regular Season":"墨超常规赛",
    "Copa Interamericana":"美洲洲际杯",
    "Copa de la Liga":"西班牙联赛杯",
    "Johan Cruyff Shield":"约翰·克鲁伊夫盾",
    "Coppa Italia Serie C":"意丙意大利杯",
    "Regionalliga Nord":"北部地区联赛",
    "Dallas Cup":"达拉斯杯",
    "DFB-Supercup":"德国超级杯",
    "Copa do Nordeste":"东北杯",
    "Copa Mercosur":"南方共同市场杯",
    "Supertaça Cândido de Oliveira":"坎迪多·德奥利韦拉超级杯",
    "Luxembourg Cup":"卢森堡杯",
    "Belgian Cup":"比利时杯",
    "Copa CONMEBOL":"南美足联杯",
    "East Riding Senior Cup":"东赖丁高级杯",
    "Football League Two":"英乙",
    "Football League Trophy":"英格兰联赛锦标赛",
    "Saudi Super Cup":"沙特超级杯",
    "Saudi First Division League":"沙特甲级联赛",
    "Welsh Cup":"威尔士杯",
    "FA Youth Cup":"青年足总杯",
    "Charity Shield":"慈善盾",
    "Irish Cup":"爱尔兰杯",
    "North American Soccer League":"北美足球联赛",
    "North American Soccer League Soccer Bowl":"北美足球联赛总决赛",
    "National Football League":"全国足球联赛",
    "MLS Cup":"美职联杯",
    "Supporters' Shield":"支持者盾",
    "Serbian SuperLiga":"塞尔维亚超级联赛",
    "Full Members' Cup":"正式会员杯",
    "Football League Third Division":"英丙",
    "Honduran Liga Nacional":"洪都拉斯国家联赛",
    "Honduran Super Copa":"洪都拉斯超级杯",
    "Honduran Cup":"洪都拉斯杯",
    "Recopa Sudamericana":"南美优胜者杯",
    "Brandenburg Cup":"勃兰登堡杯",
    "Westphalian Cup":"威斯特法伦杯",
    "Swiss Super League":"瑞士超级联赛",
    "Supercoppa di Lega di Serie C1":"意丙1超级杯",
    "CAF Confederation Cup":"非洲联盟杯",
    "Latin Cup":"拉丁杯",
    "Croatian Super Cup":"克罗地亚超级杯",
    "Jia B League":"甲B联赛",
    "Svenska Supercupen":"瑞典超级杯",
    "Copa do Brasil":"巴西杯",
    "Superclásico de las Américas":"美洲超级德比",
    "A-League":"澳超",
    "Football League Second Division":"英格兰乙级联赛",
    "Football League One":"英甲"
};

/* 奖项名（名宿成就/个人荣誉用；供 Translate 调用与数据翻译） */
const awardCN = {
  "kicker Bundesliga Team of the Season":"踢球者德甲赛季最佳阵容",
  "Pichichi Trophy":"皮奇奇奖",
  "Pichichi Trophy (Segunda División)":"皮奇奇奖（西乙）",
  "Zarra Trophy":"萨拉奖",
  "Zarra Trophy (Segunda División)":"萨拉奖（西乙）",
  "Ricardo Zamora Trophy":"里卡多·萨莫拉奖",
  "Ligue 1 top scorer":"法甲最佳射手",
  "Serie A top scorer":"意甲最佳射手",
  "Coppa Italia top scorer":"意大利杯最佳射手",
  "Bundesliga top scorer":"德甲最佳射手",
  "Bundesliga Top Scorer":"德甲最佳射手",
  "Bundesliga top assist provider":"德甲助攻王",
  "2. Bundesliga top assist provider":"德乙助攻王",
  "Serie A top assist provider":"意甲助攻王",
  "Football League Cup top scorer":"英格兰联赛杯最佳射手",
  "China League Two top scorer":"中乙最佳射手",
  "Regionalliga West Top Goalscorers":"西部地区联赛最佳射手",
  "Bundesliga Team of the Season":"德甲赛季最佳阵容",
  "La Liga Team of the Season":"西甲赛季最佳阵容",
  "UEFA Europa League Squad of the Season":"欧联杯赛季最佳阵容",
  "Premier League Playmaker of the Season":"英超赛季最佳组织者",
  "Premier League Fan Team of the Season":"英超球迷票选赛季最佳阵容",
  "Premier League Most Powerful Goal":"英超赛季最强进球",
  "Premier League Player of the Year":"英超年度最佳球员",
  "Premier League Golden Boot":"英超金靴奖",
  "Serie A Italian Footballer of the Year":"意甲年度最佳意大利球员",
  "Serie A Fair Play Prize":"意甲公平竞赛奖",
  "Serie A Goal of the Year":"意甲年度最佳进球",
  "Serie A Goal of the Season":"意甲赛季最佳进球",
  "Africa Cup of Nations Best Player":"非洲杯最佳球员",
  "Football League 100 Legends":"英格兰联赛百大传奇",
  "Franz Beckenbauer Supercup":"弗朗茨·贝肯鲍尔超级杯"
};
const oppCN = {
    "1. FC Heidenheim 1846":"海登海姆","1. FC Magdeburg":"马格德堡","1. FC Union Berlin":"柏林联合","AC Milan":"AC米兰","AEK Athens":"AEK雅典",
    "AFC Bournemouth":"伯恩茅斯","AJ Auxerre":"欧塞尔","Ajax Amsterdam":"阿贾克斯","Al Ahly":"开罗国民","Al Ain":"阿尔艾因","Al Hilal":"利雅得新月",
    "Alavés":"阿拉维斯","Albacete":"阿尔瓦塞特","Angers":"昂热","Arsenal":"阿森纳","AS Monaco":"摩纳哥","AS Roma":"罗马","Aston Villa":"阿斯顿维拉",
    "Atalanta":"亚特兰大","Athletic Club":"毕尔巴鄂竞技","Atlético Madrid":"马德里竞技","Auckland City":"奥克兰城","Barcelona":"巴塞罗那","Barnsley":"巴恩斯利",
    "Bayer Leverkusen":"勒沃库森","Bayern Munich":"拜仁慕尼黑","Beijing Guoan":"北京国安","Benfica":"本菲卡","Birmingham City":"伯明翰","Boca Juniors":"博卡青年",
    "Bodo/Glimt":"博德闪耀","Bologna":"博洛尼亚","Borussia Dortmund":"多特蒙德","Borussia Mönchengladbach":"门兴格拉德巴赫","Botafogo":"博塔弗戈",
    "Brentford":"布伦特福德","Brest":"布雷斯特","Brighton & Hove Albion":"布莱顿","Buriram United":"武里南联","Burnley":"伯恩利","Cagliari":"卡利亚里",
    "CD Guadalajara":"瓜达拉哈拉","Celta Vigo":"塞尔塔","Changchun Yatai":"长春亚泰","Chelsea":"切尔西","Chengdu Rongcheng":"成都蓉城",
    "Chongqing Tonglianglong":"重庆铜梁龙","Club Brugge":"布鲁日","Como":"科莫","Cong An Hanoi":"河内公安","Coventry City":"考文垂","Cremonese":"克雷莫纳",
    "Crystal Palace":"水晶宫","Daegu FC":"大邱FC","Daejeon Hana Citizen":"大田韩亚市民","Dalian Yingbo":"大连英博","Deportivo":"拉科鲁尼亚",
    "Eintracht Frankfurt":"法兰克福","Elche":"埃尔切","Espanyol":"西班牙人","Everton":"埃弗顿","Exeter City":"埃克塞特城","F.C. København":"哥本哈根",
    "FC Augsburg":"奥格斯堡","FC Basel":"巴塞尔","FC Cologne":"科隆","FC Porto":"波尔图","FC Seoul":"首尔FC","Fenerbahce":"费内巴切",
    "Ferencvaros":"费伦茨瓦罗斯","Feyenoord Rotterdam":"费耶诺德","Fiorentina":"佛罗伦萨","FK Qarabag":"卡拉巴赫","Flamengo":"弗拉门戈",
    "Fluminense":"弗鲁米嫩塞","Fontenay Foot":"丰特奈","Frosinone":"弗罗西诺内","Fulham":"富勒姆","Galatasaray":"加拉塔萨雷","Gangwon FC":"江原FC",
    "Genoa":"热那亚","Getafe":"赫塔菲","Girona":"赫罗纳","Grasshoppers":"草蜢","Hamburg SV":"汉堡","Hellas Verona":"维罗纳","Henan":"河南队",
    "Huddersfield Town":"哈德斯菲尔德","Hull City":"赫尔城","Inter Miami CF":"迈阿密国际","Internazionale":"国际米兰","Ipswich Town":"伊普斯维奇",
    "Jeju United":"济州联","Jeonbuk Motors":"全北现代","Johor Darul Ta'zim":"柔佛DT","Juventus":"尤文图斯","Kairat Almaty":"阿拉木图凯拉特",
    "Karlsruher SC":"卡尔斯鲁厄","LASK Linz":"林茨","Lazio":"拉齐奥","Le Havre AC":"勒阿弗尔","Le Mans":"勒芒","Lecce":"莱切","Leeds United":"利兹联",
    "Leganés":"莱加内斯","Lens":"朗斯","Levante":"莱万特","Liaoning Tieren":"辽宁铁人","Lille":"里尔","Liverpool":"利物浦","Lorient":"洛里昂",
    "Lyon":"里昂","Machida Zelvia":"町田泽维亚","Mainz":"美因茨","Málaga":"马拉加","Mallorca":"马略卡","Manchester City":"曼城","Manchester United":"曼联",
    "Marseille":"马赛","Meizhou Hakka":"梅州客家","Metz":"梅斯","Monterrey":"蒙特雷","Monza":"蒙扎","Nantes":"南特","Napoli":"那不勒斯",
    "Newcastle Jets":"纽卡斯尔喷气机","Newcastle United":"纽卡斯尔联","Nice":"尼斯","Norwich City":"诺维奇","Nottingham Forest":"诺丁汉森林",
    "Olympiacos":"奥林匹亚科斯","Osasuna":"奥萨苏纳","Pafos":"帕福斯","Palermo":"巴勒莫","Paris FC":"巴黎FC","Paris Saint-Germain":"巴黎圣日耳曼",
    "Parma":"帕尔马","Pisa":"比萨","Pohang Steelers":"浦项制铁","Port FC":"泰港","Preston North End":"普雷斯顿","PSV Eindhoven":"埃因霍温",
    "Qingdao Hainiu":"青岛海牛","Qingdao West Coast":"青岛西海岸","Racing Santander":"桑坦德竞技","Ratchaburi FC":"叻武里","Rayo Vallecano":"巴列卡诺",
    "RB Leipzig":"莱比锡红牛","RB Salzburg":"萨尔茨堡红牛","Real Betis":"皇家贝蒂斯","Real Madrid":"皇家马德里","Real Oviedo":"皇家奥维耶多",
    "Real Sociedad":"皇家社会","River Plate":"河床","Sabah FK":"萨巴巴库","Salford City":"索尔福德城","Sanfrecce Hiroshima":"广岛三箭",
    "Sassuolo":"萨索洛","SC Freiburg":"弗赖堡","SC Paderborn 07":"帕德博恩","Schalke 04":"沙尔克04","Seattle Sounders FC":"西雅图海湾人",
    "Sevilla":"塞维利亚","Shakhtar Donetsk":"顿涅茨克矿工","Shandong Taishan":"山东泰山","Shanghai Port":"上海海港","Shanghai Shenhua":"上海申花",
    "Shenzhen Xinpengcheng":"深圳新鹏城","Slavia Prague":"布拉格斯拉维亚","Slovan Bratislava":"布拉迪斯拉发","Southampton":"南安普顿",
    "Sporting CP":"葡萄牙体育","St. Pauli":"圣保利","Stade Rennais":"雷恩","Stoke City":"斯托克城","Strasbourg":"斯特拉斯堡","Sunderland":"桑德兰",
    "SV Elversberg":"埃尔弗斯贝格","SV Wehen Wiesbaden":"韦恩威斯巴登","Swansea City":"斯旺西","Tianjin Jinmen Tiger":"天津津门虎","Torino":"都灵",
    "Tottenham Hotspur":"托特纳姆热刺","Toulouse":"图卢兹","Troyes":"特鲁瓦","TSG Hoffenheim":"霍芬海姆","Udinese":"乌迪内斯","Ulsan HD":"蔚山HD",
    "Union St.-Gilloise":"圣吉尔联","Urawa Red Diamonds":"浦和红钻","Valencia":"瓦伦西亚","Venezia":"威尼斯","VfB Stuttgart":"斯图加特",
    "VfL Osnabruck":"奥斯纳布吕克","VfL Wolfsburg":"沃尔夫斯堡","Viking FK":"维京","Villarreal":"比利亚雷亚尔","Vissel Kobe":"神户胜利船",
    "Werder Bremen":"云达不莱梅","West Ham United":"西汉姆联","Wolverhampton Wanderers":"狼队","Wrexham":"雷克瑟姆","Wuhan Three Towns":"武汉三镇",
    "Wydad AC":"卡萨布兰卡维达德","Yokohama F. Marinos":"横滨水手","Yunnan Yukun":"云南玉昆","Zhejiang Professional FC":"浙江队","Pachuca":"帕丘卡","Talavera":"塔拉韦拉","WSG Swarovski Tirol":"蒂罗尔WSG",
};
const venueCN = {
    "Ahmad bin Ali Stadium":"艾哈迈德·本·阿里球场","Al-Awwal Park":"奥瓦尔公园球场","Allianz Arena":"安联球场","Allianz Riviera":"安联里维埃拉球场",
    "Allianz Stadium":"安联球场（都灵）","Alphamega Stadium":"阿尔法梅加球场","American Express Stadium":"美国运通球场","Anfield":"安菲尔德球场",
    "Arena Garibaldi - Stadio Romeo Anconetani":"加里波第球场","Aspmyra Stadion":"阿斯普米拉球场","Atatürk Olimpiyat":"阿塔图尔克奥林匹克球场",
    "Baku Olympic Stadium":"巴库奥林匹克球场","Balaidos":"巴莱多斯球场","Bank of America Stadium":"美国银行球场","BayArena":"拜耳竞技场",
    "BBBank Wildpark":"野生动物园球场","Benghazi International Stadium":"班加西国际球场","Bluenergy Stadium":"蓝能源球场","BORUSSIA-PARK":"普鲁士公园球场",
    "BRITA-Arena":"布里塔球场","Camping World Stadium":"露营世界球场","Carlos Belmonte":"卡洛斯·贝尔蒙特球场","Carlos Tartiere":"卡洛斯·塔尔铁雷球场",
    "Chang Arena":"昌竞技场","Changchun Sports Center Stadium":"长春体育中心体育场","Chengdu Phoenix Mountain Sports Park":"成都凤凰山体育公园",
    "Chongqing Longxing Football Stadium":"重庆龙兴足球场","Chuncheon Songam Sports Town Main Stadium":"春川松岩体育城主体育场",
    "Ciutat de Valencia":"巴伦西亚城球场","Coventry Building Society Arena":"考文垂建筑协会球场","Craven Cottage":"克拉文农场球场","Daegu Stadium":"大邱体育场",
    "Dalian Suoyuwan Football Stadium":"大连梭鱼湾足球场","De Kuip":"德凯普球场","Decathlon Arena - Stade Pierre-Mauroy":"皮埃尔·莫鲁瓦球场",
    "Deepdale":"深谷球场","Deutsche Bank Park":"德意志银行公园","Dragon Solar Park":"龙球场","Edion Peace Wing Hiroshima":"广岛和平之翼球场",
    "El Sadar":"萨达尔球场","El Sardineros":"萨尔迪内罗球场","Elland Road":"埃兰路球场","Emirates Stadium":"酋长球场","Ennio Tardini":"塔尔迪尼球场",
    "Estadi Ciutat de València":"巴伦西亚城球场","Estadi Johan Cruyff":"约翰·克鲁伊夫球场","Estadi Mallorca Son Moix":"马略卡松莫伊什球场",
    "Estadi Montilivi":"蒙蒂利维球场","Estadi Olímpic Lluís Companys":"路易斯·孔帕尼斯奥林匹克球场","Estadio Abanca-Balaídos":"巴莱多斯球场",
    "Estadio Bernabéu":"伯纳乌球场","Estadio Coliseum":"斗兽场球场","Estadio de la Cerámica":"陶瓷球场","Estadio de Vallecas":"巴列卡斯球场",
    "Estádio do Dragão":"龙球场","Estádio José Alvalade":"若泽·阿尔瓦拉德球场","Estadio La Cartuja":"拉卡图哈球场","Estadio Martínez Valero":"马丁内斯·巴莱罗球场",
    "Etihad Stadium":"伊蒂哈德球场","Europa-Park Stadion":"欧洲公园球场","Fortuna Arena":"幸运球场","GEODIS Park":"乔迪斯公园",
    "Giuseppe Sinigaglia":"西尼加利亚球场","Groupama Arena":"格鲁帕马球场","Groupama Stadium":"格鲁帕马球场","Gtech Community Stadium":"Gtech社区球场",
    "Hard Rock Stadium":"硬石球场","Hill Dickinson Stadium":"希尔·迪金森球场","Home Deluxe Arena":"家园球场","Huanglong Sports Centre":"黄龙体育中心",
    "Jaber Al-Ahmad International Stadium":"贾比尔·艾哈迈德国际球场","Jan Breydel Stadium":"扬·布雷德尔球场","Jeonju World Cup Stadium":"全州世界杯球场",
    "Jinan Olympic Sports Center":"济南奥体中心","Jinan Olympic Sports Center Stadium":"济南奥体中心体育场","Johan Cruijff Arena":"约翰·克鲁伊夫竞技场",
    "John Smith's Stadium":"约翰·史密斯球场","Kai Tak Sports Park":"启德体育园","King Abdullah Sports City":"阿卜杜拉国王体育城",
    "La Beaujoire-Louis-Fonteneau":"博茹瓦尔球场","La Rosaleda":"玫瑰园球场","Lincoln Financial Field":"林肯金融球场","Liverpool Academy":"利物浦青训基地",
    "Liverpool Training Centre":"利物浦训练中心","London Stadium":"伦敦球场","Lotto Park":"乐透公园球场","Lumen Field":"流明球场","Mapei Stadium":"马贝球场",
    "McDonald Jones Stadium":"麦克唐纳·琼斯球场","Mendizorrotza":"门迪索罗萨球场","Mercedes-Benz Stadium":"梅赛德斯-奔驰球场","Mestalla Stadium":"梅斯塔利亚球场",
    "MetLife Stadium":"大都会球场","MEWA ARENA":"美瓦竞技场","MHPArena":"MHP竞技场","Millerntor-Stadion":"米勒门球场","Molineux Stadium":"莫利纽克斯球场",
    "Národny Futbalovy Stadión":"国家足球场","New Balance Arena":"新百伦球场","Nissan Stadium, Yokohama":"日产球场","Noevir Stadium Kobe":"诺艾维亚球场",
    "Old Trafford":"老特拉福德球场","Olimpico":"奥林匹克球场","Olympic Stadium Berlin":"柏林奥林匹克球场","OPAP Arena":"OPAP竞技场","Optus Stadium":"澳都斯球场",
    "Orange Vélodrome":"韦洛德罗姆球场","Parc des Princes":"王子公园球场","Pedro Escartín":"佩德罗·埃斯卡廷球场","Philips Stadion":"飞利浦球场",
    "Portman Road":"波特曼路球场","PreZero Arena":"普利泽罗球场","Principality Stadium":"公国球场","Puskás Aréna":"普斯卡什球场",
    "Qingdao West Coast University City Stadium":"青岛西海岸大学城体育场","Qingdao Youth Football Stadium":"青岛青春足球场","Raiffeisen Arena (Linz)":"莱夫艾森球场",
    "Ramón Sánchez Pizjuán Stadium":"拉蒙·桑切斯·皮斯胡安球场","Ramón Sánchez-Pizjuán":"拉蒙·桑切斯·皮斯胡安球场","RAMS Park":"拉姆斯公园",
    "RCDE Stadium":"西班牙人球场","Reale Arena":"皇家竞技场","Red Bull Arena":"红牛球场","Red Bull Arena Salzburg":"萨尔茨堡红牛球场","Renato Dall'Ara":"达拉拉球场",
    "Renzo Barbera":"巴尔贝拉球场","RheinEnergieStadion":"莱茵能源球场","Riazor":"里亚索球场","Riyadh Air Metropolitano":"大都会球场","Roazhon Park":"罗阿宗公园球场",
    "Rose Bowl":"玫瑰碗球场","SAIC Motor Pudong Arena":"上汽浦东足球场","San Mamés":"圣马梅斯球场","San Nicola":"圣尼古拉球场","San Siro":"圣西罗球场",
    "Santiago Bernabéu":"圣地亚哥·伯纳乌球场","Selhurst Park":"塞尔赫斯特公园球场","Seoul World Cup Stadium":"首尔世界杯球场","Shanghai Stadium":"上海体育场",
    "Shenzhen Stadium":"深圳体育场","Signal Iduna Park":"伊杜纳信号公园球场","Soldier Field":"士兵球场","Spotify Camp Nou":"诺坎普球场",
    "St. Andrew's Stadium":"圣安德鲁斯球场","St. Jakob Park":"圣雅各布公园球场","St. James' Park":"圣詹姆斯公园球场","Stade Bollaert-Delelis":"博莱尔-德勒利球场",
    "Stade de la Beaujoire":"博茹瓦尔球场","Stade de la Meinau":"梅诺球场","Stade de l'Abbé-Deschamps":"阿贝-德尚球场","Stade de l'Aube":"曙光球场",
    "Stade du Moustoir - Yves Allainmat":"穆斯图瓦球场","Stade Francis-Le Blé":"弗朗西斯·勒布莱球场","Stade Jean Bouin":"让·布安球场","Stade Louis II":"路易二世球场",
    "Stade Marie-Marvingt":"玛丽·马万球场","Stade Océane":"海洋球场","Stade Raymond Kopa":"雷蒙·科帕球场","Stade Saint-Symphorien":"圣桑福里安球场",
    "Stade Vélodrome":"韦洛德罗姆球场","Stadio Artemio Franchi":"弗兰基球场","Stadio Benito Stirpe":"贝尼托·斯蒂尔佩球场","Stadio Diego Armando Maradona":"马拉多纳球场",
    "Stadio Friuli":"弗留利球场","Stadio Giovanni Zini":"齐尼球场","Stadio Luigi Ferraris":"路易吉·费拉里斯球场","Stadio Marcantonio Bentegodi":"本特戈迪球场",
    "Stadio Olimpico Grande Torino":"都灵奥林匹克球场","Stadio Pier Luigi Penzo":"彭佐球场","Stadion An der Alten Försterei":"老林务所球场",
    "Stadion an der Bremer Brücke'":"不来梅桥球场","Stadion Letzigrund":"莱奇格伦德球场","Stadium de Toulouse":"图卢兹球场","Stadium Municipal de Toulouse":"图卢兹市政球场",
    "Stadium of Light":"光明球场","Stamford Bridge":"斯坦福桥球场","Steelyard Stadium":"钢铁厂球场","Şükrü Saracoğlu Stadium":"苏克鲁·萨拉科格鲁球场",
    "Sultan Ibrahim Stadium":"苏丹易卜拉欣球场","Swansea.com Stadium":"斯旺西球场","TEDA Football Stadium":"泰达足球场","The City Ground":"城市球场",
    "The MKM Stadium":"MKM球场","Tianjin Olympic Center Stadium":"天津奥体中心体育场","Tiexi New District Sports Centre":"铁西新区体育中心",
    "Tottenham Hotspur Stadium":"托特纳姆热刺球场","TQL Stadium":"TQL球场","Turf Moor":"图夫摩尔球场","Ullevi Stadium":"乌勒维球场",
    "Unipol Domus":"尤尼波尔多姆斯球场","U-Power Stadium":"U-Power球场","URSAPHARM-Arena an der Kaiserlinde":"凯撒林登球场","Veltins Arena":"费尔廷斯竞技场",
    "Via Del Mare":"海滨大道球场","Viking Stadion":"维京球场","Villa Park":"维拉公园球场","Vitality Stadium":"活力球场","Voith-Arena":"福伊特竞技场",
    "Volksparkstadion":"人民公园球场","Volkswagen Arena":"大众汽车竞技场","Wembley Stadium":"温布利球场","Weserstadion":"威悉球场",
    "Workers' Stadium":"北京工人体育场","Wuhan Sports Center Stadium":"武汉体育中心体育场","Wuhua Olympic Sports Center Huitang Stadium":"五华奥体中心惠堂体育场",
    "Wuliangye Sports Center Stadium":"五粮液体育中心体育场","WWK Arena":"WWK竞技场","Yankee Stadium":"洋基球场",
    "Yellow Dragon Sports Center Stadium":"黄龙体育中心体育场","Yuxi Plateau Sports Center Stadium":"玉溪高原体育运动中心体育场","Zhengzhou Hanghai Stadium":"郑州航海体育场","Almaty Ortalyk Stadium":"阿拉木图中央体育场","Estádio da Luz":"光明球场","Estadio Municipal de Anoeta":"阿诺埃塔球场","Estadio Municipal El Prado":"埃尔普拉多市政球场","Georgios Karaiskakis Stadium":"乔治亚斯·卡赖斯卡基斯球场","Tivoli Stadion Tirol":"蒂沃利球场",
};

/* 中文 → 英文 反查表（数据层双语） */
function invertMap(m){
  const r = {};
  Object.keys(m || {}).forEach(k => { const v = m[k]; if(v && !(v in r)) r[v] = k; });
  return r;
}
const EN_OF = {
  team: invertMap(Object.assign({}, oppCN, ZH.teams)),
  venue: invertMap(Object.assign({}, venueCN, ZH.venues)),
  country: invertMap(ZH.countries),
  city: invertMap(ZH.cities || {}),
  comp: invertMap(compCN),
  pos: { "门将":"Goalkeeper", "后卫":"Defender", "中场":"Midfielder", "前锋":"Forward", "球员":"Player", "其他":"Others" }
};
function enOfTeam(v){ return EN_OF.team[v] || v; }
function enOfVenue(v){ return EN_OF.venue[v] || v; }
function enOfCountry(v){ return EN_OF.country[v] || v; }
function enOfCity(v){ return EN_OF.city[v] || v; }
function enOfComp(v){ return EN_OF.comp[v] || v; }
function enOfPos(v){ return EN_OF.pos[v] || v; }

/* 数据取值：中文模式取中文字段，英文模式优先英文字段 */
function dTeam(o){ return isEN() ? (o.en || enOfTeam(o.name) || o.name) : (o.name || o.en); }
function dVenue(o){ return isEN() ? (o.venueEn || enOfVenue(o.venue) || o.venue) : (o.venue || o.venueEn); }
function dComp(v){ return isEN() ? enOfComp(v) : v; }
function dOpp(v){ return isEN() ? enOfTeam(v) : v; }
function dNat(v){ return isEN() ? enOfCountry(v) : v; }
function dPos(v){ return isEN() ? enOfPos(v) : v; }
function dVenueName(v){ return isEN() ? enOfVenue(v) : v; }

const LEAGUE_EN = { "英超":"Premier League", "西甲":"LaLiga", "德甲":"Bundesliga", "意甲":"Serie A", "法甲":"Ligue 1", "中超":"Chinese Super League" };
const LEAGUE_COUNTRY_EN = { "英格兰":"England", "西班牙":"Spain", "德国":"Germany", "意大利":"Italy", "法国":"France", "中国":"China" };
function dLeague(v){ return isEN() ? (LEAGUE_EN[v] || v) : v; }

function dCountryName(v){ return isEN() ? (LEAGUE_COUNTRY_EN[v] || enOfCountry(v)) : v; }
function dCityName(v){ return isEN() ? enOfCity(v) : v; }

/* Node 环境兜底：页面中 isEN() 由 js/i18n.js 提供（加载顺序 i18n → translator）；Node 下缺省中文 */
if (typeof isEN !== "function") { var isEN = function(){ return false; }; }

/* =========================================================
   组件封装：window.Translator（浏览器）/ module.exports（Node）
   ========================================================= */
const Translator = {
  dict: ZH, compCN: compCN, oppCN: oppCN, venueCN: venueCN, awardCN: awardCN,
  player: zhPlayer, team: zhTeam, venue: zhVenue, country: zhCountry, city: zhCity,
  enOfTeam: enOfTeam, enOfVenue: enOfVenue, enOfCountry: enOfCountry, enOfCity: enOfCity, enOfComp: enOfComp, enOfPos: enOfPos,
  dTeam: dTeam, dVenue: dVenue, dComp: dComp, dOpp: dOpp, dNat: dNat, dPos: dPos, dVenueName: dVenueName, dLeague: dLeague, dCountryName: dCountryName, dCityName: dCityName,
  stats: function(){
    return {
      players: Object.keys(ZH.players).length, teams: Object.keys(ZH.teams).length, venues: Object.keys(ZH.venues).length,
      countries: Object.keys(ZH.countries).length, cities: Object.keys(ZH.cities || {}).length, playersNat: Object.keys(ZH.playersNat || {}).length
    };
  },
  translit: function(name){
    if (typeof require !== "function") return { zh: name, src: "node-only" };
    const engine = require("./translator-translit.js");
    if (!Translator._tokenMap) {
      try { Translator._tokenMap = JSON.parse(require("fs").readFileSync(__dirname + "/../data/translit-token-map.json", "utf8")); }
      catch (e) { Translator._tokenMap = {}; }
    }
    return engine.translitName(name, Translator._tokenMap);
  }
};
if (typeof window !== "undefined") window.Translator = Translator;
if (typeof module !== "undefined" && module.exports) module.exports = Translator;
