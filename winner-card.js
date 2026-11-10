/*
  winner-card.js: screen 1 (winner card) and screen 2 (top 10 for the game).
  Loaded by top-bar.js. A game calls:
    WinnerCard.show({ game: "Word Shift", name: "ali123", word: "BRAVE", points: 5 })
  It returns true when the card is shown and false when the game should use its own popup.
  Add ?demo=1 to a game's address to test it without going live (nothing is saved).
*/
(function () {
  if (window.WinnerCard) return;
  var DEMO = /[?&]demo=1/.test(location.search);
  var MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  var TROPHY = "\uD83C\uDFC6", BOLT = "\u26A1";
  var T_FAST = 3000, T_SLOW = 4000, T_LIST = 4000;

  var css =
    "#wc-root{position:fixed;inset:0;z-index:9995;display:flex;align-items:center;justify-content:center;padding:16px;" +
    "background:rgba(0,0,0,.35);pointer-events:none;font-family:'Outfit',system-ui,sans-serif}" +
    ".wc-card{width:min(92vw,380px);max-height:92vh;overflow:hidden;background:rgba(20,18,43,.97);" +
    "border:1.5px solid rgba(255,255,255,.22);border-radius:22px;padding:22px 18px;text-align:center;color:#f3f1ff;" +
    "animation:wcin .25s ease-out}" +
    "@keyframes wcin{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}" +
    ".wc-tiles{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:0 0 14px}" +
    ".wc-tile{width:38px;height:44px;border-radius:8px;background:#3ddc84;color:#06240f;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700}" +
    ".wc-word{margin:0 0 14px;padding:10px 14px;border-radius:14px;background:#3ddc84;color:#06240f;font-weight:700;letter-spacing:1px;text-align:center;white-space:nowrap;overflow:hidden}" +
    ".wc-name{font-size:24px;font-weight:700;word-break:break-word}" +
    ".wc-sub{font-size:17px;color:#b9b3dc;margin:2px 0 16px}" +
    ".wc-chips{display:flex;gap:10px;justify-content:center}" +
    ".wc-chip{flex:1;padding:10px 6px;border-radius:12px;background:rgba(155,114,240,.22);color:#b79cff;font-size:20px;font-weight:700;white-space:nowrap}" +
    ".wc-chip.w{background:rgba(61,220,132,.18);color:#3ddc84}" +
    ".wc-dots{display:flex;gap:8px;justify-content:center;margin-top:16px}" +
    ".wc-dot{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.25)}" +
    ".wc-dot.on{background:#9b72f0}" +
    ".wc-title{font-size:24px;font-weight:700;margin:0 0 10px}" +
    ".wc-list{display:flex;flex-direction:column;gap:4px}" +
    ".wc-row{display:flex;align-items:center;gap:10px;padding:5px 10px;border-radius:10px;font-size:20px;text-align:left}" +
    ".wc-row.me{background:rgba(155,114,240,.28)}" +
    ".wc-rn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}" +
    ".wc-rp{font-weight:700;color:#b79cff}" +
    ".wc-m{width:28px;text-align:center;font-size:22px}" +
    ".wc-c{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.16);display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700}" +
    ".wc-empty{color:#c9c3ee;padding:20px}" +
    "@media (prefers-reduced-motion:reduce){.wc-card{animation:none}}" +
    "@media (min-width:800px){.wc-card{width:min(92vw,500px)}.wc-tile{width:52px;height:60px;font-size:32px}" +
    ".wc-name{font-size:30px}.wc-sub{font-size:21px}.wc-chip{font-size:24px}.wc-title{font-size:28px}" +
    ".wc-row{font-size:25px}.wc-m{font-size:28px}.wc-c{width:34px;height:34px;font-size:18px}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function curMonth() {
    return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 7);
  }

  var root = null, timers = [], token = 0;
  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    token++;
  }

  function dots(n) {
    var d = el("div", "wc-dots");
    d.appendChild(el("span", "wc-dot" + (n === 0 ? " on" : "")));
    d.appendChild(el("span", "wc-dot" + (n === 1 ? " on" : "")));
    return d;
  }

  function screen1(card, o, name) {
    card.innerHTML = "";
    var word = el("div", "wc-word", String(o.word || "").toUpperCase());
    card.appendChild(word);
    var fs = window.innerWidth >= 800 ? 44 : 32;
    word.style.fontSize = fs + "px";
    while (word.scrollWidth > word.clientWidth && fs > 16) {
      fs -= 2;
      word.style.fontSize = fs + "px";
    }
    card.appendChild(el("div", "wc-name", name + " solved it"));
    card.appendChild(el("div", "wc-sub", o.game));
    var chips = el("div", "wc-chips");
    if (o.points) chips.appendChild(el("span", "wc-chip", BOLT + " +" + o.points + " pts"));
    chips.appendChild(el("span", "wc-chip w", TROPHY + " +1 win"));
    card.appendChild(chips);
    card.appendChild(dots(0));
  }

  function screen2(card, o, name, rows) {
    card.innerHTML = "";
    card.appendChild(el("div", "wc-title", "Top 10 in " + o.game));
    var list = el("div", "wc-list");
    if (rows === undefined) list.appendChild(el("div", "wc-empty", "Loading..."));
    else if (rows === null) list.appendChild(el("div", "wc-empty", "Could not load scores"));
    else if (!rows.length) list.appendChild(el("div", "wc-empty", "No scores yet"));
    else rows.forEach(function (r, i) {
      var me = String(r.viewer_name).toLowerCase() === name.toLowerCase();
      var row = el("div", "wc-row" + (me ? " me" : ""));
      row.appendChild(i < 3 ? el("span", "wc-m", MEDALS[i]) : el("span", "wc-c", String(i + 1)));
      row.appendChild(el("span", "wc-rn", r.viewer_name));
      row.appendChild(el("span", "wc-rp", String(r.total)));
      list.appendChild(row);
    });
    card.appendChild(list);
    card.appendChild(dots(1));
  }

  function loadTop(game, cb) {
    var db = window.WP_DB;
    if (!db) { cb(null); return; }
    fetch(db.url + "/rest/v1/leaderboard_game_totals?month=eq." + curMonth() +
      "&game=eq." + encodeURIComponent(game) +
      "&order=total.desc,viewer_name.asc&limit=10&select=viewer_name,total", { headers: { apikey: db.key } })
      .then(function (r) { return r.json(); })
      .then(function (rows) { cb(Array.isArray(rows) ? rows : null); })
      .catch(function () { cb(null); });
  }

  function withDemo(rows, name, pts) {
    var out = (rows || []).slice();
    out.push({ viewer_name: name, total: pts || 0 });
    out.sort(function (a, b) {
      return b.total - a.total || (a.viewer_name < b.viewer_name ? -1 : 1);
    });
    return out.slice(0, 10);
  }

  function show(o) {
    o = o || {};
    var name = String(o.name || "").trim().slice(0, 30), fake = false;
    if (!name) {
      if (!DEMO) return false;
      name = "demo";
      fake = true;
    }
    clearAll();
    var my = token;
    root = el("div");
    root.id = "wc-root";
    var card = el("div", "wc-card");
    root.appendChild(card);
    document.body.appendChild(root);

    var t1 = o.slow ? T_SLOW : T_FAST;
    var state = { screen: 1, rows: undefined };
    screen1(card, o, name);

    // fetch the list about a second before screen 2, so the new points are saved
    timers.push(setTimeout(function () {
      loadTop(o.game, function (rows) {
        if (my !== token) return;
        if (fake) rows = withDemo(rows, name, o.points);
        state.rows = rows;
        if (state.screen === 2) screen2(card, o, name, state.rows);
      });
    }, Math.max(0, t1 - 1000)));
    timers.push(setTimeout(function () {
      if (my !== token) return;
      state.screen = 2;
      screen2(card, o, name, state.rows);
    }, t1));
    timers.push(setTimeout(function () {
      if (my === token) clearAll();
    }, t1 + T_LIST));
    return true;
  }

  window.WinnerCard = {
    show: show,
    total: function (slow) { return (slow ? T_SLOW : T_FAST) + T_LIST; }
  };
})();
