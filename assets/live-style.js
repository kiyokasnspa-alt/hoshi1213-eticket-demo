/* 見た目の修正指示シートの数字を、デモのページにその場で当てはめる（2026-11-20 清香さん。デモだけ。本番のチケットには入れない）。
   シート「見た目の修正指示シート（電子チケット・11/20 時点）」は、リンクを知っている全員が閲覧できる設定。
   黄色の列（直したい文字の大きさ・行間・文言）に入った値だけを使う。番号と文字の対応は live_style_map.json（work/style_sheet.py が作る）。
   ?live=0 を付けると、シートを読まずに元の表示で開く。 */
(function () {
  var SHEET = '1U4pEHon2xej_CVPDFoBIMs3lZ086n3r2aeBvJdhWqv8';
  if (/[?&](measure=1|live=0)/.test(location.search)) return;
  var me = document.currentScript;
  var base = me ? me.src.replace(/live-style\.js.*$/, '') : '';

  function bar(msg) {
    var b = document.createElement('div');
    b.id = 'live-style-bar';
    b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1d2340;color:#fff;font:12px/1.5 sans-serif;padding:6px 10px;display:flex;justify-content:space-between;gap:8px;align-items:center';
    var t = document.createElement('span'); t.textContent = msg;
    var a = document.createElement('a'); a.textContent = '元の表示'; a.style.cssText = 'color:#ffd400;white-space:nowrap';
    a.href = location.pathname + '?live=0';
    b.appendChild(t); b.appendChild(a); document.body.appendChild(b);
  }
  function num(c) {
    if (!c || c.v == null || c.v === '') return null;
    var v = parseFloat(String(c.v).replace(/[^\d.]/g, ''));
    return isNaN(v) ? null : v;
  }
  function apply(resp, pg) {
    if (!resp || resp.status !== 'ok') { bar('シートを読めませんでした（元の表示のままです）'); return; }
    var n = 0, textLater = 0, bad = 0;
    // 列は見出しの文字で探す（列を足したり並べ替えたりしても読めるように）
    var cols = resp.table.cols || [], ix = {};
    cols.forEach(function (col, i) { var l = col.label || '';
      if (ix.no == null && l.indexOf('番号') === 0) ix.no = i;
      if (l.indexOf('直したい文字の大きさ') >= 0) ix.fs = i;
      if (l.indexOf('直したい行間') >= 0) ix.lh = i;
      if (l.indexOf('直したい文言') >= 0) ix.tx = i; });
    if (ix.no == null) { bar('シートの列の見出しが見つかりません（元の表示のままです）'); return; }
    (resp.table.rows || []).forEach(function (r) {
      var c = r.c || [];
      var no = c[ix.no] && c[ix.no].v; if (no == null) return;
      var row = pg.rows[String(Math.round(parseFloat(no)))]; if (!row) return;
      var fs = ix.fs != null ? num(c[ix.fs]) : null, lh = ix.lh != null ? num(c[ix.lh]) : null;
      var tx = (ix.tx != null && c[ix.tx] && c[ix.tx].v != null) ? String(c[ix.tx].v).trim() : '';
      if (fs != null && (fs < 6 || fs > 100)) { fs = null; bad++; }
      if (lh != null && (lh < 0.8 || lh > 4)) { lh = null; bad++; }
      if (fs == null && lh == null && !tx) return;
      var els = [];
      row.sel.split(' || ').forEach(function (s) { var e = document.querySelector(s); if (e) els.push(e); });
      if (!els.length) { bad++; return; }
      els.forEach(function (e) {
        if (fs != null) e.style.fontSize = fs + 'px';
        if (lh != null) e.style.lineHeight = String(lh);
        e.style.outline = '2px dashed #e8202a'; e.style.outlineOffset = '2px';
      });
      if (tx) {
        // 文の中に太字や改行がないところだけ、その場で差し替える。ほかは確定のときに反映する
        if (els.length === 1 && !els[0].children.length) els[0].textContent = tx; else textLater++;
      }
      n++;
    });
    if (!n && !bad) return;
    bar('シートの数字で表示中：' + n + 'か所（赤い点線）' + (textLater ? '／文言' + textLater + 'か所は確定のときに反映' : '') + (bad ? '／当てはめられない値' + bad + 'か所' : ''));
  }
  fetch(base + 'live_style_map.json?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (map) {
    var path = location.pathname, key = null;
    Object.keys(map.pages).forEach(function (k) { if (path.slice(-(k.length + 1)) === '/' + k) key = k; });
    if (!key) return;
    var pg = map.pages[key], cb = '__liveStyle' + Date.now();
    window[cb] = function (resp) { try { apply(resp, pg); } finally { delete window[cb]; } };
    var s = document.createElement('script');
    s.src = 'https://docs.google.com/spreadsheets/d/' + SHEET + '/gviz/tq?tqx=responseHandler:' + cb +
            '&headers=1&sheet=' + encodeURIComponent(pg.tab) + '&range=A2:Z400&_=' + Date.now();
    s.onerror = function () { bar('シートを読めませんでした（元の表示のままです）'); };
    document.head.appendChild(s);
  }).catch(function () {});
})();
