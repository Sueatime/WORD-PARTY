/*
  live-comments.js
  Add this to any game page to turn TikTok viewer comments into guesses.

  How it works:
  1. Connects to your relay on Render.
  2. For each comment, it types the comment into the game's text box
     and presses the game's Guess / Submit button.

  For games that need special handling, define this BEFORE this script:
    window.onLiveComment = function (user, text) { ...your game's code... };
*/
(function () {
  var RELAY = 'wss://tiktok-relay-7iss.onrender.com';
  var ws = null;
  var wait = 2000;

  // ---- small status badge (green = connected, orange = connecting) ----
  var badge = document.createElement('div');
  badge.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 10px;' +
    'border-radius:12px;font:12px sans-serif;color:#fff;background:#e67e22;' +
    'opacity:.85;pointer-events:none';
  badge.textContent = 'Live comments: connecting...';
  function addBadge() { document.body.appendChild(badge); }
  if (document.body) addBadge();
  else document.addEventListener('DOMContentLoaded', addBadge);

  function setBadge(ok) {
    badge.style.background = ok ? '#27ae60' : '#e67e22';
    badge.textContent = ok ? 'Live comments: connected' : 'Live comments: connecting...';
  }

  // ---- find the game's text box and submit button ----
  function visible(el) {
    return el && el.offsetParent !== null && !el.disabled;
  }

  function findInput() {
    var list = document.querySelectorAll(
      'input[type="text"], input:not([type]), input[type="search"], textarea'
    );
    for (var i = 0; i < list.length; i++) {
      if (visible(list[i])) return list[i];
    }
    return null;
  }

  function findButton() {
    var list = document.querySelectorAll('button');
    for (var i = 0; i < list.length; i++) {
      var t = (list[i].textContent || '').trim().toLowerCase();
      if (visible(list[i]) && /^(guess|submit|enter|send|go|check|ok|add)/.test(t)) {
        return list[i];
      }
    }
    return null;
  }

  function pressEnter(el) {
    ['keydown', 'keypress', 'keyup'].forEach(function (type) {
      el.dispatchEvent(
        new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })
      );
    });
  }

  function handleComment(user, text) {
    text = String(text || '').trim();
    if (!text) return;

    // Games with their own handler
    if (typeof window.onLiveComment === 'function') {
      window.onLiveComment(user, text);
      return;
    }

    // Default: type it in and submit
    var input = findInput();
    if (!input) return;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    var btn = findButton();
    if (btn) btn.click();
    else pressEnter(input);
  }

  // ---- connection with automatic reconnect ----
  function connect() {
    try {
      ws = new WebSocket(RELAY);
    } catch (e) {
      setTimeout(connect, wait);
      return;
    }
    ws.onopen = function () {
      wait = 2000;
      setBadge(true);
    };
    ws.onmessage = function (e) {
      try {
        var d = JSON.parse(e.data);
        handleComment(d.user, d.comment);
      } catch (err) {}
    };
    ws.onclose = function () {
      setBadge(false);
      wait = Math.min(wait * 1.5, 15000);
      setTimeout(connect, wait);
    };
    ws.onerror = function () {
      try { ws.close(); } catch (e) {}
    };
  }

  connect();
})();
