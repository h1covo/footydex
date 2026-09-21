/* 战绩 / 赛程模块：结果统计 / 战绩表 / 赛程筛选 / 比分与结果取值 */
"use strict";
/* =========================================================
   球队详情
   ========================================================= */
function resultOf(r){ return r.gf > r.ga ? "W" : (r.gf === r.ga ? "D" : "L"); }
const RES_CN = { W:"胜", D:"平", L:"负" };

function resultSummary(list){
  const counts = { W:0, D:0, L:0 };
  list.forEach(r => counts[resultOf(r)]++);
  return { counts: counts, chrono: [...list].reverse() };
}




function bindFixtures(list){
  const body = $("#fixtures-body");
  if(!body) return;
  function renderFx(){
    const month = $("#fx-month").value, comp = $("#fx-comp").value;
    const filtered = list.filter(f => (!month || f.date.slice(0,7) === month) && (!comp || f.comp === comp));
    $("#fx-count").textContent = L("共 " + filtered.length + " 场比赛", filtered.length + " matches");
    body.innerHTML = fixturesTableHTML(filtered, month, comp);
  }
  $("#fx-month").addEventListener("change", renderFx);
  $("#fx-comp").addEventListener("change", renderFx);
  renderFx();
}
