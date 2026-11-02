// Shared helper loaded by every game: <script src="../back-to-menu.js"></script>
// 1) Adds a home-icon button in the top-left corner.
// 2) Stops the page from zooming in / opening the keyboard by itself when a game loads.
(function () {
  // ---- 1) Menu button ----
  var a = document.createElement("a");
  a.href = "../";
  a.innerHTML = "\uD83C\uDFE0";
  a.setAttribute("aria-label", "Back to Word Party menu");
  a.style.cssText =
    "position:fixed;top:calc(12px + env(safe-area-inset-top,0px));left:12px;z-index:9999;" +
    "width:72px;height:72px;display:flex;align-items:center;justify-content:center;" +
    "border-radius:50%;background:rgba(20,18,43,.92);color:#fff;" +
    "font-size:40px;line-height:1;" +
    "text-decoration:none;border:3px solid rgba(255,255,255,.3);" +
    "-webkit-tap-highlight-color:transparent;";
  document.body.appendChild(a);

  // ---- 2) No auto-zoom, no keyboard popping up on its own ----
  var vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    vp = document.createElement("meta");
    vp.name = "viewport";
    document.head.appendChild(vp);
  }
  vp.setAttribute("content",
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");

  var lastTouch = 0;
  var menuHold = 0; // while set, no field may take focus (used when leaving the game)
  function onMenuButton(e) { return a.contains(e.target); }
  function touched(e) {
    if (onMenuButton(e)) return; // a tap on Menu is not a tap on the game
    lastTouch = Date.now();
  }
  document.addEventListener("pointerdown", touched, true);
  document.addEventListener("touchstart", touched, true);
  document.addEventListener("keydown", touched, true);

  function isField(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
  }

  // Ignore focus that the game triggers by itself (no tap just before it)
  var realFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function () {
    if (isField(this) && (Date.now() < menuHold || Date.now() - lastTouch > 800)) return;
    return realFocus.apply(this, arguments);
  };

  // Tapping Menu: close the keyboard and keep the game from reacting to the tap
  function leaving(e) {
    menuHold = Date.now() + 3000;
    if (isField(document.activeElement)) document.activeElement.blur();
    e.stopPropagation();
  }
  ["pointerdown", "touchstart", "mousedown", "pointerup", "touchend", "mouseup", "click"]
    .forEach(function (t) { a.addEventListener(t, leaving); });

  // If a field was already focused while the page loaded, release it
  function release() {
    if (isField(document.activeElement)) document.activeElement.blur();
    window.scrollTo(0, 0);
  }
  release();
  window.addEventListener("load", function () { setTimeout(release, 0); });
})();
