// Adds a "Menu" button with a home icon to the top-left corner of any game.
// Each game loads this with: <script src="../back-to-menu.js"></script>
(function () {
  var a = document.createElement("a");
  a.href = "../";
  a.innerHTML = "\uD83C\uDFE0 Menu";
  a.setAttribute("aria-label", "Back to Word Party menu");
  a.style.cssText =
    "position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:12px;z-index:9999;" +
    "padding:14px 24px;border-radius:999px;background:rgba(20,18,43,.92);color:#fff;" +
    "font:600 24px/1 'Fredoka',system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "text-decoration:none;border:3px solid rgba(255,255,255,.3);" +
    "-webkit-tap-highlight-color:transparent;";
  document.body.appendChild(a);
})();
