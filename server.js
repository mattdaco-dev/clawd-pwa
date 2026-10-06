// Local hub: receives Claude Code hook payloads, keeps one state per agent and
// streams snapshots to the PWA over server-sent events.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
const SESSION_TTL = 6 * 3600_000;
const SUBAGENT_TTL = 30 * 60_000;

const sessions = new Map();
const clients = new Set();

function activityFor(tool = '') {
  if (SEARCH_TOOLS.has(tool)) return 'search';
  if (WEB_TOOLS.has(tool) || tool.startsWith('mcp__')) return 'web';
  if (THINK_TOOLS.has(tool)) return 'think';
  return 'type';
}

function set(agent, state, activity = null, tool = null) {
  Object.assign(agent, { state, activity, tool, seenAt: Date.now() });
}

function sessionFor(p) {
  let s = sessions.get(p.session_id);
  if (!s) {
    s = { id: p.session_id, name: '', state: 'idle', activity: null, tool: null, subagents: new Map() };
    sessions.set(s.id, s);
  }
  if (p.cwd) s.name = basename(p.cwd);
  s.seenAt = Date.now();
  return s;
}

function apply(p) {
  const event = p.hook_event_name;
  if (!p.session_id || !event) return;
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
    case 'PostToolUse':
    case 'PostToolUseFailure':
      if (agent.state === 'waiting') set(agent, 'working', activityFor(p.tool_name), p.tool_name);
      break;
    case 'PermissionRequest':
      set(agent, 'waiting', 'flag', p.tool_name);
      break;
    case 'Notification':
      if (WAIT_NOTIFICATIONS.has(p.notification_type)) set(s, 'waiting', 'bubble');
      break;
    case 'SubagentStart':
      s.subagents.set(p.agent_id, { id: p.agent_id, type: p.agent_type ?? 'agent' });
      set(s.subagents.get(p.agent_id), 'working', 'think');
      break;
    case 'SubagentStop':
      s.subagents.delete(p.agent_id);
      break;
  }
}

function snapshot() {
  return {
    sessions: [...sessions.values()].map(({ subagents, ...s }) => ({ ...s, subagents: [...subagents.values()] })),
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

async function serveStatic(pathname, res) {
  const file = normalize(join(PUBLIC, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(PUBLIC)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
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
