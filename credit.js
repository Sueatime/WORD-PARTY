// Shows a small credit note for a few seconds when a page opens, then fades it away.
// Change the text, height, time and font size here.
(function () {
  if (window.__creditNote) return;
  window.__creditNote = true;

  var TEXT = "All games are inspired by the work of their original creators and developers. Full credit goes to them.";
  var LIFT = 24;            // height from the bottom of the screen, in percent (higher = further up, away from comments)
  var SECONDS = 6;          // how long the note stays on screen
  var ONCE_PER_VISIT = false; // true = show only the first time someone opens a game in this visit

  if (ONCE_PER_VISIT) {
    try { if (sessionStorage.getItem("creditShown")) return; sessionStorage.setItem("creditShown", "1"); } catch (e) {}
  }

  var d = document.createElement("div");
  d.textContent = TEXT;
  d.setAttribute("role", "note");
  d.style.cssText =
    "position:fixed;left:12px;right:12px;bottom:" + LIFT + "vh;z-index:9998;" +
    "padding:8px 12px;border-radius:10px;text-align:center;" +
    "background:rgba(20,18,43,.88);color:#e6e2ff;border:1px solid rgba(255,255,255,.18);" +
    "font:500 clamp(17px,2.6vw,32px)/1.3 'Fredoka',system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "pointer-events:none;opacity:0;transition:opacity .6s ease;";
  document.body.appendChild(d);

  setTimeout(function () { d.style.opacity = "1"; }, 400);
  setTimeout(function () { d.style.opacity = "0"; }, 400 + SECONDS * 1000);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 400 + SECONDS * 1000 + 800);
})();
