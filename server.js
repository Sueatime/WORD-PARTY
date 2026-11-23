const http = require('http');
const { WebSocketServer } = require('ws');
const lib = require('tiktok-live-connector');

// Works with both the new (v2) and old (v1) versions of the library
const Connection = lib.TikTokLiveConnection || lib.WebcastPushConnection;
const CHAT_EVENT = lib.WebcastEvent ? lib.WebcastEvent.CHAT : 'chat';

const USERNAME = process.env.TIKTOK_USERNAME;
const PORT = process.env.PORT || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const RECENT_MS = 30 * 60 * 1000; // viewer must have commented in the last 30 min
const MAX_POINTS = 1000;          // safety check only, not a scoring cap
const recentCommenters = new Map(); // viewer name -> time of last comment

// ---------- Live stream controls (read from the live_state table) ----------
const DEBUG_ROLES = process.env.DEBUG_ROLES === '1'; // set to 1 on Render to see viewer roles in the logs
const LEVEL = { all: 0, follow: 1, fan: 2, sub: 3, mod: 4 }; // who can play / vote
const ALL_GAMES = ['Color Shuffle','Color Spell','Emoji Words','Guess the Country','Guess the Picture','Icon Spell','Letter Order','Number Code','Secret Word','Spot the Difference','Survey Says','Word Between','Word Blur','Word Border','Word Chain','Word Clues','Word Compare','Word Counts','Word Gap','Word Graph','Word Jumble','Word Overlap','Word Pixels','Word Related','Word Search','Word Shift','Word Symbol','Word Tangle','Word Thread','Word Trail','Word Trick'];
const SB_HEADERS = { 'Content-Type': 'application/json', apikey: SUPABASE_SECRET_KEY };

let live = { play_who: 'all', vote_who: 'all', options: [], votes: [0, 0, 0, 0, 0, 0, 0, 0], vote_ends_at: null, next_vote_at: null, vote_secs: 35, game: null };
let voteSession = '';
const voted = new Set();
let queue = Promise.resolve();

async function refreshLive() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/live_state?id=eq.1&select=*', { headers: SB_HEADERS });
    if (!r.ok) return;
    const rows = await r.json();
    if (rows && rows[0]) live = rows[0];
  } catch (e) {}
}
setInterval(refreshLive, 2000);
refreshLive();

async function patchLive(p) {
  p.updated_at = new Date().toISOString();
  const r = await fetch(SUPABASE_URL + '/rest/v1/live_state?id=eq.1', {
    method: 'PATCH',
    headers: Object.assign({ Prefer: 'return=minimal' }, SB_HEADERS),
    body: JSON.stringify(p),
  });
  if (!r.ok) console.log('Live update failed:', r.status, await r.text());
}

function voteOpen() {
  return !!live.vote_ends_at && new Date(live.vote_ends_at).getTime() > Date.now();
}

function d0(v) { return v === undefined ? '-' : String(v); }
function safeJson(v) {
  try { return JSON.stringify(v, (k, x) => (typeof x === 'bigint' ? x.toString() : x)) || ''; } catch (e) { return ''; }
}

// 0 = regular viewer, 1 = follower, 2 = fan club member, 3 = subscriber, 4 = moderator
function roleLevel(d) {
  const u = d.user || d;
  const text = (safeJson(u.badges) + safeJson(u.userBadges) + safeJson(d.userBadges) + safeJson(u.badgeList)).toLowerCase();
  const isMod = !!(u.isModerator || d.isModerator || /moderator/.test(text));
  const isSub = !!(u.isSubscriber || d.isSubscriber || u.isSubscribed || /subscri/.test(text));
  const fc = u.fansClub && (u.fansClub.data || u.fansClub);
  const fanLevel = Number(fc && (fc.level || fc.clubLevel)) || 0;
  const isFan = !!(u.isFanClub || d.isFanClub || fanLevel > 0 || /fans?[_ ]?club|fansclub/.test(text));
  const fr = Number(u.followRole !== undefined ? u.followRole : d.followRole) || 0;
  const fi = Number(u.followInfo && u.followInfo.followStatus) || 0;
  const isFollower = !!(u.isFollower || d.isFollower || fr >= 1 || fi >= 1);
  return isMod ? 4 : isSub ? 3 : isFan ? 2 : isFollower ? 1 : 0;
}

// Add one chat vote (one at a time, so two votes never overwrite each other)
function addVote(idx) {
  queue = queue.then(async () => {
    await refreshLive();
    if (!voteOpen()) return;
    const votes = Array.isArray(live.votes) ? live.votes.slice() : [0, 0, 0, 0, 0, 0, 0, 0];
    votes[idx] = (Number(votes[idx]) || 0) + 1;
    await patchLive({ votes: votes });
    live.votes = votes;
  }).catch((e) => console.log('Vote error:', e.message));
}

// A viewer won a round: if a vote is due, wait until the winner card and leaderboard screens are
// finished (the game then starts its next round) and open the vote at that moment.
let pendingTimer = null;

async function openVote(reason) {
  await refreshLive();
  if (voteOpen()) return;
  const names = ALL_GAMES.filter((n) => n !== live.game).sort(() => Math.random() - 0.5).slice(0, 8);
  await patchLive({
    options: names,
    votes: [0, 0, 0, 0, 0, 0, 0, 0],
    vote_ends_at: new Date(Date.now() + (Number(live.vote_secs) || 35) * 1000).toISOString(),
    log: reason,
  });
}

async function onRoundWin() {
  await refreshLive();
  if (voteOpen() || pendingTimer) return; // a vote is open, or already waiting
  const due = live.next_vote_at && new Date(live.next_vote_at).getTime() <= Date.now();
  if (!due) return;
  // Safety: if the next round never reports in, open the vote anyway after 60 seconds
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    openVote('Vote opened (waited 60 seconds after a win)').catch((e) => console.log('Vote open error:', e.message));
  }, 60000);
}

// The game on the stream page started a new round (after the winner and leaderboard screens)
async function onRoundStart() {
  if (!pendingTimer) return;
  clearTimeout(pendingTimer);
  pendingTimer = null;
  await openVote('Vote opened after the leaderboard screens');
}

// Simple page so the host (and you) can check the relay is awake
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Relay is running');
});

const wss = new WebSocketServer({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

// Month label in Malaysia time (UTC+8), e.g. "2026-11"
function currentMonth() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

async function saveScore(user, game, points, win) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SECRET_KEY,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      viewer_name: user,
      game: game,
      points: points,
      is_win: win === true,
      month: currentMonth(),
    }),
  });
  if (!res.ok) {
    console.log('Save failed:', res.status, await res.text());
  }
}

// Games send: { type: "score", user: "ali123", game: "Family Feud", points: 36 }
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch (e) { return; }
    if (m && m.type === 'round_start') {
      if (m.embedded === true) onRoundStart().catch((e) => console.log('Vote open error:', e.message));
      return;
    }
    if (!m || m.type !== 'score') return;

    const user = String(m.user || '').toLowerCase().slice(0, 60);
    const game = String(m.game || '').slice(0, 60);
    const points = m.points;

    if (!user || !game) return;
    if (!Number.isInteger(points) || points < 1 || points > MAX_POINTS) return;

    const last = recentCommenters.get(user);
    if (!last || Date.now() - last > RECENT_MS) return; // not a real recent commenter

    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return;
    if (m.win === true) onRoundWin().catch((e) => console.log('Vote open error:', e.message));
    saveScore(user, game, points, m.win === true).catch((e) => console.log('Save error:', e.message));
  });
});

function startTikTok() {
  const tiktok = new Connection(USERNAME, {});

  tiktok.connect()
    .then(() => console.log('Connected to live'))
    .catch((err) => {
      console.log('Not connected, retrying in 15s:', err && err.message ? err.message : err);
      setTimeout(startTikTok, 15000);
    });

  tiktok.on(CHAT_EVENT, (data) => {
    const u0 = data.user || data;
    const user = u0.uniqueId || u0.displayId || data.uniqueId || u0.nickname || '';
    // Newer versions of the TikTok library name the message text differently, so check each name
    const rawText = [data.comment, data.content, data.message, data.text].find((t) => typeof t === 'string' && t.length > 0);
    const comment = String(rawText || '').trim();
    if (DEBUG_ROLES && !globalThis.__keysLogged) {
      globalThis.__keysLogged = true;
      console.log('Chat event fields:', Object.keys(data).join(','));
    }
    const level = roleLevel(data);
    const name = String(user || '').toLowerCase();

    if (DEBUG_ROLES) {
      console.log('Chat from', name || '(no name)', '| level', level,
        '| event: isModerator=' + d0(data.isModerator) + ' isSubscriber=' + d0(data.isSubscriber) + ' followRole=' + d0(data.followRole) + ' topGifterRank=' + d0(data.topGifterRank),
        '| followInfo:', safeJson(u0.followInfo),
        '| fansClub:', safeJson(u0.fansClub).slice(0, 200),
        '| userAttr:', safeJson(u0.userAttr).slice(0, 120),
        '| badges:', safeJson(u0.badges || u0.userBadges || data.userBadges).slice(0, 200));
    }

    const note = (m) => { if (DEBUG_ROLES) console.log('   ->', m, '| games connected:', wss.clients.size); };

    // While a vote is open, only the numbers 1 to 6 count, and guesses are paused
    if (voteOpen()) {
      if (/^[1-8]$/.test(comment) && name && level >= (LEVEL[live.vote_who] || 0)) {
        if (voteSession !== live.vote_ends_at) { voteSession = live.vote_ends_at; voted.clear(); }
        const idx = Number(comment) - 1;
        if (!voted.has(name) && idx < (live.options || []).length) {
          voted.add(name);
          addVote(idx);
          note('vote counted for card ' + comment);
        } else {
          note('vote ignored (already voted, or no such card)');
        }
      } else if (/^[1-8]$/.test(comment)) {
        note('vote blocked: only "' + (live.vote_who || 'all') + '" can vote');
      } else {
        note('dropped: a vote is open, guesses are paused');
      }
      return;
    }

    // Who can play
    if (level < (LEVEL[live.play_who] || 0)) {
      note('dropped: only "' + (live.play_who || 'all') + '" can play (viewer level ' + level + ')');
      return;
    }

    if (user) recentCommenters.set(name, Date.now());
    note('sent to the games: "' + comment.slice(0, 30) + '"');
    broadcast({ user: user, comment: comment, level: level });
  });

  tiktok.on('disconnected', () => {
    console.log('Disconnected, retrying in 15s');
    setTimeout(startTikTok, 15000);
  });
}

server.listen(PORT, () => {
  console.log('Relay on port ' + PORT);
  console.log('Saving scores to Supabase: ' + (SUPABASE_URL && SUPABASE_SECRET_KEY ? 'ON' : 'OFF (variables missing)'));
});
startTikTok();
