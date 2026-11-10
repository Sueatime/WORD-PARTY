/*
  top-bar.js: the moving "Top 10 wins" bar at the top of every game.
  Loaded by back-to-menu.js. It is not shown on the leaderboard page.
*/
(function () {
  var KEY = "sb_publishable_Vf0-TBuyjmtifEFAzF7row_HuK9PAnS"; // the sb_publishable_... key, never the secret key
  var URL_ = "https://igezympgwgxgqaqnuhqo.supabase.co";
  window.WP_DB = { url: URL_, key: KEY };
  if (window.__wpTopBar || /leaderboard/i.test(location.pathname)) return;
  window.__wpTopBar = true;

  var MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var MEDALS = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];
  var TROPHY = "\uD83C\uDFC6";

  var css =
    "#wp-topbar{position:fixed;z-index:9990;right:12px;display:flex;align-items:center;gap:12px;height:48px;padding:0 16px;" +
    "border-radius:999px;background:rgba(20,18,43,.92);border:1.5px solid rgba(255,255,255,.22);color:#f3f1ff;" +
    "font:700 15px/1 'Outfit',system-ui,sans-serif;pointer-events:none;overflow:hidden}" +
    ".wp-lab{flex:none;white-space:nowrap}.wp-lab span{color:#a98bff}" +
    ".wp-view{flex:1;min-width:0;overflow:hidden;" +
    "-webkit-mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 12px),transparent);" +
    "mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 12px),transparent)}" +
    ".wp-track{display:inline-flex;white-space:nowrap;animation:wpscroll 30s linear infinite;will-change:transform}" +
    ".wp-set{display:inline-flex;flex:none}" +
    ".wp-it{display:inline-flex;align-items:center;gap:8px;margin-right:24px;flex:none}" +
    ".wp-m{font-size:20px;line-height:1}" +
    ".wp-c{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.16);display:inline-flex;align-items:center;justify-content:center;font-size:13px}" +
    ".wp-nm{font-weight:600}.wp-w{color:#3ddc84}" +
    ".wp-empty{color:#c9c3ee;font-weight:500;white-space:nowrap}" +
    "@keyframes wpscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
    "@media (prefers-reduced-motion:reduce){.wp-track{animation:none}}" +
    "body.wp-has-bar{padding-top:56px}" +
    "@media (min-width:800px){#wp-topbar{height:56px;font-size:21px}.wp-m{font-size:26px}" +
    ".wp-c{width:30px;height:30px;font-size:16px}body.wp-has-bar{padding-top:56px}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var bar = el("div");
  bar.id = "wp-topbar";
  var lab = el("div", "wp-lab");
  var view = el("div", "wp-view");
  bar.appendChild(lab);
  bar.appendChild(view);
  document.body.appendChild(bar);
  document.body.classList.add("wp-has-bar");

  function curMonth() {
    return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 7);
  }
  function setLabel() {
    var p = curMonth().split("-");
    lab.textContent = "";
    lab.appendChild(document.createTextNode(MN[+p[1] - 1] + " " + p[0] + " \u00B7 "));
    lab.appendChild(el("span", "", "Top 10"));
  }

  // line the bar up with the home button
  function place() {
    var h = document.querySelector('a[aria-label="Back to Word Party menu"]');
    var r = h ? h.getBoundingClientRect() : { left: 12, top: 12, right: 68, height: 56 };
    bar.style.left = (r.right + 8) + "px";
    bar.style.top = Math.max(4, r.top + (r.height - bar.offsetHeight) / 2) + "px";
  }

  function item(r, i) {
    var it = el("span", "wp-it");
    it.appendChild(i < 3 ? el("span", "wp-m", MEDALS[i]) : el("span", "wp-c", String(i + 1)));
    it.appendChild(el("span", "wp-nm", r.viewer_name));
    it.appendChild(el("span", "wp-w", TROPHY + " " + r.wins));
    return it;
  }

  var lastRows = null, lastJson = "";
  function build(rows) {
    view.innerHTML = "";
    if (!rows.length) { view.appendChild(el("div", "wp-empty", "No wins yet this month")); return; }
    var track = el("div", "wp-track");
    var a = el("div", "wp-set");
    rows.forEach(function (r, i) { a.appendChild(item(r, i)); });
    track.appendChild(a);
    view.appendChild(track);
    var guard = 0;
    while (a.scrollWidth < view.clientWidth && guard < 6) {
      rows.forEach(function (r, i) { a.appendChild(item(r, i)); });
      guard++;
    }
    track.appendChild(a.cloneNode(true));
    track.style.animationDuration = Math.max(12, a.scrollWidth / 55) + "s";
  }

  function load() {
    if (document.hidden) return;
    setLabel();
    fetch(URL_ + "/rest/v1/leaderboard_wins?month=eq." + curMonth() +
      "&order=wins.desc,viewer_name.asc&limit=10&select=viewer_name,wins", { headers: { apikey: KEY } })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) return;
        var j = JSON.stringify(rows);
        if (j === lastJson) return;
        lastJson = j; lastRows = rows;
        build(rows);
      })
      .catch(function () {});
  }

  setLabel();
  view.appendChild(el("div", "wp-empty", "Loading..."));
  place();
  window.addEventListener("resize", function () { place(); if (lastRows) build(lastRows); });
  window.addEventListener("load", place);
  load();
  setInterval(load, 30000);
  var wc = document.createElement("script");
  wc.src = new URL("winner-card.js", document.currentScript.src).href;
  document.body.appendChild(wc);
})();
