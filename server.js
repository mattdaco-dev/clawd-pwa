// Local hub: receives Claude Code hook payloads, keeps one state per agent and
// streams snapshots to the PWA over server-sent events.
import { createServer } from 'node:http';
import { mkdir, open, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.CLAWD_PORT ?? 4777);
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};

const SEARCH_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS', 'LSP', 'NotebookRead', 'ToolSearch']);
const WEB_TOOLS = new Set(['WebFetch', 'WebSearch']);
const THINK_TOOLS = new Set(['Agent', 'Task', 'TodoWrite', 'EnterPlanMode']);
const WAIT_TOOLS = new Set(['AskUserQuestion', 'ExitPlanMode']);
const WAIT_NOTIFICATIONS = new Set(['permission_prompt', 'elicitation_dialog']);
// Bash commands worth a reaction: a commit, a test run (green or red).
const COMMIT = /\bgit(?:\s+-[cC]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+commit\b/;
const TESTS = /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|jest|vitest|pytest|mocha|playwright\s+test|go\s+test|cargo\s+test|phpunit|rspec|mvn\s+(?:\S+\s+)*test|gradlew?\s+test|node\s+--test|ng\s+test)\b/;
const SESSION_TTL = 6 * 3600_000;
const SUBAGENT_TTL = 30 * 60_000;

const sessions = new Map();
const clients = new Set();

// Building site mode: each session builds a room after its launch directory.
// The steps done per directory are kept on disk, so a reload (or a later
// session in the same project) picks the work up where it was. The site only
// moves while a PWA watches it in that mode: a step per tool call, and at
// least one every SITE_PACE.
const SITE_FILE = join(dirname(fileURLToPath(import.meta.url)), 'data', 'site.json');
const SITE_PACE = 15_000;
const SITE_MAX = 999;
const RESCAN_EVERY = 30_000;
// Counted apart: present or not, never walked into.
const HEAVY = new Set(['node_modules', 'vendor', '.venv', 'venv', '__pycache__', 'dist', 'build', 'target', '.next', '.nuxt', '.cache', 'coverage', '.git', '.gradle', '.idea', '.vscode']);
const LANGS = {
  js: 'js', mjs: 'js', cjs: 'js', jsx: 'js', ts: 'js', tsx: 'js', vue: 'js', svelte: 'js',
  py: 'py', rs: 'metal', go: 'metal', c: 'metal', h: 'metal', cpp: 'metal', zig: 'metal',
  java: 'jvm', kt: 'jvm', scala: 'jvm', rb: 'ruby', php: 'php', swift: 'swift', cs: 'jvm',
  md: 'doc', html: 'js', css: 'js',
};
let siteSteps = {};
try {
  siteSteps = JSON.parse(await readFile(SITE_FILE, 'utf8'));
} catch {}
let siteSaving = null;
function saveSite() {
  siteSaving ??= setTimeout(async () => {
    siteSaving = null;
    try {
      await mkdir(dirname(SITE_FILE), { recursive: true });
      await writeFile(SITE_FILE, JSON.stringify(siteSteps));
    } catch {}
  }, 2000);
}

// What the directory holds, roughly: its folders with their file counts, the
// heavy ones it has, its top-level files and the language most files are in.
async function scanDir(dir) {
  const budget = { left: 5000 };
  const langs = {};
  const count = async (path, depth) => {
    let n = 0;
    let entries = [];
    try {
      entries = await readdir(path, { withFileTypes: true });
    } catch {
      return 0;
    }
    for (const e of entries) {
      if (budget.left-- <= 0) break;
      if (e.isDirectory()) {
        if (depth < 4 && !HEAVY.has(e.name) && !e.name.startsWith('.')) n += await count(join(path, e.name), depth + 1);
      } else if (e.isFile()) {
        n++;
        const lang = LANGS[extname(e.name).slice(1).toLowerCase()];
        if (lang && lang !== 'doc') langs[lang] = (langs[lang] ?? 0) + 1;
      }
    }
    return n;
  };
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const dirs = [];
  const heavy = [];
  const files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (HEAVY.has(e.name)) heavy.push(e.name);
      else if (e.name === '.github' || e.name === '.gitlab' || !e.name.startsWith('.')) dirs.push({ name: e.name, files: await count(join(dir, e.name), 1) });
    } else if (e.isFile()) {
      files.push(e.name);
      const lang = LANGS[extname(e.name).slice(1).toLowerCase()];
      if (lang && lang !== 'doc') langs[lang] = (langs[lang] ?? 0) + 1;
    }
  }
  dirs.sort((a, b) => b.files - a.files || a.name.localeCompare(b.name));
  const lang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const total = files.length + dirs.reduce((sum, d) => sum + d.files, 0);
  return { files: total, lang, dirs: dirs.slice(0, 12), heavy, top: files.slice(0, 60) };
}

function rescan(s) {
  if (!s.dir) return;
  const dir = s.dir;
  s.scannedAt = Date.now();
  scanDir(dir).then((plan) => {
    if (sessions.get(s.id) !== s || s.dir !== dir || !plan) return;
    if (JSON.stringify(plan) === JSON.stringify(s.plan)) return;
    s.plan = plan;
    broadcast();
  });
}

const siteWatched = () => [...clients].some((c) => c.site);

function siteStep(s, now = Date.now()) {
  s.stepAt = now;
  if (!s.dir || !s.plan || !siteWatched()) return false;
  const steps = siteSteps[s.dir] ?? 0;
  if (steps >= SITE_MAX) return false;
  siteSteps[s.dir] = steps + 1;
  saveSite();
  return true;
}

function activityFor(tool = '') {
  if (SEARCH_TOOLS.has(tool)) return 'search';
  if (WEB_TOOLS.has(tool) || tool.startsWith('mcp__')) return 'web';
  if (THINK_TOOLS.has(tool)) return 'think';
  return 'type';
}

// `since` only moves when the state changes: how long it has worked or waited.
function set(agent, state, activity = null, tool = null) {
  const now = Date.now();
  if (agent.state !== state) agent.since = now;
  Object.assign(agent, { state, activity, tool, seenAt: now });
}

// What a finished Bash command means for the Clawd: null when nothing special.
function reactionTo(p, failed) {
  const command = p.tool_name === 'Bash' ? String(p.tool_input?.command ?? '') : '';
  if (TESTS.test(command)) return failed ? 'tests-red' : 'tests-green';
  if (!failed && COMMIT.test(command)) return 'commit';
  return null;
}

// The directory Claude was launched in: the first cwd recorded in the session
// transcript. The cwd of hook payloads follows the session's later `cd`s.
async function launchDir(transcriptPath) {
  try {
    const file = await open(transcriptPath);
    try {
      const { buffer, bytesRead } = await file.read(Buffer.alloc(256 * 1024), 0, 256 * 1024, 0);
      for (const line of buffer.toString('utf8', 0, bytesRead).split('\n')) {
        try {
          const entry = JSON.parse(line);
          if (entry.cwd) return entry.cwd;
        } catch {}
      }
    } finally {
      await file.close();
    }
  } catch {}
  return null;
}

function sessionFor(p) {
  let s = sessions.get(p.session_id);
  if (!s) {
    // Named after the current cwd until the transcript gives the launch directory.
    const now = Date.now();
    s = { id: p.session_id, name: basename(p.cwd ?? ''), dir: p.cwd ?? null, state: 'idle', since: now, activity: null, tool: null, startedAt: now, subagents: new Map() };
    sessions.set(s.id, s);
    rescan(s);
    if (p.transcript_path) {
      launchDir(p.transcript_path).then((dir) => {
        if (dir && sessions.get(s.id) === s && dir !== s.dir) {
          s.name = basename(dir);
          s.dir = dir;
          rescan(s);
          broadcast();
        }
      });
    }
  }
  s.seenAt = Date.now();
  return s;
}

function apply(p) {
  const event = p.hook_event_name;
  if (!p.session_id || !event) return;
  // Internal tool a subagent calls to hand its report back: not real work.
  if (p.tool_name === 'SubagentHandback') return;
  if (event === 'SessionEnd') {
    sessions.delete(p.session_id);
    return;
  }

  const s = sessionFor(p);
  // Tool events fired inside a subagent should carry its agent_id; anything
  // else is attributed to the main agent.
  const agent = (p.agent_id && s.subagents.get(p.agent_id)) || s;

  switch (event) {
    case 'SessionStart':
      // Fired again once a compaction is done: not a new session.
      if (p.source !== 'compact') set(s, 'idle');
      break;
    case 'Stop':
    case 'StopFailure':
      set(s, 'idle');
      break;
    case 'UserPromptSubmit':
      set(s, 'working', 'think');
      break;
    case 'PreToolUse':
      if (WAIT_TOOLS.has(p.tool_name)) set(agent, 'waiting', 'flag', p.tool_name);
      else set(agent, 'working', activityFor(p.tool_name), p.tool_name);
      break;
    case 'PostToolUseFailure':
    case 'PostToolUse': {
      const failed = event === 'PostToolUseFailure';
      // Not a cancellation: red tests get their own face, any other failure a one-off « oops ».
      const reaction = failed && p.is_interrupt ? null : reactionTo(p, failed);
      if (reaction) agent.reaction = { kind: reaction, at: Date.now() };
      else if (failed && !p.is_interrupt) agent.errorAt = Date.now();
      if (failed && !p.is_interrupt) agent.lastError = { tool: p.tool_name ?? null, at: Date.now() };
      if (agent.state === 'waiting') set(agent, 'working', activityFor(p.tool_name), p.tool_name);
      siteStep(s);
      // A new folder may just have appeared: the site grows with the project.
      if (Date.now() - (s.scannedAt ?? 0) > RESCAN_EVERY && /^(Write|Edit|MultiEdit|NotebookEdit|Bash)$/.test(p.tool_name ?? '')) rescan(s);
      break;
    }
    case 'PreCompact':
      // Tidies its notes while the conversation is compacted, then goes back to what it was doing.
      s.beforeCompact = { state: s.state, activity: s.activity, tool: s.tool };
      set(s, 'working', 'compact');
      break;
    case 'PostCompact':
      if (s.beforeCompact) set(s, s.beforeCompact.state, s.beforeCompact.activity, s.beforeCompact.tool);
      s.beforeCompact = null;
      break;
    case 'PermissionRequest':
      set(agent, 'waiting', 'flag', p.tool_name);
      break;
    case 'Notification':
      if (WAIT_NOTIFICATIONS.has(p.notification_type)) set(s, 'waiting', 'bubble');
      break;
    case 'SubagentStart':
      s.subagents.set(p.agent_id, { id: p.agent_id, type: p.agent_type ?? 'agent', startedAt: Date.now() });
      set(s.subagents.get(p.agent_id), 'working', 'think');
      break;
    case 'SubagentStop':
      s.subagents.delete(p.agent_id);
      break;
  }
}

function snapshot() {
  return {
    sessions: [...sessions.values()].map(({ subagents, beforeCompact, plan, stepAt, scannedAt, ...s }) => ({
      ...s,
      site: plan ? { plan, steps: siteSteps[s.dir] ?? 0 } : null,
      subagents: [...subagents.values()],
    })),
  };
}

function broadcast() {
  const data = `data: ${JSON.stringify(snapshot())}\n\n`;
  for (const res of clients) res.write(data);
}

// Drops agents whose end event never arrived (crash, killed terminal).
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, s] of sessions) {
    if (now - s.seenAt > SESSION_TTL) changed = sessions.delete(id);
    for (const [aid, a] of s.subagents) if (now - a.seenAt > SUBAGENT_TTL) changed = s.subagents.delete(aid);
  }
  if (changed) broadcast();
}, 60_000);

setInterval(() => {
  for (const res of clients) res.write(': ping\n\n');
}, 25_000);

// The minimum pace of the building sites, between two tool calls.
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const s of sessions.values()) if (now - (s.stepAt ?? 0) >= SITE_PACE) changed = siteStep(s, now) || changed;
  if (changed) broadcast();
}, 3000);

async function serveStatic(pathname, res) {
  const file = normalize(join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    // no-cache: the browser revalidates, so edits show up on the next reload.
    res
      .writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && pathname === '/event') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      apply(JSON.parse(body));
    } catch {
      return res.writeHead(400).end();
    }
    broadcast();
    return res.writeHead(204).end();
  }

  if (pathname === '/events') {
    // Watching in building site mode is what keeps the sites going.
    res.site = new URL(req.url, 'http://localhost').searchParams.get('site') === '1';
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (pathname === '/state') {
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(snapshot(), null, 2));
  }

  return serveStatic(pathname, res);
}).listen(PORT, '127.0.0.1', () => console.log(`clawd-pwa: http://localhost:${PORT}`));
