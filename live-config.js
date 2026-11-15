// Shared by host.html and stream.html (Word Party live control)
var SB = "https://igezympgwgxgqaqnuhqo.supabase.co";
var KEY = "sb_publishable_Vf0-TBuyjmtifEFAzF7row_HuK9PAnS";
// [name, emoji, folder] - same list and order as the menu page
var MENU = [
  ["Color Shuffle","🎨","Shuffle"],["Color Spell","🌈","Color"],["Emoji Words","😀","Emoji"],["Guess the Country","🌍","Country"],["Guess the Picture","🖼️","Picture"],
  ["Icon Spell","🔣","Icons"],["Letter Order","🔤","Order"],["Number Code","🔢","Number"],["Secret Word","🔐","Secret"],
  ["Spot the Difference","🔍","Odd"],["Survey Says","📊","Survey"],["Word Between","↕️","Between"],["Word Blur","🌫️","Blur"],
  ["Word Border","📐","Border"],["Word Chain","🔗","Chain"],["Word Clues","💡","Clues"],["Word Compare","⚖️","Compare"],
  ["Word Counts","🚥","Counts"],["Word Gap","📏","Gap"],["Word Graph","📈","Graph"],["Word Jumble","🔀","Jumble"],
  ["Word Overlap","🔄","Overlap"],["Word Pixels","👾","Pixel"],["Word Related","🕸️","Related"],["Word Search","🔎","Search"],
  ["Word Shift","↔️","Shift"],["Word Symbol","❓","Symbol"],["Word Tangle","🌀","Tangle"],["Word Thread","🧵","Thread"],
  ["Word Trail","👣","Trail"],["Word Trick","🃏","Trick"]
];
var ACC = ["#3ecf8e","#4c8dff","#a46bff","#ffbf3c","#ff6b9d","#2ec4c9"];
var WHO = {all:"Everyone",follow:"Followers and above",fan:"Fan club members and above",sub:"Subscribers and above",mod:"Moderators only"};
var SHORT = {follow:"Followers",fan:"Fan club members",sub:"Subscribers",mod:"Moderators"};
function find(n){for(var i=0;i<MENU.length;i++)if(MENU[i][0]===n)return i;return -1}
function ic(n){var i=find(n);return i<0?"":MENU[i][1]}
function slug(n){var i=find(n);return i<0?"":MENU[i][2]}
function acc(n){return ACC[Math.max(0,find(n))%6]}
function fmt(ms){ms=Math.max(0,Math.ceil(ms/1000));return Math.floor(ms/60)+":"+String(ms%60).padStart(2,"0")}
function sb(path,opt){opt=opt||{};opt.headers={apikey:KEY,"Content-Type":"application/json"};return fetch(SB+"/rest/v1/"+path,opt).then(function(r){return r.json()})}
function getState(){return sb("live_state?id=eq.1&select=*").then(function(a){return a&&a[0]})}
function rpc(fn,body){return sb("rpc/"+fn,{method:"POST",body:JSON.stringify(body)})}
