/* 英文人名 → 中文音译引擎（规则音节表 + 词典词元复用）
   Node 专用模块（浏览器不加载）：被 Translator.translit() 懒加载，也供离线脚本 require。
   原 %TEMP%\opencode\translit-engine.js 迁入，代码逐字节保留。 */
"use strict";
// 英文人名 -> 中文音译（规则表 + 词典词元复用）
const SYL = {
  // 单独元音
  "a":"阿","e":"埃","i":"伊","o":"奥","u":"乌","y":"伊",
  "ai":"艾","au":"奥","ay":"艾","ea":"伊","ee":"伊","ei":"艾","eu":"欧","ew":"尤","ey":"伊","ie":"伊","io":"约","oa":"奥","oe":"厄","oi":"奥伊","oo":"乌","ou":"乌","ow":"奥","oy":"奥伊","ui":"伊","uy":"伊",
  "an":"安","en":"恩","in":"因","on":"昂","un":"温","am":"阿姆","em":"埃姆","im":"伊姆","om":"奥姆","um":"乌姆",
  "ar":"阿","er":"尔","ir":"伊尔","or":"奥","ur":"尔",
  "al":"阿尔","el":"埃尔","il":"伊尔","ol":"奥尔","ul":"乌尔",
  // b
  "ba":"巴","be":"贝","bi":"比","bo":"博","bu":"布","by":"比","bai":"拜","bay":"贝","ban":"班","ben":"本","bin":"宾","bon":"邦","bun":"本","bar":"巴","ber":"伯","bir":"伯","bor":"博","bur":"伯","bal":"巴尔","bel":"贝尔","bil":"比尔","bol":"博尔","bul":"布尔","boo":"布","bra":"布拉","bre":"布雷","bri":"布里","bro":"布罗","bru":"布鲁","bran":"布兰","bren":"布伦","brin":"布林","bron":"布龙","brun":"布伦","bla":"布拉","ble":"布莱","bli":"布利","blo":"布洛","blu":"布鲁",
  // c
  "ca":"卡","ce":"塞","ci":"西","co":"科","cu":"库","cy":"西","cai":"凯","cay":"凯","can":"坎","cen":"森","cin":"辛","con":"康","cun":"昆","car":"卡","cer":"塞","cir":"西尔","cor":"科","cur":"库","cal":"卡尔","cel":"塞尔","cil":"西尔","col":"科尔","cul":"库尔","cha":"查","che":"切","chi":"奇","cho":"乔","chu":"楚","chai":"柴","chan":"尚","chen":"琴","chin":"钦","chon":"琼","chun":"春","char":"查","cher":"谢尔","chir":"奇尔","chor":"乔尔","chur":"楚尔","ck":"克","sch":"施","sci":"西","sce":"塞",
  // d
  "da":"达","de":"德","di":"迪","do":"多","du":"杜","dy":"迪","dai":"戴","day":"戴","dan":"丹","den":"登","din":"丁","don":"东","dun":"敦","dar":"达尔","der":"德尔","dir":"迪尔","dor":"多尔","dur":"杜尔","dal":"达尔","del":"德尔","dil":"迪尔","dol":"多尔","dul":"杜尔","doo":"杜","dra":"德拉","dre":"德雷","dri":"德里","dro":"德罗","dru":"德鲁","dran":"德兰","dren":"德伦","drin":"德林","dron":"德龙","drun":"德伦",
  // f
  "fa":"法","fe":"费","fi":"菲","fo":"福","fu":"富","fy":"菲","fai":"法伊","fay":"费","fan":"范","fen":"芬","fin":"芬","fon":"丰","fun":"丰","far":"法","fer":"费尔","fir":"菲尔","for":"福","fur":"富尔","fal":"法尔","fel":"费尔","fil":"菲尔","fol":"福尔","ful":"富尔","foo":"富","fra":"弗拉","fre":"弗雷","fri":"弗里","fro":"弗罗","fru":"弗鲁","fran":"弗兰","fren":"弗伦","frin":"弗林","fron":"弗龙","frun":"弗伦","fla":"弗拉","fle":"弗莱","fli":"弗利","flo":"弗洛","flu":"弗卢","pha":"法","phe":"费","phi":"菲","pho":"福","phu":"富",
  // g
  "ga":"加","ge":"格","gi":"吉","go":"戈","gu":"古","gy":"吉","gai":"盖","gay":"盖","gan":"甘","gen":"根","gin":"金","gon":"贡","gun":"贡","gar":"加","ger":"格","gir":"吉尔","gor":"戈尔","gur":"古尔","gal":"加尔","gel":"格尔","gil":"吉尔","gol":"戈尔","gul":"古尔","gra":"格拉","gre":"格雷","gri":"格里","gro":"格罗","gru":"格鲁","gran":"格兰","gren":"格伦","grin":"格林","gron":"格龙","grun":"格伦","gla":"格拉","gle":"格莱","gli":"格利","glo":"格洛","glu":"格卢",
  // h
  "ha":"哈","he":"赫","hi":"希","ho":"霍","hu":"胡","hy":"希","hai":"海","hay":"海","han":"汉","hen":"亨","hin":"欣","hon":"洪","hun":"洪","har":"哈","her":"赫","hir":"希尔","hor":"霍","hur":"胡尔","hal":"哈尔","hel":"赫尔","hil":"希尔","hol":"霍尔","hul":"胡尔",
  // j
  "ja":"贾","je":"杰","ji":"吉","jo":"乔","ju":"朱","jy":"吉","jai":"杰","jay":"杰","jan":"詹","jen":"詹","jin":"金","jon":"琼","jun":"琼","jar":"贾尔","jer":"杰尔","jir":"吉尔","jor":"乔尔","jur":"朱尔","jal":"贾尔","jel":"杰尔","jil":"吉尔","jol":"乔尔","jul":"朱尔",
  // k
  "ka":"卡","ke":"克","ki":"基","ko":"科","ku":"库","ky":"基","kai":"凯","kay":"凯","kan":"坎","ken":"肯","kin":"金","kon":"孔","kun":"昆","kar":"卡尔","ker":"克尔","kir":"基尔","kor":"科尔","kur":"库尔","kal":"卡尔","kel":"克尔","kil":"基尔","kul":"库尔","kwa":"夸","kwe":"奎","kwi":"奎","kwo":"阔","kwu":"库","kra":"克拉","kre":"克雷","kri":"克里","kro":"克罗","kru":"克鲁","kla":"克拉","kle":"克莱","kli":"克利","klo":"克洛","klu":"克卢",
  // l
  "la":"拉","le":"勒","li":"利","lo":"洛","lu":"卢","ly":"利","lai":"莱","lay":"莱","lan":"兰","len":"伦","lin":"林","lon":"隆","lun":"伦","lar":"拉尔","ler":"勒","lir":"利尔","lor":"洛尔","lur":"卢尔","lal":"拉尔","lel":"勒尔","lil":"利尔","lol":"洛尔","lul":"卢尔","loo":"卢",
  // m
  "ma":"马","me":"梅","mi":"米","mo":"莫","mu":"穆","my":"米","mai":"迈","may":"梅","man":"曼","men":"门","min":"明","mon":"蒙","mun":"蒙","mar":"马","mer":"默","mir":"米尔","mor":"莫尔","mur":"穆尔","mal":"马尔","mel":"梅尔","mil":"米尔","mol":"莫尔","mul":"穆尔","moo":"穆","mc":"麦克","mac":"麦克",
  // n
  "na":"纳","ne":"内","ni":"尼","no":"诺","nu":"努","ny":"尼","nai":"奈","nay":"奈","nan":"南","nen":"嫩","nin":"宁","non":"农","nun":"农","nar":"纳尔","ner":"内尔","nir":"尼尔","nor":"诺尔","nur":"努尔","nal":"纳尔","nel":"内尔","nil":"尼尔","nol":"诺尔","nul":"努尔","noo":"努",
  // p
  "pa":"帕","pe":"佩","pi":"皮","po":"波","pu":"普","py":"皮","pai":"派","pay":"佩","pan":"潘","pen":"彭","pin":"平","pon":"蓬","pun":"蓬","par":"帕尔","per":"珀","pir":"皮尔","por":"波尔","pur":"普尔","pal":"帕尔","pel":"佩尔","pil":"皮尔","pol":"波尔","pul":"普尔","pra":"普拉","pre":"普雷","pri":"普里","pro":"普罗","pru":"普鲁","pla":"普拉","ple":"普莱","pli":"普利","plo":"普洛","plu":"普卢",
  // q
  "qua":"夸","que":"克","qui":"基","quo":"阔",
  // r
  "ra":"拉","re":"雷","ri":"里","ro":"罗","ru":"鲁","ry":"里","rai":"赖","ray":"雷","ran":"兰","ren":"伦","rin":"林","ron":"龙","run":"伦","rar":"拉尔","rer":"雷尔","rir":"里尔","ror":"罗尔","rur":"鲁尔","ral":"拉尔","rel":"雷尔","ril":"里尔","rol":"罗尔","rul":"鲁尔","roo":"鲁",
  // s
  "sa":"萨","se":"塞","si":"西","so":"索","su":"苏","sy":"西","sai":"赛","say":"赛","san":"桑","sen":"森","sin":"辛","son":"森","sun":"桑","sar":"萨","ser":"塞尔","sir":"西尔","sor":"索尔","sur":"苏尔","sal":"萨尔","sel":"塞尔","sil":"西尔","sol":"索尔","sul":"苏尔","sha":"沙","she":"谢","shi":"希","sho":"肖","shu":"舒","shan":"尚","shen":"申","shin":"欣","shon":"肖恩","shun":"顺","sla":"斯拉","sle":"斯莱","sli":"斯利","slo":"斯洛","slu":"斯卢","spa":"斯帕","spe":"斯佩","spi":"斯皮","spo":"斯波","spu":"斯普","sta":"斯塔","ste":"斯特","sti":"斯蒂","sto":"斯托","stu":"斯图","stra":"斯特拉","stre":"斯特雷","stri":"斯特里","stro":"斯特罗","stru":"斯特鲁","tha":"萨","the":"特","thi":"蒂","tho":"托","thu":"图",
  // t
  "ta":"塔","te":"特","ti":"蒂","to":"托","tu":"图","ty":"蒂","tai":"泰","tay":"泰","tan":"坦","ten":"滕","tin":"廷","ton":"顿","tun":"通","tar":"塔","ter":"特","tir":"蒂尔","tor":"托尔","tur":"图尔","tal":"塔尔","tel":"特尔","til":"蒂尔","tol":"托尔","tul":"图尔","too":"图","tra":"特拉","tre":"特雷","tri":"特里","tro":"特罗","tru":"特鲁","tran":"特兰","tren":"特伦","trin":"特林","tron":"特龙","trun":"特伦",
  // v
  "va":"瓦","ve":"韦","vi":"维","vo":"沃","vu":"武","vy":"维","vai":"瓦伊","vay":"韦","van":"范","ven":"文","vin":"温","von":"冯","vun":"文","var":"瓦尔","ver":"韦尔","vir":"维尔","vor":"沃尔","vur":"武尔","val":"瓦尔","vel":"韦尔","vil":"维尔","vol":"沃尔","vul":"武尔",
  // w
  "wa":"瓦","we":"韦","wi":"威","wo":"沃","wu":"伍","wy":"威","wai":"怀","way":"韦","wan":"万","wen":"温","win":"温","won":"翁","wun":"温","war":"瓦尔","wer":"韦尔","wir":"维尔","wor":"沃","wur":"伍尔","wal":"瓦尔","wel":"韦尔","wil":"威尔","wol":"沃尔","wul":"伍尔","wh":"沃",
  // x
  "xa":"克萨","xe":"克塞","xi":"克西","xo":"克索","xu":"克苏",
  // y
  "ya":"亚","ye":"耶","yi":"伊","yo":"约","yu":"尤","yy":"伊","yai":"亚伊","yay":"耶","yan":"扬","yen":"延","yin":"因","yon":"扬","yun":"云","yar":"亚尔","yer":"耶尔","yir":"伊尔","yor":"约尔","yur":"尤尔","yal":"亚尔","yel":"耶尔","yil":"伊尔","yol":"约尔","yul":"尤尔",
  // z
  "za":"扎","ze":"泽","zi":"齐","zo":"佐","zu":"祖","zy":"齐","zai":"扎伊","zay":"泽","zan":"赞","zen":"曾","zin":"津","zon":"宗","zun":"尊","zar":"扎尔","zer":"泽尔","zir":"齐尔","zor":"佐尔","zur":"祖尔","zal":"扎尔","zel":"泽尔","zil":"齐尔","zol":"佐尔","zul":"祖尔",
  // 尾音
  "ez":"斯","dez":"德斯","tez":"特斯","nez":"内斯","lez":"莱斯","rez":"雷斯","vez":"维斯","sez":"塞斯","es":"斯","os":"奥斯","us":"乌斯","is":"伊斯","as":"阿斯","ys":"伊斯","az":"亚斯","iz":"伊斯","oz":"奥斯","uz":"乌斯",
  "ama":"阿马","sala":"萨拉","mou":"穆","cci":"奇","osa":"奥萨","mbe":"姆贝","llo":"洛","dia":"迪亚","chez":"切斯","guez":"格斯","llez":"莱斯","rrez":"雷斯","tcha":"查",
  "ster":"斯特","erik":"埃里克","fana":"法纳","pelle":"佩莱","lom":"隆","leo":"莱奥","lera":"莱拉","tiago":"蒂亚戈","cala":"卡拉","ale":"阿莱","quez":"克斯","vaz":"巴斯","gue":"盖",
  "vale":"瓦莱","colom":"科隆","dou":"杜","bou":"布","liou":"利乌","ina":"伊纳",
  "aaron":"阿隆","iel":"尼尔","ryl":"里尔","feli":"费利","rera":"雷拉","mari":"马里","mau":"毛","rome":"罗梅","ilic":"伊利奇",
  "son":"森","sen":"森","sson":"松","ton":"顿","ley":"利","ly":"利","ford":"福德","berg":"伯格","burg":"堡","stein":"斯坦","mann":"曼","land":"兰","field":"菲尔德","wood":"伍德","worth":"沃思","ing":"英","ington":"英顿","ell":"尔","ett":"特","itt":"特","ott":"奥特","ock":"奥克","ick":"伊克","ack":"阿克","eck":"埃克","ich":"伊奇","ovich":"奥维奇","evic":"埃维奇","ovic":"奥维奇","ic":"伊奇","ak":"阿克","ik":"伊克","ok":"奥克","uk":"乌克","ek":"埃克",
  "k":"克","t":"特","p":"普","d":"德","g":"格","m":"姆","n":"恩","l":"尔","r":"尔","s":"斯","x":"克斯","z":"兹","f":"夫","v":"夫","b":"布","c":"克","h":"赫","j":"杰","q":"克","w":"沃"
};
const PARTICLES = new Set(["van","von","de","da","di","del","della","der","den","dos","du","la","le","ter","ten","op","el","al","st","mac","mc"]);
const PINYIN_SURNAME = {
  wang:"王",li:"李",zhang:"张",liu:"刘",chen:"陈",yang:"杨",huang:"黄",zhao:"赵",wu:"吴",zhou:"周",xu:"徐",sun:"孙",ma:"马",zhu:"朱",hu:"胡",guo:"郭",he:"何",gao:"高",lin:"林",luo:"罗",zheng:"郑",liang:"梁",xie:"谢",song:"宋",tang:"唐",han:"韩",feng:"冯",deng:"邓",cao:"曹",peng:"彭",zeng:"曾",xiao:"肖",tian:"田",dong:"董",pan:"潘",yuan:"袁",cai:"蔡",jiang:"蒋",yu:"于",du:"杜",ye:"叶",cheng:"程",su:"苏",wei:"魏",lu:"卢",ding:"丁",ren:"任",yao:"姚",shen:"沈",zhong:"钟",cui:"崔",tan:"谭",fan:"范",shi:"石",jin:"金",liao:"廖",fang:"方",zou:"邹",xiong:"熊",bai:"白",meng:"孟",qin:"秦",qiu:"邱",hou:"侯",long:"龙",duan:"段",lei:"雷",qian:"钱",yin:"尹",xue:"薛",yan:"严",wen:"温",niu:"牛",hong:"洪",gong:"龚",weng:"翁",shao:"邵",wan:"万",gu:"顾",mo:"莫",kong:"孔",xiang:"项",an:"安",chang:"常",kang:"康",mao:"毛",dai:"戴",xia:"夏",mi:"米",pei:"裴",sui:"隋",ji:"纪",lan:"蓝",min:"闵",jiu:"酒",zhan:"詹",zuo:"左",gan:"甘",bao:"包",ning:"宁",qiang:"强",sang:"桑",sui:"隋",tong:"佟",weng:"翁",yin:"殷",yu:"俞",zhai:"翟",zhan:"詹",zhen:"甄",zhi:"支",zhuo:"卓",zong:"宗",zu:"祖"
};
const PINYIN_GIVEN = {
  an:"安",bao:"宝",bin:"斌",bing:"冰",bo:"博",cai:"才",chang:"昌",chao:"超",chen:"晨",cheng:"成",chi:"驰",chong:"冲",chuan:"川",chun:"春",cong:"聪",dan:"丹",dao:"道",de:"德",deng:"登",dong:"东",fa:"发",fan:"凡",fang:"方",fei:"飞",feng:"峰",fu:"福",gang:"刚",gao:"高",gen:"根",gong:"功",guang:"光",gui:"贵",guo:"国",hai:"海",han:"涵",hang:"航",hao:"浩",he:"贺",hong:"宏",hua:"华",huai:"怀",huan:"欢",hui:"辉",ji:"吉",jia:"佳",jian:"健",jiang:"江",jie:"杰",jin:"金",jing:"静",ju:"举",jun:"军",kai:"凯",kang:"康",ke:"可",kui:"奎",kun:"坤",lai:"来",lan:"兰",lei:"磊",li:"力",liang:"亮",lin:"林",ling:"玲",long:"龙",lu:"路",luo:"罗",man:"曼",mao:"茂",mei:"美",meng:"蒙",ming:"明",nan:"楠",ning:"宁",peng:"鹏",ping:"平",qi:"奇",qian:"谦",qiang:"强",qin:"琴",qing:"清",qiu:"秋",quan:"全",ran:"然",rong:"荣",rui:"睿",run:"润",shan:"山",shang:"尚",shao:"少",sheng:"胜",shi:"石",shu:"书",shuang:"爽",si:"思",song:"松",tao:"涛",teng:"腾",tian:"天",ting:"婷",tong:"通",wei:"伟",wen:"文",wu:"武",xi:"希",xia:"霞",xian:"贤",xiang:"祥",xiao:"晓",xin:"鑫",xing:"星",xiong:"雄",xiu:"秀",xu:"旭",xuan:"轩",xue:"雪",ya:"雅",yan:"岩",yang:"阳",yao:"耀",ye:"烨",yi:"毅",yin:"寅",ying:"英",yong:"勇",you:"友",  yu:"宇",yuan:"源",yue:"悦",yun:"云",zan:"赞",ze:"泽",zeng:"增",zhan:"展",zhang:"章",zhao:"昭",zhe:"哲",zhen:"振",zheng:"正",zhi:"志",zhong:"忠",zhou:"洲",zhu:"竹",zi:"子",zong:"宗",zuo:"佐",shuai:"帅",zhuang:"壮",chuan:"川",huan:"焕",kai:"恺",kun:"昆",miao:"淼",ru:"如",tian:"田",wan:"万",xin:"新",yan:"彦",yuan:"元",le:"乐",tao:"涛",hao:"浩",qi:"奇",shu:"书",yi:"艺",jie:"杰",yong:"勇",jun:"俊",wei:"伟",ming:"明",hua:"华",liang:"亮",gang:"刚",bo:"博",peng:"鹏",fei:"飞",long:"龙",hui:"辉",bin:"斌",ning:"宁",jing:"静",kai:"凯",cheng:"成",xin:"鑫",
  wang:"旺",pei:"培",chuang:"创",mo:"墨",shen:"申",xun:"勋",qiao:"桥",su:"苏",sen:"森",geng:"耕",chu:"楚",min:"敏",heng:"恒",liu:"柳",ge:"戈",shun:"顺",nong:"农",ding:"鼎",ao:"奥",xian:"贤",gui:"贵",rui:"睿",da:"达",jia:"嘉",lun:"伦"
};

function translitWord(word) {
  let w = String(word).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (w.indexOf("o'") === 0) return "奥" + translitWord(w.slice(2));
  w = w.replace(/[^a-z]/g, "");
  if (!w) return "";
  w = w.replace(/([bcdfghjklmnpqrstvwxyz])\1/g, "$1");
  let out = "", i = 0, guard = 0;
  while (i < w.length && guard++ < 40) {
    let matched = false;
    for (let len = Math.min(6, w.length - i); len >= 1; len--) {
      const ch = w.substr(i, len);
      if (SYL[ch]) { out += SYL[ch]; i += len; matched = true; break; }
    }
    if (!matched) i++;
  }
  return out;
}

function buildTokenMap(dictPlayers) {
  const map = {};
  Object.entries(dictPlayers).forEach(([en, zh]) => {
    if (!/[\u4e00-\u9fa5]/.test(zh)) return;
    const et = en.replace(/\s*\(.*?\)\s*/g, "").trim().split(/\s+/);
    const zt = zh.split("·");
    if (et.length === zt.length && et.length > 1) et.forEach((t, i) => { const k = t.toLowerCase(); if (!map[k]) map[k] = zt[i]; });
    else if (et.length === 1 && zt.length === 1) { const k = et[0].toLowerCase(); if (!map[k]) map[k] = zt[0]; }
  });
  return map;
}

const PINYIN_SYL = new Set(("a ai an ang ao ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu ca cai can cang cao ce cen ceng cha chai chan chang chao che chen cheng chi chong chou chu chuan chuang chui chun chuo ci cong cou cu cuan cui cun cuo da dai dan dang dao de deng di dian diao die ding diu dong dou du duan dui dun duo e ei en eng er fa fan fang fei fen feng fo fou fu ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun ka kai kan kang kao ke ken keng kong kou ku kua kuai kuan kuang kui kun kuo la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu long lou lu luan lun luo ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nuo ou pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun ran rang rao re ren reng ri rong rou ru ruan rui run ruo sa sai san sang sao se sen seng sha shai shan shang shao she shen sheng shi shou shu shua shuai shuan shuang shui shun shuo si song sou su suan sui sun suo ta tai tan tang tao te teng ti tian tiao tie ting tong tou tu tuan tui tun tuo wa wai wan wang wei wen weng wo wu xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun ya yan yang yao ye yi yin ying yo yong you yu yuan yue yun za zai zan zang zao ze zei zen zeng zha zhai zhan zhang zhao zhe zhen zheng zhi zhong zhou zhu zhuan zhuang zhui zhun zhuo zi zong zou zu zuan zui zun zuo").split(" "));
function splitPinyin(s) {
  const splits = [];
  (function rec(i, acc) {
    if (splits.length > 64) return;
    if (i === s.length) { splits.push(acc.slice()); return; }
    for (let len = Math.min(6, s.length - i); len >= 1; len--) {
      const c = s.substr(i, len);
      if (PINYIN_SYL.has(c)) { acc.push(c); rec(i + len, acc); acc.pop(); }
    }
  })(0, []);
  if (!splits.length) return null;
  let best = splits[0], bestScore = -1;
  for (const sp of splits) {
    const score = sp.filter(x => PINYIN_GIVEN[x] !== undefined).length;
    if (score > bestScore) { bestScore = score; best = sp; }
  }
  return best;
}
function isChinesePinyin(name) {
  const t = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (t.length < 2 || t.length > 3) return false;
  if (!t.every(x => /^[a-z]+$/.test(x))) return false;
  return !!(PINYIN_SURNAME[t[0]] || PINYIN_SURNAME[t[t.length - 1]]);
}
const SURNAME_RANK = { "王":1,"李":2,"张":3,"刘":4,"陈":5,"杨":6,"黄":7,"赵":8,"吴":9,"周":10,"徐":11,"孙":12,"马":13,"朱":14,"胡":15,"郭":16,"何":17,"高":18,"林":19,"罗":20,"郑":21,"梁":22,"谢":23,"宋":24,"唐":25,"许":26,"韩":27,"冯":28,"邓":29,"曹":30,"彭":31,"曾":32,"肖":33,"田":34,"董":35,"潘":36,"袁":37,"蔡":38,"蒋":39,"余":40,"于":41,"杜":42,"叶":43,"程":44,"苏":45,"魏":46,"丁":48,"任":49,"沈":50,"姚":51,"卢":52,"姜":53,"崔":54,"钟":55,"谭":56,"陆":57,"汪":58,"范":59,"金":60,"石":61,"廖":62,"贾":63,"夏":64,"韦":65,"方":67,"白":68,"邹":69,"孟":70,"熊":71,"秦":72,"邱":73,"江":74,"尹":75,"薛":76,"段":78,"雷":79,"侯":80,"龙":81,"史":82,"陶":83,"黎":84,"贺":85,"顾":86,"毛":87,"龚":89,"邵":90,"万":91,"钱":92,"严":93,"洪":96,"武":97,"莫":98,"孔":99 };
function tryPinyinOrder(surPinyin, givenParts) {
  const sur = PINYIN_SURNAME[surPinyin];
  if (!sur) return null;
  const syls = [];
  for (const part of givenParts) { const s = splitPinyin(part); if (!s) return null; syls.push(...s); }
  let given = "";
  for (const s of syls) { const ch = PINYIN_GIVEN[s]; if (!ch) return null; given += ch; }
  return { name: sur + given, sur };
}
function pinyinName(name) {
  const t = name.toLowerCase().split(/\s+/);
  const a = tryPinyinOrder(t[0], t.slice(1));
  const b = tryPinyinOrder(t[t.length - 1], t.slice(0, -1));
  if (a && b) return (SURNAME_RANK[a.sur] || 200) <= (SURNAME_RANK[b.sur] || 200) ? a.name : b.name;
  const r = a || b;
  return r ? r.name : null;
}

function translitName(name, tokenMap) {
  const clean = name.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (isChinesePinyin(clean)) {
    const p = pinyinName(clean);
    return p ? { zh: p, src: "pinyin" } : { zh: clean, src: "pinyin-skip" };
  }
  const tokens = clean.split(/\s+/);
  const parts = tokens.map(tk => {
    if (/-/.test(tk)) return tk.split("-").map(x => translitName(x, tokenMap).zh).join("-");
    const key = tk.toLowerCase();
    if (tokenMap[key]) return tokenMap[key];
    const r = translitWord(tk);
    return r || tk;
  });
  let out = "";
  parts.forEach((p, i) => {
    if (i === 0) { out = p; return; }
    const prev = tokens[i - 1].toLowerCase(), cur = tokens[i].toLowerCase();
    if (PARTICLES.has(prev) || PARTICLES.has(cur)) out += p;
    else out += "·" + p;
  });
  if (/[A-Za-z]/.test(out)) return { zh: out, src: "partial" };
  return { zh: out, src: "rule" };
}

module.exports = { translitName, translitWord, buildTokenMap, isChinesePinyin, pinyinName };
