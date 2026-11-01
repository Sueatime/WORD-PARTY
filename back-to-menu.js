// Adds a small "Menu" button to the top-left corner of any game.
// Each game loads this with: <script src="../back-to-menu.js"></script>
(function () {
  var a = document.createElement("a");
  a.href = "../";
  a.textContent = "\u2190 Menu";
  a.setAttribute("aria-label", "Back to Word Party menu");
  a.style.cssText =
    "position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:10px;z-index:9999;" +
    "padding:8px 14px;border-radius:999px;background:rgba(20,18,43,.88);color:#fff;" +
    "font:600 15px/1 'Fredoka',system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "text-decoration:none;border:2px solid rgba(255,255,255,.25);" +
    "-webkit-tap-highlight-color:transparent;";
  document.body.appendChild(a);
})();
