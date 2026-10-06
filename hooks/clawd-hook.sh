#!/bin/sh
# Claude Code hook: forwards the event payload to the clawd-pwa server and keeps
# a raw copy in logs/events.jsonl (CLAWD_LOG=0 to disable).
# Never slows or blocks Claude: no output, always exits 0, curl runs detached.
root=$(cd "$(dirname "$0")/.." && pwd)
payload=$(tr -d '\n\r')
[ -n "$payload" ] || exit 0

if [ "${CLAWD_LOG:-1}" = 1 ]; then
  log="$root/logs/events.jsonl"
  mkdir -p "$root/logs"
  [ -f "$log" ] && [ "$(wc -c < "$log")" -gt 5000000 ] && mv -f "$log" "$log.1"
  printf '{"ts":%s,"payload":%s}\n' "$(date +%s)" "$payload" >> "$log"
fi

printf '%s' "$payload" | curl -s -m 1 -o /dev/null -X POST -H 'Content-Type: application/json' \
  --data-binary @- "http://127.0.0.1:${CLAWD_PORT:-4777}/event" >/dev/null 2>&1 &
exit 0
