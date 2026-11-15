/*
  live-answer.js
  Lets a game send its current secret answer to the host panel.
  A game calls:  window.reportAnswer("WORD")  when a new round starts.
  It only does something on the device where you typed your host code
  on host.html. For everyone else it quietly does nothing.
*/
(function () {
  var SB = "https://igezympgwgxgqaqnuhqo.supabase.co";
  var KEY = "sb_publishable_Vf0-TBuyjmtifEFAzF7row_HuK9PAnS";
  window.reportAnswer = function (word) {
    var code = null;
    try { code = localStorage.getItem("wp_code"); } catch (e) {}
    word = String(word || "").toUpperCase();
    if (!code || !word) return;
    fetch(SB + "/rest/v1/rpc/set_answer", {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, new_answer: word })
    }).catch(function () {});
  };
})();
