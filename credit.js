// Shows one small credit line on every page that loads back-to-menu.js.
// Change the text or the height here.
(function () {
  if (window.__creditLine) return;
  window.__creditLine = true;

  var TEXT = "All games are inspired by the work of their original creators and developers. Full credit goes to them.";
  var LIFT = 15; // height from the bottom of the screen, in percent (higher = further up, away from comments)

  var d = document.createElement("div");
  d.textContent = TEXT;
  d.setAttribute("role", "note");
  d.style.cssText =
    "position:fixed;left:12px;right:12px;bottom:" + LIFT + "vh;z-index:9998;" +
    "padding:8px 12px;border-radius:10px;text-align:center;" +
    "background:rgba(20,18,43,.82);color:#e6e2ff;border:1px solid rgba(255,255,255,.18);" +
    "font:500 clamp(16px,2.4vw,30px)/1.3 'Fredoka',system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "pointer-events:none;";
  document.body.appendChild(d);
})();
