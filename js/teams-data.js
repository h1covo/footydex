/* 精选 8 队人工资料（纯数据；页面统一模板与首页共用） */
"use strict";
/* =========================================================
   数据区（示例数据）
   ========================================================= */
const TEAMS = [
  /* ---------------- 曼城 ---------------- */
  {
    id:"mancity", name:"曼彻斯特城", short:"曼城", en:"Manchester City FC", initials:"MCI",
    founded:1880, league:"英超", country:"英格兰", city:"曼彻斯特", colors:["#6CABDD","#1C2C5B"],
    desc:"曼彻斯特城足球俱乐部成立于1880年，是英格兰足坛近年最具统治力的球队之一。2008年被阿布扎比财团收购后迅速崛起，在瓜迪奥拉执教下以极致的传控与压迫足球著称，2022-23赛季成就英超、足总杯、欧冠三冠王伟业。",
    stadium:{
      name:"伊蒂哈德球场", en:"Etihad Stadium", capacity:53400, opened:2002, pitch:"105m × 68m",
      address:"Etihad Campus, Ashton New Rd, Manchester M11 3FF, 英格兰",addressEn:"Etihad Campus, Ashton New Rd, Manchester M11 3FF, England",
      lat:53.4831, lon:-2.2004,
      desc:"伊蒂哈德球场坐落于曼彻斯特东部伊蒂哈德园区，2002年启用，最初为2002年英联邦运动会而建，后成为曼城主场。球场看台紧贴草皮，氛围热烈，北看台与南看台常被主队球迷占据。"
    },
    players:[
      {no:31,name:"埃德森",pos:"门将",nat:"巴西",ap:34,lg:0,cp:0,as:1},
      {no:18,name:"奥尔特加",pos:"门将",nat:"德国",ap:6,lg:0,cp:0,as:0},
      {no:27,name:"努里",pos:"后卫",nat:"阿尔及利亚",ap:28,lg:1,cp:0,as:4},
      {no:3,name:"鲁本·迪亚斯",pos:"后卫",nat:"葡萄牙",ap:30,lg:1,cp:0,as:2},
      {no:24,name:"格瓦迪奥尔",pos:"后卫",nat:"克罗地亚",ap:33,lg:4,cp:1,as:3},
      {no:25,name:"阿坎吉",pos:"后卫",nat:"瑞士",ap:26,lg:1,cp:0,as:1},
      {no:45,name:"胡桑诺夫",pos:"后卫",nat:"乌兹别克斯坦",ap:18,lg:0,cp:0,as:1},
      {no:16,name:"罗德里",pos:"中场",nat:"西班牙",ap:28,lg:6,cp:1,as:8},
      {no:20,name:"伯纳多·席尔瓦",pos:"中场",nat:"葡萄牙",ap:32,lg:4,cp:1,as:7},
      {no:4,name:"赖因德斯",pos:"中场",nat:"荷兰",ap:31,lg:5,cp:2,as:6},
      {no:10,name:"谢尔基",pos:"中场",nat:"法国",ap:28,lg:4,cp:2,as:8},
      {no:8,name:"科瓦契奇",pos:"中场",nat:"克罗地亚",ap:20,lg:3,cp:0,as:3},
      {no:47,name:"福登",pos:"前锋",nat:"英格兰",ap:30,lg:10,cp:3,as:6},
      {no:9,name:"哈兰德",pos:"前锋",nat:"挪威",ap:33,lg:27,cp:4,as:5},
      {no:7,name:"马尔穆什",pos:"前锋",nat:"埃及",ap:27,lg:8,cp:3,as:4},
      {no:11,name:"多库",pos:"前锋",nat:"比利时",ap:26,lg:4,cp:1,as:9}
    ],
    legends:[
      {name:"塞尔吉奥·阿圭罗",en:"Sergio Agüero",period:"2011–2021",ap:390,goals:260,lg:184,cp:26,as:74,
       honors:"5×英超冠军、1×足总杯；2011-12赛季补时绝杀助球队首夺英超，曼城队史射手王（260球）",honorsEn:"5× Premier League, 1× FA Cup; his stoppage-time winner in 2011-12 sealed the club's first Premier League title — City's all-time top scorer (260 goals)"},
      {name:"大卫·席尔瓦",en:"David Silva",period:"2010–2020",ap:436,goals:77,lg:60,cp:9,as:140,
       honors:"4×英超冠军、2×足总杯；西班牙世界杯与欧洲杯冠军成员，被誉为英超最优雅的组织者之一",honorsEn:"4× Premier League, 2× FA Cup; a World Cup and European Championship winner with Spain, regarded as one of the Premier League's most elegant playmakers"},
      {name:"文森特·孔帕尼",en:"Vincent Kompany",period:"2008–2019",ap:360,goals:20,lg:18,cp:2,as:10,
       honors:"4×英超冠军、2×足总杯；铁血队长，2018-19赛季对莱斯特城的关键远射成为夺冠转折点",honorsEn:"4× Premier League, 2× FA Cup; the fearless captain whose long-range strike against Leicester in 2018-19 proved the turning point of the title race"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"英格兰顶级联赛 / 英超",nameEn:"English top flight / Premier League",count:10,years:"1937、1968、2012、2014、2018、2019、2021、2022、2023、2024"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"足总杯",nameEn:"FA Cup",count:7,years:"1904、1934、1956、1969、2011、2019、2023"},
        {name:"英格兰联赛杯",nameEn:"EFL Cup",count:8,years:"1970、1976、2014、2016、2018、2019、2020、2021"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:1,years:"2023"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:1,years:"2023"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际足联世俱杯",nameEn:"FIFA Club World Cup",count:1,years:"2023"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"英超",opp:"曼联",home:true,gf:3,ga:1},
      {date:"2026-08-30",comp:"英超",opp:"布莱顿",home:false,gf:2,ga:2},
      {date:"2026-08-23",comp:"英超",opp:"热刺",home:true,gf:4,ga:0},
      {date:"2026-08-16",comp:"英超",opp:"纽卡斯尔",home:false,gf:1,ga:2},
      {date:"2026-05-24",comp:"英超",opp:"富勒姆",home:false,gf:2,ga:0},
      {date:"2026-05-17",comp:"英超",opp:"伯恩茅斯",home:true,gf:3,ga:1},
      {date:"2026-05-10",comp:"英超",opp:"埃弗顿",home:false,gf:1,ga:1},
      {date:"2026-05-03",comp:"英超",opp:"水晶宫",home:true,gf:5,ga:2},
      {date:"2026-04-26",comp:"英超",opp:"阿斯顿维拉",home:false,gf:0,ga:1},
      {date:"2026-04-19",comp:"英超",opp:"西汉姆",home:true,gf:2,ga:0}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"英超",opp:"阿森纳",home:false,time:"23:30",stadium:"酋长球场"},
      {date:"2026-09-24",comp:"联赛杯",opp:"米德尔斯堡",home:true,time:"02:45",stadium:"伊蒂哈德球场"},
      {date:"2026-09-27",comp:"英超",opp:"切尔西",home:true,time:"21:00",stadium:"伊蒂哈德球场"},
      {date:"2026-10-03",comp:"英超",opp:"纽卡斯尔",home:true,time:"22:00",stadium:"伊蒂哈德球场"},
      {date:"2026-10-18",comp:"英超",opp:"埃弗顿",home:false,time:"00:30",stadium:"希尔·迪金森球场"},
      {date:"2026-10-25",comp:"英超",opp:"狼队",home:true,time:"22:00",stadium:"伊蒂哈德球场"},
      {date:"2026-11-01",comp:"英超",opp:"热刺",home:false,time:"01:30",stadium:"热刺球场"},
      {date:"2026-11-08",comp:"英超",opp:"利物浦",home:true,time:"00:30",stadium:"伊蒂哈德球场"},
      {date:"2026-11-22",comp:"英超",opp:"布伦特福德",home:false,time:"22:00",stadium:"社区球场"},
      {date:"2026-12-06",comp:"英超",opp:"阿斯顿维拉",home:true,time:"23:00",stadium:"伊蒂哈德球场"},
      {date:"2027-01-03",comp:"英超",opp:"阿森纳",home:true,time:"00:30",stadium:"伊蒂哈德球场"},
      {date:"2027-02-14",comp:"英超",opp:"切尔西",home:false,time:"22:00",stadium:"斯坦福桥"}
    ]
  },

  /* ---------------- 利物浦 ---------------- */
  {
    id:"liverpool", name:"利物浦", short:"利物浦", en:"Liverpool FC", initials:"LIV",
    founded:1892, league:"英超", country:"英格兰", city:"利物浦", colors:["#C8102E","#00B2A9"],
    desc:"利物浦足球俱乐部成立于1892年，是英格兰历史上最成功的俱乐部之一。安菲尔德的《你永远不会独行》闻名世界，球队在2019-20赛季时隔30年重夺英格兰顶级联赛冠军，并于2019年第六次捧起欧冠奖杯。",
    stadium:{
      name:"安菲尔德球场", en:"Anfield", capacity:61276, opened:1884, pitch:"101m × 68m",
      address:"Anfield Rd, Liverpool L4 0TH, 英格兰",addressEn:"Anfield Rd, Liverpool L4 0TH, England",
      lat:53.4308, lon:-2.9608,
      desc:"安菲尔德球场自1892年起便是利物浦的主场，主看台与新建的安菲尔德路看台可容纳超过6万人。科普看台（Kop）是球队死忠球迷的聚集地，赛前齐唱队歌的场面举世闻名。"
    },
    players:[
      {no:1,name:"阿利松",pos:"门将",nat:"巴西",ap:35,lg:0,cp:0,as:1},
      {no:25,name:"马马尔达什维利",pos:"门将",nat:"格鲁吉亚",ap:5,lg:0,cp:0,as:0},
      {no:4,name:"范戴克",pos:"后卫",nat:"荷兰",ap:35,lg:3,cp:0,as:2},
      {no:5,name:"科纳特",pos:"后卫",nat:"法国",ap:29,lg:1,cp:0,as:1},
      {no:6,name:"凯尔凯兹",pos:"后卫",nat:"匈牙利",ap:30,lg:0,cp:0,as:4},
      {no:30,name:"弗林蓬",pos:"后卫",nat:"荷兰",ap:27,lg:1,cp:0,as:5},
      {no:38,name:"赫拉芬贝赫",pos:"中场",nat:"荷兰",ap:32,lg:1,cp:1,as:3},
      {no:10,name:"麦卡利斯特",pos:"中场",nat:"阿根廷",ap:33,lg:5,cp:1,as:6},
      {no:8,name:"索博斯洛伊",pos:"中场",nat:"匈牙利",ap:34,lg:6,cp:2,as:7},
      {no:17,name:"柯蒂斯·琼斯",pos:"中场",nat:"英格兰",ap:24,lg:2,cp:1,as:3},
      {no:11,name:"萨拉赫",pos:"前锋",nat:"埃及",ap:35,lg:24,cp:3,as:15},
      {no:9,name:"伊萨克",pos:"前锋",nat:"瑞典",ap:28,lg:12,cp:2,as:3},
      {no:7,name:"维尔茨",pos:"前锋",nat:"德国",ap:30,lg:9,cp:3,as:10},
      {no:18,name:"加克波",pos:"前锋",nat:"荷兰",ap:31,lg:9,cp:2,as:5},
      {no:14,name:"基耶萨",pos:"前锋",nat:"意大利",ap:18,lg:3,cp:1,as:2}
    ],
    legends:[
      {name:"史蒂文·杰拉德",en:"Steven Gerrard",period:"1998–2015",ap:710,goals:186,lg:120,cp:21,as:96,
       honors:"2005年伊斯坦布尔奇迹欧冠冠军、2×足总杯、3×联赛杯；利物浦队史最伟大队长之一",honorsEn:"2005 Champions League winner in Istanbul, 2× FA Cup, 3× League Cup; one of the greatest captains in Liverpool's history"},
      {name:"肯尼·达格利什",en:"Kenny Dalglish",period:"1977–1990",ap:515,goals:172,lg:118,cp:24,as:80,
       honors:"3×欧冠冠军、6×英格兰联赛冠军；球员兼主帅时期带领球队度过希尔斯堡后的艰难岁月",honorsEn:"3× European Cup, 6× English league titles; as player-manager he led the club through the difficult years after Hillsborough"},
      {name:"伊恩·拉什",en:"Ian Rush",period:"1980–1987 / 1988–1996",ap:660,goals:346,lg:229,cp:48,as:60,
       honors:"利物浦队史射手王（346球）、5×联赛冠军、2×欧冠冠军",honorsEn:"Liverpool's all-time top scorer (346 goals), 5× league champion, 2× European Cup winner"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"英格兰顶级联赛",nameEn:"English top flight",count:19,years:"1901、1906、1922、1923、1947、1964、1966、1973、1976、1977、1979、1980、1982、1983、1984、1986、1988、1990、2020"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"足总杯",nameEn:"FA Cup",count:8,years:"1965、1974、1986、1989、1992、2001、2006、2022"},
        {name:"英格兰联赛杯",nameEn:"EFL Cup",count:10,years:"1981、1982、1983、1984、1995、2001、2003、2012、2022、2024"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:6,years:"1977、1978、1981、1984、2005、2019"},
        {name:"欧洲联盟杯",nameEn:"UEFA Cup",count:3,years:"1973、1976、2001"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:4,years:"1977、2001、2005、2019"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际足联世俱杯",nameEn:"FIFA Club World Cup",count:1,years:"2019"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"英超",opp:"埃弗顿",home:true,gf:2,ga:1},
      {date:"2026-08-30",comp:"英超",opp:"纽卡斯尔",home:false,gf:3,ga:2},
      {date:"2026-08-23",comp:"英超",opp:"阿森纳",home:false,gf:0,ga:0},
      {date:"2026-08-16",comp:"英超",opp:"伯恩茅斯",home:true,gf:4,ga:2},
      {date:"2026-05-24",comp:"英超",opp:"水晶宫",home:true,gf:1,ga:1},
      {date:"2026-05-17",comp:"英超",opp:"布莱顿",home:false,gf:2,ga:3},
      {date:"2026-05-10",comp:"英超",opp:"阿森纳",home:true,gf:2,ga:2},
      {date:"2026-05-03",comp:"英超",opp:"切尔西",home:false,gf:1,ga:0},
      {date:"2026-04-26",comp:"英超",opp:"热刺",home:true,gf:3,ga:1},
      {date:"2026-04-19",comp:"英超",opp:"富勒姆",home:false,gf:2,ga:1}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"英超",opp:"曼联",home:false,time:"00:30",stadium:"老特拉福德"},
      {date:"2026-09-26",comp:"英超",opp:"西汉姆",home:true,time:"22:00",stadium:"安菲尔德"},
      {date:"2026-10-04",comp:"英超",opp:"曼城",home:false,time:"23:30",stadium:"伊蒂哈德球场"},
      {date:"2026-10-17",comp:"英超",opp:"布伦特福德",home:true,time:"22:00",stadium:"安菲尔德"},
      {date:"2026-10-25",comp:"英超",opp:"阿斯顿维拉",home:false,time:"00:30",stadium:"维拉公园"},
      {date:"2026-11-07",comp:"英超",opp:"热刺",home:true,time:"22:00",stadium:"安菲尔德"},
      {date:"2026-11-21",comp:"英超",opp:"切尔西",home:false,time:"01:30",stadium:"斯坦福桥"},
      {date:"2026-12-05",comp:"英超",opp:"埃弗顿",home:false,time:"22:00",stadium:"希尔·迪金森球场"},
      {date:"2027-01-02",comp:"英超",opp:"阿森纳",home:false,time:"00:30",stadium:"酋长球场"},
      {date:"2027-02-13",comp:"英超",opp:"纽卡斯尔",home:true,time:"23:00",stadium:"安菲尔德"}
    ]
  },

  /* ---------------- 皇家马德里 ---------------- */
  {
    id:"realmadrid", name:"皇家马德里", short:"皇马", en:"Real Madrid CF", initials:"RMA",
    founded:1902, league:"西甲", country:"西班牙", city:"马德里", colors:["#F3F4F6","#1D3C8F"],
    desc:"皇家马德里足球俱乐部成立于1902年，是欧洲足坛最成功的俱乐部。球队以15座欧冠奖杯傲视群雄，从迪斯蒂法诺时代的五连冠，到C罗时代的四年三冠，白衣军团始终是欧洲之巅的代名词。",
    stadium:{
      name:"圣地亚哥·伯纳乌球场", en:"Santiago Bernabéu", capacity:78297, opened:1947, pitch:"105m × 68m",
      address:"Av. de Concha Espina 1, 28036 Madrid, 西班牙",addressEn:"Av. de Concha Espina 1, 28036 Madrid, Spain",
      lat:40.4531, lon:-3.6883,
      desc:"伯纳乌球场1947年启用，以俱乐部传奇主席圣地亚哥·伯纳乌命名。经过近年大规模改造后，球场拥有可伸缩草皮、环绕式LED幕墙与可开合屋顶，成为马德里市中心的地标建筑。"
    },
    players:[
      {no:1,name:"库尔图瓦",pos:"门将",nat:"比利时",ap:34,lg:0,cp:0,as:0},
      {no:13,name:"卢宁",pos:"门将",nat:"乌克兰",ap:5,lg:0,cp:0,as:0},
      {no:2,name:"卡瓦哈尔",pos:"后卫",nat:"西班牙",ap:26,lg:1,cp:0,as:3},
      {no:3,name:"米利唐",pos:"后卫",nat:"巴西",ap:28,lg:1,cp:0,as:1},
      {no:22,name:"吕迪格",pos:"后卫",nat:"德国",ap:30,lg:1,cp:1,as:0},
      {no:23,name:"门迪",pos:"后卫",nat:"法国",ap:25,lg:0,cp:0,as:2},
      {no:24,name:"赫伊森",pos:"后卫",nat:"西班牙",ap:29,lg:2,cp:0,as:1},
      {no:5,name:"贝林厄姆",pos:"中场",nat:"英格兰",ap:31,lg:16,cp:3,as:9},
      {no:8,name:"巴尔韦德",pos:"中场",nat:"乌拉圭",ap:34,lg:6,cp:1,as:7},
      {no:14,name:"琼阿梅尼",pos:"中场",nat:"法国",ap:30,lg:2,cp:1,as:3},
      {no:6,name:"卡马文加",pos:"中场",nat:"法国",ap:27,lg:2,cp:0,as:4},
      {no:7,name:"维尼修斯",pos:"前锋",nat:"巴西",ap:32,lg:18,cp:4,as:12},
      {no:10,name:"姆巴佩",pos:"前锋",nat:"法国",ap:34,lg:31,cp:6,as:8},
      {no:11,name:"罗德里戈",pos:"前锋",nat:"巴西",ap:29,lg:8,cp:3,as:7},
      {no:15,name:"恩德里克",pos:"前锋",nat:"巴西",ap:20,lg:4,cp:2,as:1},
      {no:30,name:"马斯坦托诺",pos:"前锋",nat:"阿根廷",ap:22,lg:3,cp:1,as:2}
    ],
    legends:[
      {name:"阿尔弗雷多·迪斯蒂法诺",en:"Alfredo Di Stéfano",period:"1953–1964",ap:396,goals:308,lg:216,cp:40,as:74,
       honors:"欧冠五连冠（1956–1960）核心、8×西甲冠军、2×金球奖，皇马王朝的奠基人",honorsEn:"The centre-piece of five straight European Cups (1956–1960), 8× LaLiga champion, 2× Ballon d'Or — the founder of the Real Madrid dynasty"},
      {name:"劳尔·冈萨雷斯",en:"Raúl González",period:"1994–2010",ap:741,goals:323,lg:228,cp:21,as:90,
       honors:"3×欧冠冠军、6×西甲冠军；长期保持队史出场与进球纪录，白衣军团的象征",honorsEn:"3× Champions League, 6× LaLiga; long-time club record holder for appearances and goals, an icon of Los Blancos"},
      {name:"克里斯蒂亚诺·罗纳尔多",en:"Cristiano Ronaldo",period:"2009–2018",ap:438,goals:450,lg:311,cp:34,as:131,
       honors:"4×欧冠冠军、2×西甲冠军、4×金球奖；皇马队史射手王（450球）",honorsEn:"4× Champions League, 2× LaLiga, 4× Ballon d'Or; Real Madrid's all-time top scorer (450 goals)"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"西班牙甲级联赛",nameEn:"LaLiga",count:36,years:"1932、1933、1954、1955、1957、1958、1961–1965、1967–1969、1972、1975、1976、1978–1980、1986–1990、1995、1997、2001、2003、2007、2008、2012、2017、2020、2022、2024 等"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"西班牙国王杯",nameEn:"Copa del Rey",count:20,years:"1905、1906、1908、1917、1934、1936、1946、1947、1962、1970、1974、1975、1982、1989、1993、2011、2014、2023 等"},
        {name:"西班牙超级杯",nameEn:"Supercopa de España",count:13,years:"1988、1989、1990、1993、1997、2001、2003、2008、2012、2017、2020、2022、2024"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:15,years:"1956、1957、1958、1959、1960、1966、1998、2000、2002、2014、2016、2017、2018、2022、2024"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:6,years:"2002、2014、2016、2017、2022、2024"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[
        {name:"国际足联世俱杯",nameEn:"FIFA Club World Cup",count:5,years:"2014、2016、2017、2018、2022"},
        {name:"洲际杯",nameEn:"Intercontinental Cup",count:3,years:"1960、1998、2002"}
      ]}
    ],
    results:[
      {date:"2026-09-14",comp:"西甲",opp:"皇家社会",home:false,gf:2,ga:0},
      {date:"2026-08-31",comp:"西甲",opp:"马略卡",home:true,gf:3,ga:0},
      {date:"2026-08-24",comp:"西甲",opp:"奥维耶多",home:false,gf:1,ga:1},
      {date:"2026-08-17",comp:"西甲",opp:"奥萨苏纳",home:true,gf:2,ga:1},
      {date:"2026-05-24",comp:"西甲",opp:"塞维利亚",home:true,gf:4,ga:2},
      {date:"2026-05-18",comp:"西甲",opp:"马德里竞技",home:false,gf:1,ga:1},
      {date:"2026-05-11",comp:"西甲",opp:"巴塞罗那",home:true,gf:3,ga:4},
      {date:"2026-05-04",comp:"西甲",opp:"赫罗纳",home:false,gf:2,ga:1},
      {date:"2026-04-27",comp:"西甲",opp:"毕尔巴鄂竞技",home:true,gf:1,ga:0},
      {date:"2026-04-20",comp:"西甲",opp:"瓦伦西亚",home:false,gf:2,ga:2}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"西甲",opp:"西班牙人",home:true,time:"03:00",stadium:"伯纳乌球场"},
      {date:"2026-09-24",comp:"西甲",opp:"莱万特",home:false,time:"03:00",stadium:"巴伦西亚城球场"},
      {date:"2026-09-28",comp:"西甲",opp:"阿拉维斯",home:true,time:"03:00",stadium:"伯纳乌球场"},
      {date:"2026-10-05",comp:"西甲",opp:"比利亚雷亚尔",home:false,time:"03:00",stadium:"陶瓷球场"},
      {date:"2026-10-19",comp:"西甲",opp:"赫塔菲",home:true,time:"03:00",stadium:"伯纳乌球场"},
      {date:"2026-10-26",comp:"西甲",opp:"巴塞罗那",home:true,time:"04:00",stadium:"伯纳乌球场"},
      {date:"2026-11-09",comp:"西甲",opp:"巴列卡诺",home:false,time:"04:00",stadium:"巴列卡斯球场"},
      {date:"2026-11-23",comp:"西甲",opp:"埃尔切",home:true,time:"04:00",stadium:"伯纳乌球场"},
      {date:"2026-12-07",comp:"西甲",opp:"塞尔塔",home:false,time:"04:00",stadium:"巴莱多斯球场"},
      {date:"2027-01-04",comp:"西甲",opp:"皇家贝蒂斯",home:true,time:"04:00",stadium:"伯纳乌球场"}
    ]
  },

  /* ---------------- 巴塞罗那 ---------------- */
  {
    id:"barcelona", name:"巴塞罗那", short:"巴萨", en:"FC Barcelona", initials:"BAR",
    founded:1899, league:"西甲", country:"西班牙", city:"巴塞罗那", colors:["#A50044","#004D98"],
    desc:"巴塞罗那足球俱乐部成立于1899年，口号「不只是一家俱乐部」。球队以拉玛西亚青训与传控足球闻名，克鲁伊夫、瓜迪奥拉、梅西等名字共同书写了红蓝军团的辉煌历史。",
    stadium:{
      name:"诺坎普球场（Spotify 诺坎普）", en:"Spotify Camp Nou", capacity:99354, opened:1957, pitch:"105m × 68m",
      address:"Carrer d'Arístides Maillol 12, 08028 Barcelona, 西班牙",addressEn:"Carrer d'Arístides Maillol 12, 08028 Barcelona, Spain",
      lat:41.3809, lon:2.1228,
      desc:"诺坎普球场1957年启用，是欧洲容量最大的球场之一。经过全面翻新后，球场新增顶棚、环形LED屏幕与更陡峭的看台，观赛视野与声浪效果都得到全面升级。"
    },
    players:[
      {no:1,name:"特尔施特根",pos:"门将",nat:"德国",ap:30,lg:0,cp:0,as:0},
      {no:13,name:"什琴斯尼",pos:"门将",nat:"波兰",ap:9,lg:0,cp:0,as:0},
      {no:2,name:"巴尔德",pos:"后卫",nat:"西班牙",ap:31,lg:0,cp:0,as:6},
      {no:4,name:"阿劳霍",pos:"后卫",nat:"乌拉圭",ap:27,lg:2,cp:0,as:1},
      {no:15,name:"克里斯滕森",pos:"后卫",nat:"丹麦",ap:22,lg:1,cp:0,as:1},
      {no:23,name:"孔德",pos:"后卫",nat:"法国",ap:32,lg:2,cp:1,as:5},
      {no:24,name:"埃里克·加西亚",pos:"后卫",nat:"西班牙",ap:25,lg:1,cp:0,as:2},
      {no:8,name:"佩德里",pos:"中场",nat:"西班牙",ap:33,lg:4,cp:1,as:8},
      {no:6,name:"加维",pos:"中场",nat:"西班牙",ap:26,lg:2,cp:1,as:3},
      {no:21,name:"德容",pos:"中场",nat:"荷兰",ap:30,lg:2,cp:0,as:5},
      {no:20,name:"奥尔莫",pos:"中场",nat:"西班牙",ap:28,lg:8,cp:3,as:6},
      {no:10,name:"亚马尔",pos:"前锋",nat:"西班牙",ap:33,lg:13,cp:4,as:14},
      {no:9,name:"莱万多夫斯基",pos:"前锋",nat:"波兰",ap:32,lg:24,cp:4,as:4},
      {no:11,name:"拉菲尼亚",pos:"前锋",nat:"巴西",ap:33,lg:17,cp:5,as:10},
      {no:7,name:"费兰·托雷斯",pos:"前锋",nat:"西班牙",ap:30,lg:10,cp:4,as:3},
      {no:19,name:"拉什福德",pos:"前锋",nat:"英格兰",ap:24,lg:5,cp:2,as:4}
    ],
    legends:[
      {name:"里奥·梅西",en:"Lionel Messi",period:"2004–2021",ap:778,goals:672,lg:474,cp:56,as:303,
       honors:"4×欧冠冠军、10×西甲冠军、6×金球奖（巴萨时期）；俱乐部历史射手王与助攻王",honorsEn:"4× Champions League, 10× LaLiga, 6× Ballon d'Or (at Barça); the club's all-time top scorer and assist provider"},
      {name:"约翰·克鲁伊夫",en:"Johan Cruyff",period:"1973–1978",ap:180,goals:60,lg:47,cp:6,as:40,
       honors:"1×西甲冠军；作为球员与主帅奠定巴萨传控哲学，被誉为俱乐部现代化的设计师",honorsEn:"1× LaLiga; as player and manager he laid the foundations of Barça's positional play — the architect of the club's modern identity"},
      {name:"哈维·埃尔南德斯",en:"Xavi Hernández",period:"1998–2015",ap:767,goals:85,lg:58,cp:11,as:185,
       honors:"4×欧冠冠军、8×西甲冠军；西班牙世界杯与两届欧洲杯冠军成员，中场大脑",honorsEn:"4× Champions League, 8× LaLiga; a World Cup and two-time European Championship winner with Spain, the midfield metronome"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"西班牙甲级联赛",nameEn:"LaLiga",count:27,years:"1929、1945、1948、1949、1952、1953、1959、1960、1974、1985、1991–1994、1997–1999、2005、2006、2009–2011、2013、2015、2016、2018、2019、2023 等"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"西班牙国王杯",nameEn:"Copa del Rey",count:31,years:"1910、1912、1913、1920、1922、1925、1926、1928、1942、1951、1952、1953、1957、1959、1963、1968、1971、1978、1981、1983、1988、1990、1997、1998、2009、2012、2015、2017、2018、2021 等"},
        {name:"西班牙超级杯",nameEn:"Supercopa de España",count:15,years:"1983、1991、1992、1994、1996、2005、2006、2009、2010、2011、2013、2016、2018、2023、2025"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:5,years:"1992、2006、2009、2011、2015"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:5,years:"1992、1997、2009、2011、2015"},
        {name:"欧洲优胜者杯",nameEn:"UEFA Cup Winners' Cup",count:4,years:"1979、1982、1989、1997"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际足联世俱杯",nameEn:"FIFA Club World Cup",count:3,years:"2009、2011、2015"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"西甲",opp:"瓦伦西亚",home:true,gf:4,ga:0},
      {date:"2026-08-30",comp:"西甲",opp:"埃尔切",home:false,gf:3,ga:1},
      {date:"2026-08-23",comp:"西甲",opp:"莱万特",home:true,gf:2,ga:0},
      {date:"2026-08-16",comp:"西甲",opp:"马略卡",home:false,gf:2,ga:2},
      {date:"2026-05-24",comp:"西甲",opp:"毕尔巴鄂竞技",home:true,gf:3,ga:0},
      {date:"2026-05-17",comp:"西甲",opp:"比利亚雷亚尔",home:false,gf:1,ga:2},
      {date:"2026-05-10",comp:"西甲",opp:"皇家马德里",home:false,gf:4,ga:3},
      {date:"2026-05-03",comp:"西甲",opp:"皇家社会",home:true,gf:2,ga:1},
      {date:"2026-04-26",comp:"西甲",opp:"塞维利亚",home:false,gf:1,ga:1},
      {date:"2026-04-19",comp:"西甲",opp:"塞尔塔",home:true,gf:4,ga:1}
    ],
    fixtures:[
      {date:"2026-09-21",comp:"西甲",opp:"赫塔菲",home:false,time:"00:30",stadium:"布塔尔克球场"},
      {date:"2026-09-25",comp:"西甲",opp:"奥维耶多",home:true,time:"03:00",stadium:"诺坎普球场"},
      {date:"2026-09-29",comp:"西甲",opp:"皇家社会",home:false,time:"03:00",stadium:"阿诺埃塔球场"},
      {date:"2026-10-05",comp:"西甲",opp:"塞维利亚",home:true,time:"03:00",stadium:"诺坎普球场"},
      {date:"2026-10-18",comp:"西甲",opp:"赫罗纳",home:false,time:"03:00",stadium:"蒙蒂利维球场"},
      {date:"2026-10-26",comp:"西甲",opp:"皇家马德里",home:false,time:"04:00",stadium:"伯纳乌球场"},
      {date:"2026-11-08",comp:"西甲",opp:"塞尔塔",home:true,time:"04:00",stadium:"诺坎普球场"},
      {date:"2026-11-22",comp:"西甲",opp:"毕尔巴鄂竞技",home:false,time:"04:00",stadium:"圣马梅斯球场"},
      {date:"2026-12-06",comp:"西甲",opp:"比利亚雷亚尔",home:true,time:"04:00",stadium:"诺坎普球场"},
      {date:"2027-01-10",comp:"西甲",opp:"马德里竞技",home:true,time:"04:00",stadium:"诺坎普球场"}
    ]
  },

  /* ---------------- 拜仁慕尼黑 ---------------- */
  {
    id:"bayern", name:"拜仁慕尼黑", short:"拜仁", en:"FC Bayern München", initials:"BAY",
    founded:1900, league:"德甲", country:"德国", city:"慕尼黑", colors:["#DC052D","#0066B2"],
    desc:"拜仁慕尼黑足球俱乐部成立于1900年，是德国足坛的绝对霸主。球队33次夺得德甲冠军，曾在2012-13与2019-20赛季两度成就三冠王，安联球场的主场氛围与「Mia san mia」的球队精神闻名欧洲。",
    stadium:{
      name:"安联球场", en:"Allianz Arena", capacity:75024, opened:2005, pitch:"105m × 68m",
      address:"Werner-Heisenberg-Allee 25, 80939 München, 德国",addressEn:"Werner-Heisenberg-Allee 25, 80939 München, Germany",
      lat:48.2188, lon:11.6247,
      desc:"安联球场2005年启用，以其可变色的ETFE膜外立面成为慕尼黑地标——拜仁主场比赛时外墙亮起红色。球场内部看台陡峭、声浪集中，被誉为欧洲最现代化的球场之一。"
    },
    players:[
      {no:1,name:"诺伊尔",pos:"门将",nat:"德国",ap:31,lg:0,cp:0,as:0},
      {no:40,name:"乌尔比希",pos:"门将",nat:"德国",ap:7,lg:0,cp:0,as:0},
      {no:2,name:"于帕梅卡诺",pos:"后卫",nat:"法国",ap:30,lg:1,cp:0,as:1},
      {no:4,name:"塔",pos:"后卫",nat:"德国",ap:29,lg:1,cp:0,as:1},
      {no:3,name:"金玟哉",pos:"后卫",nat:"韩国",ap:27,lg:1,cp:0,as:0},
      {no:19,name:"戴维斯",pos:"后卫",nat:"加拿大",ap:28,lg:1,cp:0,as:4},
      {no:6,name:"基米希",pos:"中场",nat:"德国",ap:33,lg:5,cp:1,as:10},
      {no:8,name:"格雷茨卡",pos:"中场",nat:"德国",ap:28,lg:4,cp:2,as:3},
      {no:42,name:"穆西亚拉",pos:"中场",nat:"德国",ap:31,lg:15,cp:4,as:9},
      {no:25,name:"帕利尼亚",pos:"中场",nat:"葡萄牙",ap:22,lg:2,cp:1,as:2},
      {no:27,name:"莱默尔",pos:"中场",nat:"奥地利",ap:30,lg:2,cp:0,as:3},
      {no:9,name:"凯恩",pos:"前锋",nat:"英格兰",ap:33,lg:32,cp:5,as:9},
      {no:7,name:"格纳布里",pos:"前锋",nat:"德国",ap:27,lg:8,cp:3,as:4},
      {no:17,name:"奥利塞",pos:"前锋",nat:"法国",ap:32,lg:12,cp:3,as:13},
      {no:14,name:"迪亚斯",pos:"前锋",nat:"哥伦比亚",ap:29,lg:9,cp:2,as:5}
    ],
    legends:[
      {name:"弗朗茨·贝肯鲍尔",en:"Franz Beckenbauer",period:"1964–1977",ap:582,goals:74,lg:51,cp:9,as:60,
       honors:"「足球皇帝」；3×欧冠冠军（1974–1976）、4×德甲冠军、1974年世界杯冠军",honorsEn:"'Der Kaiser'; 3× European Cup (1974–1976), 4× Bundesliga, 1974 World Cup winner"},
      {name:"盖德·穆勒",en:"Gerd Müller",period:"1964–1979",ap:605,goals:566,lg:365,cp:78,as:50,
       honors:"3×欧冠冠军、7×德甲金靴、1970年金球奖；德甲单赛季40球纪录保持者",honorsEn:"3× European Cup, 7× Bundesliga top scorer, 1970 Ballon d'Or; holder of the 40-goal single-season Bundesliga record"},
      {name:"菲利普·拉姆",en:"Philipp Lahm",period:"2002–2017",ap:517,goals:16,lg:8,cp:3,as:60,
       honors:"2013年三冠王队长、8×德甲冠军、2014年世界杯冠军队长",honorsEn:"Captain of the 2013 treble winners, 8× Bundesliga, captain of Germany's 2014 World Cup-winning side"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"德国甲级联赛",nameEn:"Bundesliga",count:33,years:"1932、1969、1972–1974、1980、1981、1985–1987、1989、1990、1994、1997、1999–2001、2003、2005、2006、2008、2010、2013–2023 等"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"德国杯",nameEn:"DFB-Pokal",count:20,years:"1957、1966、1967、1969、1971、1982、1984、1986、1998、2000、2003、2005、2006、2008、2010、2013、2014、2016、2019、2020"},
        {name:"德国超级杯",nameEn:"German Super Cup",count:10,years:"1987、1990、1998、2010、2012、2016、2017、2018、2020、2022"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:6,years:"1974、1975、1976、2001、2013、2020"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:2,years:"2013、2020"},
        {name:"欧洲优胜者杯",nameEn:"UEFA Cup Winners' Cup",count:1,years:"1967"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际足联世俱杯",nameEn:"FIFA Club World Cup",count:2,years:"2013、2020"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"德甲",opp:"汉堡",home:true,gf:5,ga:0},
      {date:"2026-08-30",comp:"德甲",opp:"奥格斯堡",home:false,gf:3,ga:2},
      {date:"2026-08-23",comp:"德甲",opp:"莱比锡",home:true,gf:6,ga:0},
      {date:"2026-08-16",comp:"德甲",opp:"斯图加特",home:false,gf:2,ga:1},
      {date:"2026-05-16",comp:"德甲",opp:"霍芬海姆",home:true,gf:4,ga:0},
      {date:"2026-05-10",comp:"德甲",opp:"门兴",home:false,gf:2,ga:0},
      {date:"2026-05-03",comp:"德甲",opp:"勒沃库森",home:true,gf:2,ga:2},
      {date:"2026-04-26",comp:"德甲",opp:"多特蒙德",home:false,gf:1,ga:2},
      {date:"2026-04-19",comp:"德甲",opp:"美因茨",home:true,gf:3,ga:0},
      {date:"2026-04-12",comp:"德甲",opp:"沃尔夫斯堡",home:false,gf:3,ga:1}
    ],
    fixtures:[
      {date:"2026-09-19",comp:"德甲",opp:"科隆",home:false,time:"21:30",stadium:"莱茵能源球场"},
      {date:"2026-09-27",comp:"德甲",opp:"云达不莱梅",home:true,time:"00:30",stadium:"安联球场"},
      {date:"2026-10-03",comp:"德甲",opp:"法兰克福",home:false,time:"21:30",stadium:"德意志银行公园"},
      {date:"2026-10-17",comp:"德甲",opp:"多特蒙德",home:true,time:"00:30",stadium:"安联球场"},
      {date:"2026-10-24",comp:"德甲",opp:"门兴",home:false,time:"21:30",stadium:"普鲁士公园"},
      {date:"2026-11-07",comp:"德甲",opp:"勒沃库森",home:true,time:"22:30",stadium:"安联球场"},
      {date:"2026-11-21",comp:"德甲",opp:"弗赖堡",home:false,time:"22:30",stadium:"欧洲公园球场"},
      {date:"2026-12-05",comp:"德甲",opp:"斯图加特",home:true,time:"22:30",stadium:"安联球场"},
      {date:"2027-01-16",comp:"德甲",opp:"莱比锡",home:false,time:"22:30",stadium:"红牛球场"},
      {date:"2027-02-20",comp:"德甲",opp:"霍芬海姆",home:false,time:"22:30",stadium:"普雷泽罗球场"}
    ]
  },

  /* ---------------- 国际米兰 ---------------- */
  {
    id:"inter", name:"国际米兰", short:"国米", en:"Inter Milan", initials:"INT",
    founded:1908, league:"意甲", country:"意大利", city:"米兰", colors:["#0068A8","#111827"],
    desc:"国际米兰足球俱乐部成立于1908年，因「兄弟情谊」得名。球队20次赢得意甲冠军，1960年代的「大国际时代」与2010年穆里尼奥率队的三冠王都是俱乐部历史上的高光时刻。",
    stadium:{
      name:"朱塞佩·梅阿查球场（圣西罗）", en:"Stadio Giuseppe Meazza (San Siro)", capacity:75923, opened:1926, pitch:"105m × 68m",
      address:"Piazzale Angelo Moratti, 20151 Milano, 意大利",addressEn:"Piazzale Angelo Moratti, 20151 Milano, Italy",
      lat:45.4781, lon:9.1240,
      desc:"圣西罗球场1926年启用，与AC米兰共用，官方名称为朱塞佩·梅阿查球场，以效力过两队的传奇射手命名。球场标志性的螺旋坡道与塔楼结构被视为意大利球场建筑的经典。"
    },
    players:[
      {no:1,name:"索默",pos:"门将",nat:"瑞士",ap:34,lg:0,cp:0,as:0},
      {no:13,name:"何塞普·马丁内斯",pos:"门将",nat:"西班牙",ap:5,lg:0,cp:0,as:0},
      {no:28,name:"帕瓦尔",pos:"后卫",nat:"法国",ap:28,lg:1,cp:0,as:2},
      {no:15,name:"阿切尔比",pos:"后卫",nat:"意大利",ap:29,lg:1,cp:0,as:1},
      {no:95,name:"巴斯托尼",pos:"后卫",nat:"意大利",ap:33,lg:2,cp:1,as:5},
      {no:32,name:"迪马尔科",pos:"后卫",nat:"意大利",ap:32,lg:4,cp:2,as:7},
      {no:31,name:"比塞克",pos:"后卫",nat:"德国",ap:24,lg:1,cp:0,as:1},
      {no:23,name:"巴雷拉",pos:"中场",nat:"意大利",ap:33,lg:4,cp:1,as:7},
      {no:20,name:"恰尔汗奥卢",pos:"中场",nat:"土耳其",ap:31,lg:7,cp:2,as:6},
      {no:22,name:"姆希塔良",pos:"中场",nat:"亚美尼亚",ap:28,lg:3,cp:1,as:4},
      {no:16,name:"弗拉泰西",pos:"中场",nat:"意大利",ap:25,lg:5,cp:3,as:2},
      {no:10,name:"劳塔罗·马丁内斯",pos:"前锋",nat:"阿根廷",ap:33,lg:21,cp:4,as:6},
      {no:9,name:"图拉姆",pos:"前锋",nat:"法国",ap:31,lg:13,cp:3,as:7},
      {no:14,name:"博尼",pos:"前锋",nat:"法国",ap:26,lg:6,cp:2,as:3},
      {no:94,name:"皮奥·埃斯波西托",pos:"前锋",nat:"意大利",ap:22,lg:5,cp:2,as:1}
    ],
    legends:[
      {name:"朱塞佩·梅阿查",en:"Giuseppe Meazza",period:"1929–1947",ap:408,goals:287,lg:197,cp:30,as:60,
       honors:"2×世界杯冠军、3×意甲金靴；圣西罗球场以他命名，意大利足球史上最伟大的球员之一",honorsEn:"2× World Cup winner, 3× Serie A top scorer; San Siro is named after him — one of the greatest players in Italian football history"},
      {name:"贾琴托·法切蒂",en:"Giacinto Facchetti",period:"1960–1978",ap:634,goals:75,lg:59,cp:10,as:80,
       honors:"「大国际时代」队长；2×欧冠冠军、4×意甲冠军、1968年欧洲杯冠军",honorsEn:"Captain of the 'Grande Inter' era; 2× European Cup, 4× Serie A, 1968 European Championship winner"},
      {name:"哈维尔·萨内蒂",en:"Javier Zanetti",period:"1995–2014",ap:858,goals:21,lg:16,cp:2,as:40,
       honors:"2010年三冠王队长、5×意甲冠军；国米队史出场王（858场）",honorsEn:"Captain of the 2010 treble winners, 5× Serie A; Inter's record appearance maker (858)"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"意大利甲级联赛",nameEn:"Serie A",count:20,years:"1910、1920、1930、1938、1940、1953、1954、1963、1965、1966、1971、1980、1989、2006–2010、2021、2024"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"意大利杯",nameEn:"Coppa Italia",count:9,years:"1939、1978、1982、2005、2006、2010、2011、2022、2023"},
        {name:"意大利超级杯",nameEn:"Supercoppa Italiana",count:8,years:"1989、2005、2006、2008、2010、2021、2022、2023"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:3,years:"1964、1965、2010"},
        {name:"欧洲联盟杯",nameEn:"UEFA Cup",count:3,years:"1991、1994、1998"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"洲际杯 / 世俱杯",nameEn:"Intercontinental Cup / Club World Cup",count:3,years:"1964、1965、2010"}]}
    ],
    results:[
      {date:"2026-09-14",comp:"意甲",opp:"尤文图斯",home:true,gf:1,ga:0},
      {date:"2026-08-31",comp:"意甲",opp:"乌迪内斯",home:false,gf:2,ga:1},
      {date:"2026-08-24",comp:"意甲",opp:"都灵",home:true,gf:3,ga:1},
      {date:"2026-08-17",comp:"意甲",opp:"热那亚",home:false,gf:2,ga:2},
      {date:"2026-05-24",comp:"意甲",opp:"科莫",home:false,gf:2,ga:0},
      {date:"2026-05-18",comp:"意甲",opp:"拉齐奥",home:true,gf:2,ga:2},
      {date:"2026-05-11",comp:"意甲",opp:"都灵",home:false,gf:3,ga:1},
      {date:"2026-05-04",comp:"意甲",opp:"罗马",home:true,gf:1,ga:0},
      {date:"2026-04-27",comp:"意甲",opp:"博洛尼亚",home:false,gf:0,ga:1},
      {date:"2026-04-20",comp:"意甲",opp:"卡利亚里",home:true,gf:3,ga:0}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"意甲",opp:"萨索洛",home:true,time:"00:00",stadium:"梅阿查球场"},
      {date:"2026-09-28",comp:"意甲",opp:"卡利亚里",home:false,time:"00:00",stadium:"圣埃利亚球场"},
      {date:"2026-10-04",comp:"意甲",opp:"克雷莫纳",home:true,time:"21:00",stadium:"梅阿查球场"},
      {date:"2026-10-19",comp:"意甲",opp:"罗马",home:false,time:"02:45",stadium:"罗马奥林匹克球场"},
      {date:"2026-10-26",comp:"意甲",opp:"那不勒斯",home:true,time:"02:45",stadium:"梅阿查球场"},
      {date:"2026-11-02",comp:"意甲",opp:"尤文图斯",home:false,time:"03:45",stadium:"都灵安联球场"},
      {date:"2026-11-23",comp:"意甲",opp:"拉齐奥",home:true,time:"03:45",stadium:"梅阿查球场"},
      {date:"2026-12-07",comp:"意甲",opp:"AC米兰",home:false,time:"03:45",stadium:"梅阿查球场"},
      {date:"2027-01-11",comp:"意甲",opp:"亚特兰大",home:true,time:"03:45",stadium:"梅阿查球场"},
      {date:"2027-02-15",comp:"意甲",opp:"佛罗伦萨",home:false,time:"03:45",stadium:"弗兰基球场"}
    ]
  },

  /* ---------------- 巴黎圣日耳曼 ---------------- */
  {
    id:"psg", name:"巴黎圣日耳曼", short:"大巴黎", en:"Paris Saint-Germain", initials:"PSG",
    founded:1970, league:"法甲", country:"法国", city:"巴黎", colors:["#004170","#DA291C"],
    desc:"巴黎圣日耳曼足球俱乐部成立于1970年，是法国足坛的霸主。卡塔尔体育投资入主后，球队汇聚世界级球星，并在2024-25赛季登顶欧冠，完成法国足球的历史性突破。",
    stadium:{
      name:"王子公园球场", en:"Parc des Princes", capacity:47929, opened:1972, pitch:"105m × 68m",
      address:"24 Rue du Commandant Guilbaud, 75016 Paris, 法国",addressEn:"24 Rue du Commandant Guilbaud, 75016 Paris, France",
      lat:48.8414, lon:2.2530,
      desc:"王子公园球场位于巴黎十六区，毗邻布洛涅森林，1972年成为巴黎圣日耳曼主场。看台以陡峭与贴近草皮著称，主场氛围在法甲首屈一指，也是法国国家队的常用主场之一。"
    },
    players:[
      {no:30,name:"舍瓦利耶",pos:"门将",nat:"法国",ap:28,lg:0,cp:0,as:0},
      {no:99,name:"萨福诺夫",pos:"门将",nat:"俄罗斯",ap:9,lg:0,cp:0,as:0},
      {no:2,name:"阿什拉夫",pos:"后卫",nat:"摩洛哥",ap:31,lg:4,cp:1,as:9},
      {no:5,name:"马尔基尼奥斯",pos:"后卫",nat:"巴西",ap:30,lg:2,cp:0,as:1},
      {no:51,name:"帕乔",pos:"后卫",nat:"厄瓜多尔",ap:30,lg:1,cp:0,as:1},
      {no:25,name:"门德斯",pos:"后卫",nat:"葡萄牙",ap:29,lg:3,cp:1,as:6},
      {no:4,name:"贝拉尔多",pos:"后卫",nat:"巴西",ap:22,lg:1,cp:0,as:1},
      {no:17,name:"维蒂尼亚",pos:"中场",nat:"葡萄牙",ap:32,lg:5,cp:2,as:8},
      {no:87,name:"若昂·内维斯",pos:"中场",nat:"葡萄牙",ap:30,lg:6,cp:2,as:5},
      {no:33,name:"扎伊尔-埃梅里",pos:"中场",nat:"法国",ap:29,lg:4,cp:1,as:6},
      {no:8,name:"法比安·鲁伊斯",pos:"中场",nat:"西班牙",ap:28,lg:5,cp:1,as:4},
      {no:10,name:"登贝莱",pos:"前锋",nat:"法国",ap:32,lg:21,cp:5,as:10},
      {no:7,name:"克瓦拉茨赫利亚",pos:"前锋",nat:"格鲁吉亚",ap:30,lg:11,cp:4,as:8},
      {no:9,name:"贡萨洛·拉莫斯",pos:"前锋",nat:"葡萄牙",ap:27,lg:12,cp:3,as:4},
      {no:14,name:"杜埃",pos:"前锋",nat:"法国",ap:29,lg:12,cp:4,as:9}
    ],
    legends:[
      {name:"保莱塔",en:"Pauleta",period:"2003–2008",ap:211,goals:109,lg:84,cp:17,as:30,
       honors:"2×法国杯冠军；长期保持俱乐部欧战与联赛射手纪录，葡萄牙黄金一代前锋",honorsEn:"2× Coupe de France; long-time club record holder for European and league goals, a forward of Portugal's golden generation"},
      {name:"兹拉坦·伊布拉希莫维奇",en:"Zlatan Ibrahimović",period:"2012–2016",ap:180,goals:156,lg:113,cp:20,as:60,
       honors:"4×法甲冠军、3×法甲金靴；俱乐部单赛季进球纪录保持者之一",honorsEn:"4× Ligue 1, 3× Ligue 1 top scorer; one of the holders of the club's single-season scoring record"},
      {name:"罗纳尔迪尼奥",en:"Ronaldinho",period:"2001–2003",ap:77,goals:25,lg:17,cp:5,as:20,
       honors:"效力期间展现桑巴魔法，随后转会巴萨并赢得2004年金球奖、2002年世界杯冠军",honorsEn:"Brought samba magic to Paris before joining Barça, where he won the 2004 Ballon d'Or and the 2002 World Cup"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[{name:"法国甲级联赛",nameEn:"Ligue 1",count:13,years:"1986、1994、2013–2016、2018–2020、2022–2025"}]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"法国杯",nameEn:"Coupe de France",count:15,years:"1982、1983、1993、1995、1998、2004、2006、2010、2015–2018、2020、2021、2024 等"},
        {name:"法国联赛杯",nameEn:"Coupe de la Ligue",count:9,years:"1995、1998、2008、2014–2018、2020"},
        {name:"法国超级杯",nameEn:"Trophée des Champions",count:13,years:"1995、1998、2013–2020、2022–2024 等"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[
        {name:"欧洲冠军联赛",nameEn:"UEFA Champions League",count:1,years:"2025"},
        {name:"欧洲优胜者杯",nameEn:"UEFA Cup Winners' Cup",count:1,years:"1996"},
        {name:"欧洲超级杯",nameEn:"UEFA Super Cup",count:1,years:"2025"}
      ]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际足联洲际杯",nameEn:"FIFA Intercontinental Cup",count:1,years:"2025"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"法甲",opp:"朗斯",home:true,gf:4,ga:0},
      {date:"2026-08-30",comp:"法甲",opp:"图卢兹",home:false,gf:3,ga:1},
      {date:"2026-08-23",comp:"法甲",opp:"昂热",home:true,gf:5,ga:0},
      {date:"2026-08-16",comp:"法甲",opp:"南特",home:false,gf:2,ga:1},
      {date:"2026-05-17",comp:"法甲",opp:"欧塞尔",home:true,gf:3,ga:0},
      {date:"2026-05-10",comp:"法甲",opp:"蒙彼利埃",home:false,gf:2,ga:0},
      {date:"2026-05-03",comp:"法甲",opp:"斯特拉斯堡",home:true,gf:2,ga:2},
      {date:"2026-04-26",comp:"法甲",opp:"马赛",home:false,gf:1,ga:1},
      {date:"2026-04-19",comp:"法甲",opp:"里昂",home:true,gf:4,ga:1},
      {date:"2026-04-12",comp:"法甲",opp:"雷恩",home:false,gf:1,ga:0}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"法甲",opp:"马赛",home:false,time:"03:00",stadium:"韦洛德罗姆球场"},
      {date:"2026-09-27",comp:"法甲",opp:"欧塞尔",home:true,time:"03:00",stadium:"王子公园球场"},
      {date:"2026-10-04",comp:"法甲",opp:"里尔",home:false,time:"03:00",stadium:"皮埃尔·莫鲁瓦球场"},
      {date:"2026-10-18",comp:"法甲",opp:"斯特拉斯堡",home:true,time:"03:00",stadium:"王子公园球场"},
      {date:"2026-10-25",comp:"法甲",opp:"布雷斯特",home:false,time:"03:00",stadium:"弗朗西斯·勒布莱球场"},
      {date:"2026-11-08",comp:"法甲",opp:"里昂",home:true,time:"04:00",stadium:"王子公园球场"},
      {date:"2026-11-22",comp:"法甲",opp:"摩纳哥",home:false,time:"04:00",stadium:"路易二世球场"},
      {date:"2026-12-06",comp:"法甲",opp:"雷恩",home:true,time:"04:00",stadium:"王子公园球场"},
      {date:"2027-01-17",comp:"法甲",opp:"南特",home:false,time:"04:00",stadium:"博茹瓦尔球场"},
      {date:"2027-02-21",comp:"法甲",opp:"朗斯",home:false,time:"04:00",stadium:"博莱尔-德勒利球场"}
    ]
  },

  /* ---------------- 上海海港 ---------------- */
  {
    id:"shanghaiport", name:"上海海港", short:"海港", en:"Shanghai Port FC", initials:"SIPG",
    founded:2005, league:"中超", country:"中国", city:"上海", colors:["#D7261E","#123C8C"],
    desc:"上海海港足球俱乐部前身上海东亚成立于2005年，以根宝青训体系为班底，2012年冲超成功。球队2018年首夺中超冠军，并在2023、2024赛季连续登顶，2024年同时加冕中超与足协杯双冠王。",
    stadium:{
      name:"浦东足球场", en:"Pudong Football Stadium", capacity:37000, opened:2021, pitch:"105m × 68m",
      address:"上海市浦东新区金湘路 1188 号",addressEn:"1188 Jinxiang Road, Pudong New Area, Shanghai",
      lat:31.2586, lon:121.6136,
      desc:"浦东足球场2021年建成启用，是上海海港的新主场，也是国内首座专业足球场。看台距离草皮仅约10米，无跑道设计带来极强的压迫感与观赛沉浸感，被誉为「白色碗」。"
    },
    players:[
      {no:1,name:"颜骏凌",pos:"门将",nat:"中国",ap:30,lg:0,cp:0,as:0},
      {no:25,name:"陈威",pos:"门将",nat:"中国",ap:4,lg:0,cp:0,as:0},
      {no:4,name:"王燊超",pos:"后卫",nat:"中国",ap:28,lg:1,cp:0,as:3},
      {no:5,name:"张琳芃",pos:"后卫",nat:"中国",ap:25,lg:1,cp:0,as:2},
      {no:13,name:"魏震",pos:"后卫",nat:"中国",ap:24,lg:0,cp:0,as:1},
      {no:32,name:"李帅",pos:"后卫",nat:"中国",ap:27,lg:0,cp:0,as:4},
      {no:3,name:"蒋光太",pos:"后卫",nat:"中国",ap:29,lg:1,cp:0,as:0},
      {no:10,name:"巴尔加斯",pos:"中场",nat:"阿根廷",ap:28,lg:8,cp:3,as:9},
      {no:6,name:"徐新",pos:"中场",nat:"中国",ap:26,lg:2,cp:1,as:3},
      {no:20,name:"杨世元",pos:"中场",nat:"中国",ap:22,lg:1,cp:0,as:2},
      {no:7,name:"武磊",pos:"前锋",nat:"中国",ap:29,lg:28,cp:4,as:6},
      {no:9,name:"古斯塔沃",pos:"前锋",nat:"巴西",ap:28,lg:15,cp:4,as:5},
      {no:11,name:"吕文君",pos:"前锋",nat:"中国",ap:24,lg:6,cp:2,as:4},
      {no:17,name:"李圣龙",pos:"前锋",nat:"中国",ap:20,lg:5,cp:3,as:3}
    ],
    legends:[
      {name:"达里奥·孔卡",en:"Darío Conca",period:"2011–2013",ap:100,goals:54,lg:44,cp:10,as:40,
       honors:"2013年中超MVP；球队冲超与崛起的核心组织者，中国职业联赛最具影响力的外援之一",honorsEn:"2013 CSL MVP; the midfield engine behind the club's rise and promotion, one of the most influential foreign players in Chinese professional football"},
      {name:"奥斯卡",en:"Oscar",period:"2017–2024",ap:248,goals:77,lg:60,cp:17,as:120,
       honors:"3×中超冠军、1×足协杯冠军；队史助攻王，中超时代最具统治力的中场之一",honorsEn:"3× CSL champion, 1× Chinese FA Cup; the club's all-time assist leader, one of the most dominant midfielders of the CSL era"},
      {name:"胡尔克",en:"Hulk",period:"2016–2020",ap:145,goals:76,lg:53,cp:23,as:40,
       honors:"2018年中超冠军、2019年超级杯冠军；强悍的身体与射门成为球队进攻旗帜",honorsEn:"2018 CSL champion, 2019 Chinese Super Cup; his power and shooting made him the spearhead of the attack"}
    ],
    honors:[
      {cat:"联赛冠军",catEn:"League titles",items:[
        {name:"中国足球超级联赛",nameEn:"Chinese Super League",count:3,years:"2018、2023、2024"},
        {name:"中国足球甲级联赛",nameEn:"China League One",count:1,years:"2012"}
      ]},
      {cat:"国内杯赛",catEn:"Domestic cups",items:[
        {name:"中国足协杯",nameEn:"Chinese FA Cup",count:1,years:"2024"},
        {name:"中国超级杯",nameEn:"Chinese Super Cup",count:2,years:"2019、2025"}
      ]},
      {cat:"洲际赛事",catEn:"Continental competitions",items:[{name:"亚足联冠军联赛",nameEn:"AFC Champions League",count:0,years:"—",note:"最好成绩：2017年亚冠联赛四强",noteEn:"Best result: 2017 AFC Champions League semi-finals"}]},
      {cat:"国际赛事",catEn:"International competitions",items:[{name:"国际赛事",nameEn:"International competitions",count:0,years:"—",note:"暂未参加国际足联旗下俱乐部赛事",noteEn:"Has not yet played in a FIFA club competition"}]}
    ],
    results:[
      {date:"2026-09-13",comp:"中超",opp:"成都蓉城",home:true,gf:2,ga:1},
      {date:"2026-08-30",comp:"中超",opp:"山东泰山",home:false,gf:1,ga:1},
      {date:"2026-08-23",comp:"中超",opp:"北京国安",home:true,gf:3,ga:0},
      {date:"2026-08-16",comp:"中超",opp:"上海申花",home:false,gf:1,ga:2},
      {date:"2026-08-09",comp:"中超",opp:"浙江队",home:true,gf:4,ga:1},
      {date:"2026-08-02",comp:"中超",opp:"天津津门虎",home:false,gf:2,ga:0},
      {date:"2026-07-26",comp:"中超",opp:"武汉三镇",home:true,gf:3,ga:2},
      {date:"2026-07-19",comp:"中超",opp:"青岛西海岸",home:false,gf:2,ga:2},
      {date:"2026-07-12",comp:"中超",opp:"河南队",home:true,gf:2,ga:0},
      {date:"2026-07-05",comp:"中超",opp:"梅州客家",home:false,gf:3,ga:1}
    ],
    fixtures:[
      {date:"2026-09-20",comp:"中超",opp:"深圳新鹏城",home:false,time:"19:35",stadium:"深圳大运中心"},
      {date:"2026-09-27",comp:"中超",opp:"青岛海牛",home:true,time:"19:35",stadium:"浦东足球场"},
      {date:"2026-10-11",comp:"中超",opp:"长春亚泰",home:false,time:"15:30",stadium:"长春体育场"},
      {date:"2026-10-18",comp:"中超",opp:"大连英博",home:true,time:"19:35",stadium:"浦东足球场"},
      {date:"2026-10-25",comp:"中超",opp:"云南玉昆",home:false,time:"15:30",stadium:"玉溪高原体育运动中心"},
      {date:"2026-11-01",comp:"中超",opp:"山东泰山",home:true,time:"15:30",stadium:"浦东足球场"},
      {date:"2026-11-08",comp:"中超",opp:"北京国安",home:false,time:"15:30",stadium:"北京工人体育场"},
      {date:"2026-11-22",comp:"中超",opp:"上海申花",home:true,time:"15:30",stadium:"浦东足球场"},
      {date:"2026-11-29",comp:"中超",opp:"成都蓉城",home:false,time:"15:30",stadium:"凤凰山体育公园"},
      {date:"2027-03-07",comp:"中超",opp:"浙江队",home:true,time:"19:35",stadium:"浦东足球场"}
    ]
  }
];
