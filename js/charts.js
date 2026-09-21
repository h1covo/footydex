/* 图表模块：内联 SVG（雷达 / 折线 / 柱状），零外部依赖、零请求 */
"use strict";

/* 雷达图：axes = [{label, a, b}]，每轴按两队较大值归一；颜色用字面量（对比页两队各一色） */
function radarChartSVG(axes, colorA, colorB){
  const cx = 180, cy = 158, R = 106, n = axes.length;
  const pt = (i, r) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  };
  const ringPoly = f => '<polygon class="ch-ring" points="' +
    axes.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ") + '"/>';
  const rings = [0.25, 0.5, 0.75, 1].map(ringPoly).join("");
  const spokes = axes.map((_, i) => {
    const p = pt(i, R);
    return '<line class="ch-spoke" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>';
  }).join("");
  const poly = (get, color) => {
    const pts = axes.map((ax, i) => {
      const mx = Math.max(ax.a, ax.b);
      const r = mx > 0 ? R * (get(ax) / mx) : 0;
      return pt(i, r).map(v => v.toFixed(1)).join(",");
    }).join(" ");
    return '<polygon points="' + pts + '" fill="' + color + '" fill-opacity="0.16" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/>';
  };
  const labels = axes.map((ax, i) => {
    const p = pt(i, R + 15);
    const anchor = Math.abs(p[0] - cx) < 8 ? "middle" : (p[0] > cx ? "start" : "end");
    return '<text class="ch-lbl" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(ax.label) + '</text>';
  }).join("");
  return '<svg class="ch-radar" viewBox="0 0 360 320" role="img">' + rings + spokes + poly(ax => ax.a, colorA) + poly(ax => ax.b, colorB) + labels + '</svg>';
}

/* 折线图：points = [{short, res, pts, label}]，y 为累计值；面积+线用 --cacc，点按 W/D/L 着色 */
function lineChartSVG(points){
  const W = 1160, H = 210, L = 48, R = 18, T = 20, B = 52;
  const maxY = Math.max(3, ...points.map(p => p.pts));
  const yMax = Math.ceil(maxY / 3) * 3;
  const n = points.length;
  const x = i => L + (n <= 1 ? 0 : i * (W - L - R) / (n - 1));
  const y = v => H - B - (yMax ? (v / yMax) * (H - T - B) : 0);
  const d = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.pts).toFixed(1)).join(" ");
  const area = d + " L" + x(n - 1).toFixed(1) + " " + (H - B) + " L" + x(0).toFixed(1) + " " + (H - B) + " Z";
  const grid = [0, 0.5, 1].map(f => {
    const yy = y(yMax * f);
    return '<line class="ch-grid" x1="' + L + '" y1="' + yy.toFixed(1) + '" x2="' + (W - R) + '" y2="' + yy.toFixed(1) + '"/>' +
      '<text class="ch-ylbl" x="' + (L - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + Math.round(yMax * f) + '</text>';
  }).join("");
  const dots = points.map((p, i) =>
    '<circle class="ch-dot ' + p.res.toLowerCase() + '" cx="' + x(i).toFixed(1) + '" cy="' + y(p.pts).toFixed(1) + '" r="5"><title>' + esc(p.label) + '</title></circle>').join("");
  const xl = points.map((p, i) =>
    '<text class="ch-xlbl" x="' + x(i).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle">' + esc(p.short) + '</text>').join("");
  return '<svg class="ch-line" viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
    '<path class="ch-area" d="' + area + '"/>' + grid + '<path class="ch-path" d="' + d + '"/>' + dots + xl + '</svg>';
}

/* 分组柱状图：groups = [{short, a, b, label}]；a 用 --cacc，b 用灰色 */
function groupedBarsSVG(groups){
  const W = 1160, H = 210, L = 48, R = 18, T = 20, B = 52;
  const maxV = Math.max(1, ...groups.map(g => Math.max(g.a, g.b)));
  const gw = (W - L - R) / groups.length;
  const barW = Math.min(22, gw * 0.3);
  const y = v => H - B - (v / maxV) * (H - T - B);
  const bars = groups.map((g, i) => {
    const cx = L + gw * i + gw / 2;
    const ha = H - B - y(g.a), hb = H - B - y(g.b);
    return '<rect class="ch-bar-a" x="' + (cx - barW - 2).toFixed(1) + '" y="' + y(g.a).toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(0, ha).toFixed(1) + '" rx="2"><title>' + esc(g.label) + ': ' + g.a + '</title></rect>' +
      '<rect class="ch-bar-b" x="' + (cx + 2).toFixed(1) + '" y="' + y(g.b).toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(0, hb).toFixed(1) + '" rx="2"><title>' + esc(g.label) + ': ' + g.b + '</title></rect>';
  }).join("");
  const grid = [0, 0.5, 1].map(f => {
    const yy = y(maxV * f);
    return '<line class="ch-grid" x1="' + L + '" y1="' + yy.toFixed(1) + '" x2="' + (W - R) + '" y2="' + yy.toFixed(1) + '"/>' +
      '<text class="ch-ylbl" x="' + (L - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + Math.round(maxV * f) + '</text>';
  }).join("");
  const xl = groups.map((g, i) =>
    '<text class="ch-xlbl" x="' + (L + gw * i + gw / 2).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle">' + esc(g.short) + '</text>').join("");
  return '<svg class="ch-bars" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + grid + bars + xl + '</svg>';
}

/* 阵型图上的名字：取姓氏（末段），过长折成两行 */
function fpNameLines(name){
  let s = String(name || "");
  if(s.indexOf("·") >= 0) s = s.slice(s.lastIndexOf("·") + 1);
  else if(s.indexOf("-") >= 0 && s.lastIndexOf("-") < s.length - 1) s = s.slice(s.lastIndexOf("-") + 1);
  if(s.length <= 5) return [s];
  const mid = Math.ceil(s.length / 2);
  return [s.slice(0, mid), s.slice(mid)];
}
/* 首发阵型图：players = [{name, no, row, side}]，row: -1=门将、0..R-1 由后向前；side ∈ L/C/R */
function formationPitchSVG(players, rowCount){
  const W = 340, H = 500, P = 18;
  const R = Math.max(1, rowCount || 3);
  const yOf = row => row < 0 ? 0.92 : 0.74 - row * (0.74 - 0.22) / (R - 1 || 1);
  const byRow = {};
  (players || []).forEach(p => { (byRow[p.row] = byRow[p.row] || []).push(p); });
  const ord = { L: 0, C: 1, R: 2 };
  const innerW = W - 2 * P - 44, x0 = P + 22;
  const parts = [];
  parts.push('<rect class="fp-pitch" x="' + P + '" y="' + P + '" width="' + (W - 2 * P) + '" height="' + (H - 2 * P) + '" rx="8"/>');
  const midY = P + (H - 2 * P) / 2;
  parts.push('<line class="fp-line" x1="' + P + '" y1="' + midY + '" x2="' + (W - P) + '" y2="' + midY + '"/>');
  parts.push('<circle class="fp-line" cx="' + (W / 2) + '" cy="' + midY + '" r="44"/>');
  parts.push('<rect class="fp-line" x="' + (W / 2 - 70) + '" y="' + P + '" width="140" height="64"/>');
  parts.push('<rect class="fp-line" x="' + (W / 2 - 70) + '" y="' + (H - P - 64) + '" width="140" height="64"/>');
  Object.keys(byRow).forEach(k => {
    const row = parseInt(k, 10);
    const list = byRow[k].slice().sort((a, b) => ord[a.side] - ord[b.side]);
    const n = list.length;
    list.forEach((p, i) => {
      const x = n <= 1 ? W / 2 : (n === 2 ? W / 2 + (i === 0 ? -1 : 1) * W * 0.15 : x0 + i * innerW / (n - 1));
      const y = P + (H - 2 * P) * (1 - yOf(row));
      parts.push('<circle class="fp-dot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="14"><title>' + esc(p.name) + '</title></circle>');
      parts.push('<text class="fp-no" x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="middle">' + esc(String(p.no || "")) + '</text>');
      const lines = fpNameLines(p.name);
      lines.forEach((ln, li) => {
        parts.push('<text class="fp-name" x="' + x.toFixed(1) + '" y="' + (y + 27 + li * 11).toFixed(1) + '" text-anchor="middle">' + esc(ln) + '</text>');
      });
    });
  });
  return '<svg class="fp-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + parts.join("") + '</svg>';
}
/* 单序列雷达（0-100 固定刻度）：axes = [{label, value}] */
function tacticalRadarSVG(axes, color){
  const cx = 190, cy = 165, R = 110, n = axes.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const rings = [0.25, 0.5, 0.75, 1].map(f => '<polygon class="ch-ring" points="' +
    axes.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(",")).join(" ") + '"/>').join("");
  const spokes = axes.map((_, i) => { const p = pt(i, R); return '<line class="ch-spoke" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; }).join("");
  const pts = axes.map((ax, i) => pt(i, R * Math.max(0, Math.min(1, (ax.value || 0) / 100))).map(v => v.toFixed(1)).join(",")).join(" ");
  const poly = '<polygon points="' + pts + '" fill="' + color + '" fill-opacity="0.18" stroke="' + color + '" stroke-width="2" stroke-linejoin="round"/>';
  const labels = axes.map((ax, i) => {
    const p = pt(i, R + 16);
    const anchor = Math.abs(p[0] - cx) < 8 ? "middle" : (p[0] > cx ? "start" : "end");
    return '<text class="ch-lbl" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(ax.label + " " + Math.round(ax.value)) + '</text>';
  }).join("");
  return '<svg class="ch-radar" viewBox="0 0 380 330" role="img">' + rings + spokes + poly + labels + '</svg>';
}

/* 荣誉时间线：lanes = [{label, color, points:[{year, label}]}]，每类一条泳道按年份打点 */
function honoursTimelineSVG(lanes){
  const years = [];
  lanes.forEach(l => l.points.forEach(p => years.push(p.year)));
  if(!years.length) return "";
  let minY = Math.floor(Math.min.apply(null, years) / 10) * 10;
  let maxY = Math.ceil((Math.max.apply(null, years) + 1) / 10) * 10;
  if(maxY - minY < 10) maxY = minY + 10;
  const W = 1160, L = 100, R = 18, T = 14, laneH = 27, B = 30;
  const H = T + lanes.length * laneH + B;
  const x = y => L + (y - minY) / (maxY - minY) * (W - L - R);
  const parts = [];
  for(let y = minY; y <= maxY; y += 10){
    const xx = x(y).toFixed(1);
    parts.push('<line class="ch-grid" x1="' + xx + '" y1="' + (T - 5) + '" x2="' + xx + '" y2="' + (T + lanes.length * laneH) + '"/>');
    parts.push('<text class="ch-ylbl" x="' + xx + '" y="' + (T + lanes.length * laneH + 17) + '" text-anchor="middle">' + y + '</text>');
  }
  lanes.forEach((l, i) => {
    const cy = T + i * laneH + laneH / 2;
    parts.push('<line class="ch-grid" x1="' + L + '" y1="' + cy + '" x2="' + (W - R) + '" y2="' + cy + '"/>');
    parts.push('<text class="ht-lane" x="' + (L - 12) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(l.label) + '</text>');
    l.points.forEach(p => {
      parts.push('<circle class="ht-dot" cx="' + x(p.year).toFixed(1) + '" cy="' + cy + '" r="4.5" fill="' + l.color + '"><title>' + esc(p.year + " · " + p.label) + '</title></circle>');
    });
  });
  return '<svg class="ch-honours" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + parts.join("") + '</svg>';
}
